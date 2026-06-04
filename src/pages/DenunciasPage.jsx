import React, { useEffect, useState } from 'react'
import { ShieldAlert, ChevronDown, ChevronUp, Clock, CheckCircle, Inbox } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/spinner'
import { APP_CONFIG } from '../config'

const ESTADOS = ['pendiente', 'en_revision', 'cerrada']
const ESTADO_LABEL = { pendiente: 'Pendiente', en_revision: 'En revisión', cerrada: 'Cerrada' }
const ESTADO_COLOR = {
  pendiente:   { bg: '#FFF3CD', text: '#856404', border: '#FFEEBA' },
  en_revision: { bg: '#D1ECF1', text: '#0C5460', border: '#BEE5EB' },
  cerrada:     { bg: '#D4EDDA', text: '#155724', border: '#C3E6CB' },
}
const TIPO_LABELS = {
  maltrato_psicologico: 'Maltrato psicológico',
  acoso_laboral:        'Acoso laboral',
  acoso_sexual:         'Acoso sexual',
  cambio_funciones:     'Cambio o suma de funciones',
  otros:                'Otros',
}

export default function DenunciasPage() {
  const { isAdministrador, isDirector } = useAuth()
  const [denuncias, setDenuncias]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [expandida, setExpandida]           = useState(null)
  const [filtroEstado, setFiltroEstado]     = useState('todos')
  const [updatingId, setUpdatingId]         = useState(null)
  const [modalCierre, setModalCierre]       = useState(null)
  const [resolucion, setResolucion]         = useState('')
  const [enviandoCierre, setEnviandoCierre] = useState(false)

  const canView = isAdministrador || isDirector

  useEffect(() => { if (canView) loadDenuncias() }, [canView])

  const loadDenuncias = async () => {
    const { data } = await supabase
      .from('denuncias')
      .select('*')
      .order('created_at', { ascending: false })
    setDenuncias(data || [])
    setLoading(false)
  }

  const notificarEstado = async (nombre, email, estado, resolucion = null) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(`${supabaseUrl}/functions/v1/notify-estado-denuncia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ nombre, email, estado, ...(resolucion && { resolucion }) }),
      })
    } catch (err) { console.warn('[Email estado]', err) }
  }

  const cambiarEstado = async (id, nuevoEstado, denuncia) => {
    if (nuevoEstado === 'cerrada') {
      setModalCierre({ id, nombre: denuncia.nombre, email: denuncia.email })
      setResolucion('')
      return
    }
    setUpdatingId(id)
    await supabase.from('denuncias').update({ estado: nuevoEstado }).eq('id', id)
    setDenuncias(prev => prev.map(d => d.id === id ? { ...d, estado: nuevoEstado } : d))
    setUpdatingId(null)
    notificarEstado(denuncia.nombre, denuncia.email, nuevoEstado)
  }

  const confirmarCierre = async () => {
    if (!resolucion.trim()) return
    const { id, nombre, email } = modalCierre
    setEnviandoCierre(true)
    await supabase.from('denuncias').update({ estado: 'cerrada', resolucion }).eq('id', id)
    setDenuncias(prev => prev.map(d => d.id === id ? { ...d, estado: 'cerrada', resolucion } : d))
    setModalCierre(null)
    setResolucion('')
    setEnviandoCierre(false)
    notificarEstado(nombre, email, 'cerrada', resolucion)
  }

  const formatFecha = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const getTipos = (d) => Object.entries(TIPO_LABELS)
    .filter(([key]) => d[key])
    .map(([, label]) => label)

  const denunciasFiltradas = filtroEstado === 'todos'
    ? denuncias
    : denuncias.filter(d => d.estado === filtroEstado)

  const contadores = {
    todos:       denuncias.length,
    pendiente:   denuncias.filter(d => d.estado === 'pendiente').length,
    en_revision: denuncias.filter(d => d.estado === 'en_revision').length,
    cerrada:     denuncias.filter(d => d.estado === 'cerrada').length,
  }

  if (!canView) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldAlert className="w-12 h-12 mb-4" style={{ color: '#c0392b' }} />
      <p className="text-lg font-semibold">Acceso restringido</p>
      <p className="text-sm text-muted-foreground mt-1">Solo directores y administradores pueden ver este panel.</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* Encabezado */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        <ShieldAlert className="w-5 h-5 text-white" />
        <h1 className="text-xl font-bold text-white">Panel de Denuncias</h1>
        <span className="ml-auto text-xs px-2 py-1 rounded-full font-medium"
              style={{ backgroundColor: APP_CONFIG.colorPrimario, color: '#fff' }}>
          Confidencial
        </span>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'todos',       label: 'Total',       icon: Inbox,       color: APP_CONFIG.colorPrimarioOscuro },
          { key: 'pendiente',   label: 'Pendientes',  icon: Clock,       color: '#856404' },
          { key: 'en_revision', label: 'En revisión', icon: ShieldAlert, color: '#0C5460' },
          { key: 'cerrada',     label: 'Cerradas',    icon: CheckCircle, color: '#155724' },
        ].map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setFiltroEstado(key)}
            className="rounded-lg border p-3 text-left transition-all"
            style={{
              borderColor:     filtroEstado === key ? color : '#ddd6cc',
              backgroundColor: filtroEstado === key ? `${color}15` : '#fff',
              boxShadow:       filtroEstado === key ? `0 0 0 2px ${color}40` : 'none',
            }}
          >
            <Icon className="w-4 h-4 mb-1" style={{ color }} />
            <p className="text-xl font-bold" style={{ color }}>{contadores[key]}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </button>
        ))}
      </div>

      {/* Estadística tipos de denuncia */}
      {!loading && denuncias.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3"
             style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
            Tipos de denuncia
          </p>
          <div className="space-y-2">
            {Object.entries(TIPO_LABELS).map(([key, label]) => {
              const count = denuncias.filter(d => d[key]).length
              const pct   = denuncias.length > 0 ? Math.round((count / denuncias.length) * 100) : 0
              if (count === 0) return null
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#333' }}>{label}</span>
                    <span className="font-semibold"
                          style={{ color: APP_CONFIG.colorPrimarioOscuro }}>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ backgroundColor: '#e5e7eb' }}>
                    <div className="h-1.5 rounded-full transition-all"
                         style={{ width: `${pct}%`, backgroundColor: APP_CONFIG.colorPrimario }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : denunciasFiltradas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay denuncias {filtroEstado !== 'todos' ? `con estado "${ESTADO_LABEL[filtroEstado]}"` : 'registradas'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {denunciasFiltradas.map(d => {
            const isOpen      = expandida === d.id
            const estadoStyle = ESTADO_COLOR[d.estado] || ESTADO_COLOR.pendiente
            const tipos       = getTipos(d)

            return (
              <div key={d.id} className="rounded-xl border overflow-hidden" style={{ borderColor: '#ddd6cc' }}>

                {/* Cabecera */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandida(isOpen ? null : d.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm"
                         style={{ color: APP_CONFIG.colorPrimarioOscuro }}>{d.nombre}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium border"
                            style={{ backgroundColor: estadoStyle.bg, color: estadoStyle.text, borderColor: estadoStyle.border }}>
                        {ESTADO_LABEL[d.estado]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFecha(d.created_at)} · {tipos.join(', ') || 'Sin tipo'}
                    </p>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                </button>

                {/* Detalle expandido */}
                {isOpen && (
                  <div className="border-t px-4 py-4 space-y-4"
                       style={{ borderColor: '#ddd6cc', backgroundColor: '#fafafa' }}>

                    {/* Denunciante / Denunciado */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                           style={{ color: APP_CONFIG.colorPrimario }}>Denunciante</p>
                        <p className="font-medium">{d.nombre}</p>
                        <p className="text-muted-foreground">{d.rut}</p>
                        <p className="text-muted-foreground">{d.email}</p>
                        {d.telefono && <p className="text-muted-foreground">{d.telefono}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                           style={{ color: '#c0392b' }}>Denunciado</p>
                        <p className="font-medium">{d.denunciado_nombre}</p>
                        <p className="text-muted-foreground">{d.denunciado_cargo}</p>
                      </div>
                    </div>

                    {/* Fecha ocurrencia */}
                    {d.fecha_ocurrencia && (
                      <div className="text-sm p-3 rounded-lg border"
                           style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                           style={{ color: APP_CONFIG.colorPrimario }}>Fecha de ocurrencia</p>
                        <p>{new Date(d.fecha_ocurrencia).toLocaleDateString('es-CL', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}</p>
                      </div>
                    )}

                    {/* Tipos */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                         style={{ color: APP_CONFIG.colorPrimario }}>Tipo de denuncia</p>
                      <div className="flex flex-wrap gap-2">
                        {tipos.map((t, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{ backgroundColor: '#FFF3CD', color: '#856404', border: '1px solid #FFEEBA' }}>
                            {t}
                          </span>
                        ))}
                        {d.otros && d.otros_detalle && (
                          <span className="text-xs text-muted-foreground italic">({d.otros_detalle})</span>
                        )}
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                         style={{ color: APP_CONFIG.colorPrimario }}>Descripción de los hechos</p>
                      <p className="text-sm leading-relaxed whitespace-pre-line bg-white rounded-lg border p-3"
                         style={{ borderColor: '#ddd6cc' }}>{d.descripcion}</p>
                    </div>

                    {/* Cambiar estado (solo admin) */}
                    {isAdministrador && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                           style={{ color: APP_CONFIG.colorPrimario }}>Cambiar estado</p>
                        <div className="flex gap-2 flex-wrap">
                          {ESTADOS.map(estado => (
                            <button
                              key={estado}
                              disabled={d.estado === estado || updatingId === d.id}
                              onClick={() => cambiarEstado(d.id, estado, d)}
                              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all disabled:opacity-40"
                              style={{
                                backgroundColor: d.estado === estado ? ESTADO_COLOR[estado].bg : '#fff',
                                color:           ESTADO_COLOR[estado].text,
                                borderColor:     ESTADO_COLOR[estado].border,
                              }}
                            >
                              {updatingId === d.id ? '...' : ESTADO_LABEL[estado]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal cierre */}
      {modalCierre && (
        <div
          onClick={() => setModalCierre(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   zIndex: 9999, padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
                     overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
          >
            <div style={{ background: APP_CONFIG.colorPrimarioOscuro, padding: '1.2rem 1.5rem' }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 16, margin: 0 }}>✅ Cerrar caso</p>
              <p style={{ color: '#a8d5b5', fontSize: 13, margin: '4px 0 0' }}>
                Denuncia de {modalCierre.nombre}
              </p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: 14, color: '#555', margin: '0 0 0.75rem', lineHeight: 1.6 }}>
                Describe brevemente la resolución del caso. Este texto será enviado al socio por correo electrónico.
              </p>
              <textarea
                value={resolucion}
                onChange={e => setResolucion(e.target.value)}
                placeholder="Ej: Luego de analizar los antecedentes, se tomaron las medidas correspondientes..."
                rows={5}
                style={{ width: '100%', border: '1.5px solid #ddd6cc', borderRadius: 8,
                         padding: '0.65rem 0.9rem', fontFamily: 'inherit', fontSize: 14,
                         resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />
              {!resolucion.trim() && (
                <p style={{ fontSize: 12, color: '#c0392b', margin: '4px 0 0' }}>
                  La resolución es obligatoria para cerrar el caso.
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  onClick={() => setModalCierre(null)}
                  style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #ddd6cc',
                           borderRadius: 10, background: '#fff', fontSize: 14,
                           cursor: 'pointer', color: '#555' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCierre}
                  disabled={!resolucion.trim() || enviandoCierre}
                  style={{ flex: 1, padding: '0.75rem', border: 'none', borderRadius: 10,
                           background: resolucion.trim() ? APP_CONFIG.colorPrimarioOscuro : '#ccc',
                           color: '#fff', fontSize: 14, fontWeight: 500,
                           cursor: resolucion.trim() ? 'pointer' : 'not-allowed' }}
                >
                  {enviandoCierre ? 'Cerrando...' : 'Cerrar caso y notificar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
