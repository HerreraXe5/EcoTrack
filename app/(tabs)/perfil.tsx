import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function PerfilScreen() {
  const router = useRouter();
  const { usuario, logout } = useAuth();

  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // El guard en _layout.tsx redirige automáticamente al login
          },
        },
      ]
    );
  };

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'EC';

  const getEmojiNivel = () => {
    return '🌱 Semilla';
  };

  const MenuItem = ({ icono, texto, onPress, color = '#374151' }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcono}>
        <Ionicons name={icono} size={22} color="#115E3E" />
      </View>
      <Text style={[styles.menuTexto, { color }]}>{texto}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.fondo}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* Avatar y nombre */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarTexto}>{iniciales}</Text>
          </View>
          <Text style={styles.nombre}>{usuario?.nombre || 'Usuario'}</Text>
          <Text style={styles.email}>{usuario?.email || ''}</Text>
          <View style={styles.nivelBadge}>
            <Text style={styles.nivelTexto}>Nivel: {getEmojiNivel()}</Text>
          </View>
          {usuario?.rol === 'admin' && (
            <View style={[styles.nivelBadge, { backgroundColor: '#DBEAFE', marginTop: 6 }]}>
              <Text style={[styles.nivelTexto, { color: '#1E40AF' }]}>⭐ Administrador</Text>
            </View>
          )}
        </View>

        {/* Menú opciones */}
        <View style={styles.menuCard}>
          <Text style={styles.seccionTitulo}>Mi Cuenta</Text>

          <MenuItem
            icono="create-outline"
            texto="Editar Perfil"
            onPress={() => router.push('/editar-perfil')}
          />
          <MenuItem
            icono="trophy-outline"
            texto="Mis Logros"
            onPress={() => router.push('/(tabs)/logros')}
          />
        </View>

        <View style={styles.menuCard}>
          <Text style={styles.seccionTitulo}>Configuración</Text>

          <MenuItem
            icono="notifications-outline"
            texto="Notificaciones"
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible en la próxima versión')}
          />
          <MenuItem
            icono="shield-outline"
            texto="Privacidad"
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible en la próxima versión')}
          />
        </View>

        {/* Admin (solo si es admin) */}
        {usuario?.rol === 'admin' && (
          <View style={styles.menuCard}>
            <Text style={styles.seccionTitulo}>Administrador</Text>
            <MenuItem
              icono="settings-outline"
              texto="Gestionar Categorías"
              onPress={() => router.push('/(tabs)/admin-categorias')}
            />
          </View>
        )}

        {/* Cerrar Sesión */}
        <TouchableOpacity style={styles.botonCerrarSesion} onPress={handleCerrarSesion}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.textoCerrarSesion}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Versión */}
        <Text style={styles.version}>EcoTrack v2.0 - Con JWT 🔐</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#115E3E', justifyContent: 'center',
    alignItems: 'center', marginBottom: 16,
  },
  avatarTexto: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  nombre: { fontSize: 22, fontWeight: '800', color: '#064E3B' },
  email: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  nivelBadge: {
    backgroundColor: '#D1F2E0', paddingHorizontal: 16,
    paddingVertical: 6, borderRadius: 20, marginTop: 12,
  },
  nivelTexto: { fontSize: 13, fontWeight: '600', color: '#115E3E' },
  menuCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  seccionTitulo: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  menuIcono: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#D1F2E0', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  menuTexto: { flex: 1, fontSize: 15, fontWeight: '500' },
  botonCerrarSesion: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#FEE2E2',
    borderRadius: 12, height: 52, marginTop: 8, gap: 8,
  },
  textoCerrarSesion: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 24 },
});