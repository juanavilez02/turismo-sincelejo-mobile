import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function LugarCard({ lugar, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: lugar.imagen }}
        style={styles.imagen}
      />
      <View style={styles.contenido}>
        <Text style={styles.titulo}>{lugar.nombre}</Text>
        <Text style={styles.categoria}>{lugar.categoria}</Text>
        <Text style={styles.direccion}>
          📍 {lugar.direccion}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    margin: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: "45%",
  },
  imagen: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  contenido: {
    padding: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  categoria: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0D9488",
    marginBottom: 8,
  },
  direccion: {
    fontSize: 13,
    color: "#64748b",
  },
});
