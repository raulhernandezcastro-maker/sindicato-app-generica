import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { FileText, Gift, Handshake, HelpCircle, Users, Phone, Plus, Pencil, Trash2, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import WhatsAppButton from '../components/ui/WhatsAppButton'

export default function HomePage() {
  const { isAdministrador } = useAuth()
  const [ultimoAviso, setUltimoAviso]   = useState(null)
  const [directores, setDirectores]     = useState([])
  const [loading, setLoading]           = useState(true)

  // Dialog directores
  const [dirOpen, setDirOpen]           = useState(false)
  const [editando, setEditando]         = useState(null) // null = nuevo
  const [dirForm, setDirForm]           = useState({ nombre: '', telefono: '' })
  const [savingDir, setSavingDir]       = useState(false)

  useEffect(() => { loadHomeData() }, [])

  const loadHomeData = async () => {
    try {
      setLoading(true)
      const [{ data: avisos }, { data: dirs }] = await Promise.all([
        supabase.from('avisos').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('directivos').select('*').order('created_at', { ascending: true }),
      ])
      setUltimoAviso(avisos?.[0] || null)
      setDirectores(dirs || [])
    } catch (err) {
      console.error('Error cargando inicio:', err)
    } finally {
      setLoading(false)
    }
  }

  const abrirNuevo = () => {
    setEditando(null)
    setDirForm({ nombre: '', telefono: '' })
    setDirOpen(true)
  }

  const abrirEditar = (dir) => {
    setEditando(dir)
    setDirForm({ nombre: dir.nombre, celular: dir.telefono })
    setDirOpen(true)
  }

  const guardarDirector = async () => {
    if (!dirForm.nombre.trim() || !dirForm.telefono.trim()) return
    setSavingDir(true)
    try {
      if (editando) {
        await supabase.from('directivos').update(dirForm).eq('id', editando.id)
        setDirectores(prev => prev.map(d => d.id === editando.id ? { ...d, ...dirForm } : d))
      } else {
        const { data } = await supabase.from('directivos').insert(dirForm).select().single()
        setDirectores(prev => [...prev, data])
      }
      setDirOpen(false)
    } catch (err) {
      console.error('Error guardando director:', err)
    } finally {
      setSavingDir(false)
    }
  }

  const eliminarDirector = async (id) => {
    await supabase.from('directivos').delete().eq('id', id)
    setDirectores(prev => prev.filter(d => d.id !== id))
  }

  // Accesos rápidos
  const accesos = [
    { to: '/beneficios', icon: Gift,      label: 'Beneficios',         color: '#dbeafe', iconColor: '#1e40af' },
    { to: '/convenios',  icon: Handshake, label: 'Convenios',          color: '#dbeafe', iconColor: '#1e40af' },
    { to: '/leyes',      icon: Scale,     label: 'Leyes Laborales',    color: '#dbeafe', iconColor: '#1e40af' },
    { to: '/faq',        icon: HelpCircle,label: 'Preguntas Frecuentes',color: '#dbeafe', iconColor: '#1e40af' },
  ]

  // Formatea celular para WhatsApp (quita espacios, +, guiones)
  const whatsappUrl = (celular) => {
    const num = String(celular).replace(/[\s+\-()]/g, '')
    // Si empieza con 9 (Chile sin código país), agrega +56
    const full = num.startsWith('56') ? num : `56${num}`
    return `https://wa.me/${full}`
  }

  // Título de sección con los colores del sindicato
  const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 px-4 py-2 rounded-t-lg"
         style={{ backgroundColor: '#1e40af' }}>
      <Icon className="w-4 h-4 text-white" />
      <span className="font-semibold text-white text-sm">{title}</span>
      <WhatsAppButton />
    </div>
  )


  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Encabezado ── */}
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain rounded-full hidden md:block" />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e40af' }}>
            Bienvenido al Portal del Sindicato
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Último Aviso ── */}
          <div className="rounded-lg border overflow-hidden">
            <SectionTitle icon={FileText} title="Último Aviso" />
            <div className="p-4" style={{ backgroundColor: '#eff6ff' }}>
              {ultimoAviso ? (
                <>
                  <h3 className="font-semibold mb-1">{ultimoAviso.titulo}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {ultimoAviso.contenido}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(ultimoAviso.created_at).toLocaleDateString('es-CL')}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No hay avisos publicados</p>
              )}
            </div>
          </div>

          {/* ── Accesos Rápidos ── */}
          <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 rounded-t-lg"
                 style={{ backgroundColor: '#1e40af' }}>
              <Gift className="w-4 h-4 text-white" />
              <span className="font-semibold text-white text-sm">Accesos Rápidos</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4" style={{ backgroundColor: '#eff6ff' }}>
              {accesos.map(({ to, icon: Icon, label, color, iconColor }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border bg-white hover:shadow-md transition-all"
                  style={{ borderColor: '#dbeafe' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: color }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight"
                        style={{ color: '#1e40af' }}>
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Directores ── */}
          <div className="rounded-lg border overflow-hidden md:col-span-2">
            <div className="flex items-center justify-between px-4 py-2 rounded-t-lg"
                 style={{ backgroundColor: '#1e40af' }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">Directorio</span>
              </div>
              {isAdministrador && (
                <button
                  onClick={abrirNuevo}
                  className="text-white hover:text-blue-200 transition-colors"
                  title="Agregar director"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="p-4" style={{ backgroundColor: '#eff6ff' }}>
              {directores.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay directores registrados.
                  {isAdministrador && ' Haz clic en + para agregar.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {directores.map(dir => (
                    <div key={dir.id}
                         className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm">
                      <div>
                        <p className="text-sm font-semibold">{dir.nombre}</p>
                        <a
                          href={whatsappUrl(dir.telefono)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs mt-1 font-medium"
                          style={{ color: '#1e40af' }}
                        >
                          <Phone className="w-3 h-3" />
                          {dir.telefono}
                        </a>
                      </div>
                      {isAdministrador && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => abrirEditar(dir)}
                            className="text-gray-400 hover:text-blue-700 p-1"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarDirector(dir.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── Dialog agregar/editar director ── */}
      <Dialog open={dirOpen} onOpenChange={setDirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Director' : 'Agregar Director'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre completo *</Label>
              <Input
                value={dirForm.nombre}
                onChange={e => setDirForm({ ...dirForm, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez González"
              />
            </div>
            <div>
              <Label>Número de celular * (con código país, ej: +56912345678)</Label>
              <Input
                value={dirForm.telefono}
                onChange={e => setDirForm({ ...dirForm, telefono: e.target.value })}
                placeholder="+56912345678"
              />
            </div>
            <Button
              onClick={guardarDirector}
              disabled={savingDir || !dirForm.nombre.trim() || !dirForm.telefono.trim()}
              className="w-full"
              style={{ backgroundColor: '#1e40af' }}
            >
              {savingDir ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar Director'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
