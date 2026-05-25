import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

const API_URL = "https://ecotrack-api-6686.onrender.com";

export default function DashboardScreen() {
  const router = useRouter();
  
  // Estados para los datos reales
  const [totalCO2, setTotalCO2] = useState(0);
  const [totalObjetos, setTotalObjetos] = useState(0);
  const [cargando, setCargando] = useState(true);

  // useFocusEffect hace que la pantalla vuelva a cargar los datos cada vez que la abres
  useFocusEffect(
    useCallback(() => {
      const cargarDatos = async () => {
        try {
          const response = await fetch(`${API_URL}/registros/`);
          if (response.ok) {
            const data = await response.json();
            
            // Sumamos el CO2 de todos los registros
            const sumaCO2 = data.reduce((acc: number, curr: any) => acc + (curr.co2_ahorrado || 0), 0);
            
            setTotalCO2(sumaCO2);
            setTotalObjetos(data.length);
          }
        } catch (error) {
          console.error("Error al cargar dashboard:", error);
        } finally {
          setCargando(false);
        }
      };

      cargarDatos();
    }, [])
  );

  return (
    <SafeAreaView style={styles.fondo}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#115E3E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EcoTrack</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.saludo}>¡Hola, Eco Guerrero!</Text>
        <View style={styles.nivelPill}>
          <Ionicons name="leaf" size={16} color="#115E3E" />
          <Text style={styles.nivelTexto}>Nivel Eco: Semilla</Text>
        </View>

        <View style={styles.progresoContainer}>
          <View style={styles.barraFondo}>
            <View style={styles.barraLlenado} />
          </View>
          <Text style={styles.xpTexto}>450 / 1000 XP</Text>
        </View>

        <View style={styles.tarjetaPrincipal}>
          <Text style={styles.tituloTarjeta}>CO2 Ahorrado</Text>
          
          <View style={styles.circuloFondo}>
            <View style={styles.circuloProgreso}>
              <View style={styles.circuloCentro}>
                {cargando ? (
                  <ActivityIndicator size="large" color="#115E3E" />
                ) : (
                  <>
                    <Text style={styles.numeroGrande}>{totalCO2.toFixed(1)}</Text>
                    <Text style={styles.textoKg}>kg</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.mensajeMotivacional}>
            ¡Buen trabajo! Estás haciendo un impacto real en el planeta.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.botonNuevoRegistro}
          onPress={() => router.push('/nuevo-pesaje')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.textoBotonNuevo}>Nuevo Registro</Text>
        </TouchableOpacity>

        <View style={styles.gridContainer}>
          
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => router.push('/historial')}
          >
            <View style={[styles.iconoCaja, { backgroundColor: '#A3DAB9' }]}>
              <Ionicons name="sync" size={24} color="#115E3E" />
            </View>
            <Text style={styles.gridNumero}>{totalObjetos}</Text>
            <Text style={styles.gridEtiqueta}>REGISTROS</Text>
          </TouchableOpacity>

          <View style={styles.gridCard}>
            <View style={[styles.iconoCaja, { backgroundColor: '#6B7280' }]}>
              <Ionicons name="water" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.gridNumero}>120L</Text>
            <Text style={styles.gridEtiqueta}>AGUA AHORRADA</Text>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#115E3E' },
  saludo: { fontSize: 18, color: '#374151', marginBottom: 12 },
  nivelPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1F2E0', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginBottom: 16 },
  nivelTexto: { color: '#115E3E', fontWeight: '600', fontSize: 14, marginLeft: 6 },
  progresoContainer: { marginBottom: 24 },
  barraFondo: { height: 8, backgroundColor: '#BFE9D4', borderRadius: 4, marginBottom: 8 },
  barraLlenado: { width: '45%', height: '100%', backgroundColor: '#115E3E', borderRadius: 4 },
  xpTexto: { textAlign: 'right', fontSize: 12, color: '#6B7280', fontWeight: '500' },
  tarjetaPrincipal: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 },
  tituloTarjeta: { fontSize: 16, color: '#374151', fontWeight: '500', marginBottom: 20 },
  circuloFondo: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#D1F2E0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  circuloProgreso: { width: 160, height: 160, borderRadius: 80, borderWidth: 12, borderColor: '#115E3E', borderLeftColor: 'transparent', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-45deg' }] },
  circuloCentro: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '45deg' }] },
  numeroGrande: { fontSize: 40, fontWeight: '800', color: '#115E3E' },
  textoKg: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  mensajeMotivacional: { textAlign: 'center', color: '#6B7280', fontSize: 13, lineHeight: 20, paddingHorizontal: 10 },
  botonNuevoRegistro: { backgroundColor: '#115E3E', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, marginBottom: 24 },
  textoBotonNuevo: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { backgroundColor: '#FFFFFF', width: '48%', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  iconoCaja: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridNumero: { fontSize: 20, fontWeight: '800', color: '#374151', marginBottom: 4 },
  gridEtiqueta: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 1 }
});