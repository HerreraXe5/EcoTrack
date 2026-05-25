import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
  ScrollView, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import type { ItemValue } from '@react-native-picker/picker/typings/Picker';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'https://ecotrack-api-6686.onrender.com';

interface Categoria {
  id: number;
  nombre: string;
  factor_co2: number;
}

export default function NuevoPesajeScreen() {
  const router = useRouter();
  const { usuario, token, logout } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [peso, setPeso] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  // Cargar categorías al iniciar
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await fetch(`${API_URL}/categorias/`, {
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
          const datos = await response.json();
          setCategorias(datos);
          if (datos.length > 0) {
            setCategoriaId(String(datos[0].id));
          }
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar las categorías');
      } finally {
        setCargandoCategorias(false);
      }
    };

    if (token) cargarCategorias();
  }, [token]);

  const handleRegistrar = async () => {
    if (!categoriaId || !peso.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const pesoNum = parseFloat(peso.replace(',', '.'));

    if (isNaN(pesoNum) || pesoNum <= 0) {
      Alert.alert('Error', 'El peso debe ser un número mayor a 0');
      return;
    }

    setCargando(true);

    try {
      console.log('📡 Registrando pesaje con JWT...');

      const response = await fetch(`${API_URL}/registros/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuario_id: usuario?.id,
          categoria_id: parseInt(categoriaId),
          peso_kg: pesoNum,
        }),
      });

      if (response.status === 401) {
        await logout();
        return;
      }

      if (response.status === 403) {
        Alert.alert('Error', 'No tienes permiso para crear este registro');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al crear el registro');
      }

      const datos = await response.json();
      console.log('✅ Registro creado:', datos);

      const catSeleccionada = categorias.find(c => c.id === parseInt(categoriaId));

      Alert.alert(
        '¡Excelente! 🌱',
        `Has registrado ${pesoNum} kg de ${catSeleccionada?.nombre || 'material'}.\n\n¡Acabas de ahorrar ${datos.co2_ahorrado?.toFixed(2)} kg de CO₂!`,
        [{ text: '¡Genial!', onPress: () => { setPeso(''); router.push('/(tabs)'); } }]
      );

    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'No se pudo registrar el pesaje');
    } finally {
      setCargando(false);
    }
  };

  if (cargandoCategorias) {
    return (
      <SafeAreaView style={styles.fondo}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#115E3E" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="scale-outline" size={48} color="#115E3E" style={{ marginBottom: 12 }} />
          <Text style={styles.titulo}>Nuevo Pesaje</Text>
          <Text style={styles.subtitulo}>Registra el material que reciclaste</Text>
        </View>

        {/* Card Formulario */}
        <View style={styles.card}>

          {/* Categoría */}
          <Text style={styles.label}>Tipo de Material</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoriaId}
              onValueChange={(val: ItemValue) => setCategoriaId(String(val))}
              style={styles.picker}
            >
              {categorias.map((cat) => (
                <Picker.Item
                  key={cat.id}
                  label={`${cat.nombre} (×${cat.factor_co2} CO₂)`}
                  value={String(cat.id)}
                />
              ))}
            </Picker>
          </View>

          {/* Peso */}
          <Text style={[styles.label, { marginTop: 20 }]}>Peso en kilogramos (kg)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="scale-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
            <TextInput
              style={styles.input}
              placeholder="Ej: 2.5"
              placeholderTextColor="#9CA3AF"
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
              editable={!cargando}
            />
            <Text style={styles.unidad}>kg</Text>
          </View>

          {/* Cálculo estimado */}
          {peso !== '' && categoriaId !== '' && (
            <View style={styles.estimado}>
              <Ionicons name="leaf-outline" size={16} color="#115E3E" />
              <Text style={styles.estimadoTexto}>
                CO₂ estimado: {(
                  parseFloat(peso.replace(',', '.') || '0') *
                  (categorias.find(c => c.id === parseInt(categoriaId))?.factor_co2 || 0)
                ).toFixed(2)} kg
              </Text>
            </View>
          )}

          {/* Botón Registrar */}
          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={handleRegistrar}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.textoBoton}>Registrar Pesaje</Text>
              </>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#E8F7ED' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#064E3B' },
  subtitulo: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  pickerContainer: {
    borderWidth: 1, borderColor: '#BFE9D4',
    borderRadius: 12, overflow: 'hidden', backgroundColor: '#F9FAFB',
  },
  picker: { height: 56, color: '#115E3E' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1,
    borderColor: '#BFE9D4', borderRadius: 12,
    height: 56, paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 16, color: '#115E3E' },
  unidad: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  estimado: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#D1F2E0', padding: 12,
    borderRadius: 10, marginTop: 12, gap: 8,
  },
  estimadoTexto: { fontSize: 13, color: '#115E3E', fontWeight: '600' },
  boton: {
    backgroundColor: '#064E3B', borderRadius: 12,
    height: 56, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', marginTop: 24,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});