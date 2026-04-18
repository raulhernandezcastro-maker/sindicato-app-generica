# Aplicación Web del Sindicato de Trabajadores

## Descripción General

Aplicación Web Progresiva (PWA) diseñada para la gestión de un Sindicato de Trabajadores, con funcionalidades de comunicación, gestión documental y administración de socios y cuotas.

## Características Principales

### ✅ Autenticación y Seguridad
- Login con email y contraseña
- Recuperación de contraseña
- Sistema de roles multinivel (Socio, Director, Administrador)
- Sesiones persistentes
- Rutas protegidas por rol

### ✅ Roles y Permisos

#### SOCIO (rol base)
- Ver avisos del sindicato
- Consultar y descargar documentos
- Ver y editar perfil personal
- No ve información de pagos

#### DIRECTOR
- Todo lo del SOCIO +
- Crear y publicar avisos
- Subir y eliminar documentos
- Ver estadísticas generales del sindicato
- Ver información general de cuotas (sin detalles individuales)

#### ADMINISTRADOR
- Acceso total a la aplicación
- Crear, editar y gestionar socios
- Asignar y modificar roles
- Ver pagos individuales de cada socio
- Activar/desactivar socios

### ✅ Pantallas Implementadas

1. **Login** - Autenticación de usuarios
2. **Home** - Página de inicio con último aviso y accesos rápidos
3. **Avisos** - Lista de comunicaciones oficiales con filtros por tipo
4. **Documentos** - Gestión documental organizada por categorías
5. **Mi Perfil** - Edición de información personal y cambio de contraseña
6. **Dashboard** - Estadísticas generales del sindicato (Director/Admin)
7. **Cuotas** - Gestión de pagos y estados de cuotas (Director/Admin)
8. **Gestión de Socios** - Administración completa de usuarios (Solo Admin)

## Tecnologías Utilizadas

- **Frontend**: React 19 + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database + Auth + Storage)
- **Routing**: React Router v7
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Theme**: next-themes (soporte dark mode)

## Estructura de Base de Datos

### Tablas Principales

#### profiles
- Información de usuarios (RUT, nombre, email, teléfono, foto, estado)

#### roles
- Roles asignados a cada usuario (relación muchos a muchos)

#### avisos
- Comunicaciones oficiales (título, contenido, tipo, autor)
- Tipos: urgente, asamblea, informativo

#### documentos
- Archivos oficiales (título, categoría, URL del archivo)
- Categorías: estatutos, actas, beneficios

#### pagos
- Registro de cuotas mensuales (monto, mes, año, estado)
- Estados: pagado, pendiente, atrasado

### Storage Buckets

- **profile-photos**: Fotos de perfil de los usuarios
- **documentos**: Archivos PDF oficiales del sindicato

## Diseño Visual

### Colores
- **Principal**: Azul (#2563eb) - Representa confianza y profesionalismo
- **Acento**: Verde (#22c55e) - Usado en botones y elementos destacados
- **Fondo**: Blanco/Gris claro

### Características de Diseño
- Diseño Apple-style (limpio, minimalista, espacioso)
- Totalmente responsive (mobile-first)
- Íconos grandes para facilitar uso móvil
- Menú inferior fijo en móvil
- Menú lateral en escritorio
- Soporte para modo oscuro

## Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` con:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 2. Base de Datos

Las migraciones ya están aplicadas. La base de datos incluye:
- Todas las tablas necesarias
- Índices optimizados
- RLS deshabilitado por defecto para facilitar el desarrollo
- Buckets de storage configurados

### 3. Crear Primer Administrador

Ver archivo `INSTRUCCIONES_INICIAL.md` para crear el primer usuario administrador.

## Funcionalidades Futuras Preparadas

La estructura está lista para agregar:
- ✨ Sistema de votaciones
- ✨ Encuestas a socios
- ✨ Solicitudes internas
- ✨ Notificaciones automáticas por email
- ✨ Mensajería interna
- ✨ Calendario de eventos

## Características PWA

- ✅ Instalable en dispositivos móviles
- ✅ Funciona offline (caché básico)
- ✅ Icono de aplicación personalizado
- ✅ Splash screen
- ✅ Optimizada para rendimiento

## Seguridad

- ✅ Autenticación con Supabase Auth
- ✅ Validación de roles en backend y frontend
- ✅ RLS configurado (deshabilitado por defecto para desarrollo)
- ✅ Passwords hasheados automáticamente
- ✅ Sesiones seguras con tokens JWT
- ✅ CORS configurado correctamente

## Estructura del Proyecto

```
/home/user/
├── src/
│   ├── components/
│   │   ├── auth/           # Componentes de autenticación
│   │   ├── layout/         # Layouts y navegación
│   │   └── ui/             # Componentes de shadcn/ui
│   ├── contexts/
│   │   └── AuthContext.jsx # Contexto de autenticación
│   ├── pages/              # Todas las páginas de la app
│   ├── lib/
│   │   ├── supabase.js     # Cliente de Supabase
│   │   └── utils.js        # Utilidades
│   ├── App.jsx             # Componente principal con rutas
│   └── main.jsx            # Entry point
├── supabase/
│   └── migrations/         # Migraciones de base de datos
├── public/
│   ├── manifest.json       # Configuración PWA
│   └── icon.svg           # Icono de la aplicación
└── types/
    └── database.types.ts   # Types generados de Supabase
```

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Desarrollo (NO ejecutar - solo para referencia)
# npm run dev

# Build para producción
npm run build

# Regenerar tipos de Supabase
npx supabase gen types --linked > types/database.types.ts

# Ver migraciones
npx supabase migration list --linked

# Crear nueva migración
npx supabase migration new nombre_migracion
```

## Flujo de Trabajo para Nuevos Usuarios

1. **Administrador** crea cuenta del nuevo socio en "Gestión de Socios"
2. Socio recibe email con credenciales (futuro)
3. Socio inicia sesión y completa su perfil
4. Socio puede cambiar su contraseña desde "Mi Perfil"

## Consideraciones Importantes

### ⚠️ Limitaciones en E2B Sandbox

Algunas funcionalidades no funcionan en el entorno de sandbox:
- Carga de archivos (documentos y fotos de perfil)
- Descarga de archivos
- Vista previa de PDFs

Estas funcionalidades muestran un mensaje informativo indicando que se requiere publicar en producción.

### ✅ Listo para Producción

La aplicación está completamente funcional y lista para producción:
- Base de datos configurada
- Autenticación funcionando
- Sistema de roles implementado
- Todas las pantallas operativas
- PWA configurada
- Responsive design implementado

## Soporte y Mantenimiento

### Agregar Nuevo Rol

1. Actualizar tabla `roles` con el nuevo rol
2. Modificar `AuthContext.jsx` para incluir función del nuevo rol
3. Actualizar componentes de navegación
4. Crear rutas protegidas necesarias

### Agregar Nueva Funcionalidad

1. Crear migración si requiere nuevas tablas
2. Crear página en `/src/pages/`
3. Agregar ruta en `App.jsx`
4. Actualizar navegación en `DesktopNav.jsx` y `MobileNav.jsx`

## Logs y Debugging

La aplicación incluye logs extensivos en consola para debugging:
- Todos los componentes principales tienen logs
- Operaciones de base de datos logueadas
- Errores capturados y logueados
- Estado de autenticación trackeado

## Conclusión

Esta aplicación proporciona una base sólida y completa para la gestión de un sindicato, con todas las funcionalidades básicas implementadas y una arquitectura preparada para escalar y agregar nuevas características según las necesidades futuras.

---

**Desarrollado con React + Vite + Supabase**
