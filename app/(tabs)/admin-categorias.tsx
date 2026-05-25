import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const API_URL = "https://ecotrack-api-6686.onrender.com";

export default function AdminCategoriasScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  const obtenerCategorias = async () => {
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/categorias/`);
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  // Cargar las categorías al abrir la pantalla
  useEffect(() => {
    obtenerCategorias();
  }, []);

  const handleNuevaCategoria = () => {
    router.push('/admin-nueva-categoria');
  };

  // Pasamos los datos exactos de la categoría a la pantalla de edición
  const handleEditar = (cat: any) => {
    router.push({
      pathname: '/admin-calibrar',
      params: { id: cat.id, nombre: cat.nombre, factor: cat.factor_co2 }
    });
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#115E3E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EcoTrack Admin</Text>
        {/* Botón para recargar la lista de la base de datos */}
        <TouchableOpacity onPress={obtenerCategorias}>
          <Ionicons name="refresh" size={24} color="#115E3E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.seccionTituloContainer}>
          <View style={styles.textosTitulo}>
            <Text style={styles.tituloPrincipal}>Categorías de Reciclaje</Text>
            <Text style={styles.subtituloPrincipal}>Gestiona materiales y factores de CO2</Text>
          </View>
          <View style={styles.pildoraActivas}>
            <Ionicons name="leaf-outline" size={14} color="#115E3E" />
            <Text style={styles.textoActivas}>{categorias.length} Activas</Text>
          </View>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color="#115E3E" style={{ marginTop: 40 }} />
        ) : categorias.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 20 }}>No hay categorías. Toca el botón + para crear una.</Text>
        ) : (
          categorias.map((cat: any) => (
            <View key={cat.id} style={styles.tarjeta}>
              <Ionicons name="sync" size={120} color="rgba(17, 94, 62, 0.04)" style={styles.marcaDeAgua} />
              <View style={styles.tarjetaHeader}>
                <View style={styles.iconoContainer}>
                  <Ionicons name="cube-outline" size={20} color="#115E3E" />
                </View>
                <TouchableOpacity onPress={() => handleEditar(cat)}>
                  <Ionicons name="pencil" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.nombreCategoria}>{cat.nombre}</Text>
              
              <View style={styles.factorContainer}>
                <Text style={styles.labelFactor}>FACTOR CO2</Text>
                <Text style={styles.valorFactor}>{cat.factor_co2} kg / kg</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleNuevaCategoria}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#064E3B' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  seccionTituloContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  textosTitulo: { flex: 1, paddingRight: 10 },
  tituloPrincipal: { fontSize: 18, fontWeight: '700', color: '#064E3B', marginBottom: 4 },
  subtituloPrincipal: { fontSize: 13, color: '#4B5563' },
  pildoraActivas: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C6F0D5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  textoActivas: { color: '#115E3E', fontWeight: '700', fontSize: 12, marginLeft: 4 },
  tarjeta: { backgroundColor: '#C6F0D5', borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden', position: 'relative' },
  marcaDeAgua: { position: 'absolute', right: -20, top: 10, transform: [{ rotate: '15deg' }] },
  tarjetaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconoContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(17, 94, 62, 0.1)', justifyContent: 'center', alignItems: 'center' },
  nombreCategoria: { fontSize: 18, fontWeight: '800', color: '#064E3B', marginBottom: 16 },
  factorContainer: { backgroundColor: '#F0FDF4', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  labelFactor: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 1 },
  valorFactor: { fontSize: 16, fontWeight: '800', color: '#064E3B' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#064E3B', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 }
});