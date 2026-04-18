import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({
  children,
  allowAdmin = false,
  allowDirector = false,
}) {
  const { user, loading, isAdministrador, isDirector } = useAuth()

  // ⏳ Esperar auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando…</p>
      </div>
    )
  }

  // 🔒 No logueado
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 🔐 Validación por rol
  if (allowAdmin && !isAdministrador) {
    return <Navigate to="/" replace />
  }

  if (allowDirector && !(isAdministrador || isDirector)) {
    return <Navigate to="/" replace />
  }

  return children
}
