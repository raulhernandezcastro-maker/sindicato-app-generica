import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card'
import { Alert } from '../ui/alert'
import { supabase } from '../../lib/supabase'

export function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      setError('Error enviando el correo')
    } else {
      setMessage('Correo enviado')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}
          {message && <Alert>{message}</Alert>}

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <Button className="w-full">Enviar</Button>
        </form>
      </CardContent>

      <CardFooter>
        <Button variant="link" onClick={onBack}>
          Volver
        </Button>
      </CardFooter>
    </Card>
  )
}
