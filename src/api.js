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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
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
 * NO se manda Content-Type a mano — el uploader agrega el boundary necesario.
 */
export async function subirArchivo(uri, token) {
  const { uploadAsync, FileSystemUploadTypes } = await import("expo-file-system");
  const respuesta = await uploadAsync(`${API_URL}/archivos`, uri, {
    httpMethod: "POST",
    uploadType: FileSystemUploadTypes.MULTIPART,
    fieldName: "archivo",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (respuesta.status < 200 || respuesta.status >= 300) {
    throw new Error(`Error subiendo la imagen (${respuesta.status})`);
  }
  const resultado = JSON.parse(respuesta.body);
  return resultado.url;
}
