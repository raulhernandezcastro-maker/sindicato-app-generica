import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert } from '../ui/alert'
import { useAuth } from '../../contexts/AuthContext'

export function LoginForm({ onForgotPassword }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      const msg = err.message?.includes('dada de baja')
        ? err.message
        : 'Credenciales incorrectas. Verifica tu email y contraseña.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden">

      {/* Cabecera verde */}
      <div className="px-6 py-4" style={{ backgroundColor: '#1e40af' }}>
        <h3 className="text-white text-lg font-bold text-center">Iniciar Sesión</h3>
      </div>

      {/* Formulario */}
      <div className="px-6 py-6 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        <div>
          <Label className="text-sm font-semibold" style={{ color: '#1e40af' }}>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="mt-1 focus:ring-2"
            style={{ borderColor: '#1e40af' }}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold" style={{ color: '#1e40af' }}>Contraseña</Label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="mt-1"
            style={{ borderColor: '#1e40af' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#1e40af' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className="text-center pt-1">
          <button
            onClick={onForgotPassword}
            className="text-sm underline"
            style={{ color: '#1e40af' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  )
}
