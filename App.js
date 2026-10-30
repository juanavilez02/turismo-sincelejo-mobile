import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, StatusBar, ActivityIndicator, View, Text, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "@expo-google-fonts/poppins";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import FormularioLugarScreen from "./src/screens/FormularioLugarScreen";
import { eliminarLugar } from "./src/api";
import { colores, fuentes } from "./src/theme";

const LLAVE_TOKEN = "token";

export default function App() {
  const [token, setToken] = useState(null);
  const [sesionCargada, setSesionCargada] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
  const [modoFormulario, setModoFormulario] = useState(null); // null | {} | {lugar}

  // Al arrancar: recuperar la sesión guardada en el teléfono (si ya entró antes)
  useEffect(() => {
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(LLAVE_TOKEN);
        if (guardado) setToken(guardado);
      } catch {
        // sin token guardado: arranca como visitante
      } finally {
        setSesionCargada(true);
      }
    })();
  }, []);

  // Carga de Poppins (las mismas variantes que usa la web: 400/500/600/700/800)
  const [fuentesCargadas] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const iniciarSesion = async (t) => {
    setToken(t);
    setMostrarLogin(false);
    try {
      await AsyncStorage.setItem(LLAVE_TOKEN, t);
    } catch {
      // si no se puede guardar, la sesión vive igual mientras la app está abierta
    }
  };

  const cerrarSesion = async () => {
    setToken(null);
    setModoFormulario(null);
    setLugarSeleccionado(null);
    try {
      await AsyncStorage.removeItem(LLAVE_TOKEN);
    } catch {
      // nada grave si falla el borrado local
    }
  };

  const confirmarEliminar = (lugar) => {
    Alert.alert(
      "Eliminar lugar",
      `¿Seguro que quieres eliminar "${lugar.nombre}"? Esta acción no tiene vuelta atrás.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarLugar(lugar.idLugar, token);
              setLugarSeleccionado(null);
              Alert.alert("Listo", "Lugar eliminado exitosamente.");
            } catch (err) {
              Alert.alert("Error", err.message || "No se pudo eliminar el lugar.");
            }
          },
        },
      ]
    );
  };

  if (!fuentesCargadas || !sesionCargada) {
    return (
      <SafeAreaView style={[styles.contenedor, styles.centro]}>
        <StatusBar barStyle="light-content" backgroundColor={colores.primarioOscuro} />
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.cargandoTexto}>Preparando la Sabana…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.contenedor}>
        <StatusBar barStyle="light-content" backgroundColor={colores.primarioOscuro} />

        {modoFormulario ? (
        <FormularioLugarScreen
          lugar={modoFormulario?.lugar}
          token={token}
          onGuardar={() => setModoFormulario(null)}
          onCancelar={() => setModoFormulario(null)}
        />
      ) : mostrarLogin ? (
        <LoginScreen onLogin={iniciarSesion} onVolver={() => setMostrarLogin(false)} />
      ) : lugarSeleccionado ? (
        <DetalleScreen
          lugar={lugarSeleccionado}
          esAdmin={Boolean(token)}
          onVolver={() => setLugarSeleccionado(null)}
          onEditar={() => setModoFormulario({ lugar: lugarSeleccionado })}
          onEliminar={() => confirmarEliminar(lugarSeleccionado)}
        />
      ) : (
        <HomeScreen
          esAdmin={Boolean(token)}
          onVerDetalle={setLugarSeleccionado}
          onAbrirLogin={() => setMostrarLogin(true)}
          onNuevoLugar={() => setModoFormulario({})}
          onCerrarSesion={cerrarSesion}
        />
      )}
      </SafeAreaView>
    </SafeAreaProvider>
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
