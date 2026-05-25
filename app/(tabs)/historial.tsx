import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'https://ecotrack-api-6686.onrender.com';

interface Registro {
  id: number;
  categoria_id: number;
  peso_kg: number;
  co2_ahorrado: number;
  fecha_registro: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

export default function HistorialScreen() {
  const { token, logout } = useAuth();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const [resRegistros, resCategorias] = await Promise.all([
        fetch(`${API_URL}/registros/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/categorias/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (resRegistros.status === 401) {
        await logout();
        return;
      }

      const dataRegistros = await resRegistros.json();
      const dataCategorias = await resCategorias.json();

      // Ordenar por más reciente
      const ordenados = dataRegistros.sort((a: Registro, b: Registro) =>
        new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
      );

      setRegistros(ordenados);
      setCategorias(dataCategorias);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) cargarDatos();
    }, [token])
  );

  const getNombreCategoria = (categoriaId: number) => {
    const cat = categorias.find(c => c.id === categoriaId);
    return cat ? cat.nombre : 'Desconocido';
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleEliminar = (id: number) => {
    Alert.alert(
      'Eliminar Registro',
      '¿Estás seguro de que quieres eliminar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/registros/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (response.status === 401) {
                await logout();
                return;
              }

              if (response.ok) {
                setRegistros(prev => prev.filter(r => r.id !== id));
                Alert.alert('✅', 'Registro eliminado correctamente');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el registro');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Registro }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemIcono}>
        <Ionicons name="leaf-outline" size={24} color="#115E3E" />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre}>{getNombreCategoria(item.categoria_id)}</Text>
        <Text style={styles.itemDetalle}>{item.peso_kg} kg · {item.co2_ahorrado?.toFixed(2)} kg CO₂</Text>
        <Text style={styles.itemFecha}>{formatearFecha(item.fecha_registro)}</Text>
      </View>
      <TouchableOpacity
        style={styles.btnEliminar}
        onPress={() => handleEliminar(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.fondo}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#115E3E" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titulo}>Historial</Text>
          <Text style={styles.subtitulo}>{registros.length} registros en total</Text>
        </View>

        {/* Lista */}
        {registros.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="leaf-outline" size={64} color="#BFE9D4" />
            <Text style={styles.vacioTexto}>No tienes registros aún</Text>
            <Text style={styles.vacioSubTexto}>¡Haz tu primer pesaje!</Text>
          </View>
        ) : (
          <FlatList
            data={registros}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: { marginBottom: 20 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#064E3B' },
  subtitulo: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemIcono: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#D1F2E0', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: 15, fontWeight: '700', color: '#064E3B' },
  itemDetalle: { fontSize: 13, color: '#115E3E', marginTop: 2 },
  itemFecha: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  btnEliminar: { padding: 8 },
  vacio: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vacioTexto: { fontSize: 18, fontWeight: '700', color: '#6B7280', marginTop: 16 },
  vacioSubTexto: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
});