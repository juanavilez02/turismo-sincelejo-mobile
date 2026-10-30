/**
 * Favoritos: misma lógica del sitio web (localStorage), aqui con AsyncStorage
 * que persiste en el teléfono de forma local — no depende del servidor.
 * La clave se llama igual: "favoritos".
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const LLAVE_FAVORITOS = "favoritos";

/** Devuelve un Set con los idLugar favoritos guardados en el teléfono */
export async function obtenerFavoritos() {
  try {
    const json = await AsyncStorage.getItem(LLAVE_FAVORITOS);
    return new Set(json ? JSON.parse(json) : []);
  } catch {
    return new Set();
  }
}

/** Guarda el Set completo de favoritos */
export async function guardarFavoritos(favoritos) {
  try {
    await AsyncStorage.setItem(LLAVE_FAVORITOS, JSON.stringify([...favoritos]));
  } catch {
    // Si falla el guardado local, la app sigue funcionando sin favoritos
  }
}

/** Igual que alternarFavorito() de la web: si estaba, lo quita; si no, lo agrega */
export async function alternarFavorito(id) {
  const favoritos = await obtenerFavoritos();
  if (!favoritos.delete(id)) { // delete devuelve false si no estaba → lo agregamos
    favoritos.add(id);
  }
  await guardarFavoritos(favoritos);
  return favoritos;
}
