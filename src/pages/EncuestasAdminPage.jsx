import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, BarChart2, ClipboardList, Eye, EyeOff, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/spinner'
import { APP_CONFIG } from '../config'

const PLANTILLAS = {
  clima_laboral: 'Clima Laboral',
  satisfaccion:  'Satisfacción',
  nps:           'NPS',
  personalizada: 'Personalizada',
}

const TIPOS = {
  escala:          'Escala 1-5',
  si_no:           'Sí / No',
  opcion_multiple: 'Opción múltiple',
  texto_libre:     'Texto libre',
}

const VISIBLE_PARA = {
  todos:      'Socios y Aportantes',
  socios:     'Solo Socios',
  aportantes: 'Solo Aportantes',
}

const ESTADO_COLOR = {
  borrador: { bg: '#f0f0f0', text: '#555' },
  activa:   { bg: '#D4EDDA', text: '#155724' },
  cerrada:  { bg: '#f8d7da', text: '#721c24' },
}

export default function EncuestasAdminPage() {
  const { user, isAdministrador, isDirector } = useAuth()
  const canManage = isAdministrador
  const canView   = isAdministrador || isDirector

  const [encuestas, setEncuestas]                       = useState([])
  const [loading, setLoading]                           = useState(true)
  const [vistaActual, setVistaActual]                   = useState('lista') // lista | crear | resultados
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null)
  const [resultados, setResultados]                     = useState([])
  const [loadingResultados, setLoadingResultados]       = useState(false)
  const [featureFlag, setFeatureFlag]                   = useState(false)
  const [togglingFlag, setTogglingFlag]                 = useState(false)

  const [form, setForm] = useState({
    titulo: '', descripcion: '', plantilla_base: 'personalizada',
    visible_para: 'todos', fecha_inicio: '', fecha_fin: '',
  })
  const [preguntas, setPreguntas] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('encuestas').select('*').order('created_at', { ascending: false })
    setEncuestas(data || [])
    const { data: config } = await supabase
      .from('configuracion').select('valor').eq('clave', 'encuestas_habilitadas').single()
    setFeatureFlag(config?.valor === 'true')
    setLoading(false)
  }, [])

  useEffect(() => { if (canView) load() }, [canView, load])

  const toggleFlag = async () => {
    setTogglingFlag(true)
    const nuevoValor = featureFlag ? 'false' : 'true'
    await supabase.from('configuracion').update({ valor: nuevoValor }).eq('clave', 'encuestas_habilitadas')
    setFeatureFlag(!featureFlag)
    setTogglingFlag(false)
  }

  const cargarPlantilla = async (plantilla) => {
    if (plantilla === 'personalizada') { setPreguntas([]); return }
    setPreguntas([])
    const { data } = await supabase
      .from('plantillas_encuesta').select('*').eq('plantilla', plantilla).order('orden')
    setPreguntas((data || []).map(p => ({
      texto: p.texto, tipo: p.tipo, opciones: p.opciones, obligatoria: p.obligatoria,
    })))
  }

  const agregarPregunta = () =>
    setPreguntas(prev => [...prev, { texto: '', tipo: 'escala', opciones: null, obligatoria: true }])

  const actualizarPregunta = (idx, campo, valor) =>
    setPreguntas(prev => prev.map((p, i) => i === idx ? { ...p, [campo]: valor } : p))

  const eliminarPregunta = (idx) =>
    setPreguntas(prev => prev.filter((_, i) => i !== idx))

  const handleGuardar = async (estado = 'borrador') => {
    if (!form.titulo.trim()) { setErrorForm('El título es obligatorio'); return }
    if (preguntas.length === 0) { setErrorForm('Agrega al menos una pregunta'); return }
    if (preguntas.some(p => !p.texto.trim())) { setErrorForm('Todas las preguntas deben tener texto'); return }
    setGuardando(true); setErrorForm('')

    const { data: enc, error } = await supabase.from('encuestas').insert({
      ...form, estado, created_by: user.id,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
    }).select().single()

    if (error) { setErrorForm(error.message); setGuardando(false); return }

    const rows = preguntas.map((p, i) => ({ encuesta_id: enc.id, orden: i + 1, ...p }))
    await supabase.from('preguntas_encuesta').insert(rows)

    await load()
    setVistaActual('lista')
    setForm({ titulo: '', descripcion: '', plantilla_base: 'personalizada', visible_para: 'todos', fecha_inicio: '', fecha_fin: '' })
    setPreguntas([])
    setGuardando(false)
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    if (nuevoEstado === 'activa') {
      await supabase.from('encuestas').update({ estado: 'cerrada' }).eq('estado', 'activa').neq('id', id)
    }
    await supabase.from('encuestas').update({ estado: nuevoEstado }).eq('id', id)
    await load()
  }

  const verResultados = async (enc) => {
    setEncuestaSeleccionada(enc)
    setLoadingResultados(true)
    setVistaActual('resultados')

    const { data: preg }        = await supabase.from('preguntas_encuesta').select('*').eq('encuesta_id', enc.id).order('orden')
    const { data: resp }        = await supabase.from('respuestas_encuesta').select('*').eq('encuesta_id', enc.id)
    const { data: respondidas } = await supabase.from('encuestas_respondidas').select('id').eq('encuesta_id', enc.id)

    const totalParticipantes = respondidas?.length || 0

    const resumen = (preg || []).map(p => {
      const respPreg = (resp || []).filter(r => r.pregunta_id === p.id)
      let stats = {}

      if (p.tipo === 'escala') {
        const vals = respPreg.map(r => parseInt(r.respuesta)).filter(Boolean)
        const promedio = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '-'
        const distribucion = [1,2,3,4,5].map(n => ({ valor: n, count: vals.filter(v => v === n).length }))
        stats = { promedio, distribucion, total: vals.length }
      } else if (p.tipo === 'si_no') {
        const si = respPreg.filter(r => r.respuesta === 'Sí').length
        const no = respPreg.filter(r => r.respuesta === 'No').length
        stats = { si, no, total: respPreg.length }
      } else if (p.tipo === 'opcion_multiple') {
        const conteo = {}
        respPreg.forEach(r => { conteo[r.respuesta] = (conteo[r.respuesta] || 0) + 1 })
        stats = { conteo, total: respPreg.length }
      } else if (p.tipo === 'texto_libre') {
        stats = { textos: respPreg.map(r => r.respuesta), total: respPreg.length }
      }

      return { ...p, stats }
    })

    setResultados({ preguntas: resumen, totalParticipantes })
    setLoadingResultados(false)
  }

  if (!canView) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-semibold">Acceso restringido</p>
    </div>
  )

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  // ── Vista Resultados ──
  if (vistaActual === 'resultados') return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        <BarChart2 className="w-5 h-5 text-white" />
        <div className="flex-1">
          <h1 className="text-white font-bold text-base">Resultados</h1>
          <p className="text-xs" style={{ color: APP_CONFIG.colorPrimarioClaro }}>
            {encuestaSeleccionada?.titulo}
          </p>
        </div>
        <button onClick={() => setVistaActual('lista')}
                className="text-xs px-3 py-1 rounded-full bg-white/10 text-white">
          ← Volver
        </button>
      </div>

      <div className="rounded-xl border p-4 text-center" style={{ borderColor: '#ddd6cc' }}>
        <p className="text-3xl font-bold" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
          {resultados.totalParticipantes}
        </p>
        <p className="text-sm text-muted-foreground">participantes</p>
      </div>

      {loadingResultados ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <div className="space-y-4">
          {(resultados.preguntas || []).map((p, idx) => (
            <div key={p.id} className="rounded-xl border p-4" style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
              <p className="font-semibold text-sm mb-3" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
                {idx + 1}. {p.texto}
              </p>

              {p.tipo === 'escala' && (
                <div>
                  <p className="text-2xl font-bold mb-2" style={{ color: APP_CONFIG.colorPrimario }}>
                    ⌀ {p.stats.promedio}
                  </p>
                  <div className="space-y-1">
                    {p.stats.distribucion.map(d => (
                      <div key={d.valor} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-center font-medium">{d.valor}</span>
                        <div className="flex-1 rounded-full h-2" style={{ backgroundColor: '#e5e7eb' }}>
                          <div className="h-2 rounded-full"
                               style={{ width: p.stats.total > 0 ? `${(d.count / p.stats.total) * 100}%` : '0%', backgroundColor: APP_CONFIG.colorPrimario }} />
                        </div>
                        <span className="w-6 text-right">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {p.tipo === 'si_no' && (
                <div className="flex gap-4">
                  <div className="flex-1 text-center p-3 rounded-lg" style={{ backgroundColor: '#D4EDDA' }}>
                    <p className="text-2xl font-bold" style={{ color: '#155724' }}>{p.stats.si}</p>
                    <p className="text-xs" style={{ color: '#155724' }}>Sí</p>
                  </div>
                  <div className="flex-1 text-center p-3 rounded-lg" style={{ backgroundColor: '#f8d7da' }}>
                    <p className="text-2xl font-bold" style={{ color: '#721c24' }}>{p.stats.no}</p>
                    <p className="text-xs" style={{ color: '#721c24' }}>No</p>
                  </div>
                </div>
              )}

              {p.tipo === 'opcion_multiple' && (
                <div className="space-y-1">
                  {Object.entries(p.stats.conteo || {}).map(([op, count]) => (
                    <div key={op} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 truncate">{op}</span>
                      <div className="w-24 rounded-full h-2" style={{ backgroundColor: '#e5e7eb' }}>
                        <div className="h-2 rounded-full"
                             style={{ width: p.stats.total > 0 ? `${(count / p.stats.total) * 100}%` : '0%', backgroundColor: APP_CONFIG.colorPrimario }} />
                      </div>
                      <span className="w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}

              {p.tipo === 'texto_libre' && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(p.stats.textos || []).length === 0
                    ? <p className="text-xs text-muted-foreground italic">Sin respuestas</p>
                    : (p.stats.textos || []).map((t, i) => (
                      <p key={i} className="text-xs p-2 rounded-lg" style={{ backgroundColor: '#f7f4ef' }}>"{t}"</p>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Vista Crear ──
  if (vistaActual === 'crear') return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        <Plus className="w-5 h-5 text-white" />
        <h1 className="text-white font-bold text-base flex-1">Nueva Encuesta</h1>
        <button onClick={() => setVistaActual('lista')}
                className="text-xs px-3 py-1 rounded-full bg-white/10 text-white">
          ← Volver
        </button>
      </div>

      {errorForm && (
        <div className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#fdf0f0', color: '#c0392b' }}>
          {errorForm}
        </div>
      )}

      <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#ddd6cc' }}>
        <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>Datos generales</p>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Título *</label>
          <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }}
            placeholder="Ej: Encuesta de Clima Laboral 2026" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Descripción (opcional)</label>
          <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none" style={{ borderColor: '#ddd6cc' }} rows={2}
            placeholder="Breve descripción para el socio..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Plantilla base</label>
            <select value={form.plantilla_base}
              onChange={async e => { const val = e.target.value; setForm(f => ({ ...f, plantilla_base: val })); await cargarPlantilla(val) }}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }}>
              {Object.entries(PLANTILLAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Visible para</label>
            <select value={form.visible_para} onChange={e => setForm(f => ({ ...f, visible_para: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }}>
              {Object.entries(VISIBLE_PARA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fecha inicio (opcional)</label>
            <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fecha fin (opcional)</label>
            <input type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }} />
          </div>
        </div>
      </div>

      {/* Preguntas */}
      <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#ddd6cc' }}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
            Preguntas ({preguntas.length})
          </p>
          <button onClick={agregarPregunta}
            className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1"
            style={{ backgroundColor: APP_CONFIG.colorPrimario, color: '#fff' }}>
            <Plus className="w-3 h-3" /> Agregar
          </button>
        </div>

        {preguntas.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {form.plantilla_base !== 'personalizada'
              ? 'Cargando plantilla...'
              : 'Agrega preguntas manualmente o selecciona una plantilla'}
          </p>
        )}

        {preguntas.map((p, idx) => (
          <div key={idx} className="p-3 rounded-lg border space-y-2"
               style={{ borderColor: '#e5e7eb', backgroundColor: '#fafafa' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-5 text-center" style={{ color: APP_CONFIG.colorPrimario }}>{idx + 1}</span>
              <input value={p.texto} onChange={e => actualizarPregunta(idx, 'texto', e.target.value)}
                className="flex-1 border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: '#ddd6cc' }}
                placeholder="Texto de la pregunta..." />
              <button onClick={() => eliminarPregunta(idx)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
            <div className="flex items-center gap-3 ml-7">
              <select value={p.tipo} onChange={e => actualizarPregunta(idx, 'tipo', e.target.value)}
                className="border rounded-lg px-2 py-1 text-xs" style={{ borderColor: '#ddd6cc' }}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={p.obligatoria}
                       onChange={e => actualizarPregunta(idx, 'obligatoria', e.target.checked)}
                       className="accent-green-700" />
                Obligatoria
              </label>
            </div>
            {p.tipo === 'opcion_multiple' && (
              <div className="ml-7">
                <input
                  value={Array.isArray(p.opciones) ? p.opciones.join(', ') : ''}
                  onChange={e => actualizarPregunta(idx, 'opciones', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                  className="w-full border rounded-lg px-2 py-1.5 text-xs" style={{ borderColor: '#ddd6cc' }}
                  placeholder="Opciones separadas por coma: Opción 1, Opción 2, Opción 3" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => handleGuardar('borrador')} disabled={guardando}
          className="flex-1 py-3 rounded-xl border text-sm font-medium"
          style={{ borderColor: '#ddd6cc', color: '#555' }}>
          Guardar borrador
        </button>
        <button onClick={() => handleGuardar('activa')} disabled={guardando}
          className="flex-1 py-3 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
          {guardando ? 'Guardando...' : 'Publicar encuesta'}
        </button>
      </div>
    </div>
  )

  // ── Vista Lista ──
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        <ClipboardList className="w-5 h-5 text-white" />
        <h1 className="text-white font-bold text-base flex-1">Encuestas</h1>
        {canManage && (
          <button onClick={() => setVistaActual('crear')}
            className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1"
            style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, color: APP_CONFIG.colorPrimarioOscuro }}>
            <Plus className="w-3 h-3" /> Nueva
          </button>
        )}
      </div>

      {/* Feature Flag */}
      {canManage && (
        <div className="flex items-center justify-between p-4 rounded-xl border"
             style={{ borderColor: featureFlag ? APP_CONFIG.colorPrimario : '#ddd6cc', backgroundColor: featureFlag ? APP_CONFIG.colorPrimarioClaro : '#fafafa' }}>
          <div>
            <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>Módulo de Encuestas</p>
            <p className="text-xs text-muted-foreground">
              {featureFlag ? 'Visible para socios y aportantes' : 'Oculto — no visible en la App'}
            </p>
          </div>
          <button onClick={toggleFlag} disabled={togglingFlag}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{ backgroundColor: featureFlag ? APP_CONFIG.colorPrimario : '#e5e7eb', color: featureFlag ? '#fff' : '#555' }}>
            {togglingFlag
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : featureFlag ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {featureFlag ? 'Habilitado' : 'Deshabilitado'}
          </button>
        </div>
      )}

      {encuestas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay encuestas creadas aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {encuestas.map(enc => {
            const estadoStyle = ESTADO_COLOR[enc.estado]
            return (
              <div key={enc.id} className="rounded-xl border p-4"
                   style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate"
                       style={{ color: APP_CONFIG.colorPrimarioOscuro }}>{enc.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {PLANTILLAS[enc.plantilla_base]} · {VISIBLE_PARA[enc.visible_para]}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ backgroundColor: estadoStyle.bg, color: estadoStyle.text }}>
                    {enc.estado.charAt(0).toUpperCase() + enc.estado.slice(1)}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap mt-3">
                  <button onClick={() => verResultados(enc)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border font-medium"
                    style={{ borderColor: APP_CONFIG.colorPrimario, color: APP_CONFIG.colorPrimario }}>
                    <BarChart2 className="w-3 h-3" /> Resultados
                  </button>
                  {canManage && enc.estado === 'borrador' && (
                    <button onClick={() => cambiarEstado(enc.id, 'activa')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ backgroundColor: '#D4EDDA', color: '#155724' }}>
                      <CheckCircle className="w-3 h-3" /> Activar
                    </button>
                  )}
                  {canManage && enc.estado === 'activa' && (
                    <button onClick={() => cambiarEstado(enc.id, 'cerrada')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ backgroundColor: '#f8d7da', color: '#721c24' }}>
                      <XCircle className="w-3 h-3" /> Cerrar
                    </button>
                  )}
                  {canManage && enc.estado === 'cerrada' && (
                    <button onClick={() => cambiarEstado(enc.id, 'activa')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ backgroundColor: '#D4EDDA', color: '#155724' }}>
                      <RefreshCw className="w-3 h-3" /> Reactivar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
