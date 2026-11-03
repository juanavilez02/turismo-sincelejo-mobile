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
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import LugarCard from "../components/LugarCard";
import { obtenerLugares, obtenerCategorias, obtenerUrlImagen, SITE_URL } from "../api";
import { obtenerFavoritos, alternarFavorito } from "../favoritos";
import { obtenerDeCache, tieneEnCache, guardarEnCache } from "../cacheLugares";
import { obtenerFiltrosLista, guardarFiltrosLista } from "../estadoLista";
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

/** Clave de caché para una combinación de filtros + página. */
function claveCache(buscar, idCategoria, pagina) {
  return `${(buscar || "").trim().toLowerCase()}|${idCategoria || 0}|${pagina}`;
}

export default function HomeScreen({ onVerDetalle, onAbrirLogin, esAdmin, onNuevoLugar, onCerrarSesion }) {
  const refLista = useRef(null);
  // Identifica cada petición para descartar respuestas obsoletas cuando el
  // usuario escribe rápido o cambia de filtro mientras una carga está en vuelo.
  const peticionRef = useRef(0);
  // Marca que la categoría se cargó al instante, para que el efecto de filtros
  // no repita la misma petición 400 ms después.
  const categoriaCargadaRef = useRef(false);
  // Respeto la "zona segura" del teléfono: reloj, wifi y batería arriba
  const insets = useSafeAreaInsets();

  // Recuperamos los filtros de la última visita a la lista para volver a la
  // misma categoría/búsqueda/favoritos al regresar del detalle.
  const filtrosGuardados = obtenerFiltrosLista();
  const datosIniciales = obtenerDeCache(
    claveCache(filtrosGuardados.buscar, filtrosGuardados.idCategoria, 1)
  );

  const [lugares, setLugares] = useState(() => datosIniciales?.lugares || []);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(() => !datosIniciales);
  const [buscar, setBuscar] = useState(filtrosGuardados.buscar);
  const [idCategoria, setIdCategoria] = useState(filtrosGuardados.idCategoria);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(
    () => datosIniciales?.paginacion?.totalPaginas || 1
  );
  // A partir de la primera carga lograda ya no mostramos el loader a pantalla
  // completa: los cambios de categoría usan un indicador dentro de la lista.
  const cargaInicialHechaRef = useRef(Boolean(datosIniciales));
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [imagenHeroIndex, setImagenHeroIndex] = useState(0);
  const [favoritos, setFavoritos] = useState(new Set());
  const [soloFavoritos, setSoloFavoritos] = useState(filtrosGuardados.soloFavoritos);
  // Capas de opacidad del hero: una por foto, como las dos capas del crossfade web
  const [opacidadesHero] = useState(() => FOTOS_HERO.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)));

  // Carrusel de categorías: refs/estado para centrar el chip activo al volver
  // del detalle (si no, el carrusel aparece al inicio y hay que buscarlo).
  const refChips = useRef(null);
  const ultimaCentradaRef = useRef(null);
  const [anchoChips, setAnchoChips] = useState(0);
  const [posicionesChips, setPosicionesChips] = useState({});

  // ---------- Carga de datos ----------
  const cargarLugares = useCallback(async (paginaDestino = 1, filtros = {}, forzar = false) => {
    const aplicar = (data) => {
      const nuevos = data.lugares || [];
      const pag = data.paginacion || {};
      setTotalPaginas(pag.totalPaginas || 1);
      if (paginaDestino === 1) {
        setLugares(nuevos);
      } else {
        setLugares((prev) => [...prev, ...nuevos]);
      }
    };

    const clave = claveCache(filtros.buscar, filtros.idCategoria, paginaDestino);

    // Si ya visitamos esta categoría/página, la mostramos al instante.
    if (!forzar && tieneEnCache(clave)) {
      aplicar(obtenerDeCache(clave));
      cargaInicialHechaRef.current = true;
      setError(null);
      setCargando(false);
      setCargandoMas(false);
      return;
    }

    const idPeticion = ++peticionRef.current;
    try {
      if (paginaDestino === 1) {
        setCargando(true);
      } else {
        setCargandoMas(true);
      }
      setError(null);
      const data = await obtenerLugares({ ...filtros, pagina: paginaDestino });
      if (idPeticion !== peticionRef.current) return; // llegó tarde: la ignoramos

      cargaInicialHechaRef.current = true;
      guardarEnCache(clave, data);
      aplicar(data);
    } catch (err) {
      if (idPeticion !== peticionRef.current) return;
      setError(err.message || "No se pudieron cargar los lugares");
    } finally {
      if (idPeticion === peticionRef.current) {
        setCargando(false);
        setCargandoMas(false);
      }
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

  // Al montar: categorías, favoritos y precarga del hero. Los lugares los
  // carga el efecto de filtros (más abajo), que también cubre la primera vez.
  useEffect(() => {
    cargarCategorias();
    cargarFavoritos();
    // Precarga las 6 fotos del hero al abrir: sin ellas, el fundido
    // muestra el fondo negro mientras descarga cada imagen por el túnel
    Promise.all(FOTOS_HERO.map((url) => Image.prefetch(url))).catch(() => {});
  }, []);

  // Recordamos categoría, búsqueda y vista de favoritos para restaurarlas al
  // volver del detalle (HomeScreen se desmonta y vuelve a montarse).
  useEffect(() => {
    guardarFiltrosLista({ buscar, idCategoria, soloFavoritos });
  }, [buscar, idCategoria, soloFavoritos]);

  // Búsqueda/filtros en vivo (con pequeño retardo, como en la web).
  // Siempre recarga desde la página 1: antes, si el usuario ya había paginado
  // ("Ver más"), el filtro se ignoraba hasta la siguiente pulsación de tecla.
  useEffect(() => {
    // Si el cambio vino de una categoría, ya se cargó al instante en el handler.
    if (categoriaCargadaRef.current) {
      categoriaCargadaRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      setPagina(1);
      cargarLugares(1, { buscar, idCategoria });
    }, 400);
    return () => clearTimeout(t);
  }, [buscar, idCategoria, cargarLugares]);

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

  // Con numColumns=2, si la última fila tiene un solo elemento la tarjeta se
  // estira a todo el ancho. Añadimos un hueco invisible para mantener la rejilla.
  const datosLista =
    lugaresVisibles.length % 2 === 1
      ? [...lugaresVisibles, { idLugar: "__relleno__", __relleno: true }]
      : lugaresVisibles;

  // Elegir una categoría SIEMPRE sale de la vista de favoritos. Antes
  // `soloFavoritos` quedaba activo y la lista seguía filtrada a favoritos,
  // dando la sensación de que las demás categorías no respondían.
  const seleccionarCategoria = (id) => {
    const yaActiva = !soloFavoritos && id === idCategoria;
    setSoloFavoritos(false);
    if (yaActiva) return;

    // Invalida cualquier petición en vuelo de la categoría anterior.
    peticionRef.current += 1;

    // Vaciamos la lista para no mostrar la categoría anterior, pero sin sacar
    // al usuario de la pantalla: el hero y los chips siguen visibles.
    setLugares([]);
    setPagina(1);
    setIdCategoria(id);

    // Cargamos al instante (sin el retardo de 400 ms que sí usa el buscador)
    // y avisamos al efecto de filtros de que no repita la petición.
    categoriaCargadaRef.current = true;
    cargarLugares(1, { buscar, idCategoria: id });
  };

  // Entrar a favoritos muestra todos los favoritos (sin categoría seleccionada).
  const alternarVistaFavoritos = () => {
    if (!soloFavoritos) setIdCategoria(0);
    setSoloFavoritos(!soloFavoritos);
  };

  // Guarda la posición de cada chip para poder centrarlo después.
  const registrarPosicionChip = (clave, evento) => {
    const { x, width } = evento.nativeEvent.layout;
    setPosicionesChips((prev) => {
      const actual = prev[clave];
      if (actual && actual.x === x && actual.width === width) return prev;
      return { ...prev, [clave]: { x, width } };
    });
  };

  // Centra el chip de la categoría activa. Al volver del detalle se hace sin
  // animación para que aparezca ya en su sitio; al cambiar de categoría, animado.
  useEffect(() => {
    const claveActiva = soloFavoritos
      ? "fav"
      : idCategoria === 0
        ? "todos"
        : `cat-${idCategoria}`;
    const pos = posicionesChips[claveActiva];
    if (!pos || !anchoChips) return;
    if (ultimaCentradaRef.current === claveActiva) return;

    const primeraVez = ultimaCentradaRef.current === null;
    ultimaCentradaRef.current = claveActiva;
    const destino = Math.max(0, pos.x - anchoChips / 2 + pos.width / 2);
    refChips.current?.scrollTo({ x: destino, animated: !primeraVez });
  }, [idCategoria, soloFavoritos, posicionesChips, anchoChips]);

  // El loader a pantalla completa solo aparece en el primer arranque. Después
  // (p. ej. al cambiar de categoría) usamos el indicador dentro de la lista.
  if (cargando && lugares.length === 0 && !cargaInicialHechaRef.current) {
    return (
      <View style={[styles.contenedor, styles.centro]}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.textoCargando}>Cargando la Sabana…</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

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
                  "rgba(15, 23, 42, 0.78)",
                  "rgba(15, 23, 42, 0.86)",
                  "rgba(15, 23, 42, 0.94)",
                ]}
                locations={[0, 0.4, 1]}
                style={styles.heroGradiente}
              />

              {/* Barra de marca: ahora vive FUERA de la lista, fija en la pantalla */}
              <View style={[styles.heroContenido, styles.heroPanel, sombras.vidrio]}>
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
                ref={refChips}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                onLayout={(e) => setAnchoChips(e.nativeEvent.layout.width)}
              >
                <Chip
                  etiqueta="Todos"
                  activo={!soloFavoritos && !idCategoria}
                  onPress={() => seleccionarCategoria(0)}
                  onLayout={(e) => registrarPosicionChip("todos", e)}
                />
                {categorias.map((cat) => (
                  <Chip
                    key={cat.idCategoria}
                    etiqueta={`${cat.nombre}`}
                    activo={!soloFavoritos && idCategoria === cat.idCategoria}
                    onPress={() => seleccionarCategoria(cat.idCategoria)}
                    onLayout={(e) => registrarPosicionChip(`cat-${cat.idCategoria}`, e)}
                  />
                ))}
                <Chip
                  etiqueta="❤️ Mis favoritos"
                  activo={soloFavoritos}
                  onPress={alternarVistaFavoritos}
                  onLayout={(e) => registrarPosicionChip("fav", e)}
                />
              </ScrollView>
            </View>
          </View>
        }
        data={datosLista}
        keyExtractor={(item) => (item.__relleno ? "relleno" : item.idLugar.toString())}
        renderItem={({ item }) =>
          item.__relleno ? (
            <View style={styles.tarjetaRelleno} />
          ) : (
            <LugarCard
              lugar={item}
              favorito={favoritos.has(item.idLugar)}
              onAlternarFavorito={() => alTocarFavorito(item.idLugar)}
              onPress={() => onVerDetalle(item)}
            />
          )
        }
        numColumns={2}
        columnWrapperStyle={styles.filaTarjetas}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={cargando && lugares.length > 0}
            onRefresh={() => cargarLugares(1, { buscar, idCategoria }, true)}
            colors={[colores.primario]}
            tintColor={colores.primario}
          />
        }
        ListEmptyComponent={
          cargando ? (
            <View style={styles.cargandoLista}>
              <ActivityIndicator color={colores.primario} />
              <Text style={styles.textoCargando}>Cargando lugares…</Text>
            </View>
          ) : (
            <Text style={styles.sinResultados}>
              {soloFavoritos
                ? "Aún no guardas favoritos. Toca el 🤍 en cualquier lugar. ❤️"
                : "No encontramos lugares con esos filtros 🧭"}
            </Text>
          )
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

      {/* ============ BARRA SUPERIOR FIJA (navbar glass móvil, como la web) ============ */}
      <View
        style={[
          styles.barraMarca,
          { top: insets.top + 8 },
          sombras.vidrio,
        ]}
      >
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

function Chip({ etiqueta, activo, onPress, onLayout }) {
  return (
    <TouchableOpacity
      style={[styles.chip, activo && styles.chipActivo]}
      onPress={onPress}
      onLayout={onLayout}
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
    // Anula el paddingHorizontal de la lista: el hero debe llegar de borde a
    // borde para que no queden franjas claras sin sombrear a los lados.
    marginHorizontal: -8,
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
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    zIndex: 10,
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
  heroPanel: {
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    padding: 14,
    paddingBottom: 14,
  },
  heroUbicacion: {
    color: "#FBBF24",
    fontSize: 12.5,
    fontFamily: fuentes.bold,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  heroTitulo: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 36,
    fontFamily: fuentes.extrabold,
    marginBottom: 8,
  },
  heroDestacado: {
    color: colores.acento,
  },
  heroParrafo: {
    color: "#FFFFFF",
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: fuentes.medio,
    marginBottom: 16,
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
    // Compensa el paddingHorizontal de la lista: los chips ya tienen su propio
    // relleno lateral de 16px y así quedan alineados con el contenido del hero.
    marginHorizontal: -8,
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
  tarjetaRelleno: {
    flex: 1,
    margin: 8,
  },
  cargandoLista: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
