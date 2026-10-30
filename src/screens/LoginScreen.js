import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { login } from "../api";

export default function LoginScreen({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarLogin = async () => {
    if (!usuario || !password) {
      Alert.alert("Campos requeridos", "Ingresa usuario y contraseña");
      return;
    }

    setCargando(true);
    try {
      const token = await login(usuario, password);
      // Aquí normalmente guardarías el token en SecureStore
      onLogin(token);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Acceso Administrativo</Text>
        <Text style={styles.subtitulo}>Ingresa tus credenciales</Text>

        <TextInput
          style={styles.input}
          placeholder="Usuario"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.boton}
          onPress={manejarLogin}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.botonTexto}>Ingresar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignSelf: "center",
    width: "90%",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    height: 50,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#1e293b",
    marginBottom: 16,
    fontSize: 16,
  },
  boton: {
    backgroundColor: "#0D9488",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  botonTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
