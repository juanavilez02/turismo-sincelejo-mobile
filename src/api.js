/**
 * Configuración de la API de Turismo Sincelejo
 * 
 * IMPORTANTE: Usa la API desplegada en Render para que funcione
 * tanto en emulador como en dispositivo físico.
 */
export const API_URL = "https://turismo-sincelejo-api.onrender.com/api";

/**
 * URL base del sitio web (donde viven las imagenes estaticas /img/... /uploads/...)
 * La API devuelve rutas relativas (ej. "img/catedral.jpg"); aqui las completamos.
 */
export const SITE_URL = "https://turismo-sincelejo.onrender.com";

/**
 * Convierte el campo "imagen" que devuelve la API en una URL completa
 * que React Native pueda descargar.
 *  - "img/catedral.jpg"                 -> SITE_URL + "/img/catedral.jpg"
 *  - "/uploads/archivo.jpg" (subidas)   -> SITE_URL + "/uploads/archivo.jpg"
 *  - "https://..." (URL externa)        -> se usa tal cual
 *  - vacio                              -> null (la tarjeta mostrara su estado vacio)
 */
export function obtenerUrlImagen(ruta) {
  if (!ruta) return null;
  if (ruta.startsWith("http://") || ruta.startsWith("https://")) return ruta;
  if (ruta.startsWith("/")) return `${SITE_URL}${ruta}`;
  return `${SITE_URL}/${ruta}`;
}

/**
 * Realiza una petición a la API con manejo básico de errores
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Leemos siempre como texto: hay endpoints (p. ej. DELETE) que responden
    // 204 sin cuerpo. Hacer response.json() directo reventaba con
    // "Unexpected end of JSON input".
    const texto = await response.text();
    const data = texto ? parsearJsonSeguro(texto) : null;

    if (!response.ok) {
      throw new Error((data && data.mensaje) || `Error ${response.status}`);
    }

    return data;
  } catch (error) {
    if (__DEV__) {
      console.error(`[API Error] ${endpoint}:`, error.message);
    }
    throw error;
  }
}

/** Intenta parsear JSON; si el cuerpo no es JSON válido, devuelve null. */
function parsearJsonSeguro(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/**
 * Obtiene lugares con filtros opcionales
 */
export async function obtenerLugares({ buscar = "", idCategoria = 0, pagina = 1, porPagina = 6 } = {}) {
  const params = new URLSearchParams({
    pagina: pagina.toString(),
    porPagina: porPagina.toString(),
  });

  if (buscar) {
    params.append("buscar", buscar);
  }

  if (idCategoria && idCategoria > 0) {
    params.append("idCategoria", idCategoria.toString());
  }

  return apiRequest(`/lugares?${params.toString()}`);
}

/**
 * Obtiene todas las categorías
 */
export async function obtenerCategorias() {
  return apiRequest("/categorias");
}

/**
 * Inicia sesión y devuelve el token JWT
 */
export async function login(usuario, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
  return data.token;
}

/**
 * Crea un nuevo lugar (requiere autenticación)
 */
export async function crearLugar(lugarData, token) {
  return apiRequest("/lugares", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(lugarData),
  });
}

/**
 * Editar un lugar existente (PUT) — requiere autenticación
 */
export async function actualizarLugar(idLugar, lugarData, token) {
  return apiRequest(`/lugares/${idLugar}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(lugarData),
  });
}

/**
 * Eliminar un lugar (DELETE) — requiere autenticación
 */
export async function eliminarLugar(idLugar, token) {
  return apiRequest(`/lugares/${idLugar}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Sube una foto local del teléfono a la API (/api/archivos, multipart igual
 * que en el admin web) y devuelve la URL que la API asignó al archivo.
 *
 * Se usa fetch + FormData (API estándar de React Native) en lugar de
 * expo-file-system: en la versión 58 de expo-file-system, uploadAsync del
 * entry principal está deprecado y lanza error en runtime, por lo que la
 * subida fallaba siempre. Con FormData NO se manda Content-Type a mano —
 * fetch agrega el boundary del multipart automáticamente.
 */
export async function subirArchivo(uri, token) {
  const nombre = uri.split("/").pop() || `foto-${Date.now()}.jpg`;
  const extension = (nombre.split(".").pop() || "jpg").toLowerCase();
  const tipo =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : extension === "gif"
          ? "image/gif"
          : "image/jpeg";

  const formData = new FormData();
  formData.append("archivo", { uri, name: nombre, type: tipo });

  const respuesta = await fetch(`${API_URL}/archivos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const texto = await respuesta.text();
  const resultado = texto ? parsearJsonSeguro(texto) : null;

  if (!respuesta.ok) {
    throw new Error(
      (resultado && resultado.mensaje) || `Error subiendo la imagen (${respuesta.status})`
    );
  }
  if (!resultado || !resultado.url) {
    throw new Error("La API no devolvió la URL de la imagen subida.");
  }
  return resultado.url;
}
