/**
 * Generador del ícono de Turismo Sincelejo (sin dependencias externas).
 *
 * Diseño: degradado diagonal turquesa "Caribe" (tokens del theme), un pin de
 * mapa blanco con la punta redondeada y un sol dorado "sabanero" en el
 * centro del pin. Anti-aliasing por sobremuestreo (4x4 por pixel).
 *
 * Salidas (assets/):
 *   - icon.png            1024x1024  fondo degradado + pin (app clasica, iOS, splash base)
 *   - adaptive-icon.png   1024x1024  transparente + pin al 68% (Android 8+, zona segura)
 *   - splash-icon.png     1024x1024  transparente + pin grande (splash sobre color solido)
 *
 * Uso: node scripts/generar-icono.js
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const TAM = 1024;      // lado de las imagenes generadas
const SUB = 4;         // submuestras por eje (anti-aliasing)

const COLOR_A = [21, 178, 164];   // #15B2A4  turquesa claro (esquina sup-izq)
const COLOR_B = [8, 79, 73];      // #084F49  turquesa profundo (esquina inf-der)
const BLANCO = [255, 255, 255];
const DORADO = [245, 158, 11];    // #F59E0B  dorado sabanero (theme.acento)

/* ------------------------------------------------------------------ */
/* PNG encoding                                                        */
/* ------------------------------------------------------------------ */

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) c = TABLA_CRC[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function crearChunk(tipo, datos) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(datos.length, 0);
  const tipoB = Buffer.from(tipo, "ascii");
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32(Buffer.concat([tipoB, datos])), 0);
  return Buffer.concat([len, tipoB, datos, crcB]);
}

function pngEncode(w, h, rgba) {
  const crudo = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    crudo[y * (w * 4 + 1)] = 0; // filtro 0 (ninguno)
    rgba.copy(crudo, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8;  // profundidad
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    crearChunk("IHDR", ihdrData),
    crearChunk("IDAT", zlib.deflateSync(crudo, { level: 9 })),
    crearChunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Geometría del diseño (coordenadas normalizadas, +y hacia arriba)     */
/* ------------------------------------------------------------------ */

// Pin: cabeza circular + trapecio que baja a la punta (unión para cubrir la costura)
const CABEZA = { x: 0, y: 0.01, r: 0.47 };
const AGUJERO = { x: 0, y: 0.01, r: 0.235 };
const TRIANGULO = [
  { x: 0, y: -0.62 },      // punta
  { x: -0.43, y: 0.06 },
  { x: 0.43, y: 0.06 },
];

// Sol dentro del agujero: disco + 8 rayos (cápsulas finas para que lea como sol)
const SOL = { x: 0, y: 0.01, r: 0.115 };
const RAYOS = { largo: 0.205, grosor: 0.026 };

function adentroCirculo(px, py, c) {
  const dx = px - c.x, dy = py - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

function adentroTriangulo(px, py, v) {
  const [a, b, c] = v;
  const cruz = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = cruz(a, b, { x: px, y: py });
  const d2 = cruz(b, c, { x: px, y: py });
  const d3 = cruz(c, a, { x: px, y: py });
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function modular(a, b) {
  const r = (a % b + b) % b;
  return r > b / 2 ? r - b : r;
}

function distanciaSegmento(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)));
  const dx = apx - abx * t, dy = apy - aby * t;
  return Math.hypot(dx, dy);
}

function adentroPin(px, py) {
  const cuerpo = adentroCirculo(px, py, CABEZA) || adentroTriangulo(px, py, TRIANGULO);
  return cuerpo && !adentroCirculo(px, py, AGUJERO);
}

function adentroSol(px, py) {
  if (adentroCirculo(px, py, SOL)) return true;
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4 + Math.PI / 8; // rayos girados 22.5° para no quedar típicos
    const bx = SOL.x + Math.cos(ang) * RAYOS.largo;
    const by = SOL.y + Math.sin(ang) * RAYOS.largo;
    if (distanciaSegmento(px, py, SOL.x, SOL.y, bx, by) <= RAYOS.grosor) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

/**
 * escala: factor del pin; conFondo: null | { degradado } | { relleno: [r,g,b] } | "transparente"
 */
function render(escala, modoFondo) {
  const pixeles = Buffer.alloc(TAM * TAM * 4);
  const paso = 1 / TAM;
  const half = 1 / SUB;

  for (let y = 0; y < TAM; y++) {
    for (let x = 0; x < TAM; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let sy = 0; sy < SUB; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          // centro de la submuestra en coordenadas de canvas
          const cx = (x + (sx + 0.5) * half) * paso;
          const cy = (y + (sy + 0.5) * half) * paso;
          // a coordenadas normalizadas (+y arriba), luego al espacio del pin
          const ny = 1 - 2 * cy;
          const nx = 2 * cx - 1;
          const px = nx / escala;
          const py = ny / escala;

          let cr = 0, cg = 0, cb = 0, ca = 0;
          if (modoFondo === "degradado") {
            const t = Math.min(1, Math.max(0, ((1 + nx) + (1 - ny)) / 4));
            cr = COLOR_A[0] + (COLOR_B[0] - COLOR_A[0]) * t;
            cg = COLOR_A[1] + (COLOR_B[1] - COLOR_A[1]) * t;
            cb = COLOR_A[2] + (COLOR_B[2] - COLOR_A[2]) * t;
            ca = 255;
          }
          if (adentroPin(px, py)) { cr = BLANCO[0]; cg = BLANCO[1]; cb = BLANCO[2]; ca = 255; }
          if (adentroSol(px, py)) { cr = DORADO[0]; cg = DORADO[1]; cb = DORADO[2]; ca = 255; }

          r += cr; g += cg; b += cb; a += ca;
        }
      }

      const n = SUB * SUB;
      const i = (y * TAM + x) * 4;
      pixeles[i] = Math.round(r / n);
      pixeles[i + 1] = Math.round(g / n);
      pixeles[i + 2] = Math.round(b / n);
      pixeles[i + 3] = Math.round(a / n);
    }
  }
  return pngEncode(TAM, TAM, pixeles);
}

const dirSalida = path.join(__dirname, "..", "assets");
if (!fs.existsSync(dirSalida)) fs.mkdirSync(dirSalida, { recursive: true });

fs.writeFileSync(path.join(dirSalida, "icon.png"), render(1.12, "degradado"));
fs.writeFileSync(path.join(dirSalida, "adaptive-icon.png"), render(0.68, "transparente"));
fs.writeFileSync(path.join(dirSalida, "splash-icon.png"), render(1.05, "transparente"));

console.log("Iconos generados en assets/: icon.png, adaptive-icon.png, splash-icon.png");
