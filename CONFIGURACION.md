# 🚀 Cómo adaptar esta app a un nuevo cliente

## Paso 1 — Editar `src/config.js`

Este es el único archivo que necesitas modificar para personalizar la app:

```js
export const APP_CONFIG = {
  nombreSindicato: "Sindicato XYZ Empresa",   // Nombre completo
  nombreCorto: "Sindicato XYZ",               // Para móvil (máx 20 caracteres)
  subtitulo: "Portal del Sindicato",

  colorPrimario: "#1e40af",       // Color principal (header, botones)
  colorPrimarioOscuro: "#1e3a8a", // Variante más oscura
  colorPrimarioClaro: "#dbeafe",  // Fondo suave
  colorAcento: "#3b82f6",         // Botones secundarios
  colorTextoSobreAcento: "#1e3a8a",

  whatsappNumero: "56912345678",  // Sin + ni espacios
  whatsappMensaje: "Hola, me contacto desde el portal del Sindicato.",

  appUrl: "https://nuevo-sindicato.vercel.app",
  appNombre: "App Sindicato XYZ",

  notificacionTitulo: "Sindicato XYZ",
  bienvenida: "Bienvenido al Portal del Sindicato",
}
```

## Paso 2 — Reemplazar logos e íconos

Reemplaza estos archivos en la carpeta `public/`:
- `logo.png` — logo del sindicato (circular, fondo transparente)
- `favicon.png` — mismo logo en 64x64px
- `icon-192.png` — ícono PWA en 192x192px
- `icon-512.png` — ícono PWA en 512x512px

## Paso 3 — Configurar Supabase

1. Crear nuevo proyecto en supabase.com
2. Ejecutar el SQL de estructura (`database/schema.sql`)
3. Crear los buckets de Storage: `beneficios`, `convenios`, `documentos`, `avatars`
4. Actualizar las variables de entorno en Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Paso 4 — Deploy en Vercel

1. Fork o nuevo repositorio en GitHub
2. Importar en Vercel
3. Agregar las variables de entorno
4. Deploy automático ✅

---
Tiempo estimado de personalización: **30-60 minutos** por cliente nuevo.
