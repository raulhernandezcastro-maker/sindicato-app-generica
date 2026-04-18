# Instrucciones para Configurar el Primer Usuario Administrador

## Opción 1: Crear el primer usuario desde código

Puedes usar este código en un script temporal o en la consola del navegador:

```javascript
// Ejecuta esto en la consola del navegador en /login
import { supabase } from './src/lib/supabase';

// 1. Crear usuario de autenticación
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'admin@sindicato.cl',
  password: 'admin123456'
});

if (authError) {
  console.error('Error creando usuario:', authError);
} else {
  console.log('Usuario creado:', authData.user.id);

  // 2. Crear perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      rut: '11111111-1',
      nombre: 'Administrador Principal',
      email: 'admin@sindicato.cl',
      estado: 'activo'
    });

  if (profileError) {
    console.error('Error creando perfil:', profileError);
  }

  // 3. Asignar rol de administrador
  const { error: roleError } = await supabase
    .from('roles')
    .insert([
      { user_id: authData.user.id, role_name: 'socio' },
      { user_id: authData.user.id, role_name: 'administrador' }
    ]);

  if (roleError) {
    console.error('Error asignando roles:', roleError);
  } else {
    console.log('¡Administrador creado exitosamente!');
  }
}
```

## Opción 2: SQL directo (ejecuta en la consola SQL de Supabase)

```sql
-- Nota: Primero debes crear el usuario en Authentication > Users en el panel de Supabase
-- Luego reemplaza 'USER_ID_AQUI' con el ID del usuario creado

-- Crear perfil
INSERT INTO profiles (id, rut, nombre, email, estado)
VALUES ('USER_ID_AQUI', '11111111-1', 'Administrador Principal', 'admin@sindicato.cl', 'activo');

-- Asignar roles
INSERT INTO roles (user_id, role_name)
VALUES
  ('USER_ID_AQUI', 'socio'),
  ('USER_ID_AQUI', 'administrador');
```

## Credenciales por defecto sugeridas

- Email: admin@sindicato.cl
- Contraseña: admin123456 (CAMBIAR DESPUÉS DEL PRIMER LOGIN)
- RUT: 11111111-1
- Nombre: Administrador Principal

## Siguientes pasos

1. Inicia sesión con las credenciales del administrador
2. Ve a "Gestión de Socios" para crear más usuarios
3. Cambia la contraseña del administrador desde "Mi Perfil"
4. Crea los primeros avisos y documentos para probar el sistema

## Estructura de Roles

- **Socio**: Rol base, todos los usuarios deben tenerlo
- **Director**: Puede gestionar avisos, documentos y ver estadísticas de cuotas
- **Administrador**: Acceso total, puede crear usuarios y gestionar todo el sistema

Los usuarios pueden tener múltiples roles simultáneamente.
