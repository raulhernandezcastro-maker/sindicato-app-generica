import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, ChevronRight, ArrowLeft, Send, RotateCcw,
  CalendarCheck, DollarSign, Gift, HeartPulse, FileSignature, Info,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/spinner'
import { APP_CONFIG } from '../config'
import { CONTRATO_MENU } from '../data/contratoMenu'

const ICONOS = {
  CalendarCheck, DollarSign, Gift, HeartPulse, FileSignature, Info,
}

// Pasos del flujo: 'temas' -> 'subtemas' -> 'chat'
export default function ContratoChatPage() {
  const { isAdministrador } = useAuth()
  const navigate = useNavigate()
  const [habilitado, setHabilitado] = useState(false)
  const [loading, setLoading]       = useState(true)

  const [paso, setPaso]           = useState('temas')
  const [temaActivo, setTemaActivo] = useState(null)
  const [subtemaActivo, setSubtemaActivo] = useState(null)

  const [mensajes, setMensajes]   = useState([])
  const [pregunta, setPregunta]   = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [error, setError]         = useState('')

  const scrollRef = useRef(null)

  useEffect(() => {
    const checkFlag = async () => {
      const { data } = await supabase
        .from('configuracion').select('valor')
        .eq('clave', 'chat_contrato_habilitado').single()
      setHabilitado(data?.valor === 'true')
      setLoading(false)
    }
    checkFlag()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes])

  const seleccionarTema = (tema) => {
    setTemaActivo(tema)
    setPaso('subtemas')
  }

  const seleccionarSubtema = (subtema) => {
    setSubtemaActivo(subtema)
    setMensajes([{
      tipo: 'sistema',
      texto: `Tema: ${temaActivo.label} → ${subtema.label}. Escribe tu pregunta específica y te responderé según el Convenio Colectivo.`,
    }])
    setPaso('chat')
  }

  const volverATemas = () => {
    setPaso('temas')
    setTemaActivo(null)
    setSubtemaActivo(null)
    setMensajes([])
    setError('')
  }

  const volverASubtemas = () => {
    setPaso('subtemas')
    setSubtemaActivo(null)
    setMensajes([])
    setError('')
  }

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!pregunta.trim() || enviando) return

    const textoPregunta = pregunta.trim()
    setMensajes(prev => [...prev, { tipo: 'usuario', texto: textoPregunta }])
    setPregunta('')
    setEnviando(true)
    setError('')

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`${supabaseUrl}/functions/v1/consulta-contrato`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          secciones: subtemaActivo.secciones,
          pregunta: textoPregunta,
          nombreSindicato: APP_CONFIG.nombreCorto,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ocurrió un error. Intenta nuevamente.')
        setMensajes(prev => prev.slice(0, -1))
        return
      }

      setMensajes(prev => [...prev, { tipo: 'asistente', texto: data.respuesta }])
    } catch (err) {
      console.error(err)
      setError('No se pudo conectar con el asistente. Intenta nuevamente.')
      setMensajes(prev => prev.slice(0, -1))
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  if (!habilitado) return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4 max-w-sm mx-auto">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, border: `2px solid ${APP_CONFIG.colorPrimario}` }}>
        <MessageSquare className="w-10 h-10" style={{ color: APP_CONFIG.colorPrimario }} />
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
        Chat de Beneficios no disponible
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
        Este módulo aún no está habilitado para {APP_CONFIG.nombreCorto}.
        {isAdministrador && ' Puedes activarlo desde Configuración.'}
      </p>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 pb-8">

      {/* Encabezado */}
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>
        {/* Volver a Beneficios — siempre visible */}
        <button
          onClick={() => navigate('/beneficios')}
          className="text-white/70 hover:text-white transition-colors flex-shrink-0"
          title="Volver a Beneficios"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <MessageSquare className="w-5 h-5 text-white flex-shrink-0" />
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Chat de Beneficios</h1>
          <p className="text-xs mt-0.5" style={{ color: APP_CONFIG.colorPrimarioClaro }}>
            Consulta tu Convenio Colectivo
          </p>
        </div>
        {/* Volver interno entre pasos */}
        {paso !== 'temas' && (
          <button onClick={paso === 'chat' ? volverASubtemas : volverATemas}
                  className="text-xs px-3 py-1 rounded-full bg-white/10 text-white flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Volver
          </button>
        )}
      </div>

      {/* ── Paso 1: Temas ── */}
      {paso === 'temas' && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">
            Elige el tema sobre el que quieres consultar:
          </p>
          {CONTRATO_MENU.map(tema => {
            const Icon = ICONOS[tema.icono] || Info
            return (
              <button key={tema.id} onClick={() => seleccionarTema(tema)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-md"
                style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro }}>
                  <Icon className="w-5 h-5" style={{ color: APP_CONFIG.colorPrimario }} />
                </div>
                <span className="flex-1 font-medium text-sm" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
                  {tema.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {/* ── Paso 2: Subtemas ── */}
      {paso === 'subtemas' && temaActivo && (
        <div className="space-y-2">
          <p className="text-sm font-semibold mb-2" style={{ color: APP_CONFIG.colorPrimarioOscuro }}>
            {temaActivo.label}
          </p>
          <p className="text-sm text-muted-foreground mb-2">¿Sobre qué te gustaría preguntar?</p>
          {temaActivo.subtemas.map(subtema => (
            <button key={subtema.id} onClick={() => seleccionarSubtema(subtema)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all hover:shadow-md"
              style={{ borderColor: '#ddd6cc', backgroundColor: '#fff' }}>
              <span className="flex-1 text-sm" style={{ color: '#333' }}>{subtema.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* ── Paso 3: Chat ── */}
      {paso === 'chat' && subtemaActivo && (
        <div className="flex flex-col" style={{ height: '60vh' }}>
          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 pb-3">
            {mensajes.map((m, i) => {
              if (m.tipo === 'sistema') return (
                <div key={i} className="text-center text-xs px-4 py-2 rounded-lg"
                     style={{ backgroundColor: APP_CONFIG.colorPrimarioClaro, color: APP_CONFIG.colorPrimarioOscuro }}>
                  {m.texto}
                </div>
              )
              const esUsuario = m.tipo === 'usuario'
              return (
                <div key={i} className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line"
                       style={{
                         backgroundColor: esUsuario ? APP_CONFIG.colorPrimario : '#f0f0f0',
                         color: esUsuario ? '#fff' : '#333',
                         borderRadius: esUsuario ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                       }}>
                    {m.texto}
                  </div>
                </div>
              )
            })}
            {enviando && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5" style={{ backgroundColor: '#f0f0f0', borderRadius: '16px 16px 16px 4px' }}>
                  <Spinner className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs mb-2" style={{ color: '#c0392b' }}>{error}</p>
          )}

          {/* Input */}
          <form onSubmit={handleEnviar} className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: '#eee' }}>
            <input
              type="text"
              value={pregunta}
              onChange={e => setPregunta(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={enviando}
              className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: '#ddd6cc' }}
            />
            <button type="submit" disabled={enviando || !pregunta.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: pregunta.trim() ? APP_CONFIG.colorPrimario : '#ccc',
                cursor: pregunta.trim() ? 'pointer' : 'not-allowed',
              }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>

          <button onClick={volverATemas}
            className="mt-2 flex items-center justify-center gap-1 text-xs py-2 rounded-full border"
            style={{ borderColor: '#ddd6cc', color: '#888' }}>
            <RotateCcw className="w-3 h-3" /> Empezar de nuevo
          </button>
        </div>
      )}

      <p className="text-center text-xs mt-4" style={{ color: '#999' }}>
        ℹ️ Esta es información referencial basada en el Convenio Colectivo. Para casos específicos, consulta directamente con la directiva del Sindicato.
      </p>
    </div>
  )
}
