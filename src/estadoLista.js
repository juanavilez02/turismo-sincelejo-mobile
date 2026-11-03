/**
 * Estado de los filtros de la lista de lugares.
 *
 * Vive a nivel de módulo para sobrevivir a que HomeScreen se desmonte al abrir
 * el detalle o el formulario. Al volver a la lista, el usuario recupera la
 * misma categoría, búsqueda y vista de favoritos en la que estaba.
 */
let filtros = {
  buscar: "",
  idCategoria: 0,
  soloFavoritos: false,
};

export function obtenerFiltrosLista() {
  return filtros;
}

export function guardarFiltrosLista(nuevos) {
  filtros = { ...filtros, ...nuevos };
}
