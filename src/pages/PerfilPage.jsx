import React, { useState, useEffect } from 'react'
import { Camera, User, Lock, Shield, Bell, BellOff, BellRing } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Alert } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import WhatsAppButton from '../components/ui/WhatsAppButton'
import { useNotifications } from '../hooks/useNotifications'

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-t-lg"
       style={{ backgroundColor: '#1e40af' }}>
    <Icon className="w-4 h-4 text-white" />
    <span className="font-semibold text-white text-sm">{title}</span>
      <WhatsAppButton />
  </div>
)

export default function PerfilPage() {
  const { permission, requestPermission } = useNotifications()
  const { profile, roles, user, refreshProfile } = useAuth()

  const [formData, setFormData] = useState({ nombre: '', telefono: '' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const [savingProfile, setSavingProfile]   = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPhoto, setSavingPhoto]       = useState(false)

  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({ nombre: profile.nombre || '', telefono: profile.telefono || '' })
    }
  }, [profile])

  const clearMessages = () => { setError(''); setSuccess('') }

  /* ── Perfil ── */
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    clearMessages()
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nombre: formData.nombre, telefono: formData.telefono })
        .eq('id', user.id)
      if (error) {
        setError('Error al actualizar el perfil: ' + error.message)
      } else {
        setSuccess('Perfil actualizado correctamente')
        // Recargar perfil en contexto sin cerrar sesión
        if (refreshProfile) await refreshProfile()
      }
    } catch (err) {
      setError('Error inesperado al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  /* ── Contraseña ── */
  const handlePasswordUpdate = async (e) => {
    e.preventDefault(); clearMessages()

    // Validar contraseña actual ingresada
    if (!passwordData.currentPassword) {
      setError('Debes ingresar tu contraseña actual'); return
    }

    // Validar longitud mínima
    if (passwordData.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres'); return
    }

    // Validar que coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden'); return
    }

    // Validar que la nueva sea distinta a la actual
    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('La nueva contraseña debe ser distinta a la actual'); return
    }

    setSavingPassword(true)
    try {
      // Verificar contraseña actual reautenticando
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      })
      if (reAuthError) {
        setError('La contraseña actual es incorrecta')
        setSavingPassword(false)
        return
      }

      // Actualizar contraseña y cerrar todas las otras sesiones
      const { error } = await supabase.auth.updateUser(
        { password: passwordData.newPassword },
        { emailRedirectTo: null }
      )

      if (error) {
        setError('Error al cambiar la contraseña: ' + error.message)
      } else {
        // Enviar email informativo via Edge Function (no bloqueante)
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-password-change`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ email: user.email, nombre: profile?.nombre }),
            })
          }
        } catch (emailErr) {
          console.warn('[AUTH] No se pudo enviar email informativo:', emailErr)
        }

        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setSuccess('Contraseña actualizada correctamente. Se ha enviado un email de confirmación.')
      }
    } catch (err) {
      setError('Error inesperado al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  /* ── Foto ── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return

    // Validar MIME type real (no solo la extensión)
    const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const EXT_PERMITIDAS  = ['jpg', 'jpeg', 'png', 'webp', 'gif']

    if (!MIME_PERMITIDOS.includes(file.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, WEBP o GIF)')
      return
    }

    const ext = file.name.split('.').pop().toLowerCase()
    if (!EXT_PERMITIDAS.includes(ext)) {
      setError('Extensión de archivo no permitida. Usa JPG, PNG, WEBP o GIF')
      return
    }

    // Validar tamaño máximo (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar los 2MB')
      return
    }

    clearMessages(); setSavingPhoto(true)
    const path = `${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type
    })
    if (uploadError) { setError('Error al subir la foto'); setSavingPhoto(false); return }
    const { error: updateError } = await supabase.from('profiles').update({ foto_url: path }).eq('id', user.id)
    if (updateError) { setError('Error al guardar la foto') }
    else { setSuccess('Foto actualizada correctamente'); refreshProfile?.().catch(() => {}) }
    setSavingPhoto(false)
  }

  const getInitials = (nombre) =>
    nombre ? nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'

  const getRoleLabel = (r) =>
    r === 'administrador' ? 'Administrador' : r === 'director' ? 'Director' : 'Socio'

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Título ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg"
           style={{ backgroundColor: '#1e40af' }}>
        <User className="w-5 h-5 text-white" />
        <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
      </div>

      {error   && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert>{success}</Alert>}

      {/* ── Foto ── */}
      <div className="rounded-lg border overflow-hidden">
        <SectionHeader icon={Camera} title="Foto de Perfil" />
        <div className="p-5 flex items-center gap-6" style={{ backgroundColor: '#eff6ff' }}>
          <Avatar className="w-20 h-20 border-2" style={{ borderColor: '#1e40af' }}>
            <AvatarImage
              src={
                profile?.foto_url
                  ? supabase.storage.from('avatars').getPublicUrl(profile.foto_url).data.publicUrl
                  : undefined
              }
            />
            <AvatarFallback style={{ backgroundColor: '#3b82f6', color: '#1e3a8a', fontSize: 22, fontWeight: 700 }}>
              {getInitials(profile?.nombre)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm mb-1">{profile?.nombre}</p>
            <div className="flex gap-1 flex-wrap mb-3">
              {roles.map(r => (
                <Badge key={r} style={{ backgroundColor: '#1e40af', color: 'white' }}>
                  {getRoleLabel(r)}
                </Badge>
              ))}
            </div>
            <Label htmlFor="photo" className="cursor-pointer">
              <Button disabled={savingPhoto} asChild size="sm"
                      style={{ backgroundColor: '#1e40af', color: 'white' }}>
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  {savingPhoto ? 'Subiendo...' : 'Cambiar Foto'}
                </span>
              </Button>
            </Label>
            <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>
      </div>

      {/* ── Datos personales ── */}
      <div className="rounded-lg border overflow-hidden">
        <SectionHeader icon={User} title="Datos Personales" />
        <div className="p-5" style={{ backgroundColor: '#eff6ff' }}>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+56912345678"
              />
            </div>
            <Button disabled={savingProfile} style={{ backgroundColor: '#1e40af', color: 'white' }}>
              {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </div>
      </div>

      {/* ── Cambiar contraseña ── */}
      <div className="rounded-lg border overflow-hidden">
        <SectionHeader icon={Lock} title="Cambiar Contraseña" />
        <div className="p-5" style={{ backgroundColor: '#eff6ff' }}>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <Label>Contraseña actual</Label>
              <Input
                type="password"
                placeholder="Ingresa tu contraseña actual"
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <Label>Nueva contraseña</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>
            <div>
              <Label>Confirmar nueva contraseña</Label>
              <Input
                type="password"
                placeholder="Repite la nueva contraseña"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
            <Button disabled={savingPassword} style={{ backgroundColor: '#1e40af', color: 'white' }}>
              {savingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        </div>
      </div>

      {/* ── Notificaciones ── */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#1e40af' }}>
          <Bell className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Notificaciones Push</span>
        </div>
        <div className="p-5" style={{ backgroundColor: '#eff6ff' }}>
          {permission === 'granted' ? (
            <div className="flex items-center gap-3">
              <BellRing className="w-5 h-5" style={{ color: '#1e40af' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1e40af' }}>Notificaciones activadas</p>
                <p className="text-xs text-muted-foreground">Recibirás avisos del sindicato en tu dispositivo</p>
              </div>
            </div>
          ) : permission === 'denied' ? (
            <div className="flex items-center gap-3">
              <BellOff className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-500">Notificaciones bloqueadas</p>
                <p className="text-xs text-muted-foreground">Ve a la configuración de tu navegador y permite las notificaciones para este sitio</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Activa las notificaciones para recibir avisos del sindicato directamente en tu dispositivo.</p>
              <Button onClick={requestPermission} style={{ backgroundColor: '#1e40af', color: 'white' }}>
                <Bell className="w-4 h-4 mr-2" />
                Activar Notificaciones
              </Button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
