/**
 * Enlace "Cómo llegar" de Google Maps compartido por toda la app.
 *
 * Estrategia (corregida respecto a la web original):
 * - Se envía la DIRECCIÓN como destino, no "nombre + dirección" como texto
 *   de búsqueda. Google Maps ubica direcciones exactas con mucha más
 *   precisión que mezclar varios datos en un solo query.
 * - Si la dirección escrita no menciona Sincelejo, se agrega la ciudad y el
 *   país para que el geocodificador no la ubique en otro lugar del mundo.
 * - Se usa /maps/dir/?api=1 con destino: Google abre directamente elmodo
 *   indicaciones desde la ubicación actual del usuario hasta el sitio.
 */

const CIUDAD_BASE = "Sincelejo, Colombia";

export function construirUrlComoLlegar(direccion) {
  const dir = (direccion ?? "").trim();
  if (!dir) return null;
  // Si ya escribieron "Sincelejo" en la dirección no se duplica
  const destino = /sincelejo/i.test(dir) ? dir : `${dir}, ${CIUDAD_BASE}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}
