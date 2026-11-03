# Turismo Sincelejo - App Móvil (Expo)

App móvil complementaria al portal web de turismo de Sincelejo. Comparte la misma API REST que el proyecto web (`Desarrollo web\ProyectoSincelejo\Backend`).

## Funcionalidades

- Listado de lugares con búsqueda en vivo, filtro por categoría y paginación.
- Favoritos guardados en el dispositivo (AsyncStorage).
- Detalle del lugar con enlace "Cómo llegar" a Google Maps.
- Panel de administración: iniciar sesión, crear, editar y eliminar lugares, y subir fotos (cámara o galería).
- Sesión persistente con token guardado de forma segura (SecureStore).
- Hero con crossfade de fotos, emulando el sitio web.

## Estructura del proyecto

```
ProyectoSincelejo-Movil/
├── App.js                          # Punto de entrada y navegación entre pantallas
├── app.json                        # Configuración de Expo
├── package.json                    # Dependencias
├── babel.config.js                 # Configuración de Babel
├── .gitignore                      # Archivos ignorados por Git
├── src/
│   ├── api.js                      # Llamadas a la API (timeout, sesión expirada)
│   ├── almacenamiento.js           # Token de sesión (SecureStore / AsyncStorage)
│   ├── favoritos.js                # Favoritos locales
│   ├── theme.js                    # Tokens de diseño (colores, fuentes, sombras)
│   ├── screens/
│   │   ├── HomeScreen.js           # Lista, búsqueda, categorías y favoritos
│   │   ├── DetalleScreen.js        # Ficha del lugar
│   │   ├── LoginScreen.js          # Autenticación de administrador
│   │   └── FormularioLugarScreen.js# Crear / editar lugar
│   └── components/
│       └── LugarCard.js            # Tarjeta de lugar
└── README.md
```

## Requisitos previos

- Node.js instalado
- App **Expo Go** instalada en tu teléfono (iOS o Android)
- (Opcional) Expo CLI global: `npm install -g expo-cli`; también puedes usar `npx expo`

## Instalación

Desde la carpeta del proyecto:

```bash
npm install
```

## Ejecutar en modo desarrollo

```bash
npx expo start
```

Luego:

- Escanea el QR con **Expo Go** (el teléfono y el PC deben estar en la misma red Wi‑Fi).
- Si la red no permite la conexión, usa `npx expo start --tunnel`.
- `a` para emulador Android, `i` para simulador iOS, `w` para el navegador web.

> La app también corre en web (`react-native-web`). Ten en cuenta que la subida de fotos desde cámara/galería solo funciona en un dispositivo nativo.

## API utilizada

La app consume la API desplegada en Render:

```
https://turismo-sincelejo-api.onrender.com/api
```

Es la **misma API** que usa el proyecto web en `Desarrollo web\ProyectoSincelejo\Backend`.

## Notas

- La app móvil es un **proyecto independiente** del web.
- Comparten la misma base de datos a través de la API en la nube.
- No se requiere configurar MySQL localmente para probar la app móvil.
- Si la API está en modo "suspensión" (plan gratuito de Render), la primera petición puede tardar hasta ~1 minuto en despertar; la app espera hasta 90 s y muestra un aviso si se excede.

## Créditos

Proyecto académico — Desarrollo Web y Programación Móvil (2026-2)
Autor: juanavilez02
