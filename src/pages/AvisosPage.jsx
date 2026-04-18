import React, { useEffect, useState } from 'react'
import { Plus, Trash2, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Spinner } from '../components/ui/spinner'
import { Alert } from '../components/ui/alert'
import WhatsAppButton from '../components/ui/WhatsAppButton'

export default function AvisosPage() {
  const { user, isAdministrador, isDirector } = useAuth()
  const [avisos, setAvisos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [titulo, setTitulo]   = useState('')
  const [contenido, setContenido] = useState('')
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  const canManage = isAdministrador

  useEffect(() => { loadAvisos() }, [])

  const loadAvisos = async () => {
    const { data } = await supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false })
    setAvisos(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !contenido.trim()) {
      setError('Completa el título y el contenido')
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('avisos')
      .insert({ titulo, contenido, creado_por: user.id })
      .select()
      .single()

    if (error) { setError(error.message); setSaving(false); return }

    setAvisos([data, ...avisos])
    setOpen(false)
    setTitulo('')
    setContenido('')
    setSaving(false)

    // Enviar notificación push a todos los socios
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (token) {
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ titulo, contenido }),
        })
      }
    } catch (err) {
      console.warn('[FCM] Error enviando notificaciones:', err)
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('avisos').delete().eq('id', id)
    setAvisos(avisos.filter(a => a.id !== id))
  }

  const formatFecha = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg"
           style={{ backgroundColor: '#1e40af' }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-white" />
          <h1 className="text-xl font-bold text-white">Avisos</h1>
        </div>

        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-white border-white hover:bg-blue-700"
                      style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}>
                <Plus className="w-4 h-4 mr-1" />
                Nuevo
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Aviso</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="destructive">{error}</Alert>}
                <div>
                  <Label>Título</Label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                <div>
                  <Label>Contenido</Label>
                  <Textarea
                    value={contenido}
                    onChange={e => setContenido(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button disabled={saving} style={{ backgroundColor: '#1e40af' }}>
                  {saving ? 'Publicando...' : 'Publicar Aviso'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ── Lista de avisos estilo chat ── */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : avisos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay avisos publicados aún
        </div>
      ) : (
        <div className="space-y-3 px-2">
          {avisos.map((a, idx) => (
            <div key={a.id} className="flex flex-col items-start">

              {/* Burbuja de mensaje */}
              <div
                className="relative max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 shadow-md"
                style={{
                  backgroundColor: idx === 0 ? '#1e40af' : '#3b82f6',
                  color: idx === 0 ? 'white' : '#1e3a8a',
                }}
              >
                {/* Título del aviso */}
                <p className="font-semibold text-sm mb-1">{a.titulo}</p>

                {/* Contenido */}
                <p className="text-sm whitespace-pre-line leading-relaxed">
                  {a.contenido}
                </p>

                {/* Fecha + botón eliminar */}
                <div className="flex items-center justify-between mt-2 gap-4">
                  <span className="text-xs opacity-70">{formatFecha(a.created_at)}</span>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      title="Eliminar aviso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Triángulo de burbuja */}
                <div
                  className="absolute -left-2 top-0 w-0 h-0"
                  style={{
                    borderTop: `8px solid ${idx === 0 ? '#1e40af' : '#3b82f6'}`,
                    borderLeft: '8px solid transparent',
                  }}
                />
              </div>

              {/* Indicador "NUEVO" para el más reciente */}
              {idx === 0 && (
                <span className="mt-1 ml-1 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#FFD700', color: '#333' }}>
                  NUEVO
                </span>
              )}
            </div>
          ))}
      <WhatsAppButton />
        </div>
      )}
    </div>
  )
}
