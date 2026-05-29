import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, MessageCircle, RefreshCw, Clock, CalendarRange, PauseCircle, PlayCircle } from 'lucide-react'
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

function mezclarAvisos(lista) {
  const recurrentes = lista.filter(a => a.es_recurrente && a.recurrente_activo)
  const normales    = lista.filter(a => !a.es_recurrente || !a.recurrente_activo)
  for (let i = normales.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [normales[i], normales[j]] = [normales[j], normales[i]]
  }
  return [...recurrentes, ...normales]
}

export default function AvisosPage() {
  const { user, isAdministrador } = useAuth()
  const [avisos, setAvisos]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [open, setOpen]           = useState(false)
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [titulo, setTitulo]           = useState('')
  const [contenido, setContenido]     = useState('')
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [frecuenciaDias, setFrecuenciaDias] = useState(3)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin]       = useState('')

  const canManage = isAdministrador

  const loadAvisos = useCallback(async () => {
    const { data } = await supabase
      .from('avisos').select('*').order('created_at', { ascending: false })
    setAvisos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAvisos() }, [loadAvisos])

  const resetForm = () => {
    setTitulo(''); setContenido(''); setEsRecurrente(false)
    setFrecuenciaDias(3); setFechaInicio(''); setFechaFin(''); setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !contenido.trim()) { setError('Completa el título y el contenido'); return }
    if (esRecurrente && !fechaInicio) { setError('Indica la fecha de inicio de la recurrencia'); return }
    setSaving(true)

    const payload = {
      titulo, contenido, creado_por: user.id,
      es_recurrente: esRecurrente,
      frecuencia_dias: esRecurrente ? frecuenciaDias : null,
      fecha_inicio: esRecurrente ? fechaInicio : null,
      fecha_fin: esRecurrente && fechaFin ? fechaFin : null,
      proxima_notificacion: esRecurrente ? (new Date(fechaInicio) < new Date() ? new Date().toISOString().split('T')[0] : fechaInicio) : null,
      recurrente_activo: esRecurrente ? true : null,
    }

    const { data, error: insertError } = await supabase
      .from('avisos').insert(payload).select().single()

    if (insertError) { setError(insertError.message); setSaving(false); return }

    setAvisos(prev => mezclarAvisos([data, ...prev]))
    setOpen(false); resetForm(); setSaving(false)

    const t = titulo, c = contenido
    ;(async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (token) {
          await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ titulo: t, contenido: c }),
          })
        }
      } catch (err) { console.warn('[FCM] Error:', err) }
    })()
  }

  const handleDelete = async (id) => {
    await supabase.from('avisos').delete().eq('id', id)
    setAvisos(prev => prev.filter(a => a.id !== id))
  }

  const toggleRecurrente = async (aviso) => {
    const nuevoEstado = !aviso.recurrente_activo
    const { error } = await supabase.from('avisos').update({ recurrente_activo: nuevoEstado }).eq('id', aviso.id)
    if (!error) {
      setAvisos(prev => prev.map(a => a.id === aviso.id ? { ...a, recurrente_activo: nuevoEstado } : a))
    }
  }

  const formatFecha = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (str) => {
    if (!str) return '—'
    return new Date(str).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const recurrentesActivos = avisos.filter(a => a.es_recurrente)

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ backgroundColor: '#2d7a4f' }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-white" />
          <h1 className="text-xl font-bold text-white">Avisos</h1>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#7CBE80', color: '#003d18' }}>
                <Plus className="w-4 h-4 mr-1" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Crear Aviso</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="destructive">{error}</Alert>}
                <div>
                  <Label>Título</Label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                <div>
                  <Label>Contenido</Label>
                  <Textarea value={contenido} onChange={e => setContenido(e.target.value)} rows={4} />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: '#a8d5b5', backgroundColor: '#f0f8f3' }}>
                  <input type="checkbox" id="esRecurrente" checked={esRecurrente} onChange={e => setEsRecurrente(e.target.checked)} className="w-4 h-4 accent-green-700" />
                  <label htmlFor="esRecurrente" className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: '#1e3a2f' }}>
                    <RefreshCw className="w-4 h-4" /> Aviso recurrente (se repite automáticamente)
                  </label>
                </div>
                {esRecurrente && (
                  <div className="space-y-3 p-3 rounded-lg border" style={{ borderColor: '#a8d5b5', backgroundColor: '#f7fdf9' }}>
                    <div>
                      <Label className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Repetir cada (días)</Label>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {[1,2,3,4,7,14].map(d => (
                          <button key={d} type="button" onClick={() => setFrecuenciaDias(d)}
                            className="w-9 h-9 rounded-full text-sm font-medium border transition-all"
                            style={{ backgroundColor: frecuenciaDias === d ? '#2d7a4f' : '#fff', color: frecuenciaDias === d ? '#fff' : '#2d7a4f', borderColor: '#2d7a4f' }}>
                            {d}
                          </button>
                        ))}
                        <Input type="number" min={1} max={90} value={frecuenciaDias} onChange={e => setFrecuenciaDias(Number(e.target.value))} className="w-16 text-center" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="flex items-center gap-1"><CalendarRange className="w-3.5 h-3.5" /> Fecha inicio</Label>
                        <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                      </div>
                      <div>
                        <Label>Fecha fin (opcional)</Label>
                        <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: '#2d7a4f' }}>
                      El aviso se enviará automáticamente cada {frecuenciaDias} día{frecuenciaDias > 1 ? 's' : ''} y aparecerá primero en la lista.
                    </p>
                  </div>
                )}
                <Button disabled={saving} style={{ backgroundColor: '#2d7a4f', color: '#fff', width: '100%' }}>
                  {saving ? 'Publicando...' : 'Publicar Aviso'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {canManage && recurrentesActivos.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: '#a8d5b5', backgroundColor: '#f0f8f3' }}>
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4" style={{ color: '#2d7a4f' }} />
            <span className="font-semibold text-sm" style={{ color: '#1e3a2f' }}>Avisos recurrentes programados</span>
          </div>
          {recurrentesActivos.map(a => (
            <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-white border text-xs gap-2" style={{ borderColor: '#ddd6cc' }}>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: '#1e3a2f' }}>{a.titulo}</p>
                <p style={{ color: '#555' }}>
                  Cada {a.frecuencia_dias} día{a.frecuencia_dias > 1 ? 's' : ''} · {formatDate(a.fecha_inicio)} → {formatDate(a.fecha_fin)} · Próximo: <strong>{formatDate(a.proxima_notificacion)}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.recurrente_activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.recurrente_activo ? 'Activo' : 'Pausado'}
                </span>
                <button onClick={() => toggleRecurrente(a)} title={a.recurrente_activo ? 'Pausar' : 'Activar'}>
                  {a.recurrente_activo ? <PauseCircle className="w-4 h-4 text-amber-500" /> : <PlayCircle className="w-4 h-4 text-green-600" />}
                </button>
                <button onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : avisos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay avisos publicados aún</div>
      ) : (
        <div className="space-y-3 px-2">
          {mezclarAvisos(
            canManage
              ? avisos  // Admin ve todos incluyendo pausados
              : avisos.filter(a => !a.es_recurrente || a.recurrente_activo) // Socios no ven pausados
          ).map((a, idx) => {
            const esRec = a.es_recurrente && a.recurrente_activo
            const bgColor = esRec ? '#2d5a3f' : idx === 0 ? '#2d7a4f' : '#7CBE80'
            const textColor = (esRec || idx === 0) ? 'white' : '#003d18'
            return (
              <div key={a.id} className="flex flex-col items-start">
                <div className="relative max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 shadow-md"
                     style={{ backgroundColor: bgColor, color: textColor }}>

                  <p className="font-semibold text-sm mb-1">{a.titulo}</p>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{a.contenido}</p>
                  <div className="flex items-center justify-between mt-2 gap-4">
                    <span className="text-xs opacity-70">{formatFecha(a.created_at)}</span>
                    {canManage && (
                      <button onClick={() => handleDelete(a.id)} className="opacity-60 hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="absolute -left-2 top-0 w-0 h-0"
                       style={{ borderTop: `8px solid ${bgColor}`, borderLeft: '8px solid transparent' }} />
                </div>
                {esRec && (
                  <span className="mt-1 ml-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFD700', color: '#333' }}>
                    📌 FIJADO
                  </span>
                )}
                {!esRec && idx === 0 && (
                  <span className="mt-1 ml-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFD700', color: '#333' }}>
                    NUEVO
                  </span>
                )}
              </div>
            )
          })}
          <WhatsAppButton />
        </div>
      )}
    </div>
  )
}
