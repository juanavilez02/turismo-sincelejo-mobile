import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { obtenerUrlImagen } from "../api";
import { colores, radio, sombras, fuentes } from "../theme";

// Emojis de categorias: exactamente los del sitio web (Frontend/app.js)
const EMOJIS_CATEGORIAS = {
  "Cultura e Historia": "🏛️",
  "Parques y Recreación": "🌳",
  "Gastronomía Tradicional": "🍽️",
  "Comercio y Entretenimiento": "🛍️",
};

export default function DetalleScreen({ lugar, onVolver, esAdmin, onEditar, onEliminar }) {
  const urlImagen = obtenerUrlImagen(lugar.imagen);
  const emoji = EMOJIS_CATEGORIAS[lugar.categoria] ?? "📍";

  // Mismo enlace de Google Maps que construye la web para "Cómo llegar"
  const urlMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lugar.nombre} Sincelejo ${lugar.direccion}`
  )}`;

  return (
    <View style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor={colores.tinta} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ============ FOTO HERO con botón volver encima ============ */}
        <View style={styles.hero}>
          {urlImagen ? (
            <Image source={{ uri: urlImagen }} style={styles.heroImagen} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImagen, styles.heroSinImagen]}>
              <Text style={styles.heroSinImagenTexto}>📷</Text>
            </View>
          )}

          <LinearGradient
            colors={["rgba(15, 23, 42, 0.55)", "transparent", "rgba(15, 23, 42, 0.60)"]}
            style={styles.heroGradiente}
          />

          <TouchableOpacity style={styles.btnVolver} onPress={onVolver} activeOpacity={0.8}>
            <Text style={styles.btnVolverTexto}>‹ Volver</Text>
          </TouchableOpacity>
          {/* Badge de categoria flotando sobre la foto, como el card-badge web */}
          <View style={styles.badgeCategoria}>
            <Text style={styles.badgeTexto}>
              {emoji} {lugar.categoria}
            </Text>
          </View>
        </View>

        {/* ============ CONTENIDO ============ */}
        <View style={styles.contenido}>
          <Text style={styles.nombre}>{lugar.nombre}</Text>

          {/* Filas de info: fieles a las card-meta del sitio web */}
          <View style={styles.meta}>
            <Text style={styles.metaTexto}>📍 {lugar.direccion}</Text>
            <Text style={styles.metaTexto}>⏰ {lugar.horario}</Text>
          </View>

          <Text style={styles.descripcion}>{lugar.descripcion}</Text>

          {/* CTA "Cómo llegar": mismo comportamiento del botón de la web */}
          <TouchableOpacity
            style={styles.botonMapa}
            onPress={() => Linking.openURL(urlMapa)}
            activeOpacity={0.85}
          >
            <Text style={styles.botonMapaTexto}>🗺️ Cómo llegar</Text>
          </TouchableOpacity>

          {/* Acciones de administración (solo si hay sesión, como el panel web) */}
          {esAdmin && (
            <View style={styles.filaAdmin}>
              <TouchableOpacity style={[styles.botonEditar, sombras.reposo]} onPress={onEditar} activeOpacity={0.85}>
                <Text style={styles.botonEditarTexto}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botonEliminar, sombras.reposo]} onPress={onEliminar} activeOpacity={0.85}>
                <Text style={styles.botonEliminarTexto}>🗑 Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.pie}>
            Turismo<Text style={styles.pieDorado}>Sincelejo</Text> · Capital de la Sabana
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },

  /* ---------- HERO ---------- */
  hero: {
    height: 340,
    backgroundColor: colores.tinta,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: "hidden",
  },
  heroImagen: {
    width: "100%",
    height: "100%",
  },
  heroSinImagen: {
    backgroundColor: colores.primarioSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSinImagenTexto: {
    fontSize: 56,
  },
  heroGradiente: {
    ...StyleSheet.absoluteFillObject,
  },
  btnVolver: {
    position: "absolute",
    top: 44,
    left: 16,
    backgroundColor: colores.blanco,
    borderRadius: radio.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
    ...sombras.elevada,
  },
  btnVolverTexto: {
    color: colores.tinta,
    fontSize: 15,
    fontFamily: fuentes.semibold,
  },
  badgeCategoria: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: colores.acento,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radio.pill,
    ...sombras.reposo,
  },
  badgeTexto: {
    color: colores.blanco,
    fontSize: 12,
    fontFamily: fuentes.semibold,
  },

  /* ---------- CONTENIDO ---------- */
  contenido: {
    backgroundColor: colores.superficie,
    margin: 16,
    borderRadius: radio.normal,
    padding: 20,
    ...sombras.reposo,
  },
  nombre: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fuentes.extrabold,
    color: colores.tinta,
    marginBottom: 14,
  },
  meta: {
    backgroundColor: colores.fondo,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  metaTexto: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: fuentes.medio,
    color: colores.tintaMedia,
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 23,
    fontFamily: fuentes.regular,
    color: colores.tintaMedia,
    marginBottom: 20,
  },
  botonMapa: {
    backgroundColor: colores.primario,
    borderRadius: radio.pill,
    paddingVertical: 14,
    alignItems: "center",
    ...sombras.reposo,
  },
  botonMapaTexto: {
    color: colores.blanco,
    fontSize: 15,
    fontFamily: fuentes.semibold,
  },
  filaAdmin: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  botonEditar: {
    flex: 1,
    backgroundColor: colores.acento,
    borderRadius: radio.pill,
    paddingVertical: 13,
    alignItems: "center",
  },
  botonEditarTexto: {
    color: colores.blanco,
    fontSize: 14,
    fontFamily: fuentes.semibold,
  },
  botonEliminar: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderWidth: 1.5,
    borderColor: colores.peligro,
    borderRadius: radio.pill,
    paddingVertical: 13,
    alignItems: "center",
  },
  botonEliminarTexto: {
    color: colores.peligro,
    fontSize: 14,
    fontFamily: fuentes.semibold,
  },
  pie: {
    textAlign: "center",
    marginTop: 22,
    marginBottom: 8,
    color: colores.tintaSuave,
    fontSize: 12,
    fontFamily: fuentes.medio,
  },
  pieDorado: {
    color: colores.acento,
  },
});
