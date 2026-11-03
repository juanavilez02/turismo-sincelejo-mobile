/**
 * Caché en memoria de los resultados de /lugares.
 *
 * Vive a nivel de módulo (no dentro de HomeScreen), por lo que sobrevive a que
 * la pantalla se desmonte al abrir el detalle o el formulario. Así, al volver
 * a la lista, los datos aparecen al instante.
 *
 * Debe invalidarse cuando los datos cambien (crear, editar o eliminar un
 * lugar) para no mostrar información vieja.
 */
const cache = new Map();

export function obtenerDeCache(clave) {
  return cache.get(clave);
}

export function tieneEnCache(clave) {
  return cache.has(clave);
}

export function guardarEnCache(clave, data) {
  cache.set(clave, data);
}

export function limpiarCacheLugares() {
  cache.clear();
}
