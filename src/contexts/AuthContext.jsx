import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(true)

  const initialized  = useRef(false)
  const signingOut   = useRef(false)   // ← bandera para ignorar eventos durante signOut

  useEffect(() => {
    let isMounted = true

    const clearAuth = () => {
      if (!isMounted) return
      setUser(null)
      setProfile(null)
      setRoles([])
    }

    const loadUserData = async (userId) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('*').eq('id', userId).single()
        if (profileError) throw profileError

        // Si el usuario está inactivo, cerrar sesión inmediatamente
        if (profileData?.estado === 'inactivo') {
          console.warn('[AUTH] Usuario inactivo, cerrando sesión')
          await supabase.auth.signOut()
          if (isMounted) {
            setUser(null)
            setProfile(null)
            setRoles([])
          }
          return
        }

        if (isMounted) setProfile(profileData)

        // Registrar último acceso (sin esperar respuesta para no bloquear)
        supabase.from('profiles')
          .update({ ultimo_acceso: new Date().toISOString() })
          .eq('id', userId)
          .then(() => {})
          .catch(() => {})

        const { data: rolesData, error: rolesError } = await supabase
          .from('roles').select('role_name').eq('user_id', userId)
        if (rolesError) throw rolesError

        const roleNames = (rolesData || []).map(r => r.role_name)
        if (isMounted) setRoles(roleNames)
      } catch (err) {
        console.error('[AUTH] Error loading profile/roles:', err)
        clearAuth()
      }
    }

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        if (data?.session?.user) {
          setUser(data.session.user)
          await loadUserData(data.session.user.id)
        } else {
          clearAuth()
        }
      } catch (err) {
        console.error('[AUTH] Init error:', err)
        clearAuth()
      } finally {
        if (isMounted) setLoading(false)
        initialized.current = true
      }
    }

    init()

    // Cuando el usuario vuelve a la pestaña, verificar sesión
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data } = await supabase.auth.getSession()
        if (data?.session?.user) {
          setUser(data.session.user)
          // Registrar último acceso al volver a la app
          supabase.from('profiles')
            .update({ ultimo_acceso: new Date().toISOString() })
            .eq('id', data.session.user.id)
            .then(() => {})
            .catch(() => {})
        } else {
          setUser(null)
          setProfile(null)
          setRoles([])
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Ignorar eventos si aún no inicializó o si estamos en signOut
        if (!initialized.current || signingOut.current) return

        if (session?.user) {
          // Verificar estado ANTES de setear user para evitar redirect a /
          const { data: profileCheck } = await supabase
            .from('profiles').select('estado').eq('id', session.user.id).single()

          if (profileCheck?.estado === 'inactivo') {
            // No setear user — ignorar este evento de auth
            return
          }

          setUser(session.user)
          await loadUserData(session.user.id)
        } else {
          clearAuth()
        }

        if (isMounted) setLoading(false)
      }
    )

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const isAdministrador = roles.includes('administrador')
  const isDirector      = roles.includes('director')
  const isSocio         = roles.includes('socio')

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Verificar que el usuario no esté dado de baja
    const { data: profileData } = await supabase
      .from('profiles').select('estado').eq('id', data.user.id).single()

    if (profileData?.estado === 'inactivo') {
      // Hacer signOut silencioso — onAuthStateChange lo ignorará
      // porque el perfil está inactivo y no seteará user
      await supabase.auth.signOut()
      throw new Error('Tu cuenta ha sido dada de baja. Contacta al administrador del sindicato.')
    }

    return data
  }

  const signOut = async () => {
    signingOut.current = true
    setUser(null)
    setProfile(null)
    setRoles([])
    await supabase.auth.signOut()
    signingOut.current = false
  }

  const refreshProfile = async () => {
    if (!user?.id) return
    try {
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (profileData) setProfile(profileData)

      const { data: rolesData } = await supabase
        .from('roles').select('role_name').eq('user_id', user.id)
      if (rolesData) setRoles(rolesData.map(r => r.role_name))
    } catch (err) {
      console.error('[AUTH] refreshProfile error:', err)
    }
  }

  const value = {
    user, profile, roles, loading,
    signIn, signOut, refreshProfile,
    isAdministrador, isDirector, isSocio
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
