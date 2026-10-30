import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { obtenerUrlImagen } from "../api";
import { colores, radio, sombras, fuentes } from "../theme";

export default function LugarCard({ lugar, onPress, favorito, onAlternarFavorito }) {
  const urlImagen = obtenerUrlImagen(lugar.imagen);

  return (
    <TouchableOpacity
      style={[styles.card, sombras.reposo]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {urlImagen ? (
        <Image
          source={{ uri: urlImagen }}
          style={styles.imagen}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.imagen, styles.imagenVacia]}>
          <Text style={styles.imagenVaciaTexto}>📷</Text>
        </View>
      )}

      {/* Corazón de favorito, como el .btn-favorito de la web */}
      <TouchableOpacity
        style={styles.botonFavorito}
        onPress={onAlternarFavorito}
        activeOpacity={0.8}
      >
        <Text style={styles.botonFavoritoTexto}>
          {favorito ? "❤️" : "🤍"}
        </Text>
      </TouchableOpacity>

      <View style={styles.contenido}>
        <Text style={styles.titulo}>{lugar.nombre}</Text>
        <Text style={styles.categoria}>{lugar.categoria}</Text>
        <Text style={styles.direccion}>📍 {lugar.direccion}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colores.superficie,
    borderRadius: 16,
    overflow: "hidden",
    margin: 8,
    flex: 1,
  },
  imagen: {
    width: "100%",
    height: 130,
  },
  imagenVacia: {
    backgroundColor: colores.primarioSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  imagenVaciaTexto: {
    fontSize: 32,
  },
  botonFavorito: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radio.pill,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    ...sombras.reposo,
  },
  botonFavoritoTexto: {
    fontSize: 20,
  },
  contenido: {
    padding: 12,
  },
  titulo: {
    fontSize: 14,
    fontFamily: fuentes.semibold,
    color: colores.tinta,
    marginBottom: 4,
  },
  categoria: {
    fontSize: 11,
    fontFamily: fuentes.semibold,
    color: colores.primario,
    marginBottom: 8,
  },
  direccion: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fuentes.regular,
    color: colores.tintaSuave,
  },
});
