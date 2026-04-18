import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DesktopNav } from './DesktopNav'
import { MobileNav } from './MobileNav'
import { InstallPWA } from './InstallPWA'
import { useNotifications } from '../../hooks/useNotifications'

export function AppLayout() {
  // Registrar token FCM al cargar la app
  useNotifications()

  // Usar la ruta actual como key para forzar remonte de cada página
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      {/* Menú lateral escritorio */}
      <DesktopNav />

      {/* Menú móvil (incluye header superior + barra inferior + offsets) */}
      <MobileNav />

      {/* Banner instalación PWA */}
      <InstallPWA />

      {/* Contenido principal */}
      {/* pt-16 móvil = barra superior | pb-20 móvil = barra inferior */}
      <main className="md:ml-64 pt-20 pb-20 md:pt-0 md:pb-0">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Outlet key={location.pathname} />
        </div>
      </main>
    </div>
  )
}
