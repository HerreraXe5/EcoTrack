import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../hooks/useAuth";

const API_URL = "https://ecotrack-api-6686.onrender.com";

export default function AdminCategoriasScreen() {
  const { token, usuario, logout } = useAuth();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [modalCalibrar, setModalCalibrar] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoFactor, setNuevoFactor] = useState("");
  const [nuevaDesc, setNuevaDesc] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<any>(null);
  const [nuevoFactorCalibrar, setNuevoFactorCalibrar] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (usuario?.rol !== "admin") {
    return (
      <SafeAreaView style={styles.fondo}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Ionicons name="lock-closed-outline" size={64} color="#9CA3AF" />
          <Text style={{ fontSize: 18, color: "#6B7280", marginTop: 16 }}>
            Solo administradores
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/categorias/?token=${token}`);
      if (response.status === 401) {
        await logout();
        return;
      }
      if (response.ok) setCategorias(await response.json());
    } catch {
      Alert.alert("Error", "No se pudieron cargar las categorías");
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) cargarCategorias();
    }, [token]),
  );

  const handleCrear = async () => {
    if (!nuevoNombre.trim() || !nuevoFactor.trim()) {
      Alert.alert("Error", "Nombre y factor son obligatorios");
      return;
    }
    const factor = parseFloat(nuevoFactor.replace(",", "."));
    if (isNaN(factor)) {
      Alert.alert("Error", "Factor inválido");
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch(`${API_URL}/categorias/?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          factor_co2: factor,
          descripcion: nuevaDesc.trim() || null,
        }),
      });
      if (response.status === 401) {
        await logout();
        return;
      }
      if (!response.ok) throw new Error();
      Alert.alert("✅", "Categoría creada");
      setModalNueva(false);
      setNuevoNombre("");
      setNuevoFactor("");
      setNuevaDesc("");
      cargarCategorias();
    } catch {
      Alert.alert("Error", "No se pudo crear la categoría");
    } finally {
      setGuardando(false);
    }
  };

  const handleCalibrar = async () => {
    const factor = parseFloat(nuevoFactorCalibrar.replace(",", "."));
    if (isNaN(factor)) {
      Alert.alert("Error", "Factor inválido");
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch(
        `${API_URL}/categorias/${categoriaSeleccionada?.id}?token=${token}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: categoriaSeleccionada?.nombre,
            factor_co2: factor,
            descripcion: categoriaSeleccionada?.descripcion,
          }),
        },
      );
      if (response.status === 401) {
        await logout();
        return;
      }
      if (!response.ok) throw new Error();
      Alert.alert("✅", "Factor actualizado");
      setModalCalibrar(false);
      cargarCategorias();
    } catch {
      Alert.alert("Error", "No se pudo actualizar");
    } finally {
      setGuardando(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre}>{item.nombre}</Text>
        <Text style={styles.itemFactor}>Factor CO₂: {item.factor_co2}</Text>
        {item.descripcion && (
          <Text style={styles.itemDesc}>{item.descripcion}</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.btnCalibrar}
        onPress={() => {
          setCategoriaSeleccionada(item);
          setNuevoFactorCalibrar(String(item.factor_co2));
          setModalCalibrar(true);
        }}
      >
        <Ionicons name="settings-outline" size={18} color="#115E3E" />
      </TouchableOpacity>
    </View>
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.fondo}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#115E3E" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Administrador</Text>
          <TouchableOpacity
            style={styles.btnNueva}
            onPress={() => setModalNueva(true)}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitulo}>
          {categorias.length} categorías disponibles
        </Text>
        <FlatList
          data={categorias}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>

      {/* Modal Nueva */}
      <Modal visible={modalNueva} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nueva Categoría</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del material"
              placeholderTextColor="#9CA3AF"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Factor CO₂ (ej: 0.5)"
              placeholderTextColor="#9CA3AF"
              value={nuevoFactor}
              onChangeText={setNuevoFactor}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#9CA3AF"
              value={nuevaDesc}
              onChangeText={setNuevaDesc}
            />
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalNueva(false)}
              >
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnGuardar}
                onPress={handleCrear}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.textoGuardar}>Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Calibrar */}
      <Modal visible={modalCalibrar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>
              Calibrar: {categoriaSeleccionada?.nombre}
            </Text>
            <Text style={styles.modalSubtitulo}>
              Factor actual: {categoriaSeleccionada?.factor_co2}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo factor CO₂"
              placeholderTextColor="#9CA3AF"
              value={nuevoFactorCalibrar}
              onChangeText={setNuevoFactorCalibrar}
              keyboardType="decimal-pad"
            />
            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalCalibrar(false)}
              >
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnGuardar}
                onPress={handleCalibrar}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.textoGuardar}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#E8F7ED" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  titulo: { fontSize: 24, fontWeight: "800", color: "#064E3B" },
  subtitulo: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  btnNueva: {
    backgroundColor: "#064E3B",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: 15, fontWeight: "700", color: "#064E3B" },
  itemFactor: { fontSize: 13, color: "#115E3E", marginTop: 2 },
  itemDesc: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  btnCalibrar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#D1F2E0",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#064E3B",
    marginBottom: 4,
  },
  modalSubtitulo: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#BFE9D4",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#115E3E",
    marginBottom: 12,
  },
  modalBotones: { flexDirection: "row", gap: 12, marginTop: 8 },
  btnCancelar: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFE9D4",
    justifyContent: "center",
    alignItems: "center",
  },
  textoCancelar: { color: "#6B7280", fontWeight: "600" },
  btnGuardar: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#064E3B",
    justifyContent: "center",
    alignItems: "center",
  },
  textoGuardar: { color: "#FFFFFF", fontWeight: "700" },
});
