import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import LugarCard from "../components/LugarCard";
import { obtenerLugares } from "../api";

export default function HomeScreen() {
  const [lugares, setLugares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState(null);

  const cargarLugares = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerLugares({ buscar });
      setLugares(data.lugares || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los lugares");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLugares();
  }, [buscar]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <ActivityIndicator size="large" color="#0D9488" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity
          style={styles.botonReintentar}
          onPress={cargarLugares}
        >
          <Text style={styles.botonTexto}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Descubre Sincelejo</Text>
        <Text style={styles.subtitulo}>Lugares turísticos de Sucre</Text>
      </View>

      <View style={styles.buscador}>
        <TextInput
          style={styles.input}
          placeholder="Buscar lugar..."
          value={buscar}
          onChangeText={setBuscar}
          onSubmitEditing={cargarLugares}
        />
        <TouchableOpacity style={styles.botonBuscar} onPress={cargarLugares}>
          <Text style={styles.botonTexto}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lugares}
        keyExtractor={(item) => item.idLugar.toString()}
        renderItem={({ item }) => (
          <LugarCard lugar={item} />
        )}
        numColumns={2}
        contentContainerStyle={styles.lista}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    backgroundColor: "#0D9488",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: "#e0f2fe",
  },
  buscador: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: -10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#1e293b",
  },
  botonBuscar: {
    marginLeft: 10,
    height: 48,
    width: 90,
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  botonTexto: {
    color: "#fff",
    fontWeight: "bold",
  },
  lista: {
    paddingBottom: 20,
  },
  error: {
    color: "#dc2626",
    textAlign: "center",
    margin: 20,
    fontSize: 16,
  },
});
