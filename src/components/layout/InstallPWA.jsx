import React, { useEffect, useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid, setShowAndroid]       = useState(false)
  const [showIOS, setShowIOS]               = useState(false)
  const [dismissed, setDismissed]           = useState(false)

  useEffect(() => {
    // Si ya fue descartado o instalado, no mostrar
    if (localStorage.getItem('pwa-dismissed')) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Detectar iOS (Safari)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isInStandalone = window.navigator.standalone === true
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isIOS && !isInStandalone && isSafari) {
      // Mostrar instrucciones iOS después de 3 segundos
      setTimeout(() => setShowIOS(true), 3000)
      return
    }

    // Android/Chrome: escuchar el evento beforeinstallprompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowAndroid(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowAndroid(false)
      localStorage.setItem('pwa-dismissed', 'true')
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowAndroid(false)
    setShowIOS(false)
    setDismissed(true)
    localStorage.setItem('pwa-dismissed', 'true')
  }

  // ── Banner Android ────────────────────────────────────────────────────────
  if (showAndroid && !dismissed) {
    return (
      <div
        className="fixed bottom-20 left-3 right-3 z-50 rounded-xl shadow-2xl overflow-hidden md:left-auto md:right-6 md:bottom-6 md:w-80"
        style={{ backgroundColor: '#1e40af' }}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden border-2 border-white/30">
            <img src="/icon-192.png" alt="App" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              Instala la app del Sindicato
            </p>
            <p className="text-blue-200 text-xs mt-0.5 leading-tight">
              Accede rápido desde tu pantalla de inicio
            </p>
          </div>
          <button onClick={handleDismiss} className="text-white/60 hover:text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleInstallAndroid}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}
          >
            <Download className="w-4 h-4" />
            Instalar ahora
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 rounded-lg text-xs text-blue-200 hover:text-white"
          >
            Ahora no
          </button>
        </div>
      </div>
    )
  }

  // ── Modal iOS ─────────────────────────────────────────────────────────────
  if (showIOS && !dismissed) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-4"
           style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between"
               style={{ backgroundColor: '#1e40af' }}>
            <div className="flex items-center gap-3">
              <img src="/icon-192.png" alt="App" className="w-10 h-10 rounded-xl border-2 border-white/30" />
              <div>
                <p className="text-white font-bold text-sm">Instala la app</p>
                <p className="text-blue-200 text-xs">Mi Sindicato Seguros</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pasos */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Sigue estos pasos para instalar la app en tu iPhone:
            </p>

            {/* Paso 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                   style={{ backgroundColor: '#1e40af' }}>1</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Toca el botón Compartir</p>
                <p className="text-xs text-gray-500 mt-0.5">El ícono de la barra inferior de Safari</p>
                <div className="mt-2 flex items-center justify-center w-10 h-10 rounded-lg border-2"
                     style={{ borderColor: '#1e40af' }}>
                  <Share className="w-5 h-5" style={{ color: '#1e40af' }} />
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                   style={{ backgroundColor: '#1e40af' }}>2</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Selecciona "Agregar a pantalla de inicio"</p>
                <p className="text-xs text-gray-500 mt-0.5">Desplázate hacia abajo en el menú</p>
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border"
                     style={{ borderColor: '#e5e7eb' }}>
                  <Plus className="w-4 h-4 text-gray-600" />
                  <span className="text-xs text-gray-700">Agregar a pantalla de inicio</span>
                </div>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                   style={{ backgroundColor: '#1e40af' }}>3</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Toca "Agregar"</p>
                <p className="text-xs text-gray-500 mt-0.5">La app aparecerá en tu pantalla de inicio</p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1e40af' }}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
