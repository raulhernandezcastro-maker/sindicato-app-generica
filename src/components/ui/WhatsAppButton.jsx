import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../../config'

export default function WhatsAppButton() {
  const [abierto, setAbierto] = useState(false)
  const navigate = useNavigate()

  const waUrl = `https://wa.me/${APP_CONFIG.whatsappNumero}?text=${encodeURIComponent(APP_CONFIG.whatsappMensaje)}`

  const handleDenuncias = () => {
    setAbierto(false)
    if (APP_CONFIG.denunciasInterno) {
      navigate('/denuncias')
    } else {
      window.open(APP_CONFIG.denunciasUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      {/* Overlay para cerrar al hacer clic fuera */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9997 }}
        />
      )}

      <div style={{
        position: 'fixed', bottom: '80px', right: '16px', zIndex: 9998,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px',
      }}>

        {/* Opciones desplegadas */}
        {abierto && (
          <>
            {/* WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'speedDialIn 0.2s ease both' }}>
              <span style={{
                backgroundColor: '#fff', color: '#1a1a1a', fontSize: '13px', fontWeight: 500,
                padding: '5px 10px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
              }}>Contactar por WhatsApp</span>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAbierto(false)}
                style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  backgroundColor: '#25D366',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)', flexShrink: 0,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" fill="white">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.494 2.031 7.807L0 32l8.418-2.007A15.934 15.934 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.784-1.856l-.486-.288-5.002 1.194 1.217-4.878-.317-.501A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.862c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.265.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.199-1.682-.62-3.204-1.977-1.184-1.057-1.983-2.362-2.215-2.76-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.199-.232.265-.398.398-.664.133-.265.066-.497-.033-.697-.1-.199-.897-2.162-1.229-2.96-.324-.778-.653-.672-.897-.684l-.764-.013c-.265 0-.697.1-1.063.497-.365.398-1.394 1.362-1.394 3.325s1.427 3.856 1.626 4.122c.199.265 2.808 4.288 6.803 6.016.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.892.332-.93.332-1.727.232-1.892-.099-.166-.365-.265-.763-.464z"/>
                </svg>
              </a>
            </div>

            {/* Denuncias */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'speedDialIn 0.25s ease both' }}>
              <span style={{
                backgroundColor: '#fff', color: '#1a1a1a', fontSize: '13px', fontWeight: 500,
                padding: '5px 10px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
              }}>Canal de Denuncias</span>
              <button
                onClick={handleDenuncias}
                style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  backgroundColor: APP_CONFIG.colorPrimario,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)', flexShrink: 0,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                     fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Botón principal */}
        <button
          onClick={() => setAbierto(v => !v)}
          title="Contacto y Denuncias"
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            backgroundColor: APP_CONFIG.colorPrimario,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            transition: 'background-color 0.25s, transform 0.2s',
            transform: abierto ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          {abierto ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                 fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                 fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          )}
        </button>
      </div>

      <style>{`
        @keyframes speedDialIn {
          from { opacity: 0; transform: translateY(10px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
