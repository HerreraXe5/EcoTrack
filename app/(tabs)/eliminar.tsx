import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_URL = "https://ecotrack-api-6686.onrender.com";

export default function EliminarRegistroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const [cargando, setCargando] = useState(false);

  const handleEliminar = async () => {
    if (!params.id) {
      Alert.alert("Error", "No se encontró el ID del registro.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/registros/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      Alert.alert(
        "Registro Eliminado", 
        "El pesaje ha sido borrado exitosamente de la base de datos.",
        [{ text: "Entendido", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo eliminar el registro.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.fondoOverlay}>
      <View style={styles.headerFondo}>
        <Ionicons name="arrow-back" size={24} color="#3C5C4D" />
        <Text style={styles.headerTitleFondo}>EcoTrack</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.iconoFondoSimulado}>
        <Ionicons name="leaf" size={60} color="#2D4A3E" />
      </View>

      <View style={styles.containerCentro}>
        <View style={styles.modalCard}>
          <View style={styles.iconoCirculo}>
            <Ionicons name="warning-outline" size={28} color="#C81E1E" />
          </View>

          <Text style={styles.titulo}>Delete Record?</Text>
          <Text style={styles.subtitulo}>
            ¿Seguro que quieres borrar el registro #{params.id}?{'\n'}This action cannot be undone.
          </Text>

          <TouchableOpacity style={styles.botonEliminar} onPress={handleEliminar} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.textoBotonEliminar}>Eliminar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonCancelar} onPress={() => router.back()} disabled={cargando}>
            <Text style={styles.textoBotonCancelar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondoOverlay: { flex: 1, backgroundColor: '#8BA396' },
  headerFondo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, opacity: 0.5 },
  headerTitleFondo: { fontSize: 20, fontWeight: '800', color: '#3C5C4D' },
  iconoFondoSimulado: { alignItems: 'center', marginTop: 40, opacity: 0.3 },
  containerCentro: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginTop: -80 },
  modalCard: { backgroundColor: '#E8F7ED', borderRadius: 24, width: '100%', padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  iconoCirculo: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F9EBEA', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#064E3B', marginBottom: 10 },
  subtitulo: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20, marginBottom: 30, paddingHorizontal: 10 },
  botonEliminar: { backgroundColor: '#B91C1C', width: '100%', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  textoBotonEliminar: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  botonCancelar: { backgroundColor: '#C6F0D5', width: '100%', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  textoBotonCancelar: { color: '#115E3E', fontSize: 16, fontWeight: '700' }
});