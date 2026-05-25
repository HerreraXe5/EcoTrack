import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_URL = "https://ecotrack-api-6686.onrender.com";

export default function AdminCalibrarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  
  const [factor, setFactor] = useState(params.factor?.toString() || '0.00');
  const [cargando, setCargando] = useState(false);

  const handleActualizar = async () => {
    // MAGIA DE UX: Cambiamos cualquier coma por un punto automáticamente
    const factorNormalizado = factor.replace(',', '.');

    if (!factorNormalizado || isNaN(Number(factorNormalizado))) {
      Alert.alert('Valor inválido', 'Ingresa un número válido (ej. 2.5).');
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/categorias/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: params.nombre,
          factor_co2: parseFloat(factorNormalizado) 
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      Alert.alert("Factor Calibrado", "El nuevo factor de emisión ha sido guardado.", [
        { text: "Entendido", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <SafeAreaView style={styles.fondoOverlay}>
        
        <View style={styles.headerFondo}>
          <Ionicons name="arrow-back" size={24} color="#3C5C4D" />
          <Text style={styles.headerTitleFondo}>EcoTrack Admin</Text>
          <Ionicons name="settings-outline" size={24} color="#3C5C4D" />
        </View>

        <View style={styles.containerCentro}>
          <View style={styles.modalCard}>
            
            <View style={styles.iconoCirculo}>
              <Ionicons name="options-outline" size={28} color="#115E3E" />
            </View>

            <Text style={styles.titulo}>Calibrar Factor</Text>
            <Text style={styles.subtitulo}>
              Ajuste el factor de emisión de CO2 para <Text style={{ fontWeight: '800', color: '#374151' }}>{params.nombre}</Text>.
            </Text>

            <View style={styles.inputContenedorPrincipal}>
              <View style={styles.inputCaja}>
                <Text style={styles.inputLabel}>Factor CO2 (kg/kg)</Text>
                <TextInput
                  style={styles.input}
                  value={factor}
                  onChangeText={setFactor}
                  keyboardType="numeric"
                />
                <Text style={styles.sufijoTexto}>CO<Text style={{ fontSize: 9 }}>2</Text></Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#115E3E" style={{ marginTop: 2, marginRight: 8 }} />
              <Text style={styles.infoText}>Actualizando ID: {params.id}</Text>
            </View>

            <View style={styles.filaBotones}>
              <TouchableOpacity style={styles.botonCancelar} onPress={() => router.back()} disabled={cargando}>
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.botonActualizar} onPress={handleActualizar} disabled={cargando}>
                {cargando ? <ActivityIndicator color="#FFFFFF" /> : (
                  <>
                    <Text style={styles.textoActualizar}>Actualizar</Text>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fondoOverlay: { flex: 1, backgroundColor: '#8BA396' },
  headerFondo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, opacity: 0.5 },
  headerTitleFondo: { fontSize: 20, fontWeight: '800', color: '#3C5C4D' },
  containerCentro: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginTop: -40 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 24, width: '100%', padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  iconoCirculo: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#C6F0D5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#064E3B', marginBottom: 8 },
  subtitulo: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, paddingHorizontal: 10, lineHeight: 20 },
  inputContenedorPrincipal: { width: '100%', marginBottom: 24 },
  inputCaja: { borderWidth: 1, borderColor: '#6B7280', borderRadius: 12, height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, position: 'relative' },
  inputLabel: { position: 'absolute', top: -10, left: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 4, fontSize: 11, fontWeight: '700', color: '#6B7280' },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#374151' },
  sufijoTexto: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  infoBox: { flexDirection: 'row', backgroundColor: '#D1F2E0', borderRadius: 8, padding: 12, width: '100%', marginBottom: 24 },
  infoText: { flex: 1, fontSize: 12, color: '#115E3E', lineHeight: 18 },
  filaBotones: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' },
  botonCancelar: { flex: 1, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  textoCancelar: { color: '#115E3E', fontSize: 15, fontWeight: '700' },
  botonActualizar: { flex: 1.2, backgroundColor: '#064E3B', borderRadius: 10, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  textoActualizar: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});