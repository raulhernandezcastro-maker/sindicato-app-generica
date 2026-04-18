import { APP_CONFIG } from '../../config'
import React from 'react'

const WHATSAPP_NUMBER = '56932076628'
const WHATSAPP_MESSAGE = encodeURIComponent('Hola, me contacto desde el portal del Mi Sindicato.')

export default function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Contactar al Sindicato por WhatsApp"
      style={{
        position: 'fixed',
        bottom: '80px',   // sobre la barra inferior móvil
        right: '16px',
        zIndex: 9999,
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        backgroundColor: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'
      }}
    >
      {/* WhatsApp SVG oficial */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width="28"
        height="28"
        fill="white"
      >
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.494 2.031 7.807L0 32l8.418-2.007A15.934 15.934 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.784-1.856l-.486-.288-5.002 1.194 1.217-4.878-.317-.501A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.862c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.265.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.199-1.682-.62-3.204-1.977-1.184-1.057-1.983-2.362-2.215-2.76-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.199-.232.265-.398.398-.664.133-.265.066-.497-.033-.697-.1-.199-.897-2.162-1.229-2.96-.324-.778-.653-.672-.897-.684l-.764-.013c-.265 0-.697.1-1.063.497-.365.398-1.394 1.362-1.394 3.325s1.427 3.856 1.626 4.122c.199.265 2.808 4.288 6.803 6.016.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.892.332-.93.332-1.727.232-1.892-.099-.166-.365-.265-.763-.464z"/>
      </svg>
    </a>
  )
}

