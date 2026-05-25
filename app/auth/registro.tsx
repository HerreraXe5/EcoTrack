import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function RegistroScreen() {
  const router = useRouter();
  const { registro } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);

    try {
      console.log('📝 Registrando usuario...');
      await registro(nombre, email, password);
      console.log('✅ Registro exitoso');

      Alert.alert(
        '¡Bienvenido!',
        'Cuenta creada exitosamente',
        [{ text: 'Continuar', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error) {
      console.error('❌ Error en registro:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo crear la cuenta'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.btnVolver}>
              <Ionicons name="arrow-back" size={24} color="#115E3E" />
            </TouchableOpacity>
            <Text style={styles.titulo}>Crear Cuenta</Text>
            <Text style={styles.subtitulo}>Únete a la comunidad EcoTrack</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>

            {/* Nombre */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nombre Completo</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.iconoIzq} />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor="#9CA3AF"
                  value={nombre}
                  onChangeText={setNombre}
                  autoCapitalize="words"
                  editable={!cargando}
                />
              </View>
            </View>

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
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!mostrarPassword}
                  editable={!cargando}
                />
                <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
                  <Ionicons name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.iconoIzq} />
                <TextInput
                  style={styles.input}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!mostrarPassword}
                  editable={!cargando}
                />
              </View>
            </View>

            {/* Botón Registrarse */}
            <TouchableOpacity
              style={[styles.botonRegistrar, cargando && styles.botonDeshabilitado]}
              onPress={handleRegistro}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.textoBoton}>Crear Cuenta</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Link a Login */}
            <View style={styles.loginLink}>
              <Text style={styles.textoLink}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={[styles.textoLink, styles.enlace]}>Inicia Sesión</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  scrollContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingTop: 20, marginBottom: 32 },
  btnVolver: { marginBottom: 16 },
  titulo: { fontSize: 28, fontWeight: '800', color: '#064E3B', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#6B7280' },
  formContainer: {},
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: '#BFE9D4', borderRadius: 12,
    height: 56, paddingHorizontal: 16,
  },
  iconoIzq: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#115E3E' },
  botonRegistrar: {
    backgroundColor: '#064E3B', borderRadius: 12,
    height: 56, justifyContent: 'center',
    alignItems: 'center', flexDirection: 'row', marginTop: 24,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  textoLink: { fontSize: 14, color: '#6B7280' },
  enlace: { color: '#115E3E', fontWeight: '600' },
});