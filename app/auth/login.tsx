import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

const API_URL = "https://ecotrack-api-6686.onrender.com";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setCargando(true);

    try {
      console.log('🔐 Iniciando sesión con JWT...');
      
      // Usar el método login del contexto
      await login(email, password);
      
      console.log('✅ Login exitoso, redirigiendo...');
      
      Alert.alert(
        '¡Bienvenido!',
        'Sesión iniciada correctamente',
        [{ text: 'Continuar', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error) {
      console.error('❌ Error en login:', error);
      Alert.alert(
        'Error de Login',
        error instanceof Error ? error.message : 'Email o contraseña incorrectos'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Logo/Título */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={48} color="#115E3E" />
            </View>
            <Text style={styles.titulo}>EcoTrack</Text>
            <Text style={styles.subtitulo}>Gestiona tu reciclaje inteligentemente</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.iconoIzq} />
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!cargando}
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.iconoIzq} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!mostrarPassword}
                  editable={!cargando}
                />
                <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
                  <Ionicons 
                    name={mostrarPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Iniciar Sesión */}
            <TouchableOpacity 
              style={[styles.botonIngresar, cargando && styles.botonDeshabilitado]} 
              onPress={handleLogin}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.textoBoton}>Iniciar Sesión</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Link a Registro */}
            <View style={styles.registroLink}>
              <Text style={styles.textoLink}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/registro')}>
                <Text style={[styles.textoLink, styles.enlace]}>Regístrate aquí</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info de Seguridad */}
          <View style={styles.infoSeguridad}>
            <Ionicons name="shield-checkmark" size={16} color="#115E3E" />
            <Text style={styles.textoSeguridad}>Conexión segura con JWT</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#E8F7ED',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1F2E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFE9D4',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  iconoIzq: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#115E3E',
  },
  botonIngresar: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 24,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  registroLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  textoLink: {
    fontSize: 14,
    color: '#6B7280',
  },
  enlace: {
    color: '#115E3E',
    fontWeight: '600',
  },
  infoSeguridad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1F2E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  textoSeguridad: {
    marginLeft: 8,
    fontSize: 12,
    color: '#115E3E',
    fontWeight: '600',
  },
});