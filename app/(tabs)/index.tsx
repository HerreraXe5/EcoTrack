import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'https://ecotrack-api-6686.onrender.com';

interface Registro {
  id: number;
  usuario_id: number;
  categoria_id: number;
  peso_kg: number;
  co2_ahorrado: number;
  fecha_registro: string;
}

interface Categoria {
  id: number;
  nombre: string;
  factor_co2: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { usuario, token, logout } = useAuth();

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      console.log('📡 Cargando dashboard con JWT...');

      const [resRegistros, resCategorias] = await Promise.all([
        fetch(`${API_URL}/registros/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/categorias/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (resRegistros.status === 401) {
        console.log('⚠️ Token expirado, cerrando sesión...');
        await logout();
        return;
      }

      if (resRegistros.ok) {
        const dataRegistros = await resRegistros.json();
        setRegistros(dataRegistros);
        console.log('✅ Registros cargados:', dataRegistros.length);
      }

      if (resCategorias.ok) {
        const dataCategorias = await resCategorias.json();
        setCategorias(dataCategorias);
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  // Recargar datos cada vez que se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      if (token) {
        cargarDatos();
      }
    }, [token])
  );

  // Calcular totales
  const pesoTotal = registros.reduce((sum, r) => sum + (r.peso_kg || 0), 0);
  const co2Total = registros.reduce((sum, r) => sum + (r.co2_ahorrado || 0), 0);

  // Nivel del usuario
  const getNivel = (kg: number) => {
    if (kg < 5) return { nombre: 'Semilla 🌱', siguiente: 5 };
    if (kg < 20) return { nombre: 'Árbol 🌳', siguiente: 20 };
    if (kg < 50) return { nombre: 'Bosque 🌲', siguiente: 50 };
    return { nombre: 'Guardián Planetario 🌍', siguiente: null };
  };

  const nivel = getNivel(pesoTotal);

  if (cargando) {
    return (
      <SafeAreaView style={styles.fondo}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#115E3E" />
          <Text style={styles.loadingText}>Cargando EcoTrack...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>¡Hola, {usuario?.nombre?.split(' ')[0]}! 👋</Text>
            <Text style={styles.subSaludo}>Sigue cuidando el planeta</Text>
          </View>
          <View style={styles.nivelBadge}>
            <Text style={styles.nivelTexto}>{nivel.nombre}</Text>
          </View>
        </View>

        {/* Estadísticas Principales */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="scale-outline" size={32} color="#115E3E" />
            <Text style={styles.statNumero}>{pesoTotal.toFixed(1)}</Text>
            <Text style={styles.statLabel}>kg Reciclados</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="leaf-outline" size={32} color="#115E3E" />
            <Text style={styles.statNumero}>{co2Total.toFixed(2)}</Text>
            <Text style={styles.statLabel}>kg CO₂ Ahorrado</Text>
          </View>
        </View>

        {/* Resumen rápido */}
        <View style={styles.resumenCard}>
          <Text style={styles.resumenTitulo}>📊 Resumen</Text>
          <View style={styles.resumenFila}>
            <Text style={styles.resumenLabel}>Total de registros:</Text>
            <Text style={styles.resumenValor}>{registros.length}</Text>
          </View>
          {nivel.siguiente && (
            <View style={styles.resumenFila}>
              <Text style={styles.resumenLabel}>Siguiente nivel:</Text>
              <Text style={styles.resumenValor}>{nivel.siguiente - pesoTotal > 0 ? `${(nivel.siguiente - pesoTotal).toFixed(1)} kg más` : '¡Logrado!'}</Text>
            </View>
          )}
        </View>

        {/* Botones de acción */}
        <Text style={styles.seccionTitulo}>Acciones Rápidas</Text>

        <TouchableOpacity
          style={styles.botonPrincipal}
          onPress={() => router.push('/(tabs)/nuevo-pesaje')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.botonPrincipalTexto}>Registrar Nuevo Pesaje</Text>
        </TouchableOpacity>

        <View style={styles.botonesSecundarios}>
          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => router.push('/(tabs)/historial')}
          >
            <Ionicons name="list-outline" size={24} color="#115E3E" />
            <Text style={styles.botonSecundarioTexto}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => router.push('/(tabs)/logros')}
          >
            <Ionicons name="trophy-outline" size={24} color="#115E3E" />
            <Text style={styles.botonSecundarioTexto}>Logros</Text>
          </TouchableOpacity>
        </View>

        {/* Botón Admin (solo si es admin) */}
        {usuario?.rol === 'admin' && (
          <TouchableOpacity
            style={styles.botonAdmin}
            onPress={() => router.push('/(tabs)/admin-categorias')}
          >
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonAdminTexto}>Panel de Administrador</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#115E3E', fontSize: 16 },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  saludo: { fontSize: 22, fontWeight: '800', color: '#064E3B' },
  subSaludo: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  nivelBadge: {
    backgroundColor: '#D1F2E0', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
  },
  nivelTexto: { fontSize: 12, fontWeight: '600', color: '#115E3E' },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  statNumero: { fontSize: 28, fontWeight: '800', color: '#064E3B', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  resumenCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  resumenTitulo: { fontSize: 16, fontWeight: '700', color: '#064E3B', marginBottom: 12 },
  resumenFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumenLabel: { fontSize: 14, color: '#6B7280' },
  resumenValor: { fontSize: 14, fontWeight: '600', color: '#115E3E' },
  seccionTitulo: { fontSize: 16, fontWeight: '700', color: '#064E3B', marginBottom: 12 },
  botonPrincipal: {
    backgroundColor: '#064E3B', borderRadius: 12,
    height: 56, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, gap: 10,
  },
  botonPrincipalTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  botonesSecundarios: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  botonSecundario: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    height: 56, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#BFE9D4', gap: 8,
  },
  botonSecundarioTexto: { color: '#115E3E', fontSize: 14, fontWeight: '600' },
  botonAdmin: {
    backgroundColor: '#1E40AF', borderRadius: 12,
    height: 48, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  botonAdminTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});