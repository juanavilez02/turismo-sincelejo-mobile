import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { obtenerCategorias, crearLugar, actualizarLugar, obtenerUrlImagen, subirArchivo } from "../api";
import { construirUrlComoLlegar } from "../mapsUrl";
import { colores, radio, sombras, fuentes } from "../theme";

export default function FormularioLugarScreen({ lugar, token, onGuardar, onCancelar }) {
  const insets = useSafeAreaInsets();
  // modo edición si nos pasan un lugar
  const editando = Boolean(lugar);

  const [nombre, setNombre] = useState(lugar?.nombre ?? "");
  const [direccion, setDireccion] = useState(lugar?.direccion ?? "");
  const [horario, setHorario] = useState(lugar?.horario ?? "");
  const [descripcion, setDescripcion] = useState(lugar?.descripcion ?? "");
  const [idCategoria, setIdCategoria] = useState(lugar?.idCategoria ?? 0);
  const [imagenUrl, setImagenUrl] = useState(lugar?.imagen ?? "");
  const [categorias, setCategorias] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const cargarCategorias = useCallback(async () => {
    try {
      const data = await obtenerCategorias();
      setCategorias(Array.isArray(data) ? data : data.categorias || []);
    } catch {
      Alert.alert("Atención", "No se pudieron cargar las categorías.");
    }
  }, []);

  useEffect(() => {
    cargarCategorias();
  }, []);

  // ---------- Foto: cámara o galería, subida inmediata a la API ----------
  const elegirFoto = async (usarCamara) => {
    if (usarCamara) {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert("Permiso", "Necesito acceso a la cámara para tomar la foto.");
        return;
      }
    }

    const resultado = usarCamara
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 10], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [16, 10],
          quality: 0.7,
        });

    if (resultado.canceled) return;
    const foto = resultado.assets?.[0];
    if (!foto) return;

    try {
      setSubiendoFoto(true);
      const url = await subirArchivo(foto.uri, token);
      setImagenUrl(url); // la URL real queda como "fuente de verdad", igual que en el admin web
    } catch (err) {
      Alert.alert("Error", "No se pudo subir la imagen: " + err.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardar = async () => {
    if (!nombre.trim() || !descripcion.trim() || !direccion.trim() || !imagenUrl.trim()) {
      Alert.alert("Formulario incompleto", "El lugar necesita: nombre, descripción, dirección e imagen.");
      return;
    }
    if (!idCategoria) {
      Alert.alert("Formulario incompleto", "Elige la categoría del lugar.");
      return;
    }

    const datos = {
      IdCategoria: idCategoria,
      Nombre: nombre.trim(),
      Descripcion: descripcion.trim(),
      Direccion: direccion.trim(),
      Imagen: imagenUrl.trim(),
      Horario: horario.trim() || "Abierto 24 Horas",
    };

    try {
      setGuardando(true);
      if (editando) {
        await actualizarLugar(lugar.idLugar, datos, token);
      } else {
        await crearLugar(datos, token);
      }
      onGuardar();
    } catch (err) {
      Alert.alert("Error", err.message === "Error 401"
        ? "Tu sesión expiró. Entra de nuevo."
        : err.message || "No se pudo guardar el lugar.");
    } finally {
      setGuardando(false);
    }
  };

  const preview = imagenUrl ? obtenerUrlImagen(imagenUrl) : null;

  // Abre Google Maps sobre la dirección recién escrita: si el pin cae en el
  // lugar correcto, los visitantes llegarán directo a ese mismo sitio.
  const probarEnMaps = () => {
    if (!direccion.trim()) {
      Alert.alert("Falta la dirección", "Escribe primero la dirección para probarla en Google Maps.");
      return;
    }
    const url = construirUrlComoLlegar(direccion);
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.contenedor}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Encabezado como el sidebar del admin web */}
          <Text style={styles.titulo}>
            {editando ? "✏️ Editar lugar" : "➕ Nuevo lugar"}
          </Text>
          <Text style={styles.parrafo}>
            {editando
              ? `Modificando: ${lugar?.nombre}`
              : "Completa los datos del lugar de la Sabana."}
          </Text>

          {/* ---------- Foto (vía /api/archivos, igual que el admin web) ---------- */}
          <Text style={styles.etiqueta}>Imagen del lugar</Text>
          {preview ? (
            <ImagePreview uri={preview} onQuitar={() => setImagenUrl("")} />
          ) : (
            <View style={styles.zonaFotoVacia}>
              <Text style={styles.zonaFotoTexto}>📷 {subiendoFoto ? "Subiendo…" : "Sin imagen aún"}</Text>
            </View>
          )}
          <View style={styles.filaBotonesFoto}>
            <TouchableOpacity style={styles.botonFoto} onPress={() => elegirFoto(true)} disabled={subiendoFoto}>
              <Text style={styles.botonFotoTexto}>📷 Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botonFotoGris} onPress={() => elegirFoto(false)} disabled={subiendoFoto}>
              <Text style={styles.botonFotoTexto}>🖼️ Galería</Text>
            </TouchableOpacity>
          </View>
          {subiendoFoto && <ActivityIndicator color={colores.primario} style={{ marginTop: 6 }} />}

          {/* ---------- Campos como el formulario web ---------- */}
          <Text style={styles.etiqueta}>Nombre del lugar *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Plaza Majagual"
            placeholderTextColor={colores.tintaSuave}
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.etiqueta}>Dirección *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Carrera 17, Barrio Majagual"
            placeholderTextColor={colores.tintaSuave}
            value={direccion}
            onChangeText={setDireccion}
          />
          <Text style={styles.ayudaMapa}>
            📍 Escríbela igual que aparece en Google Maps (lugar → "Copiar dirección"). 
            Los visitantes llegarán directo a ese punto con "Cómo llegar".
          </Text>
          <TouchableOpacity style={styles.botonProbarMapa} onPress={probarEnMaps} activeOpacity={0.85}>
            <Text style={styles.botonProbarMapaTexto}>🧭 Probar dirección en Google Maps</Text>
          </TouchableOpacity>

          <Text style={styles.etiqueta}>Horario</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 07:00 AM - 07:00 PM"
            placeholderTextColor={colores.tintaSuave}
            value={horario}
            onChangeText={setHorario}
          />

          <Text style={styles.etiqueta}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.inputArea]}
            placeholder="Cuenta qué hace especial a este lugar…"
            placeholderTextColor={colores.tintaSuave}
            multiline
            numberOfLines={4}
            value={descripcion}
            onChangeText={setDescripcion}
          />

          <Text style={styles.etiqueta}>Categoría *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.idCategoria}
                style={[
                  styles.chip,
                  idCategoria === cat.idCategoria && styles.chipActivo,
                ]}
                onPress={() => setIdCategoria(cat.idCategoria)}
                activeOpacity={0.8}
              >
                <Text style={idCategoria === cat.idCategoria ? styles.chipTextoActivo : styles.chipTexto}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ---------- Acciones ---------- */}
          <TouchableOpacity style={styles.botonGuardar} onPress={guardar} disabled={guardando} activeOpacity={0.85}>
            {guardando ? (
              <ActivityIndicator color={colores.blanco} />
            ) : (
              <Text style={styles.botonGuardarTexto}>
                {editando ? "Guardar cambios" : "Crear lugar"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancelar} activeOpacity={0.7}>
            <Text style={styles.cancelar}>Cancelar y volver</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* toast de guardado abajo, como los toasts del admin web */}
      {guardando && <Text style={styles.guardandoFlotante}>Guardando lugar…</Text>}
    </View>
  );
}

function ImagePreview({ uri, onQuitar }) {
  return (
    <View style={styles.previewCaja}>
      <Image source={{ uri }} style={styles.previewImagen} resizeMode="cover" />
      <TouchableOpacity onPress={onQuitar} style={styles.botonQuitar}>
        <Text style={styles.botonQuitarTexto}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 22,
    fontFamily: fuentes.extrabold,
    color: colores.tinta,
  },
  parrafo: {
    color: colores.tintaSuave,
    fontSize: 13,
    fontFamily: fuentes.regular,
    marginTop: 4,
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 12,
    fontFamily: fuentes.semibold,
    color: colores.tintaMedia,
    marginBottom: 6,
  },
  zonaFotoVacia: {
    backgroundColor: colores.primarioSuave,
    borderRadius: radio.normal,
    borderWidth: 2,
    borderColor: colores.primario,
    borderStyle: "dashed",
    paddingVertical: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  zonaFotoTexto: {
    color: colores.primarioOscuro,
    fontFamily: fuentes.medio,
    fontSize: 14,
  },
  previewCaja: {
    marginBottom: 10,
  },
  previewImagen: {
    width: "100%",
    height: 170,
    borderRadius: radio.normal,
  },
  botonQuitar: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(15,23,42,0.65)",
    borderRadius: radio.pill,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  botonQuitarTexto: {
    color: colores.blanco,
    fontSize: 15,
  },
  filaBotonesFoto: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  botonFoto: {
    backgroundColor: colores.acento,
    borderRadius: radio.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  botonFotoGris: {
    backgroundColor: colores.tintaSuave,
    borderRadius: radio.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  botonFotoTexto: {
    color: colores.blanco,
    fontFamily: fuentes.semibold,
    fontSize: 13,
  },
  input: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: colores.tinta,
    fontFamily: fuentes.regular,
    fontSize: 14,
    marginBottom: 16,
  },
  inputArea: {
    height: 110,
    textAlignVertical: "top",
  },
  ayudaMapa: {
    color: colores.tintaSuave,
    fontFamily: fuentes.regular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
    marginTop: -10,
  },
  botonProbarMapa: {
    alignSelf: "flex-start",
    backgroundColor: colores.primarioSuave,
    borderWidth: 1,
    borderColor: colores.primario,
    borderRadius: radio.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  botonProbarMapaTexto: {
    color: colores.primarioOscuro,
    fontFamily: fuentes.semibold,
    fontSize: 12.5,
  },
  chip: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
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
    fontSize: 13,
    fontFamily: fuentes.semibold,
  },
  botonGuardar: {
    backgroundColor: colores.primario,
    borderRadius: radio.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    ...sombras.reposo,
  },
  botonGuardarTexto: {
    color: colores.blanco,
    fontSize: 15,
    fontFamily: fuentes.semibold,
  },
  cancelar: {
    textAlign: "center",
    color: colores.tintaMedia,
    fontFamily: fuentes.semibold,
    fontSize: 13,
    marginTop: 16,
  },
  guardandoFlotante: {
    position: "absolute",
    bottom: 18,
    left: 20,
    right: 20,
    textAlign: "center",
    color: colores.primarioOscuro,
    backgroundColor: colores.primarioSuave,
    borderRadius: radio.pill,
    paddingVertical: 8,
    fontFamily: fuentes.semibold,
    fontSize: 12,
  },
});
