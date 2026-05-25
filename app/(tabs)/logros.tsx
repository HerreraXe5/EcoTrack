import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Datos simulados del camino ecológico
const niveles = [
  { id: '4', titulo: 'Héroe del Planeta', subtitulo: '100 puntos req.', estado: 'bloqueado', icono: 'earth' },
  { id: '3', titulo: 'Guardián Verde', subtitulo: '75 puntos logrados', estado: 'actual', icono: 'leaf' },
  { id: '2', titulo: 'Brote', subtitulo: 'Completado en Oct 2025', estado: 'completado', icono: 'leaf-outline' },
  { id: '1', titulo: 'Semilla', subtitulo: 'Completado en Ago 2025', estado: 'completado', icono: 'rose-outline' },
];

export default function LogrosScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.fondo}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Superior */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.botonRegresar}>
            <Ionicons name="arrow-back" size={24} color="#115E3E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EcoTrack</Text>
        </View>

        {/* Sección Hero: Nivel Actual */}
        <View style={styles.heroContainer}>
          <Text style={styles.labelNivel}>NIVEL ACTUAL</Text>
          
          <View style={styles.circuloIconoGrande}>
            <Ionicons name="leaf" size={48} color="#A3DAB9" />
          </View>

          <Text style={styles.tituloHero}>Guardián{'\n'}Verde</Text>
          <Text style={styles.subtituloHero}>
            Has completado 45 acciones sostenibles este mes. ¡Sigue así!
          </Text>
        </View>

        {/* Tarjeta de Progreso */}
        <View style={styles.tarjetaProgreso}>
          <View style={styles.filaProgresoTop}>
            <View>
              <Text style={styles.labelProximo}>Próximo Nivel</Text>
              <Text style={styles.tituloProximo}>Héroe del Planeta</Text>
            </View>
            <Text style={styles.porcentaje}>75%</Text>
          </View>
          
          <View style={styles.barraFondo}>
            <View style={styles.barraLlenado} />
          </View>
          
          <Text style={styles.textoFaltante}>Faltan 15 puntos ecológicos</Text>
        </View>

        {/* Lista del Camino Ecológico */}
        <View style={styles.caminoContainer}>
          <Text style={styles.tituloCamino}>Tu Camino Ecológico</Text>

          {niveles.map((nivel) => {
            const isBloqueado = nivel.estado === 'bloqueado';
            const isActual = nivel.estado === 'actual';
            const isCompletado = nivel.estado === 'completado';

            return (
              <View 
                key={nivel.id} 
                style={[
                  styles.tarjetaNivel, 
                  isActual && styles.tarjetaNivelActual,
                  isBloqueado && styles.tarjetaNivelBloqueado
                ]}
              >
                {/* Lado Izquierdo: Icono */}
                <View style={[
                  styles.iconoNivelContainer,
                  isActual && styles.iconoNivelActualContainer,
                  isBloqueado && styles.iconoNivelBloqueadoContainer
                ]}>
                  <Ionicons 
                    name={nivel.icono as any} 
                    size={24} 
                    color={isActual ? '#FFFFFF' : (isBloqueado ? '#9CA3AF' : '#115E3E')} 
                  />
                </View>

                {/* Textos Centrales */}
                <View style={styles.textosNivelContainer}>
                  <View style={styles.filaTituloNivel}>
                    <Text style={[
                      styles.tituloNivel,
                      isBloqueado && styles.textoBloqueado
                    ]}>
                      {nivel.titulo}
                    </Text>
                    {isActual && (
                      <View style={styles.pillActual}>
                        <Text style={styles.textoPillActual}>ACTUAL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.subtituloNivel,
                    isBloqueado && styles.textoBloqueadoSecundario
                  ]}>
                    {nivel.subtitulo}
                  </Text>
                </View>

                {/* Lado Derecho: Icono de Estado */}
                <View style={styles.estadoNivelContainer}>
                  {isBloqueado && <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
                  {isCompletado && <Ionicons name="checkmark-circle-outline" size={24} color="#115E3E" />}
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#E8F7ED', 
  },
  scrollContainer: {
    paddingBottom: 100, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    position: 'relative',
  },
  botonRegresar: {
    position: 'absolute',
    left: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#115E3E',
  },
  heroContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
    marginBottom: 20,
  },
  labelNivel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  circuloIconoGrande: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2D4A3E', // Verde muy oscuro
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tituloHero: {
    fontSize: 36,
    fontWeight: '800',
    color: '#064E3B',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
  },
  subtituloHero: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  tarjetaProgreso: {
    backgroundColor: '#FFFFFF', // O un verde súper claro #F0FDF4
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  filaProgresoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  labelProximo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  tituloProximo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
  },
  porcentaje: {
    fontSize: 14,
    fontWeight: '700',
    color: '#115E3E',
  },
  barraFondo: {
    height: 10,
    backgroundColor: '#D1F2E0',
    borderRadius: 5,
    marginBottom: 8,
  },
  barraLlenado: {
    width: '75%',
    height: '100%',
    backgroundColor: '#115E3E',
    borderRadius: 5,
  },
  textoFaltante: {
    fontSize: 13,
    color: '#6B7280',
  },
  caminoContainer: {
    paddingHorizontal: 20,
  },
  tituloCamino: {
    fontSize: 16,
    fontWeight: '700',
    color: '#064E3B',
    marginBottom: 16,
  },
  tarjetaNivel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Gris muy claro para los completados
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tarjetaNivelActual: {
    backgroundColor: '#D1F2E0', // Verde claro para el actual
    borderColor: '#BFE9D4',
  },
  tarjetaNivelBloqueado: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  iconoNivelContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconoNivelActualContainer: {
    backgroundColor: '#115E3E', // Verde oscuro
  },
  iconoNivelBloqueadoContainer: {
    backgroundColor: '#F3F4F6',
  },
  textosNivelContainer: {
    flex: 1,
  },
  filaTituloNivel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tituloNivel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  textoBloqueado: {
    color: '#9CA3AF',
  },
  pillActual: {
    backgroundColor: '#115E3E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  textoPillActual: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtituloNivel: {
    fontSize: 12,
    color: '#6B7280',
  },
  textoBloqueadoSecundario: {
    color: '#9CA3AF',
  },
  estadoNivelContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }
});