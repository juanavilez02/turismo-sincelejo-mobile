import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { login } from "../api";
import { colores, radio, sombras, fuentes } from "../theme";

export default function LoginScreen({ onLogin, onVolver }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const entrar = async () => {
    if (!usuario.trim() || !password) {
      setError("Escribe tu usuario y contraseña.");
      return;
    }
    try {
      setCargando(true);
      setError(null);
      const token = await login(usuario.trim(), password);
      onLogin(token);
    } catch (err) {
      setError(err.message === "Error 401"
        ? "Usuario o contraseña incorrectos."
        : err.message || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <LinearGradient
      colors={[colores.primarioOscuro, colores.primario, "#14B8A6"]}
      style={styles.contenedor}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Marca, como el navbar de la web */}
          <Text style={styles.marca}>
            Turismo<Text style={styles.marcaFuerte}>Sincelejo</Text>
          </Text>
          <Text style={styles.subtitulo}>Acceso administrativo</Text>

          {/* Tarjeta del formulario, como las superficies de la web */}
          <View style={[styles.tarjeta, sombras.elevada]}>
            <Text style={styles.emoji}>🔐</Text>
            <Text style={styles.titulo}>Panel de Administración</Text>
            <Text style={styles.parrafo}>
              Ingresa con tu cuenta para gestionar los lugares de la Sabana.
            </Text>

            <Text style={styles.etiqueta}>Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: admin"
              placeholderTextColor={colores.tintaSuave}
              autoCapitalize="none"
              value={usuario}
              onChangeText={setUsuario}
            />

            <Text style={styles.etiqueta}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colores.tintaSuave}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error && <Text style={styles.error}>⚠️ {error}</Text>}

            <TouchableOpacity
              style={[styles.botonEntrar, cargando && { opacity: 0.7 }]}
              onPress={entrar}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color={colores.blanco} />
              ) : (
                <Text style={styles.botonEntrarTexto}>Entrar</Text>
              )}
            </TouchableOpacity>

            {onVolver && (
              <TouchableOpacity onPress={onVolver} activeOpacity={0.7}>
                <Text style={styles.volver}>‹ Volver al inicio</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.pie}>
            Proyecto académico · Made with 💛 por juanavilez02
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  marca: {
    textAlign: "center",
    color: colores.blanco,
    fontSize: 26,
    fontFamily: fuentes.bold,
    marginBottom: 6,
  },
  marcaFuerte: {
    color: colores.acento,
  },
  subtitulo: {
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: fuentes.medio,
    marginBottom: 26,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radio.normal + 6,
    padding: 24,
  },
  emoji: {
    textAlign: "center",
    fontSize: 40,
    marginBottom: 8,
  },
  titulo: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: fuentes.semibold,
    color: colores.tinta,
  },
  parrafo: {
    textAlign: "center",
    color: colores.tintaSuave,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fuentes.regular,
    marginTop: 6,
    marginBottom: 22,
  },
  etiqueta: {
    fontSize: 12,
    fontFamily: fuentes.semibold,
    color: colores.tintaMedia,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colores.fondo,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colores.tinta,
    fontFamily: fuentes.regular,
    fontSize: 14,
    marginBottom: 14,
  },
  error: {
    color: colores.peligro,
    fontSize: 13,
    fontFamily: fuentes.medio,
    marginBottom: 12,
  },
  botonEntrar: {
    backgroundColor: colores.primario,
    borderRadius: radio.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    ...sombras.reposo,
  },
  botonEntrarTexto: {
    color: colores.blanco,
    fontSize: 15,
    fontFamily: fuentes.semibold,
  },
  volver: {
    textAlign: "center",
    color: colores.primario,
    fontFamily: fuentes.semibold,
    fontSize: 13,
    marginTop: 18,
  },
  pie: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: fuentes.regular,
    marginTop: 22,
  },
});
