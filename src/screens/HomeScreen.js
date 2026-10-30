import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LugarCard from "../components/LugarCard";
import { obtenerLugares, obtenerCategorias, obtenerUrlImagen, SITE_URL } from "../api";
import { obtenerFavoritos, alternarFavorito } from "../favoritos";
import { colores, radio, sombras, fuentes } from "../theme";

// Fotos del hero: las mismas del crossfade del sitio web (Frontend/app.js)
const FOTOS_HERO = [
  `${SITE_URL}/img/majagual.jpg`,
  `${SITE_URL}/img/catedral.jpg`,
  `${SITE_URL}/img/santander.jpg`,
  `${SITE_URL}/img/pozo.jpg`,
  `${SITE_URL}/img/museo.jpg`,
  `${SITE_URL}/img/guacari.jpg`,
];

export default function HomeScreen({ onVerDetalle, onAbrirLogin, esAdmin, onNuevoLugar, onCerrarSesion }) {
  const refLista = useRef(null);
  const [lugares, setLugares] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [idCategoria, setIdCategoria] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [imagenHeroIndex, setImagenHeroIndex] = useState(0);
  const [favoritos, setFavoritos] = useState(new Set());
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  // Capas de opacidad del hero: una por foto, como las dos capas del crossfade web
  const [opacidadesHero] = useState(() => FOTOS_HERO.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)));

  // ---------- Carga de datos ----------
  const cargarLugares = useCallback(async (paginaDestino = 1, filtros) => {
    try {
      if (paginaDestino === 1) {
        setCargando(true);
      } else {
        setCargandoMas(true);
      }
      setError(null);
      const data = await obtenerLugares({ ...filtros, pagina: paginaDestino });
      const nuevos = data.lugares || [];
      const pag = data.paginacion || {};
      setTotalPaginas(pag.totalPaginas || 1);

      if (paginaDestino === 1) {
        setLugares(nuevos);
      } else {
        setLugares((prev) => [...prev, ...nuevos]);
      }
    } catch (err) {
      setError(err.message || "No se pudieron cargar los lugares");
    } finally {
      setCargando(false);
      setCargandoMas(false);
    }
  }, []);

  const cargarCategorias = useCallback(async () => {
    try {
      const data = await obtenerCategorias();
      setCategorias(Array.isArray(data) ? data : data.categorias || []);
    } catch {
      // Las categorías son complementarias: si fallan, la app sigue funcionando
    }
  }, []);

  // Carga los favoritos guardados en el teléfono (equivalente a localStorage de la web)
  const cargarFavoritos = useCallback(async () => {
    setFavoritos(await obtenerFavoritos());
  }, []);

  // Igual que alternarFavorito() de la web: invierte y guarda
  const alTocarFavorito = useCallback(async (idLugar) => {
    const nuevos = await alternarFavorito(idLugar);
    setFavoritos(nuevos);
  }, []);

  // Primera carga
  useEffect(() => {
    cargarLugares(1, {});
    cargarCategorias();
    cargarFavoritos();
    // Precarga las 6 fotos del hero al abrir: sin ellas, el fundido
    // muestra el fondo negro mientras descarga cada imagen por el túnel
    Promise.all(FOTOS_HERO.map((url) => Image.prefetch(url))).catch(() => {});
  }, []);

  // Búsqueda en vivo (con pequeño retardo, como en la web)
  useEffect(() => {
    const t = setTimeout(() => {
      if (pagina === 1) {
        cargarLugares(1, { buscar, idCategoria });
      } else {
        setPagina(1); // al cambiar filtros, volvemos a la página 1
      }
    }, 400);
    return () => clearTimeout(t);
  }, [buscar, idCategoria]);

  // ---------- Crossfade del hero (fundido suave, como el sitio web) ----------
  // Mismo ritmo que la web: 6 segundos por foto, y el cambio se hace con un
  // fundido animado de 1.2 s: la saliente baja su opacidad mientras entra la nueva.
  useEffect(() => {
    if (FOTOS_HERO.length < 2) return;
    const t = setInterval(() => {
      setImagenHeroIndex((i) => (i + 1) % FOTOS_HERO.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    opacidadesHero.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === imagenHeroIndex ? 1 : 0,
        duration: 1200,
        useNativeDriver: true,
      }).start();
    });
  }, [imagenHeroIndex]);

  const hayFiltros = buscar.trim().length > 0 || idCategoria > 0;

  // Vista de favoritos: filtro local sobre lo cargado, como aplicarVistaFavoritos() en la web
  const lugaresVisibles = soloFavoritos
    ? lugares.filter((l) => favoritos.has(l.idLugar))
    : lugares;

  if (cargando && lugares.length === 0) {
    return (
      <View style={[styles.contenedor, styles.centro]}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.textoCargando}>Cargando la Sabana…</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor={colores.primarioOscuro} />

      <FlatList
        ref={refLista}
        ListHeaderComponent={
          <View>
            {/* ============ HERO (como la web: foto + gradiente + buscador) ============ */}
            <View style={styles.hero}>
              {/* Capa base permanente: garantiza que NUNCA se asome el fondo negro */}
              <View style={styles.capaHero}>
                <Image
                  source={{ uri: FOTOS_HERO[0] }}
                  style={styles.capaHeroImagen}
                  resizeMode="cover"
                />
              </View>
              {FOTOS_HERO.map((url, i) => (
                <Animated.View
                  key={url}
                  style={[styles.capaHero, { opacity: opacidadesHero[i] }]}
                >
                  <Image
                    source={{ uri: url }}
                    style={styles.capaHeroImagen}
                    resizeMode="cover"
                  />
                </Animated.View>
              ))}
              <LinearGradient
                colors={[
                  "rgba(15, 23, 42, 0.42)",
                  "rgba(15, 23, 42, 0.58)",
                  "rgba(15, 23, 42, 0.90)",
                ]}
                locations={[0, 0.45, 1]}
                style={styles.heroGradiente}
              />

              {/* Marca arriba (equivalente al navbar glass de la web) */}
              <View style={styles.barraMarca}>
                <Text style={styles.marcaTexto}>
                  Turismo<Text style={styles.marcaFuerte}>Sincelejo</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.botonLogin, esAdmin && styles.botonLoginAdmin]}
                  onPress={esAdmin ? onCerrarSesion : onAbrirLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.botonLoginTexto}>
                    {esAdmin ? "🚪 Salir" : "⚙ Acceso"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.heroContenido}>
                <Text style={styles.heroUbicacion}>
                  📍 Sincelejo · Sucre · Colombia
                </Text>
                <Text style={styles.heroTitulo}>
                  Descubre la{"\n"}
                  <Text style={styles.heroDestacado}>Sabana</Text> y su gente
                </Text>
                <Text style={styles.heroParrafo}>
                  Plazas históricas, cultura sabanera, gastronomía y los rincones
                  que hacen única a la capital de Sucre.
                </Text>

                {/* Buscador integrado en el hero, como en la web */}
                <View style={styles.heroBuscador}>
                  <Text style={styles.heroLupa}>🔍</Text>
                  <TextInput
                    style={styles.heroInput}
                    placeholder="Busca mientras escribes: majagual, catedral, pozo..."
                    placeholderTextColor={colores.tintaSuave}
                    value={buscar}
                    onChangeText={setBuscar}
                    onFocus={() => refLista.current?.scrollToOffset({ animated: true, offset: 140 })}
                  />
                </View>
              </View>
            </View>

            {/* ============ CHIPS DE CATEGORÍAS ============ */}
            <View style={styles.chipsSeccion}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                <Chip
                  etiqueta="Todos"
                  activo={!idCategoria}
                  onPress={() => setIdCategoria(0)}
                />
                {categorias.map((cat) => (
                  <Chip
                    key={cat.idCategoria}
                    etiqueta={`${cat.nombre}`}
                    activo={idCategoria === cat.idCategoria}
                    onPress={() => setIdCategoria(cat.idCategoria)}
                  />
                ))}
                <Chip
                  etiqueta="❤️ Mis favoritos"
                  activo={soloFavoritos}
                  onPress={() => setSoloFavoritos(!soloFavoritos)}
                />
              </ScrollView>
            </View>
          </View>
        }
        data={lugaresVisibles}
        keyExtractor={(item) => item.idLugar.toString()}
        renderItem={({ item }) => (
          <LugarCard
            lugar={item}
            favorito={favoritos.has(item.idLugar)}
            onAlternarFavorito={() => alTocarFavorito(item.idLugar)}
            onPress={() => onVerDetalle(item)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.filaTarjetas}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <Text style={styles.sinResultados}>
            {soloFavoritos
              ? "Aún no guardas favoritos. Toca el 🤍 en cualquier lugar. ❤️"
              : "No encontramos lugares con esos filtros 🧭"}
          </Text>
        }
        ListFooterComponent={
          <View>
            {/* ============ PAGINACIÓN (fuera de la vista de favoritos) ============ */}
            {!soloFavoritos && pagina < totalPaginas && (
              <TouchableOpacity
                style={styles.botonVerMas}
                disabled={cargandoMas}
                onPress={() => {
                  const sig = pagina + 1;
                  setPagina(sig);
                  cargarLugares(sig, { buscar, idCategoria });
                }}
                activeOpacity={0.8}
              >
                {cargandoMas ? (
                  <ActivityIndicator color={colores.blanco} />
                ) : (
                  <Text style={styles.botonVerMasTexto}>Ver más lugares ↓</Text>
                )}
              </TouchableOpacity>
            )}

            {/* ============ FOOTER (versión móvil del footer web) ============ */}
            <View style={styles.footer}>
              <LinearGradient
                colors={[colores.tinta, "#1E293B"]}
                style={styles.footerGradiente}
              />
              <Text style={styles.footerMarca}>
                Turismo<Text style={styles.footerDorado}>Sincelejo</Text>
              </Text>
              <Text style={styles.footerTexto}>
                Portal turístico de la capital de la Sabana. Fiestas del 20 de
                Enero, cultura de bandas, sombrero vueltiao y corralejas: aquí
                nace el folclor sabanero.
              </Text>
              <Text style={styles.footerCredito}>Proyecto académico</Text>
              <Text style={styles.footerCredito}>
                Made with 💛 por juanavilez02
              </Text>
            </View>
          </View>
        }
      />

      {error && lugares.length > 0 && (
        <Text style={styles.errorFlotante}>{error}</Text>
      )}

      {/* ============ FAB "Nuevo lugar" (solo modo admin, como el panel web) ============ */}
      {esAdmin && !soloFavoritos && (
        <TouchableOpacity
          style={[styles.fab, sombras.elevada]}
          onPress={onNuevoLugar}
          activeOpacity={0.8}
        >
          <Text style={styles.fabTexto}>➕ Nuevo lugar</Text>
        </TouchableOpacity>
      )}

      {/* Error completo (sin datos) */}
      {error && lugares.length === 0 && !cargando && (
        <View style={[styles.centroAbsoluto]}>
          <Text style={styles.errorTitulo}>Algo falló 😕</Text>
          <Text style={styles.errorMensaje}>{error}</Text>
          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={() => cargarLugares(1, { buscar, idCategoria })}
            activeOpacity={0.8}
          >
            <Text style={styles.botonReintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Chip({ etiqueta, activo, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, activo && styles.chipActivo]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
        {etiqueta}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  centro: {
    alignItems: "center",
    justifyContent: "center",
  },
  textoCargando: {
    marginTop: 12,
    color: colores.tintaSuave,
    fontFamily: fuentes.medio,
  },
  centroAbsoluto: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colores.fondo,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  /* ---------- HERO ---------- */
  hero: {
    height: 330,
    backgroundColor: colores.tinta,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroFondo: {
    ...StyleSheet.absoluteFillObject,
  },
  capaHero: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  capaHeroImagen: {
    width: "100%",
    height: "100%",
    marginTop: 0,
  },
  heroGradiente: {
    ...StyleSheet.absoluteFillObject,
  },
  barraMarca: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  marcaTexto: {
    color: colores.blanco,
    fontSize: 18,
    fontFamily: fuentes.bold,
  },
  marcaFuerte: {
    color: colores.acento,
  },
  botonLogin: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radio.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  botonLoginTexto: {
    color: colores.blanco,
    fontSize: 13,
    fontFamily: fuentes.semibold,
  },
  botonLoginAdmin: {
    backgroundColor: colores.acento,
    borderColor: "rgba(255,255,255,0.7)",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 46,
    backgroundColor: colores.acento,
    borderRadius: radio.pill,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  fabTexto: {
    color: colores.blanco,
    fontSize: 14,
    fontFamily: fuentes.semibold,
  },
  heroContenido: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  heroUbicacion: {
    color: colores.acento,
    fontSize: 12,
    fontFamily: fuentes.semibold,
    letterSpacing: 0.5,
    marginBottom: 8,
    textShadowColor: "rgba(15,23,42,0.95)",
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 1 },
  },
  heroTitulo: {
    color: colores.blanco,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: fuentes.extrabold,
    marginBottom: 8,
    textShadowColor: "rgba(15,23,42,0.95)",
    textShadowRadius: 7,
    textShadowOffset: { width: 0, height: 2 },
  },
  heroDestacado: {
    color: colores.acento,
  },
  heroParrafo: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fuentes.regular,
    marginBottom: 16,
    textShadowColor: "rgba(15,23,42,0.95)",
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 1 },
  },
  heroBuscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: radio.pill,
    paddingHorizontal: 16,
    height: 50,
    ...sombras.reposo,
  },
  heroLupa: {
    fontSize: 16,
    marginRight: 10,
  },
  heroInput: {
    flex: 1,
    color: colores.tinta,
    fontSize: 14,
    fontFamily: fuentes.regular,
  },

  /* ---------- CHIPS ---------- */
  chipsSeccion: {
    paddingTop: 18,
    paddingBottom: 4,
  },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radio.pill,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    marginRight: 8,
    ...sombras.reposo,
  },
  chipActivo: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  chipTexto: {
    color: colores.tintaMedia,
    fontSize: 13,
    fontFamily: fuentes.semibold,
  },
  chipTextoActivo: {
    color: colores.blanco,
  },

  /* ---------- TARJETAS ---------- */
  lista: {
    paddingHorizontal: 8,
    paddingBottom: 0,
  },
  filaTarjetas: {
    justifyContent: "space-between",
  },
  sinResultados: {
    textAlign: "center",
    color: colores.tintaSuave,
    fontFamily: fuentes.medio,
    marginTop: 30,
    marginBottom: 20,
  },

  /* ---------- PAGINACIÓN ---------- */
  botonVerMas: {
    backgroundColor: colores.primario,
    borderRadius: radio.pill,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...sombras.reposo,
  },
  botonVerMasTexto: {
    color: colores.blanco,
    fontSize: 15,
    fontFamily: fuentes.semibold,
  },

  /* ---------- FOOTER ---------- */
  footer: {
    marginTop: 10,
    backgroundColor: colores.tinta,
    paddingVertical: 26,
    paddingHorizontal: 22,
  },
  footerGradiente: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  footerMarca: {
    color: colores.blanco,
    fontSize: 20,
    fontFamily: fuentes.bold,
    marginBottom: 10,
  },
  footerDorado: {
    color: colores.acento,
  },
  footerTexto: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fuentes.regular,
    marginBottom: 16,
  },
  footerCredito: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: fuentes.medio,
    marginBottom: 4,
  },

  /* ---------- ESTADOS ---------- */
  errorFlotante: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FEF2F2",
    color: colores.peligro,
    textAlign: "center",
    padding: 10,
    fontSize: 12,
  },
  errorTitulo: {
    fontSize: 20,
    fontFamily: fuentes.bold,
    color: colores.tinta,
    marginBottom: 8,
  },
  errorMensaje: {
    color: colores.tintaMedia,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: fuentes.regular,
  },
  botonReintentar: {
    backgroundColor: colores.primario,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radio.pill,
  },
  botonReintentarTexto: {
    color: colores.blanco,
    fontFamily: fuentes.semibold,
  },
});
