import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, ActivityIndicator,
  Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'https://ecotrack-api-6686.onrender.com';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const { usuario, token, logout, updateUser } = useAuth();

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [telefono, setTelefono] = useState(usuario?.telefono || '');
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim() || !email.trim()) {
      Alert.alert('Error', 'Nombre y email son obligatorios');
      return;
    }

    setCargando(true);

    try {
      const response = await fetch(`${API_URL}/usuarios/${usuario?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim() || null,
        }),
      });

      if (response.status === 401) {
        await logout();
        return;
      }

      if (response.status === 403) {
        Alert.alert('Error', 'No tienes permiso para editar esta cuenta');
        return;
      }

      if (!response.ok) throw new Error('Error al actualizar');

      const usuarioActualizado = await response.json();

      // Actualizar en el contexto global
      updateUser({
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        rol: usuarioActualizado.rol,
      });

      Alert.alert('✅ Éxito', 'Perfil actualizado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarCuenta = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro? Esta acción es IRREVERSIBLE y eliminará todos tus datos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmación Final',
              'Esta acción no se puede deshacer. ¿Continuar?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar Definitivamente',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const response = await fetch(`${API_URL}/usuarios/${usuario?.id}`, {
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                      });

                      if (response.status === 401) {
                        await logout();
                        return;
                      }

                      if (response.ok) {
                        await logout();
                        Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente');
                      }
                    } catch (error) {
                      Alert.alert('Error', 'No se pudo eliminar la cuenta');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.btnVolver}>
              <Ionicons name="arrow-back" size={24} color="#115E3E" />
            </TouchableOpacity>
            <Text style={styles.titulo}>Editar Perfil</Text>
          </View>

          {/* Campos */}
          <View style={styles.card}>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nombre Completo</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.icono} />
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  placeholderTextColor="#9CA3AF"
                  editable={!cargando}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.icono} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!cargando}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Teléfono (opcional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.icono} />
                <TextInput
                  style={styles.input}
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="+57 300 1234567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  editable={!cargando}
                />
              </View>
            </View>

          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[styles.botonGuardar, cargando && styles.botonDeshabilitado]}
            onPress={handleGuardar}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.textoBoton}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Botón Eliminar Cuenta */}
          <TouchableOpacity
            style={styles.botonEliminar}
            onPress={handleEliminarCuenta}
            disabled={cargando}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.textoEliminar}>Eliminar Cuenta</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 },
  btnVolver: { marginRight: 16 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#064E3B' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1,
    borderColor: '#BFE9D4', borderRadius: 12,
    height: 52, paddingHorizontal: 14,
  },
  icono: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#115E3E' },
  botonGuardar: {
    backgroundColor: '#064E3B', borderRadius: 12,
    height: 52, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  botonEliminar: {
    backgroundColor: '#FEE2E2', borderRadius: 12,
    height: 52, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
  },
  textoEliminar: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});