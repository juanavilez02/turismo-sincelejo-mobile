/**
 * Almacenamiento del token de sesión.
 *
 * En el teléfono usamos expo-secure-store (cifrado por el SO) en lugar de
 * AsyncStorage, que guarda texto plano. Mantenemos AsyncStorage solo como
 * respaldo (y en web, donde SecureStore no está disponible).
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const LLAVE_TOKEN = "token";

export async function guardarToken(token) {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(LLAVE_TOKEN, token);
      return;
    }
    await SecureStore.setItemAsync(LLAVE_TOKEN, token);
  } catch {
    // Si SecureStore falla, al menos no perdemos la sesión en esta ejecución.
    try {
      await AsyncStorage.setItem(LLAVE_TOKEN, token);
    } catch {
      // sin persistencia: la sesión vive mientras la app está abierta
    }
  }
}

export async function obtenerToken() {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(LLAVE_TOKEN);
    }
    const token = await SecureStore.getItemAsync(LLAVE_TOKEN);
    if (token) return token;

    // Migración: si venía guardado en AsyncStorage (version anterior), lo
    // movemos a SecureStore y limpiamos el rastro en texto plano.
    const anterior = await AsyncStorage.getItem(LLAVE_TOKEN);
    if (anterior) {
      await SecureStore.setItemAsync(LLAVE_TOKEN, anterior);
      await AsyncStorage.removeItem(LLAVE_TOKEN);
    }
    return anterior;
  } catch {
    return null;
  }
}

export async function borrarToken() {
  try {
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(LLAVE_TOKEN);
    }
  } catch {
    // seguimos abajo para limpiar también el respaldo
  }
  try {
    await AsyncStorage.removeItem(LLAVE_TOKEN);
  } catch {
    // nada grave si falla el borrado local
  }
}
