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
 * Tiempo máximo de espera por petición. Render (plan gratuito) puede tardar
 * casi un minuto en "despertar", así que damos margen pero evitamos que la
 * app se quede colgada para siempre si el servidor no responde.
 */
const TIEMPO_LIMITE_MS = 90000;

/**
 * Callback global que la app registra para reaccionar a una sesión expirada
 * (HTTP 401) en cualquier pantalla. Ver configurarManejadorNoAutorizado().
 */
let manejadorNoAutorizado = null;

export function configurarManejadorNoAutorizado(fn) {
  manejadorNoAutorizado = fn;
}

/**
 * Realiza una petición a la API con manejo básico de errores
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const { signal: signalExterno, timeout = TIEMPO_LIMITE_MS, headers: cabeceras, ...resto } = options;

  // Cancelamos la petición si supera el tiempo límite.
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeout);
  if (signalExterno) {
    if (signalExterno.aborted) controlador.abort();
    else signalExterno.addEventListener("abort", () => controlador.abort());
  }

  const defaultOptions = {
    ...resto,
    headers: {
      "Content-Type": "application/json",
      ...cabeceras,
    },
    signal: controlador.signal,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Leemos siempre como texto: hay endpoints (p. ej. DELETE) que responden
    // 204 sin cuerpo. Hacer response.json() directo reventaba con
    // "Unexpected end of JSON input".
    const texto = await response.text();
    const data = texto ? parsearJsonSeguro(texto) : null;

    // 401 fuera del login = el token caducó: avisamos a la app para que cierre
    // la sesión. En /auth/login un 401 solo significa credenciales erróneas.
    if (
      response.status === 401 &&
      manejadorNoAutorizado &&
      !endpoint.includes("/auth/login")
    ) {
      manejadorNoAutorizado();
    }

    if (!response.ok) {
      const error = new Error((data && data.mensaje) || `Error ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        "La petición tardó demasiado. Revisa tu conexión e inténtalo de nuevo."
      );
      timeoutError.esTimeout = true;
      throw timeoutError;
    }
    if (__DEV__) {
      console.error(`[API Error] ${endpoint}:`, error.message);
    }
    throw error;
  } finally {
    clearTimeout(temporizador);
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
 * La implementación nueva de FormData en React Native 0.88 (SDK 58) ya no
 * acepta el objeto { uri, name, type } y lanza "unsupported formdatapart
 * implementation". Por eso usamos el uploader multipart nativo que Expo
 * incluye en expo-file-system/legacy (el del entry principal está deprecado
 * y lanza error en runtime).
 */
export async function subirArchivo(uri, token) {
  const { uploadAsync, FileSystemUploadType } = await import("expo-file-system/legacy");

  const nombre = uri.split("/").pop() || `foto-${Date.now()}.jpg`;
  const extension = (nombre.split(".").pop() || "jpg").toLowerCase();
  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : extension === "gif"
          ? "image/gif"
          : "image/jpeg";

  const respuesta = await uploadAsync(`${API_URL}/archivos`, uri, {
    httpMethod: "POST",
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: "archivo",
    mimeType,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const resultado = respuesta.body ? parsearJsonSeguro(respuesta.body) : null;

  if (respuesta.status < 200 || respuesta.status >= 300) {
    throw new Error(
      (resultado && resultado.mensaje) || `Error subiendo la imagen (${respuesta.status})`
    );
  }
  if (!resultado || !resultado.url) {
    throw new Error("La API no devolvió la URL de la imagen subida.");
  }
  return resultado.url;
}
