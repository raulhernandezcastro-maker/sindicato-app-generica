import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'

export default function ConfirmarCuotas({ onFinish }) {
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [resultado, setResultado] = useState(null)
  const ejecutandoRef = React.useRef(false)

  const confirmarCuotas = async () => {
    if (ejecutandoRef.current) return
    ejecutandoRef.current = true

    setLoading(true)
    setError('')
    setSuccess('')
    setResultado(null)

    try {
      const { data: filas, error } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .in('estado', ['pendiente', 'sin_socio'])
        .eq('estado_validacion', 'ok')

      if (error) throw error

      if (!filas || filas.length === 0) {
        setSuccess('No hay cuotas para confirmar')
        setLoading(false)
        return
      }

      const confirmadas   = []
      const sinSocio      = []
      const tipoInvalido  = []
      const errores       = []

      for (const fila of filas) {
        try {
          // 1. Buscar perfil por RUT
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('rut', fila.rut)
            .single()

          if (!profile) {
            sinSocio.push({ rut: fila.rut, nombre: fila.nombre })
            await supabase
              .from('cuotas_importacion')
              .update({
                estado: 'sin_socio',
                observacion: 'Usuario no encontrado. Crear el usuario y volver a confirmar.'
              })
              .eq('id', fila.id)
            continue
          }

          // 2. Obtener roles del usuario en el sistema
          const { data: rolesData } = await supabase
            .from('roles')
            .select('role_name')
            .eq('user_id', profile.id)

          const rolesDelSistema = (rolesData || []).map(r => r.role_name)

          // 3. Validar que el tipo del archivo coincida con el rol del sistema
          // Archivo SOCIO → sistema debe tener rol 'socio' o 'director'
          // Archivo APORTANTE → sistema debe tener rol 'aportante'
          const tipoArchivo = (fila.tipo || '').toUpperCase()
          let tipoValido = false

          if (tipoArchivo === 'SOCIO') {
            tipoValido = rolesDelSistema.includes('socio') || rolesDelSistema.includes('director')
          } else if (tipoArchivo === 'APORTANTE') {
            tipoValido = rolesDelSistema.includes('aportante')
          }

          if (!tipoValido) {
            const rolSistema = rolesDelSistema.join(', ') || 'sin rol'
            tipoInvalido.push({
              rut: fila.rut,
              nombre: fila.nombre,
              tipoArchivo,
              rolSistema,
            })
            await supabase
              .from('cuotas_importacion')
              .update({
                estado: 'pendiente',
                observacion: `Tipo no coincide: archivo dice "${tipoArchivo}" pero el sistema tiene rol "${rolSistema}". Revisar y corregir.`
              })
              .eq('id', fila.id)
            continue
          }

          // 4. Confirmar la cuota
          const { error: updateError } = await supabase
            .from('cuotas_importacion')
            .update({
              estado: 'confirmado',
              profile_id: profile.id,
              observacion: null
            })
            .eq('id', fila.id)

          if (updateError) throw updateError

          confirmadas.push({ rut: fila.rut, nombre: fila.nombre })

        } catch (err) {
          errores.push({ rut: fila.rut, error: err.message })
          await supabase
            .from('cuotas_importacion')
            .update({ estado: 'error', observacion: err.message })
            .eq('id', fila.id)
        }
      }

      setResultado({ confirmadas, sinSocio, tipoInvalido, errores })

      if (confirmadas.length > 0) {
        setSuccess(`✅ ${confirmadas.length} cuota(s) confirmada(s) correctamente`)
      }
      if (sinSocio.length > 0 || tipoInvalido.length > 0 || errores.length > 0) {
        const total = sinSocio.length + tipoInvalido.length + errores.length
        setError(`⚠️ ${total} cuota(s) quedaron pendientes. Revisa el detalle abajo.`)
      }

      if (onFinish) onFinish()

    } catch (err) {
      console.error(err)
      setError('Error al confirmar cuotas: ' + err.message)
    } finally {
      setLoading(false)
      ejecutandoRef.current = false
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmar cuotas importadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && <Alert>{success}</Alert>}
        {error   && <Alert variant="destructive">{error}</Alert>}

        {/* Sin socio */}
        {resultado?.sinSocio?.length > 0 && (
          <div className="text-sm border rounded p-3 bg-yellow-50 text-yellow-800">
            <p className="font-semibold mb-1">⚠️ Usuario no encontrado en el sistema ({resultado.sinSocio.length}):</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {resultado.sinSocio.map((s, i) => (
                <li key={i}>{s.nombre} — RUT: {s.rut}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs">Crea el usuario en Gestión de Socios y vuelve a confirmar.</p>
          </div>
        )}

        {/* Tipo no coincide */}
        {resultado?.tipoInvalido?.length > 0 && (
          <div className="text-sm border rounded p-3 bg-orange-50 text-orange-800">
            <p className="font-semibold mb-1">⚠️ Tipo no coincide con el sistema ({resultado.tipoInvalido.length}):</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {resultado.tipoInvalido.map((s, i) => (
                <li key={i}>
                  {s.nombre} — RUT: {s.rut}
                  <span className="ml-1 text-xs">
                    (Archivo: <strong>{s.tipoArchivo}</strong> / Sistema: <strong>{s.rolSistema}</strong>)
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">Corrige el tipo en el Excel o el rol del usuario en Gestión de Socios y vuelve a confirmar.</p>
          </div>
        )}

        {/* Errores técnicos */}
        {resultado?.errores?.length > 0 && (
          <div className="text-sm border rounded p-3 bg-red-50 text-red-800">
            <p className="font-semibold mb-1">❌ Errores técnicos ({resultado.errores.length}):</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {resultado.errores.map((s, i) => (
                <li key={i}>{s.rut} — {s.error}</li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={confirmarCuotas} disabled={loading}
                style={{ backgroundColor: '#1e40af', color: 'white' }}>
          {loading ? 'Confirmando...' : 'Confirmar cuotas pendientes'}
        </Button>
      </CardContent>
    </Card>
  )
}
