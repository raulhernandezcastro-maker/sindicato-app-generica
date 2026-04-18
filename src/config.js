// ============================================================
// CONFIGURACIÓN CENTRAL DE LA APP
// Modifica solo este archivo para adaptar la app a cada cliente
// ============================================================

export const APP_CONFIG = {
  // ── Identidad ──────────────────────────────────────────────
  nombreSindicato: "Mi Sindicato",          // Nombre completo
  nombreCorto: "Mi Sindicato",              // Nombre corto para móvil
  subtitulo: "Portal del Sindicato",        // Subtítulo en header

  // ── Colores principales (hex sin #) ───────────────────────
  colorPrimario: "#1e40af",                 // Azul corporativo
  colorPrimarioOscuro: "#1e3a8a",           // Variante oscura
  colorPrimarioClaro: "#dbeafe",            // Fondo claro
  colorAcento: "#3b82f6",                   // Botones secundarios
  colorTextoSobreAcento: "#1e3a8a",         // Texto sobre botón acento

  // ── Contacto ───────────────────────────────────────────────
  whatsappNumero: "56912345678",            // Sin + ni espacios
  whatsappMensaje: "Hola, me contacto desde el portal del Sindicato.",

  // ── App / PWA ──────────────────────────────────────────────
  appUrl: "https://mi-sindicato.vercel.app",
  appNombre: "Mi Sindicato App",            // Nombre en pantalla de inicio

  // ── Notificaciones ─────────────────────────────────────────
  notificacionTitulo: "Mi Sindicato",       // Título notificaciones push

  // ── Textos personalizables ─────────────────────────────────
  bienvenida: "Bienvenido al Portal del Sindicato",
  descripcionApp: "Aplicación oficial del sindicato",
}

// Colores derivados para uso inline en JSX
export const COLORS = {
  primary:      APP_CONFIG.colorPrimario,
  primaryDark:  APP_CONFIG.colorPrimarioOscuro,
  primaryLight: APP_CONFIG.colorPrimarioClaro,
  accent:       APP_CONFIG.colorAcento,
  accentText:   APP_CONFIG.colorTextoSobreAcento,
}
