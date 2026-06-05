import React, { useEffect, useState, useCallback } from 'react'
import { ClipboardList, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/spinner'
import { APP_CONFIG } from '../config'

// Hash anónimo: combina user_id + encuesta_id sin revelar identidad
async function generarHash(userId, encuestaId) {
  const data = new TextEncoder().encode(`${userId}:${encuestaId}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const ESCALA = [1, 2, 3, 4, 5]
const ESCALA_LABEL = { 1: 'Muy malo', 2: 'Malo', 3: 'Regular', 4: 'Bueno', 5: 'Muy bueno' }

export default function EncuestasPage() {
  const { user } = useAuth()
  const [habilitado, setHabilitado]   = useState(false)
  const [loading, setLoading]         = useState(true)
  const [encuesta, setEncuesta]       = useState(null)
  const [preguntas, setPreguntas]     = useState([])
  const [yaRespondio, setYaRespondio] = useState(false)
  const [respuestas, setRespuestas]   = useState({})
  const [paso, setPaso]               = useState(0)
  const [enviando, setEnviando]       = useState(false)
  const [enviado, setEnviado]         = useState(false)
  const [error, setError]             = useState('')

  const cargarEncuesta = useCallback(async () => {
    setLoading(true)

    // Verificar feature flag
    const { data: config } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'encuestas_habilitadas')
      .single()

    if (!config || config.valor !== 'true') {
      setHabilitado(false)
      setLoading(false)
      return
    }
    setHabilitado(true)

    // Buscar encuesta activa
    const { data: enc } = await supabase
      .from('encuestas')
      .select('*')
      .eq('estado', 'activa')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!enc) { setLoading(false); return }
    setEncuesta(enc)

    // Verificar si ya respondió
    const hash = await generarHash(user.id, enc.id)
    const { data: resp } = await supabase
      .from('encuestas_respondidas')
      .select('id')
      .eq('hash', hash)
      .single()

    if (resp) { setYaRespondio(true); setLoading(false); return }

    // Cargar preguntas
    const { data: preg } = await supabase
      .from('preguntas_encuesta')
      .select('*')
      .eq('encuesta_id', enc.id)
      .order('orden')

    setPreguntas(preg || [])
    setLoading(false)
  }, [user])

  useEffect(() => { cargarEncuesta() }, [cargarEncuesta])

  const preguntaActual = preguntas[paso]
  const totalPreguntas = preguntas.length
  const progreso = totalPreguntas > 0 ? Math.round((paso / totalPreguntas) * 100) : 0

  const setRespuesta = (preguntaId, valor) =>
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }))

  const puedeAvanzar = () => {
    if (!preguntaActual) return false
    if (!preguntaActual.obligatoria) return true
    return !!respuestas[preguntaActual.id]
  }

  const handleEnviar = async () => {
    const faltantes = preguntas.filter(p => p.obligatoria && !respuestas[p.id])
    if (faltantes.length > 0) { setError('Por favor responde todas las preguntas obligatorias.'); return }

    setEnviando(true)
    setError('')
    try {
      const rows = Object.entries(respuestas).map(([pregunta_id, respuesta]) => ({
        encuesta_id: encuesta.id,
        pregunta_id,
        respuesta: String(respuesta),
      }))
      await supabase.from('respuestas_encuesta').insert(rows)

      const hash = await generarHash(user.id, encuesta.id)
      await supabase.from('encuestas_respondidas').insert({ hash, encuesta_id: encuesta.id })

      setEnviado(true)
    } catch {
      setError('Error al enviar. Intenta nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  if (!habilitado || !encuesta) return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4 max-w-sm mx-auto">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
           style={{ backgroundColor: `${APP_CONFIG.colorPrimarioClaro}`, border: `2px solid ${APP_CONFIG.colorPrimario}` }}>
        <ClipboardList className="w-10 h-10" style={{ color: APP_CONFIG.colorPrimario }} />
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
        No hay encuestas activas
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
        Por el momento no tenemos encuestas disponibles. Cuando {APP_CONFIG.nombreCorto} publique
        una nueva encuesta, recibirás una notificación para que puedas participar.
      </p>
      <div className="mt-4 px-4 py-3 rounded-lg text-xs"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, color: APP_CONFIG.colorPrimario }}>
        🔔 Te avisaremos cuando haya una nueva encuesta
      </div>
    </div>
  )

  if (yaRespondio || enviado) return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4 max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, border: `2px solid ${APP_CONFIG.colorPrimario}` }}>
        <CheckCircle className="w-10 h-10" style={{ color: APP_CONFIG.colorPrimario }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
        {enviado ? '¡Gracias por participar!' : 'Ya respondiste esta encuesta'}
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {enviado
          ? `Tu respuesta ha sido registrada de forma anónima y confidencial. Tu opinión es muy importante para ${APP_CONFIG.nombreCorto}.`
          : 'Ya enviaste tus respuestas para esta encuesta. Cuando haya una nueva encuesta disponible, te notificaremos.'}
      </p>
      <div className="mt-4 px-4 py-3 rounded-lg text-xs"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, color: APP_CONFIG.colorPrimario }}>
        🔒 Tus respuestas son completamente anónimas. Nadie puede identificar quién respondió qué.
      </div>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 pb-8">

      {/* Encabezado */}
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        <ClipboardList className="w-5 h-5 text-white flex-shrink-0" />
        <div>
          <h1 className="text-white font-bold text-base leading-tight">{encuesta.titulo}</h1>
          {encuesta.descripcion && (
            <p className="text-xs mt-0.5" style={{ color: APP_CONFIG.colorPrimarioClaro }}>
              {encuesta.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Pregunta {paso + 1} de {totalPreguntas}</span>
          <span>{progreso}% completado</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ backgroundColor: '#e5e7eb' }}>
          <div className="h-2 rounded-full transition-all"
               style={{ width: `${progreso}%`, backgroundColor: APP_CONFIG.colorPrimario }} />
        </div>
      </div>

      {/* Pregunta actual */}
      {preguntaActual && (
        <div className="rounded-xl border p-5 mb-4" style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
          <p className="font-semibold text-base mb-1" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
            {preguntaActual.texto}
            {preguntaActual.obligatoria && <span style={{ color: '#c0392b' }}> *</span>}
          </p>
          {!preguntaActual.obligatoria && <p className="text-xs text-muted-foreground mb-3">Opcional</p>}

          {/* Escala 1-5 */}
          {preguntaActual.tipo === 'escala' && (
            <div className="mt-3">
              <div className="flex justify-between gap-2">
                {ESCALA.map(n => (
                  <button key={n} onClick={() => setRespuesta(preguntaActual.id, n)}
                    className="flex-1 py-3 rounded-xl border-2 font-bold text-lg transition-all"
                    style={{
                      borderColor:     respuestas[preguntaActual.id] === n ? APP_CONFIG.colorPrimario : '#e5e7eb',
                      backgroundColor: respuestas[preguntaActual.id] === n ? APP_CONFIG.colorPrimario : '#fff',
                      color:           respuestas[preguntaActual.id] === n ? '#fff' : '#555',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                <span>Muy malo</span><span>Muy bueno</span>
              </div>
              {respuestas[preguntaActual.id] && (
                <p className="text-center text-sm font-medium mt-2" style={{ color: APP_CONFIG.colorPrimario }}>
                  {ESCALA_LABEL[respuestas[preguntaActual.id]]}
                </p>
              )}
            </div>
          )}

          {/* Sí / No */}
          {preguntaActual.tipo === 'si_no' && (
            <div className="flex gap-3 mt-3">
              {['Sí', 'No'].map(op => (
                <button key={op} onClick={() => setRespuesta(preguntaActual.id, op)}
                  className="flex-1 py-3 rounded-xl border-2 font-semibold transition-all"
                  style={{
                    borderColor:     respuestas[preguntaActual.id] === op ? APP_CONFIG.colorPrimario : '#e5e7eb',
                    backgroundColor: respuestas[preguntaActual.id] === op ? APP_CONFIG.colorPrimario : '#fff',
                    color:           respuestas[preguntaActual.id] === op ? '#fff' : '#555',
                  }}>
                  {op}
                </button>
              ))}
            </div>
          )}

          {/* Opción múltiple */}
          {preguntaActual.tipo === 'opcion_multiple' && preguntaActual.opciones && (
            <div className="flex flex-col gap-2 mt-3">
              {preguntaActual.opciones.map((op, i) => (
                <button key={i} onClick={() => setRespuesta(preguntaActual.id, op)}
                  className="text-left px-4 py-3 rounded-xl border-2 text-sm transition-all"
                  style={{
                    borderColor:     respuestas[preguntaActual.id] === op ? APP_CONFIG.colorPrimario : '#e5e7eb',
                    backgroundColor: respuestas[preguntaActual.id] === op ? APP_CONFIG.colorPrimarioClaro : '#fff',
                    color:           respuestas[preguntaActual.id] === op ? APP_CONFIG.colorPrimarioOscuro : '#555',
                    fontWeight:      respuestas[preguntaActual.id] === op ? 600 : 400,
                  }}>
                  {op}
                </button>
              ))}
            </div>
          )}

          {/* Texto libre */}
          {preguntaActual.tipo === 'texto_libre' && (
            <textarea
              value={respuestas[preguntaActual.id] || ''}
              onChange={e => setRespuesta(preguntaActual.id, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              rows={4}
              className="w-full mt-3 border rounded-xl p-3 text-sm resize-none focus:outline-none"
              style={{ borderColor: '#ddd6cc', fontFamily: 'inherit' }}
            />
          )}
        </div>
      )}

      {error && <p className="text-sm mb-3" style={{ color: '#c0392b' }}>{error}</p>}

      {/* Navegación */}
      <div className="flex gap-3">
        {paso > 0 && (
          <button onClick={() => setPaso(p => p - 1)}
            className="flex items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium"
            style={{ borderColor: '#ddd6cc', color: '#555' }}>
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
        )}

        {paso < totalPreguntas - 1 ? (
          <button onClick={() => { if (puedeAvanzar()) setPaso(p => p + 1) }}
            disabled={!puedeAvanzar()}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: puedeAvanzar() ? APP_CONFIG.colorPrimario : '#ccc',
              color: '#fff',
              cursor: puedeAvanzar() ? 'pointer' : 'not-allowed',
            }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleEnviar} disabled={enviando || !puedeAvanzar()}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: puedeAvanzar() ? APP_CONFIG.colorPrimarioOscuro : '#ccc',
              color: '#fff',
              cursor: puedeAvanzar() ? 'pointer' : 'not-allowed',
            }}>
            {enviando ? 'Enviando...' : 'Enviar respuestas'}
          </button>
        )}
      </div>

      <p className="text-center text-xs mt-4" style={{ color: '#999' }}>
        🔒 Tus respuestas son anónimas y confidenciales
      </p>
    </div>
  )
}
