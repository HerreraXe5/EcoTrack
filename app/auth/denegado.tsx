import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AccesoDenegadoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.fondo}>
      <View style={styles.container}>
        
        {/* Gráfico Central: Círculos concéntricos */}
        <View style={styles.circuloExterior}>
          <View style={styles.circuloMedio}>
            <View style={styles.circuloInterior}>
              <Ionicons name="lock-closed" size={48} color="#374151" />
            </View>
          </View>
        </View>

        {/* Textos de Restricción */}
        <Text style={styles.titulo}>Acceso Denegado</Text>
        <Text style={styles.subtitulo}>
          No tienes los permisos necesarios para ver esta sección.
        </Text>

        {/* Botón para volver */}
        <TouchableOpacity 
          style={styles.botonPrincipal} 
          // Por ahora nos lleva al Login. Más adelante, cuando haya sesión activa, lo cambiaremos al Dashboard.
          onPress={() => router.replace('/auth/login')} 
        >
          <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" style={styles.iconoBoton} />
          <Text style={styles.textoBoton}>Volver al Inicio</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#E8F7ED', // Fondo verde menta muy claro
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  circuloExterior: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#D1F2E0', // Verde exterior
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  circuloMedio: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#BFE9D4', // Verde intermedio
    justifyContent: 'center',
    alignItems: 'center',
  },
  circuloInterior: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A3DAB9', // Verde más oscuro del centro
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra para darle profundidad como en el diseño
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '600',
    color: '#374151', // Gris oscuro
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    color: '#6B7280', // Gris medio
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  botonPrincipal: {
    backgroundColor: '#115E3E', // Verde oscuro EcoTrack
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoBoton: {
    marginRight: 8,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});