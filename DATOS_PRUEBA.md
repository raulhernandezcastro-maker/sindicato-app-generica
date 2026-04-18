# Datos de Prueba para la Aplicación

## Credenciales de Usuarios de Prueba

### Administrador Principal
```
Email: admin@sindicato.cl
Password: admin123456
RUT: 11111111-1
Nombre: Administrador Principal
Roles: Socio + Administrador
```

### Director de Prueba (crear desde Gestión de Socios)
```
Email: director@sindicato.cl
Password: director123
RUT: 22222222-2
Nombre: Juan Director
Roles: Socio + Director
```

### Socio Simple (crear desde Gestión de Socios)
```
Email: socio@sindicato.cl
Password: socio123
RUT: 33333333-3
Nombre: María Socio
Roles: Socio
```

## Datos de Ejemplo para Avisos

### Aviso Urgente
```
Título: Suspensión de Actividades - Emergencia
Tipo: Urgente
Contenido:
Estimados socios,

Debido a las condiciones climáticas adversas, informamos la suspensión de todas las actividades programadas para el día de mañana.

La asamblea general será reprogramada para la próxima semana.

Atentamente,
La Directiva
```

### Aviso Asamblea
```
Título: Asamblea General Ordinaria - Marzo 2026
Tipo: Asamblea
Contenido:
Se convoca a todos los socios a la Asamblea General Ordinaria que se realizará:

Fecha: Viernes 15 de Marzo, 2026
Hora: 18:00 hrs
Lugar: Salón de Reuniones del Sindicato

Tabla de temas:
1. Presentación de balance anual
2. Elección de nueva directiva
3. Propuestas de mejoras
4. Varios

La asistencia es obligatoria.
```

### Aviso Informativo
```
Título: Beneficios Disponibles para Socios
Tipo: Informativo
Contenido:
Recordamos a todos los socios que están disponibles los siguientes beneficios:

- Descuentos en farmacias asociadas (15%)
- Convenio dental con Clínica Sonrisas (20% descuento)
- Préstamos de emergencia hasta $500.000
- Fondo de ayuda para estudios hijos de socios

Para más información, revisen la sección de Documentos > Beneficios
```

## Datos de Ejemplo para Documentos

### Categoría: Estatutos
```
Título: Estatutos del Sindicato 2025
Descripción: Estatutos actualizados y aprobados en asamblea general
Archivo: estatutos_2025.pdf
```

### Categoría: Actas
```
Título: Acta Asamblea Enero 2026
Descripción: Acta de la asamblea general ordinaria de enero
Archivo: acta_enero_2026.pdf
```

### Categoría: Beneficios
```
Título: Convenios Vigentes 2026
Descripción: Lista de todos los convenios y beneficios disponibles para socios
Archivo: convenios_2026.pdf
```

## Datos de Ejemplo para Pagos (Administrador puede registrar)

### Socio 1 - Al día
```
Usuario: María Socio (RUT: 33333333-3)
Mes: Enero
Año: 2026
Monto: $15.000
Estado: Pagado
Fecha de Pago: 05/01/2026
```

### Socio 2 - Pendiente
```
Usuario: Juan Director (RUT: 22222222-2)
Mes: Febrero
Año: 2026
Monto: $15.000
Estado: Pendiente
```

### Socio 3 - Atrasado
```
Usuario: Pedro Trabajador (RUT: 44444444-4)
Mes: Diciembre
Año: 2025
Monto: $15.000
Estado: Atrasado
```

## Flujo de Prueba Completo

### 1. Como Administrador
1. Login con credenciales de admin
2. Ir a "Gestión de Socios"
3. Crear 2-3 socios de prueba
4. Asignar rol de Director a uno de ellos
5. Ir a "Avisos" y crear avisos de prueba
6. Ir a "Cuotas" y registrar pagos de ejemplo

### 2. Como Director
1. Logout del admin
2. Login con credenciales de director
3. Verificar acceso a Dashboard
4. Crear un aviso
5. Ver estadísticas de cuotas (sin ver pagos individuales)
6. Verificar que NO tiene acceso a "Gestión de Socios"

### 3. Como Socio
1. Logout del director
2. Login con credenciales de socio
3. Verificar vista limitada (Home, Avisos, Documentos, Perfil)
4. Ver avisos publicados
5. Editar perfil personal
6. Verificar que NO tiene acceso a Dashboard ni gestión

## Scripts SQL para Datos de Prueba

```sql
-- Insertar avisos de prueba (reemplazar USER_ID con el ID del admin)
INSERT INTO avisos (titulo, contenido, tipo, autor_id) VALUES
  (
    'Suspensión de Actividades - Emergencia',
    'Debido a las condiciones climáticas adversas, informamos la suspensión de todas las actividades programadas.',
    'urgente',
    'USER_ID'
  ),
  (
    'Asamblea General Ordinaria - Marzo 2026',
    'Se convoca a todos los socios a la Asamblea General Ordinaria que se realizará el Viernes 15 de Marzo, 2026 a las 18:00 hrs.',
    'asamblea',
    'USER_ID'
  ),
  (
    'Beneficios Disponibles para Socios',
    'Recordamos a todos los socios que están disponibles descuentos en farmacias, convenio dental y préstamos de emergencia.',
    'informativo',
    'USER_ID'
  );

-- Insertar pagos de prueba (reemplazar USER_IDs)
INSERT INTO pagos (user_id, monto, mes, anio, estado, fecha_pago, registrado_por) VALUES
  ('SOCIO_1_ID', 15000, 'Enero', 2026, 'pagado', '2026-01-05', 'ADMIN_ID'),
  ('SOCIO_2_ID', 15000, 'Febrero', 2026, 'pendiente', NULL, 'ADMIN_ID'),
  ('SOCIO_3_ID', 15000, 'Diciembre', 2025, 'atrasado', NULL, 'ADMIN_ID');
```

## Verificación de Funcionalidades

### ✅ Autenticación
- [ ] Login exitoso
- [ ] Logout correcto
- [ ] Recuperar contraseña
- [ ] Sesión persistente después de refresh

### ✅ Roles y Permisos
- [ ] Socio solo ve sus pantallas
- [ ] Director ve panel de gestión
- [ ] Administrador tiene acceso total
- [ ] Redirección correcta según permisos

### ✅ Avisos
- [ ] Ver lista de avisos
- [ ] Director/Admin puede crear avisos
- [ ] Filtrar por tipo
- [ ] Ver detalle de aviso

### ✅ Documentos
- [ ] Ver por categorías
- [ ] Director/Admin puede subir documentos
- [ ] Director/Admin puede eliminar documentos
- [ ] Descargar documentos (solo en producción)

### ✅ Mi Perfil
- [ ] Ver información personal
- [ ] Editar nombre y teléfono
- [ ] Cambiar contraseña
- [ ] Subir foto de perfil (solo en producción)

### ✅ Dashboard (Director/Admin)
- [ ] Ver estadísticas generales
- [ ] Contadores correctos
- [ ] Gráficos de resumen

### ✅ Cuotas (Director/Admin)
- [ ] Ver estadísticas de pagos
- [ ] Admin ve tabla detallada
- [ ] Director NO ve pagos individuales
- [ ] Estados correctos (pagado/pendiente/atrasado)

### ✅ Gestión de Socios (Solo Admin)
- [ ] Crear nuevo socio
- [ ] Editar socio existente
- [ ] Asignar roles
- [ ] Activar/desactivar socios
- [ ] Ver lista completa

---

**Nota**: Recuerda que la carga y descarga de archivos solo funciona en producción, no en el entorno sandbox de E2B.
