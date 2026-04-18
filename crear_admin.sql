-- Script para crear el primer usuario administrador
-- IMPORTANTE: Este script debe ejecutarse DESPUÉS de crear el usuario en Supabase Auth

-- Paso 1: Ve al panel de Supabase > Authentication > Users
-- Paso 2: Crea un nuevo usuario con:
--   - Email: admin@sindicato.cl
--   - Password: admin123456 (o la que prefieras)
-- Paso 3: Copia el ID del usuario creado
-- Paso 4: Reemplaza 'USER_ID_AQUI' en este script con el ID real
-- Paso 5: Ejecuta este script en el SQL Editor de Supabase

-- Crear perfil del administrador
INSERT INTO profiles (id, rut, nombre, email, telefono, estado)
VALUES (
  'USER_ID_AQUI',
  '11111111-1',
  'Administrador Principal',
  'admin@sindicato.cl',
  '+56912345678',
  'activo'
);

-- Asignar roles de socio y administrador
INSERT INTO roles (user_id, role_name)
VALUES
  ('USER_ID_AQUI', 'socio'),
  ('USER_ID_AQUI', 'administrador');

-- Verificar que se creó correctamente
SELECT
  p.rut,
  p.nombre,
  p.email,
  p.estado,
  array_agg(r.role_name) as roles
FROM profiles p
LEFT JOIN roles r ON p.id = r.user_id
WHERE p.id = 'USER_ID_AQUI'
GROUP BY p.id, p.rut, p.nombre, p.email, p.estado;

-- Si necesitas crear más usuarios administradores, repite el proceso
-- o usa la interfaz de "Gestión de Socios" desde la aplicación
