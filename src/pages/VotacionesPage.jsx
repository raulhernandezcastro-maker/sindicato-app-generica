import React, { useEffect, useState, useCallback } from 'react'
import { Vote, CheckCircle, Clock, BarChart2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/spinner'
import { APP_CONFIG } from '../config'

async function generarHash(userId, votacionId) {
  const data = new TextEncoder().encode(`voto:${userId}:${votacionId}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function calcularQuorumRequerido(votacion, totalSocios) {
  const tipo = votacion.tipo_quorum || 'simple'
  if (tipo === 'simple')    return Math.floor(totalSocios / 2) + 1
  if (tipo === 'calificada') return Math.ceil(totalSocios * 2 / 3)
  return Math.ceil(totalSocios * (votacion.quorum_requerido / 100))
}

const VOTOS = [
  { valor: 'favor',      emoji: '✅', label: 'A favor',    bg: '#D4EDDA', color: '#155724', border: '#C3E6CB' },
  { valor: 'contra',     emoji: '❌', label: 'En contra',  bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
  { valor: 'abstencion', emoji: '⬜', label: 'Abstención', bg: '#f0f0f0', color: '#555',    border: '#ddd'    },
]

export default function VotacionesPage() {
  const { user, isAdministrador, isDirector } = useAuth()
  const puedeVotar    = !isAdministrador
  const puedeVerAdmin = isAdministrador || isDirector

  const [habilitado, setHabilitado]           = useState(false)
  const [loading, setLoading]                 = useState(true)
  const [votacion, setVotacion]               = useState(null)
  const [yaVoto, setYaVoto]                   = useState(false)
  const [conteos, setConteos]                 = useState({ favor: 0, contra: 0, abstencion: 0, total: 0 })
  const [totalSocios, setTotalSocios]         = useState(0)
  const [votoSeleccionado, setVotoSeleccionado] = useState(null)
  const [enviando, setEnviando]               = useState(false)
  const [enviado, setEnviado]                 = useState(false)
  const [error, setError]                     = useState('')
  const [tiempoRestante, setTiempoRestante]   = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)

    const { data: config } = await supabase
      .from('configuracion').select('valor')
      .eq('clave', 'votaciones_habilitadas').single()

    if (!config || config.valor !== 'true') { setHabilitado(false); setLoading(false); return }
    setHabilitado(true)

    // Buscar votación activa o cerrada+publicada
    const { data: activa } = await supabase
      .from('votaciones').select('*')
      .eq('estado', 'activa')
      .order('created_at', { ascending: false })
      .limit(1).single()

    let vot = activa
    if (!vot) {
      const { data: cerrada } = await supabase
        .from('votaciones').select('*')
        .eq('estado', 'cerrada')
        .eq('resultado_publicado', true)
        .order('updated_at', { ascending: false })
        .limit(1).single()
      vot = cerrada
    }

    if (!vot) { setLoading(false); return }
    setVotacion(vot)

    const hash = await generarHash(user.id, vot.id)
    const { data: emitida } = await supabase
      .from('votaciones_emitidas').select('id').eq('hash', hash).single()
    if (emitida) setYaVoto(true)

    const { data: votos } = await supabase
      .from('votos').select('voto').eq('votacion_id', vot.id)
    const c = { favor: 0, contra: 0, abstencion: 0, total: votos?.length || 0 }
    votos?.forEach(v => { if (c[v.voto] !== undefined) c[v.voto]++ })
    setConteos(c)

    const { count } = await supabase
      .from('profiles').select('id', { count: 'exact', head: true }).eq('estado', 'activo')
    setTotalSocios(count || 0)

    setLoading(false)
  }, [user])

  useEffect(() => { cargar() }, [cargar])

  // Contador regresivo
  useEffect(() => {
    if (!votacion?.fecha_cierre) return
    const interval = setInterval(() => {
      const diff = new Date(votacion.fecha_cierre) - new Date()
      if (diff <= 0) { setTiempoRestante('Votación cerrada'); clearInterval(interval); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTiempoRestante(`${h}h ${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(interval)
  }, [votacion])

  const handleVotar = async () => {
    if (!votoSeleccionado) { setError('Selecciona una opción para votar'); return }
    setEnviando(true); setError('')
    try {
      await supabase.from('votos').insert({ votacion_id: votacion.id, voto: votoSeleccionado })
      const hash = await generarHash(user.id, votacion.id)
      await supabase.from('votaciones_emitidas').insert({ hash, votacion_id: votacion.id })
      setEnviado(true)
      await cargar()
    } catch {
      setError('Error al registrar tu voto. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  const pct = (n) => conteos.total > 0 ? Math.round((n / conteos.total) * 100) : 0
  const quorumReq      = votacion ? calcularQuorumRequerido(votacion, totalSocios) : 0
  const quorumAlcanzado = conteos.total >= quorumReq
  const aprobada       = conteos.favor > conteos.contra
  const esCerrada      = votacion?.estado === 'cerrada'

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  if (!habilitado || !votacion) return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4 max-w-sm mx-auto">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, border: `2px solid ${APP_CONFIG.colorPrimario}` }}>
        <Vote className="w-10 h-10" style={{ color: APP_CONFIG.colorPrimario }} />
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
        No hay votaciones activas
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
        Por el momento no hay votaciones en curso. Cuando {APP_CONFIG.nombreCorto} convoque
        una votación, recibirás una notificación para que puedas emitir tu voto.
      </p>
      <div className="mt-4 px-4 py-3 rounded-lg text-xs"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, color: APP_CONFIG.colorPrimario }}>
        🔔 Te avisaremos cuando haya una nueva votación
      </div>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 pb-8 space-y-4">

      {/* Encabezado */}
      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        <div className="flex items-start gap-3">
          <Vote className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h1 className="text-white font-bold text-base leading-tight">{votacion.titulo}</h1>
            {votacion.descripcion && (
              <p className="text-xs mt-1" style={{ color: APP_CONFIG.colorPrimarioClaro }}>
                {votacion.descripcion}
              </p>
            )}
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: esCerrada ? '#f8d7da' : APP_CONFIG.colorPrimario, color: esCerrada ? '#721c24' : '#fff' }}>
            {esCerrada ? '🔒 Cerrada' : votacion.tipo === 'anonima' ? '🔒 Anónima' : '📋 Nominada'}
          </span>
        </div>
      </div>

      {/* Tiempo restante */}
      {tiempoRestante && !esCerrada && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
             style={{ backgroundColor: '#FFF3CD', color: '#856404' }}>
          <Clock className="w-4 h-4" />
          <span>Tiempo restante: <strong>{tiempoRestante}</strong></span>
        </div>
      )}

      {/* Resultado final (votación cerrada y publicada) */}
      {esCerrada && (
        <div className="rounded-xl border p-4 space-y-3"
             style={{ borderColor: quorumAlcanzado && aprobada ? '#C3E6CB' : quorumAlcanzado ? '#f5c6cb' : '#ddd6cc', backgroundColor: '#fff' }}>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" style={{ color: APP_CONFIG.colorPrimario }} />
            <p className="font-semibold text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>Resultado Final</p>
          </div>

          {quorumAlcanzado ? (
            <div className="p-3 rounded-lg text-center font-bold text-sm"
                 style={{ backgroundColor: aprobada ? '#D4EDDA' : '#f8d7da', color: aprobada ? '#155724' : '#721c24' }}>
              {aprobada ? '✅ Moción APROBADA' : '❌ Moción RECHAZADA'}
            </div>
          ) : (
            <div className="p-3 rounded-lg text-center text-sm"
                 style={{ backgroundColor: '#FFF3CD', color: '#856404' }}>
              ⚠️ No se alcanzó el quórum requerido
            </div>
          )}

          {VOTOS.map(({ valor, emoji, label, color }) => (
            <div key={valor}>
              <div className="flex justify-between text-sm mb-1">
                <span>{emoji} {label}</span>
                <span className="font-bold">{conteos[valor]} votos ({pct(conteos[valor])}%)</span>
              </div>
              <div className="w-full rounded-full h-2.5" style={{ backgroundColor: '#e5e7eb' }}>
                <div className="h-2.5 rounded-full" style={{ width: `${pct(conteos[valor])}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}

          <p className="text-xs text-center text-muted-foreground">
            Total votos emitidos: {conteos.total} de {quorumReq} requeridos
          </p>
        </div>
      )}

      {/* Resultados parciales (solo directores y admin mientras está activa) */}
      {!esCerrada && puedeVerAdmin && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
              Resultados en tiempo real
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: quorumAlcanzado ? '#D4EDDA' : '#FFF3CD', color: quorumAlcanzado ? '#155724' : '#856404' }}>
              {conteos.total} / {quorumReq} votos
            </span>
          </div>
          {VOTOS.map(({ valor, emoji, label, color }) => (
            <div key={valor}>
              <div className="flex justify-between text-xs mb-1">
                <span>{emoji} {label}</span>
                <span className="font-semibold">{conteos[valor]} ({pct(conteos[valor])}%)</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: '#e5e7eb' }}>
                <div className="h-2 rounded-full" style={{ width: `${pct(conteos[valor])}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
          {quorumAlcanzado && (
            <div className="p-2 rounded-lg text-center text-xs font-bold"
                 style={{ backgroundColor: aprobada ? '#D4EDDA' : '#f8d7da', color: aprobada ? '#155724' : '#721c24' }}>
              {aprobada ? '✅ Moción APROBADA' : '❌ Moción RECHAZADA'}
            </div>
          )}
        </div>
      )}

      {/* Sección de voto */}
      {!esCerrada && puedeVotar && (
        <>
          {(yaVoto || enviado) ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                   style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, border: `2px solid ${APP_CONFIG.colorPrimario}` }}>
                <CheckCircle className="w-8 h-8" style={{ color: APP_CONFIG.colorPrimario }} />
              </div>
              <p className="font-bold" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>¡Voto registrado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tu voto ha sido registrado de forma anónima y segura.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
              <p className="text-sm font-semibold" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>Emite tu voto</p>
              {VOTOS.map(({ valor, emoji, label, bg, color }) => (
                <button key={valor} onClick={() => setVotoSeleccionado(valor)}
                  className="w-full py-4 rounded-xl border-2 text-base font-semibold transition-all"
                  style={{
                    borderColor:     votoSeleccionado === valor ? color : '#e5e7eb',
                    backgroundColor: votoSeleccionado === valor ? bg : '#fff',
                    color:           votoSeleccionado === valor ? color : '#555',
                  }}>
                  {emoji} {label}
                </button>
              ))}
              {error && <p className="text-sm" style={{ color: '#c0392b' }}>{error}</p>}
              <button onClick={handleVotar} disabled={!votoSeleccionado || enviando}
                className="w-full py-3 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: votoSeleccionado ? APP_CONFIG.colorPrimarioOscuro : '#ccc', cursor: votoSeleccionado ? 'pointer' : 'not-allowed' }}>
                {enviando ? 'Registrando voto...' : 'Confirmar voto'}
              </button>
              <p className="text-center text-xs" style={{ color: '#999' }}>
                🔒 Tu voto es anónimo y no puede ser modificado una vez emitido
              </p>
            </div>
          )}
        </>
      )}

      {/* Admin no vota */}
      {!esCerrada && isAdministrador && !isDirector && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Como administrador, puedes ver los resultados pero no emitir voto.
        </div>
      )}
    </div>
  )
}
