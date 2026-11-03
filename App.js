import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  View,
  Text,
  Alert,
  BackHandler,
} from "react-native";
import { useFonts } from "@expo-google-fonts/poppins";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
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
import { eliminarLugar, configurarManejadorNoAutorizado } from "./src/api";
import { obtenerToken, guardarToken, borrarToken } from "./src/almacenamiento";
import { colores, fuentes } from "./src/theme";

export default function App() {
  const [token, setToken] = useState(null);
  const [sesionCargada, setSesionCargada] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null);
  const [modoFormulario, setModoFormulario] = useState(null); // null | {} | {lugar}
  // Evita mostrar varias veces el aviso si llegan varios 401 en paralelo.
  const avisoExpiradoRef = useRef(false);

  // Al arrancar: recuperar la sesión guardada en el teléfono (si ya entró antes)
  useEffect(() => {
    (async () => {
      try {
        const guardado = await obtenerToken();
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
    avisoExpiradoRef.current = false;
    setToken(t);
    setMostrarLogin(false);
    await guardarToken(t);
  };

  const cerrarSesion = async () => {
    setToken(null);
    setModoFormulario(null);
    setLugarSeleccionado(null);
    await borrarToken();
  };

  // Si cualquier petición admin responde 401 (token vencido), cerramos la
  // sesión y avisamos una sola vez. Se registra una vez al montar.
  useEffect(() => {
    configurarManejadorNoAutorizado(() => {
      setToken(null);
      setModoFormulario(null);
      setLugarSeleccionado(null);
      setMostrarLogin(true);
      borrarToken();
      if (!avisoExpiradoRef.current) {
        avisoExpiradoRef.current = true;
        Alert.alert(
          "Sesión expirada",
          "Tu sesión caducó por seguridad. Vuelve a entrar."
        );
      }
    });
  }, []);

  // Botón físico "atrás" de Android: retrocede dentro de la app en vez de
  // cerrarla de golpe cuando estás en detalle, formulario o login.
  useEffect(() => {
    const suscripcion = BackHandler.addEventListener("hardwareBackPress", () => {
      if (modoFormulario) {
        setModoFormulario(null);
        return true;
      }
      if (mostrarLogin) {
        setMostrarLogin(false);
        return true;
      }
      if (lugarSeleccionado) {
        setLugarSeleccionado(null);
        return true;
      }
      return false; // en Home, permitimos que Android cierre la app
    });
    return () => suscripcion.remove();
  }, [modoFormulario, mostrarLogin, lugarSeleccionado]);

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
      <SafeAreaProvider>
        <SafeAreaView style={[styles.contenedor, styles.centro]}>
          <StatusBar barStyle="light-content" backgroundColor={colores.primarioOscuro} />
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={styles.cargandoTexto}>Preparando la Sabana…</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/* edges sin "top": el héroe se dibuja a sangre por debajo de la barra
          de estado y cada pantalla usa los insets para colocar su contenido. */}
      <SafeAreaView style={styles.contenedor} edges={["left", "right", "bottom"]}>
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
