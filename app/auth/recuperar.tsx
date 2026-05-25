import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const API_URL = "https://ecotrack-api-6686.onrender.com";

export default function RecuperarScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleRecuperar = async () => {
    if (!email) {
      Alert.alert('Dato requerido', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    setCargando(true);

    try {
      // Ajusta la ruta '/recuperar-password' según tu FastAPI
      const response = await fetch(`${API_URL}/recuperar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud');
      }

      Alert.alert(
        'Correo Enviado',
        'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
        [{ text: 'Volver al Login', onPress: () => router.replace('/auth/login') }]
      );

    } catch (error) {
      console.error("Error en recuperación:", error);
      Alert.alert('Aviso', 'No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: 'center' }}>
        <View style={styles.contenedor}>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.botonRegresar}>
            <Ionicons name="arrow-back" size={24} color="#115E3E" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Ionicons name="key-outline" size={50} color="#115E3E" style={{ marginBottom: 16 }} />
            <Text style={styles.titulo}>Recuperar Clave</Text>
            <Text style={styles.subtitulo}>Ingresa tu correo y te enviaremos las instrucciones para restablecer tu contraseña.</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.iconoIzq} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.botonIngresar} 
            onPress={handleRecuperar}
            disabled={cargando}
          >
            {cargando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.textoBoton}>Enviar Enlace</Text>}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  contenedor: { paddingHorizontal: 24, flex: 1, justifyContent: 'center', marginTop: -50 },
  botonRegresar: { position: 'absolute', top: 20, left: 24, zIndex: 10 },
  headerContainer: { alignItems: 'center', marginBottom: 30, marginTop: 60 },
  titulo: { fontSize: 28, fontWeight: '800', color: '#064E3B', marginBottom: 8 },
  subtitulo: { fontSize: 14, color: '#4B5563', textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFE9D4', borderRadius: 12, height: 56, paddingHorizontal: 16 },
  iconoIzq: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#115E3E' },
  botonIngresar: { backgroundColor: '#064E3B', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});