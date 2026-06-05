import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Vote, BarChart2, Eye, EyeOff, RefreshCw, CheckCircle, XCircle, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/spinner'
import { APP_CONFIG } from '../config'

function calcularQuorumRequerido(votacion, totalSocios) {
  const tipo = votacion.tipo_quorum || 'porcentaje'
  if (tipo === 'simple')    return Math.floor(totalSocios / 2) + 1
  if (tipo === 'calificada') return Math.ceil(totalSocios * 2 / 3)
  return Math.ceil(totalSocios * (votacion.quorum_requerido / 100))
}

const ESTADO_COLOR = {
  borrador: { bg: '#f0f0f0', text: '#555' },
  activa:   { bg: '#D4EDDA', text: '#155724' },
  cerrada:  { bg: '#f8d7da', text: '#721c24' },
}

const VISIBLE_PARA = {
  todos:      'Socios y Aportantes',
  socios:     'Solo Socios',
  aportantes: 'Solo Aportantes',
}

export default function VotacionesAdminPage() {
  const { user, isAdministrador, isDirector } = useAuth()
  const canManage = isAdministrador
  const canView   = isAdministrador || isDirector

  const [votaciones, setVotaciones]           = useState([])
  const [loading, setLoading]                 = useState(true)
  const [vistaActual, setVistaActual]         = useState('lista')
  const [votSeleccionada, setVotSeleccionada] = useState(null)
  const [resultados, setResultados]           = useState(null)
  const [loadingRes, setLoadingRes]           = useState(false)
  const [featureFlag, setFeatureFlag]         = useState(false)
  const [togglingFlag, setTogglingFlag]       = useState(false)
  const [guardando, setGuardando]             = useState(false)
  const [errorForm, setErrorForm]             = useState('')

  const [form, setForm] = useState({
    titulo: '', descripcion: '', tipo: 'anonima',
    visible_para: 'todos', quorum_requerido: 50,
    tipo_quorum: 'simple',
    fecha_cierre: '', hora_cierre: '',
  })

  const load = useCallback(async () => {
    const { data } = await supabase.from('votaciones').select('*').order('created_at', { ascending: false })
    setVotaciones(data || [])
    const { data: config } = await supabase.from('configuracion').select('valor').eq('clave', 'votaciones_habilitadas').single()
    setFeatureFlag(config?.valor === 'true')
    setLoading(false)
  }, [])

  useEffect(() => { if (canView) load() }, [canView, load])

  const toggleFlag = async () => {
    setTogglingFlag(true)
    const nuevoValor = featureFlag ? 'false' : 'true'
    await supabase.from('configuracion').update({ valor: nuevoValor }).eq('clave', 'votaciones_habilitadas')
    setFeatureFlag(!featureFlag)
    setTogglingFlag(false)
  }

  const handleGuardar = async (estado = 'borrador') => {
    if (!form.titulo.trim()) { setErrorForm('El título es obligatorio'); return }
    setGuardando(true); setErrorForm('')

    let fecha_cierre = null
    if (form.fecha_cierre && form.hora_cierre) {
      fecha_cierre = new Date(`${form.fecha_cierre}T${form.hora_cierre}`).toISOString()
    }

    let quorum_requerido = Number(form.quorum_requerido)
    if (form.tipo_quorum === 'simple')    quorum_requerido = -1
    else if (form.tipo_quorum === 'calificada') quorum_requerido = 67

    const { error } = await supabase.from('votaciones').insert({
      titulo: form.titulo, descripcion: form.descripcion,
      tipo: form.tipo, visible_para: form.visible_para,
      quorum_requerido, tipo_quorum: form.tipo_quorum,
      fecha_cierre, estado, created_by: user.id,
    })

    if (error) { setErrorForm(error.message); setGuardando(false); return }
    await load()
    setVistaActual('lista')
    setForm({ titulo: '', descripcion: '', tipo: 'anonima', visible_para: 'todos', quorum_requerido: 50, tipo_quorum: 'simple', fecha_cierre: '', hora_cierre: '' })
    setGuardando(false)
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    if (nuevoEstado === 'activa') {
      await supabase.from('votaciones').update({ estado: 'cerrada' }).eq('estado', 'activa').neq('id', id)
    }
    await supabase.from('votaciones').update({ estado: nuevoEstado }).eq('id', id)
    await load()
  }

  const verResultados = async (vot) => {
    setVotSeleccionada(vot)
    setLoadingRes(true)
    setVistaActual('resultados')

    const { data: votos }     = await supabase.from('votos').select('*').eq('votacion_id', vot.id)
    const { data: emitidas }  = await supabase.from('votaciones_emitidas').select('id').eq('votacion_id', vot.id)
    const { count: totalSocios } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('estado', 'activo')

    const favor      = votos?.filter(v => v.voto === 'favor').length || 0
    const contra     = votos?.filter(v => v.voto === 'contra').length || 0
    const abstencion = votos?.filter(v => v.voto === 'abstencion').length || 0
    const total      = emitidas?.length || 0
    const quorumReq  = calcularQuorumRequerido(vot, totalSocios)
    const quorumAlcanzado = total >= quorumReq
    const aprobada   = favor > contra

    let nominados = []
    if (vot.tipo === 'nominada') {
      const { data: nom } = await supabase
        .from('votos').select('user_id, created_at').eq('votacion_id', vot.id).not('user_id', 'is', null)
      if (nom?.length) {
        const ids = nom.map(n => n.user_id)
        const { data: perfiles } = await supabase.from('profiles').select('id, nombre').in('id', ids)
        nominados = nom.map(n => ({ ...n, nombre: perfiles?.find(p => p.id === n.user_id)?.nombre || 'Desconocido' }))
      }
    }

    setResultados({ favor, contra, abstencion, total, totalSocios, quorumReq, quorumAlcanzado, aprobada, nominados })
    setLoadingRes(false)
  }

  const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0

  const publicarResultado = async (vot, res) => {
    await supabase.from('votaciones').update({ resultado_publicado: true }).eq('id', vot.id)

    const aprobada  = res.favor > res.contra
    const titulo    = `📊 Resultado: ${vot.titulo}`
    const contenido = `La votación ha concluido con ${res.total} votos emitidos.\n\n✅ A favor: ${res.favor} (${pct(res.favor, res.total)}%)\n❌ En contra: ${res.contra} (${pct(res.contra, res.total)}%)\n⬜ Abstención: ${res.abstencion} (${pct(res.abstencion, res.total)}%)\n\nResultado: ${res.quorumAlcanzado ? (aprobada ? '✅ APROBADA' : '❌ RECHAZADA') : '⚠️ Sin quórum'}`

    await supabase.from('avisos').insert({ titulo, contenido, creado_por: user.id })

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ titulo, contenido }),
      })
    } catch (err) { console.warn('[Notificación resultado]', err) }

    await load()
    alert('✅ Resultado publicado a todos los socios')
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
          <p className="text-xs" style={{ color: APP_CONFIG.colorPrimarioClaro }}>{votSeleccionada?.titulo}</p>
        </div>
        <button onClick={() => setVistaActual('lista')}
                className="text-xs px-3 py-1 rounded-full bg-white/10 text-white">
          ← Volver
        </button>
      </div>

      {loadingRes ? <div className="flex justify-center py-12"><Spinner /></div> : resultados && (
        <>
          {/* Botón publicar resultado */}
          {(isAdministrador || isDirector) && votSeleccionada?.estado === 'cerrada' && !votSeleccionada?.resultado_publicado && (
            <div className="rounded-xl border p-4 text-center"
                 style={{ borderColor: APP_CONFIG.colorPrimario, backgroundColor: APP_CONFIG.colorPrimarioClaro }}>
              <p className="text-sm font-semibold mb-1" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
                ¿Listo para publicar el resultado?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Se creará un aviso y se enviará una notificación push a todos los socios.
              </p>
              <button onClick={() => publicarResultado(votSeleccionada, resultados)}
                className="px-6 py-2 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
                📢 Publicar resultado a socios
              </button>
            </div>
          )}
          {votSeleccionada?.resultado_publicado && (
            <div className="rounded-xl border p-3 text-center text-sm"
                 style={{ borderColor: '#C3E6CB', backgroundColor: '#D4EDDA', color: '#155724' }}>
              ✅ Resultado ya publicado a los socios
            </div>
          )}

          {/* Quórum */}
          <div className="rounded-xl border p-4" style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>Participación</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: resultados.quorumAlcanzado ? '#D4EDDA' : '#FFF3CD', color: resultados.quorumAlcanzado ? '#155724' : '#856404' }}>
                {resultados.quorumAlcanzado ? '✅ Quórum alcanzado' : '⏳ Sin quórum aún'}
              </span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
                {resultados.total}
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                de {resultados.quorumReq} requeridos ({votSeleccionada?.quorum_requerido}%)
              </span>
            </div>
            <div className="w-full rounded-full h-3" style={{ backgroundColor: '#e5e7eb' }}>
              <div className="h-3 rounded-full transition-all"
                   style={{ width: `${Math.min(100, pct(resultados.total, resultados.quorumReq))}%`, backgroundColor: resultados.quorumAlcanzado ? APP_CONFIG.colorPrimario : '#f5c518' }} />
            </div>
          </div>

          {/* Votos */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
            <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
              Distribución de votos
            </p>
            {[
              { key: 'favor',      emoji: '✅', label: 'A favor',    color: '#155724', bg: '#D4EDDA' },
              { key: 'contra',     emoji: '❌', label: 'En contra',  color: '#721c24', bg: '#f8d7da' },
              { key: 'abstencion', emoji: '⬜', label: 'Abstención', color: '#555',    bg: '#f0f0f0' },
            ].map(({ key, emoji, label, color }) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{emoji} {label}</span>
                  <span className="font-bold">{resultados[key]} ({pct(resultados[key], resultados.total)}%)</span>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: '#e5e7eb' }}>
                  <div className="h-3 rounded-full" style={{ width: `${pct(resultados[key], resultados.total)}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
            {resultados.quorumAlcanzado && (
              <div className="mt-3 p-3 rounded-lg text-center font-bold text-sm"
                   style={{ backgroundColor: resultados.aprobada ? '#D4EDDA' : '#f8d7da', color: resultados.aprobada ? '#155724' : '#721c24' }}>
                {resultados.aprobada ? '✅ Moción APROBADA' : '❌ Moción RECHAZADA'}
              </div>
            )}
          </div>

          {/* Nominados */}
          {votSeleccionada?.tipo === 'nominada' && resultados.nominados?.length > 0 && (
            <div className="rounded-xl border p-4" style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" style={{ color: APP_CONFIG.colorPrimario }} />
                <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
                  Socios que votaron
                </p>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {resultados.nominados.map((n, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b"
                       style={{ borderColor: '#f0f0f0' }}>
                    <span>{n.nombre}</span>
                    <span className="text-muted-foreground">
                      {new Date(n.created_at).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  // ── Vista Crear ──
  if (vistaActual === 'crear') return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        <Plus className="w-5 h-5 text-white" />
        <h1 className="text-white font-bold text-base flex-1">Nueva Votación</h1>
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
        <div>
          <label className="text-xs font-medium text-muted-foreground">Moción / Título *</label>
          <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }}
            placeholder="Ej: Aprobación del nuevo Contrato Colectivo" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Descripción (opcional)</label>
          <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none" style={{ borderColor: '#ddd6cc' }} rows={3}
            placeholder="Contexto o detalles de la votación..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo de votación</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }}>
              <option value="anonima">🔒 Anónima</option>
              <option value="nominada">📋 Nominada</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {form.tipo === 'anonima' ? 'No se sabe quién votó qué' : 'Se sabe quién votó (no qué)'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Visible para</label>
            <select value={form.visible_para} onChange={e => setForm(f => ({ ...f, visible_para: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }}>
              {Object.entries(VISIBLE_PARA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Tipo de quórum</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              { key: 'simple',        label: 'Mayoría simple',    desc: '50% + 1 voto' },
              { key: 'absoluta',      label: 'Mayoría absoluta',  desc: '50% de los socios' },
              { key: 'calificada',    label: 'Mayoría calificada',desc: '2/3 (67%)' },
              { key: 'personalizado', label: 'Personalizado',     desc: 'Porcentaje manual' },
            ].map(({ key, label, desc }) => (
              <button key={key} type="button"
                onClick={() => {
                  const pctVal = key === 'simple' ? 50 : key === 'absoluta' ? 50 : key === 'calificada' ? 67 : form.quorum_requerido
                  setForm(f => ({ ...f, tipo_quorum: key, quorum_requerido: pctVal }))
                }}
                className="text-left px-3 py-2 rounded-lg border-2 transition-all"
                style={{
                  borderColor:     form.tipo_quorum === key ? APP_CONFIG.colorPrimario : '#e5e7eb',
                  backgroundColor: form.tipo_quorum === key ? APP_CONFIG.colorPrimarioClaro : '#fff',
                }}>
                <p className="text-xs font-semibold"
                   style={{ color: form.tipo_quorum === key ? APP_CONFIG.colorPrimarioOscuro : '#333' }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: '#888' }}>{desc}</p>
              </button>
            ))}
          </div>
          {form.tipo_quorum === 'personalizado' && (
            <div className="mt-2 flex items-center gap-2">
              <input type="number" min={1} max={100} value={form.quorum_requerido}
                onChange={e => setForm(f => ({ ...f, quorum_requerido: Number(e.target.value) }))}
                className="w-20 border rounded-lg px-2 py-1.5 text-sm text-center" style={{ borderColor: '#ddd6cc' }} />
              <span className="text-sm text-muted-foreground">% de los socios</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fecha de cierre (opcional)</label>
            <input type="date" value={form.fecha_cierre} onChange={e => setForm(f => ({ ...f, fecha_cierre: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hora de cierre</label>
            <input type="time" value={form.hora_cierre} onChange={e => setForm(f => ({ ...f, hora_cierre: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1" style={{ borderColor: '#ddd6cc' }} />
          </div>
        </div>
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
          {guardando ? 'Guardando...' : 'Iniciar votación'}
        </button>
      </div>
    </div>
  )

  // ── Vista Lista ──
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        <Vote className="w-5 h-5 text-white" />
        <h1 className="text-white font-bold text-base flex-1">Votaciones</h1>
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
            <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
              Módulo de Votaciones
            </p>
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

      {votaciones.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Vote className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay votaciones creadas aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {votaciones.map(vot => {
            const estadoStyle = ESTADO_COLOR[vot.estado]
            return (
              <div key={vot.id} className="rounded-xl border p-4"
                   style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
                      {vot.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vot.tipo === 'anonima' ? '🔒 Anónima' : '📋 Nominada'} · Quórum{' '}
                      {vot.tipo_quorum === 'simple' ? '50%+1' : vot.tipo_quorum === 'calificada' ? '2/3' : `${vot.quorum_requerido}%`}{' '}
                      · {VISIBLE_PARA[vot.visible_para]}
                      {vot.fecha_cierre && ` · Cierra ${new Date(vot.fecha_cierre).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ backgroundColor: estadoStyle.bg, color: estadoStyle.text }}>
                    {vot.estado.charAt(0).toUpperCase() + vot.estado.slice(1)}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap mt-3">
                  <button onClick={() => verResultados(vot)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border font-medium"
                    style={{ borderColor: APP_CONFIG.colorPrimario, color: APP_CONFIG.colorPrimario }}>
                    <BarChart2 className="w-3 h-3" /> Resultados
                  </button>
                  {canManage && vot.estado === 'borrador' && (
                    <button onClick={() => cambiarEstado(vot.id, 'activa')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ backgroundColor: '#D4EDDA', color: '#155724' }}>
                      <CheckCircle className="w-3 h-3" /> Iniciar
                    </button>
                  )}
                  {canManage && vot.estado === 'activa' && (
                    <button onClick={() => cambiarEstado(vot.id, 'cerrada')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ backgroundColor: '#f8d7da', color: '#721c24' }}>
                      <XCircle className="w-3 h-3" /> Cerrar
                    </button>
                  )}
                  {canManage && vot.estado === 'cerrada' && (
                    <button onClick={() => cambiarEstado(vot.id, 'activa')}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ backgroundColor: '#D4EDDA', color: '#155724' }}>
                      <RefreshCw className="w-3 h-3" /> Reabrir
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
