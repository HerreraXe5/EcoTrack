import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const API_URL = "https://ecotrack-api-6686.onrender.com";

export default function AdminNuevaCategoriaScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [impacto, setImpacto] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async () => {
    if (!nombre || !impacto || isNaN(Number(impacto))) {
      Alert.alert('Datos inválidos', 'Por favor ingresa un nombre y un valor numérico para el impacto.');
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/categorias/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: nombre, 
          factor_co2: parseFloat(impacto) 
        }),
      });

      if (!response.ok) throw new Error('Error al guardar');

      Alert.alert('Categoría Creada', `El material "${nombre}" ha sido añadido.`, [
        { text: 'Entendido', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo crear la categoría.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#115E3E" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EcoTrack Admin</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.tituloContainer}>
            <Text style={styles.tituloPrincipal}>Nueva Categoría</Text>
            <Text style={styles.subtituloPrincipal}>Añade un nuevo material al ecosistema.</Text>
          </View>

          <View style={styles.tarjeta}>
            <View style={styles.inputWrapper}>
              <View style={styles.labelContainer}>
                <Ionicons name="cube-outline" size={16} color="#115E3E" style={styles.labelIcon} />
                <Text style={styles.label}>Nombre del Material</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="Ej. Cartón" placeholderTextColor="#9CA3AF" value={nombre} onChangeText={setNombre} />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.labelContainer}>
                <Ionicons name="leaf-outline" size={16} color="#115E3E" style={styles.labelIcon} />
                <Text style={styles.label}>Impacto de CO2 <Text style={styles.labelLight}>(kg CO2e/kg)</Text></Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={impacto} onChangeText={setImpacto} />
              </View>
            </View>

            <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardar} disabled={cargando}>
              {cargando ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.textoBoton}>Guardar Categoría</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  scrollContainer: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#064E3B' },
  tituloContainer: { alignItems: 'center', paddingHorizontal: 30, marginBottom: 24 },
  tituloPrincipal: { fontSize: 28, fontWeight: '800', color: '#064E3B', marginBottom: 8, textAlign: 'center' },
  subtituloPrincipal: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20 },
  tarjeta: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 20, padding: 24, elevation: 3 },
  inputWrapper: { marginBottom: 24 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  labelIcon: { marginRight: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#115E3E' },
  labelLight: { fontWeight: '500', color: '#6B7280' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, height: 52, paddingHorizontal: 16, backgroundColor: '#FFFFFF' },
  input: { flex: 1, fontSize: 15, color: '#115E3E' },
  botonGuardar: { backgroundColor: '#064E3B', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, marginTop: 10 },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});