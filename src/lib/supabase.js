import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,       // Renueva el token automáticamente antes de que expire
    persistSession: true,         // Mantiene la sesión en localStorage
    detectSessionInUrl: true,     // Detecta sesión al volver desde links de email
  },
  global: {
    headers: { 'x-application-name': 'mi-sindicato' }
  }
})
