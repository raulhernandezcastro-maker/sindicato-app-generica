import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function RoleRoute({ allow, children }) {
  const { roles, loading } = useAuth()

  if (loading) return null

  const hasAccess = roles?.some(r => allow.includes(r))

  if (!hasAccess) {
    return <Navigate to="/" replace />
  }

  return children
}

