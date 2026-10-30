import React, { useState } from "react";
import { SafeAreaView, StyleSheet, StatusBar, ActivityIndicator, View, Text } from "react-native";
import { useFonts } from "@expo-google-fonts/poppins";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import HomeScreen from "./src/screens/HomeScreen";
import DetalleScreen from "./src/screens/DetalleScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { colores, fuentes } from "./src/theme";

export default function App() {
  const [token, setToken] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null);

  // Carga de Poppins (las mismas variantes que usa la web: 400/500/600/700/800)
  const [fuentesCargadas] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const abrirDetalle = (lugar) => {
    setLugarSeleccionado(lugar);
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
      ) : lugarSeleccionado ? (
        <DetalleScreen
          lugar={lugarSeleccionado}
          onVolver={() => setLugarSeleccionado(null)}
        />
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
