import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'
import { Search, Users, Pencil, Plus, Phone } from 'lucide-react'

const normalizarRut = (rut) =>
  String(rut || '').replace(/\./g, '').replace(/-/g, '').trim().toLowerCase()

const EMPTY_FORM = { nombre: '', email: '', rut: '', password: '', telefono: '', roles: ['socio'] }

const formatFecha = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export default function SociosPage() {
  const { isAdministrador } = useAuth()
  const [socios, setSocios]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [busqueda, setBusqueda]       = useState('')

  // Crear
  const [openCrear, setOpenCrear]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [form, setForm]               = useState(EMPTY_FORM)

  // Editar
  const [openEditar, setOpenEditar]   = useState(false)
  const [editForm, setEditForm]       = useState({})
  const [savingEdit, setSavingEdit]   = useState(false)
  const [errorEdit, setErrorEdit]     = useState('')

  // Baja / reactivar
  const [socioSeleccionado, setSocioSeleccionado] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [togglingId, setTogglingId]   = useState(null)

  useEffect(() => { loadSocios() }, [])

  const loadSocios = async () => {
    setLoading(true)
    const { data: profiles } = await supabase.from('profiles_with_activity').select('id, nombre, email, rut, estado, telefono, created_at, fecha_baja, last_sign_in_at, ultimo_acceso')
    const { data: roles }    = await supabase.from('roles').select('user_id, role_name')
    const joined = (profiles || []).map(p => ({
      ...p,
      roles: (roles || []).filter(r => r.user_id === p.id).map(r => r.role_name),
      telefono: p.telefono || ''
    }))
    joined.sort((a, b) => {
      if (a.estado === b.estado) return (a.nombre || '').localeCompare(b.nombre || '')
      return a.estado === 'activo' ? -1 : 1
    })
    setSocios(joined)
    setLoading(false)
  }

  /* ── CREAR ── */
  const toggleRole = (role) => {
    setForm(prev => {
      let newRoles = [...prev.roles]
      if (newRoles.includes(role)) {
        // No desmarcar si es el único rol
        if (newRoles.length === 1) return prev
        newRoles = newRoles.filter(r => r !== role)
      } else {
        // Socio y Aportante son mutuamente excluyentes
        if (role === 'aportante') newRoles = newRoles.filter(r => r !== 'socio')
        if (role === 'socio')     newRoles = newRoles.filter(r => r !== 'aportante')
        newRoles.push(role)
      }
      return { ...prev, roles: newRoles }
    })
  }

  const validateForm = () => {
    if (!form.nombre.trim())  return 'El nombre es obligatorio'
    if (!form.email.trim())   return 'El email es obligatorio'
    if (!form.rut.trim())     return 'El RUT es obligatorio'
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    return null
  }

  const handleCreateSocio = async () => {
    setError('')
    const err = validateForm()
    if (err) { setError(err); return }
    setSaving(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY
      const res  = await fetch(`${supabaseUrl}/functions/v1/bright-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: form.nombre, email: form.email, rut: normalizarRut(form.rut), password: form.password, telefono: form.telefono, roles: form.roles })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setOpenCrear(false)
      setForm(EMPTY_FORM)
      await loadSocios()
    } catch (err) {
      setError(err.message || 'Error creando socio. Verifica que el RUT y email no estén duplicados.')
    } finally {
      setSaving(false)
    }
  }

  /* ── EDITAR ── */
  const abrirEditar = (socio) => {
    setErrorEdit('')
    setEditForm({
      id:     socio.id,
      nombre:   socio.nombre   || '',
      email:    socio.email    || '',
      rut:      socio.rut      || '',
      telefono: socio.telefono || '',
      roles:    [...socio.roles],
      newPassword: '',
    })
    setOpenEditar(true)
  }

  const toggleRoleEdit = (role) => {
    setEditForm(prev => {
      let newRoles = [...(prev.roles || [])]
      if (newRoles.includes(role)) {
        if (newRoles.length === 1) return prev
        newRoles = newRoles.filter(r => r !== role)
      } else {
        if (role === 'aportante') newRoles = newRoles.filter(r => r !== 'socio')
        if (role === 'socio')     newRoles = newRoles.filter(r => r !== 'aportante')
        newRoles.push(role)
      }
      return { ...prev, roles: newRoles }
    })
  }

  const handleGuardarEdicion = async () => {
    setErrorEdit('')
    if (!editForm.nombre.trim()) { setErrorEdit('El nombre es obligatorio'); return }
    if (!editForm.email.trim())  { setErrorEdit('El email es obligatorio'); return }
    if (editForm.newPassword && editForm.newPassword.length < 6) { setErrorEdit('La contraseña debe tener al menos 6 caracteres'); return }
    setSavingEdit(true)
    try {
      // 1. Actualizar profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ nombre: editForm.nombre, rut: normalizarRut(editForm.rut), telefono: editForm.telefono })
        .eq('id', editForm.id)
      if (profileErr) throw profileErr

      // 2. Actualizar roles: borrar los actuales y reinsertar
      await supabase.from('roles').delete().eq('user_id', editForm.id)
      const rolesInsert = editForm.roles.map(r => ({ user_id: editForm.id, role_name: r }))
      await supabase.from('roles').insert(rolesInsert)

      // 3. Cambiar contraseña si se ingresó una nueva (requiere Edge Function o admin API)
      // Se omite por ahora ya que requiere privilegios de servicio

      setSocios(prev => prev.map(s =>
        s.id === editForm.id ? { ...s, nombre: editForm.nombre, rut: normalizarRut(editForm.rut), roles: editForm.roles } : s
      ))
      setOpenEditar(false)
    } catch (err) {
      setErrorEdit(err.message || 'Error al guardar cambios')
    } finally {
      setSavingEdit(false)
    }
  }

  /* ── BAJA / REACTIVAR ── */
  const pedirConfirmacion = (socio) => { setSocioSeleccionado(socio); setConfirmOpen(true) }

  const handleToggleEstado = async () => {
    if (!socioSeleccionado) return
    const nuevoEstado = socioSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
    const idSocio = socioSeleccionado.id

    setTogglingId(idSocio)
    setConfirmOpen(false)
    setSocioSeleccionado(null)

    try {
      const updateData = { estado: nuevoEstado }
      if (nuevoEstado === 'inactivo') {
        updateData.fecha_baja = new Date().toISOString()
      } else {
        updateData.fecha_baja = null
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', idSocio)

      if (error) {
        console.error('Error cambiando estado:', error)
        alert(`Error al cambiar el estado: ${error.message}`)
      } else {
        // Forzar recarga limpia desde Supabase
        const { data: profiles } = await supabase
          .from('profiles_with_activity')
          .select('id, nombre, email, rut, estado, telefono, created_at, fecha_baja, last_sign_in_at, ultimo_acceso')
        const { data: roles } = await supabase
          .from('roles')
          .select('user_id, role_name')
        const joined = (profiles || []).map(p => ({
          ...p,
          roles: (roles || []).filter(r => r.user_id === p.id).map(r => r.role_name),
          telefono: p.telefono || ''
        }))
        joined.sort((a, b) => {
          if (a.estado === b.estado) return (a.nombre || '').localeCompare(b.nombre || '')
          return a.estado === 'activo' ? -1 : 1
        })
        setSocios([...joined])
      }
    } catch (err) {
      console.error('Error inesperado:', err)
      alert(`Error inesperado: ${err.message}`)
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) return <Spinner />

  const sociosFiltrados = busqueda.trim()
    ? socios.filter(s => {
        const q = busqueda.toLowerCase().trim()
        return (s.nombre?.toLowerCase().includes(q)) || (s.rut?.toLowerCase().includes(q))
      })
    : socios

  return (
    <div className="max-w-6xl mx-auto space-y-4">

      {/* Título */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ backgroundColor: '#1e40af' }}>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">Gestión de Socios</h1>
            <p className="text-xs text-blue-100">
              {socios.filter(s => s.estado === 'activo' && s.roles.includes('socio') && !s.roles.includes('director') && !s.roles.includes('administrador')).length} socios
              {' · '}
              {socios.filter(s => s.estado === 'activo' && s.roles.includes('aportante')).length} aportantes
              {' · '}
              {socios.filter(s => s.estado === 'activo' && s.roles.includes('director')).length} directores
              {' · '}
              {socios.filter(s => s.estado === 'activo' && s.roles.includes('administrador')).length} administrador{socios.filter(s => s.estado === 'activo' && s.roles.includes('administrador')).length !== 1 ? 'es' : ''}
              {socios.filter(s => s.estado === 'inactivo').length > 0 && (
                <span style={{ color: '#fca5a5' }}>
                  {' · '}
                  {socios.filter(s => s.estado === 'inactivo').length} dados de baja
                </span>
              )}
            </p>
          </div>
        </div>
        {isAdministrador && (
          <Button size="sm" onClick={() => { setError(''); setOpenCrear(true) }}
                  style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo Socio
          </Button>
        )}
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-white shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="text-xs text-muted-foreground hover:text-foreground">
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Lista de socios con scroll */}
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '65vh' }}>
        {sociosFiltrados.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {busqueda ? `No se encontraron socios para "${busqueda}"` : 'No hay socios registrados'}
          </div>
        ) : (
          sociosFiltrados.map(s => (
            <div key={s.id}
              className="rounded-lg border bg-white shadow-sm overflow-hidden"
              style={{ opacity: s.estado === 'inactivo' ? 0.55 : 1 }}>
              {/* Franja superior con nombre y badges */}
              <div className="flex items-center justify-between px-4 py-2"
                   style={{ backgroundColor: '#eff6ff' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm truncate" style={{ color: '#1a1a1a' }}>
                    {s.nombre}
                  </span>
                  {s.roles.map(r => (
                    <Badge key={r} style={{ backgroundColor: '#1e40af', color: 'white', fontSize: '10px' }}>{r}</Badge>
                  ))}
                </div>
                <Badge style={{
                  backgroundColor: s.estado === 'activo' ? '#dbeafe' : '#fde8e8',
                  color: s.estado === 'activo' ? '#1e40af' : '#c0392b',
                  fontSize: '10px', flexShrink: 0
                }}>
                  {s.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              {/* Datos y acciones */}
              <div className="flex items-center justify-between px-4 py-2 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-0.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground truncate">📧 {s.email}</span>
                  <span className="text-xs text-muted-foreground">🪪 {s.rut}</span>
                  <span className="text-xs text-muted-foreground">
                    <Phone className="w-3 h-3 inline mr-1" style={{ color: '#1e40af' }} />
                    {s.telefono || <span className="italic text-gray-300">Sin teléfono</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    📅 Alta: <span style={{ color: '#1e40af' }}>{formatFecha(s.created_at)}</span>
                  </span>
                  {s.estado === 'inactivo' && s.fecha_baja && (
                    <span className="text-xs text-muted-foreground">
                      🔴 Baja: <span style={{ color: '#c0392b' }}>{formatFecha(s.fecha_baja)}</span>
                    </span>
                  )}
                  {isAdministrador && s.estado === 'activo' && (
                    <span className="text-xs text-muted-foreground">
                      🔑 Último login: <span style={{ color: '#1e40af' }}>
                        {s.last_sign_in_at ? formatFecha(s.last_sign_in_at) : 'Sin acceso aún'}
                      </span>
                    </span>
                  )}
                  {isAdministrador && s.estado === 'activo' && (
                    <span className="text-xs text-muted-foreground">
                      🟢 Última visita: <span style={{ color: '#1e40af' }}>
                        {s.ultimo_acceso ? formatFecha(s.ultimo_acceso) : 'Sin visitas aún'}
                      </span>
                    </span>
                  )}
                </div>
                {isAdministrador && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => abrirEditar(s)}
                            className="h-7 px-2" title="Editar socio">
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm"
                            disabled={togglingId === s.id}
                            onClick={() => pedirConfirmacion(s)}
                            className="h-7 px-2 text-xs"
                            style={{ color: s.estado === 'activo' ? '#c0392b' : '#1e40af' }}>
                      {s.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Diálogo CREAR ── */}
      <Dialog open={openCrear} onOpenChange={v => { if (!v) { setOpenCrear(false); setError(''); setForm(EMPTY_FORM) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Socio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
            <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" /></div>
            <div><Label>RUT * (sin puntos, con guión)</Label><Input value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} placeholder="12345678-9" /></div>
            <div><Label>Teléfono (ej: +56912345678)</Label><Input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+56912345678" /></div>
            <div><Label>Contraseña * (mín. 6 caracteres)</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label>Roles</Label>
              <div className="space-y-2 mt-2">
                {['socio', 'aportante', 'director', 'administrador'].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox checked={form.roles.includes(r)} onCheckedChange={() => toggleRole(r)} />
                    <span className="capitalize text-sm">{r}</span>
                    
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleCreateSocio} disabled={saving} className="w-full" style={{ backgroundColor: '#1e40af', color: 'white' }}>
              {saving ? 'Creando…' : 'Crear Socio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Diálogo EDITAR ── */}
      <Dialog open={openEditar} onOpenChange={v => { if (!v) setOpenEditar(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Socio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {errorEdit && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errorEdit}</p>}
            <div><Label>Nombre *</Label><Input value={editForm.nombre || ''} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} /></div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email || ''} disabled className="bg-gray-50 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">El email no puede modificarse desde aquí</p>
            </div>
            <div><Label>RUT</Label><Input value={editForm.rut || ''} onChange={e => setEditForm({ ...editForm, rut: e.target.value })} placeholder="12345678-9" /></div>
            <div><Label>Teléfono</Label><Input type="tel" value={editForm.telefono || ''} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} placeholder="+56912345678" /></div>
            <div>
              <Label>Roles</Label>
              <div className="space-y-2 mt-2">
                {['socio', 'aportante', 'director', 'administrador'].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox checked={(editForm.roles || []).includes(r)} onCheckedChange={() => toggleRoleEdit(r)} />
                    <span className="capitalize text-sm">{r}</span>
                    
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleGuardarEdicion} disabled={savingEdit} className="w-full" style={{ backgroundColor: '#1e40af', color: 'white' }}>
              {savingEdit ? 'Guardando…' : 'Guardar Cambios'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Diálogo confirmar baja/reactivación ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {socioSeleccionado?.estado === 'activo' ? '¿Dar de baja a este socio?' : '¿Reactivar a este socio?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {socioSeleccionado?.estado === 'activo'
                ? `${socioSeleccionado?.nombre} quedará como Inactivo. Sus datos se conservarán.`
                : `${socioSeleccionado?.nombre} volverá a estar Activo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSocioSeleccionado(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleEstado} style={{ backgroundColor: '#1e40af' }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
