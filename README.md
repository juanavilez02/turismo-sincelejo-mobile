# Turismo Sincelejo - App Móvil (Expo)

App móvil complementaria al portal web de turismo de Sincelejo. Comparte la misma API REST que el proyecto web (`Desarrollo web\ProyectoSincelejo\Backend`).

## Estructura del proyecto

```
ProyectoSincelejo-Movil/
├── App.js                      # Punto de entrada
├── app.json                    # Configuración de Expo
├── package.json                # Dependencias
├── babel.config.js             # Configuración de Babel
├── .gitignore                  # Archivos ignorados por Git
├── src/
│   ├── api.js                  # Configuración y llamadas a la API
│   ├── screens/
│   │   ├── HomeScreen.js       # Lista de lugares con búsqueda
│   │   └── LoginScreen.js      # Pantalla de autenticación
│   └── components/
│       └── LugarCard.js        # Tarjeta de lugar
└── README.md
```

## Requisitos previos

- Node.js instalado
- Expo CLI: `npm install -g expo-cli` (opcional, puedes usar `npx expo`)
- App **Expo Go** instalada en tu teléfono (iOS o Android)

## Instalación

Desde la carpeta del proyecto:

```bash
npm install
```

## Ejecutar en modo desarrollo

```bash
npx expo start
```

Luego escanea el QR con la app **Expo Go** en tu teléfono, o presiona:
- `w` para abrir en navegador web
- `a` para emulador Android
- `i` para simulador iOS

## API utilizada

La app consume la API desplegada en Render:

```
https://turismo-sincelejo-api.onrender.com/api
```

Esta es la **misma API** que usa el proyecto web en `Desarrollo web\ProyectoSincelejo\Backend`.

## Notas

- La app móvil es un **proyecto independiente** del web.
- Comparten la misma base de datos a través de la API en la nube.
- No se requiere configurar MySQL localmente para probar la app móvil.
- Si la API está en modo "suspensión" (plan gratuito de Render), la primera petición puede tardar ~1 minuto en despertar.

## Créditos

Proyecto académico — Desarrollo Web y Programación Móvil (2026-2)
Autor: juanavilez02
