import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function RequireRole({ allow = [], children }) {
  const { user, roles, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const hasPermission = allow.some(r => roles.includes(r))

  if (!hasPermission) {
    return <Navigate to="/" replace />
  }

  return children
}
