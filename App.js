import React, { useState } from "react";
import { SafeAreaView, StyleSheet, StatusBar, ActivityIndicator, View, Text, Alert } from "react-native";
import { useFonts } from "@expo-google-fonts/poppins";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { colores, fuentes } from "./src/theme";

export default function App() {
  const [token, setToken] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  // Carga de Poppins (las mismas variantes que usa la web: 400/500/600/700/800)
  const [fuentesCargadas] = useFonts({
    Poppins_400Regular: require("@expo-google-fonts/poppins/Poppins_400Regular.js"),
    Poppins_500Medium: require("@expo-google-fonts/poppins/Poppins_500Medium.js"),
    Poppins_600SemiBold: require("@expo-google-fonts/poppins/Poppins_600SemiBold.js"),
    Poppins_700Bold: require("@expo-google-fonts/poppins/Poppins_700Bold.js"),
    Poppins_800ExtraBold: require("@expo-google-fonts/poppins/Poppins_800ExtraBold.js"),
  });

  const abrirDetalle = (lugar) => {
    // Pantalla de detalle: siguiente sesión del proyecto
    Alert.alert(
      lugar.nombre,
      lugar.descripcion,
      [{ text: "Cerrar" }],
      { cancelable: true }
    );
  };

  if (!fuentesCargadas) {
    return (
      <SafeAreaView style={[styles.contenedor, styles.centro]}>
        <StatusBar barStyle="light-content" backgroundColor={colores.primarioOscuro} />
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.cargandoTexto}>Preparando la Sabana…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor={colores.primarioOscuro} />
      {mostrarLogin ? (
        <LoginScreen onLogin={(t) => {
          setToken(t);
          setMostrarLogin(false);
        }} />
      ) : (
        <HomeScreen
          onVerDetalle={abrirDetalle}
          onAbrirLogin={() => setMostrarLogin(true)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  centro: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colores.fondo,
  },
  cargandoTexto: {
    marginTop: 12,
    color: colores.tintaSuave,
    fontFamily: fuentes.medio,
  },
});
