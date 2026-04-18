import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, FileText, Scale, Gift, Handshake, User, Users,
  DollarSign, LayoutDashboard, LogOut, HelpCircle, Menu, X
} from 'lucide-react'
import { APP_CONFIG, COLORS } from '../../config'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

export function MobileNav() {
  const location  = useLocation()
  const { isAdministrador, isDirector, signOut, profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const socioLinks = [
    { to: '/',            icon: Home,            label: 'Inicio' },
    { to: '/avisos',      icon: FileText,        label: 'Avisos' },
    { to: '/beneficios',  icon: Gift,            label: 'Beneficios' },
    { to: '/convenios',   icon: Handshake,       label: 'Convenios' },
    { to: '/leyes',       icon: Scale,           label: 'Leyes' },
    { to: '/perfil',      icon: User,            label: 'Perfil' },
    { to: '/faq',         icon: HelpCircle,      label: 'Preguntas' },
  ]
  const directorLinks = [
    ...socioLinks,
    { to: '/dashboard',  icon: LayoutDashboard, label: 'Panel' },
    { to: '/cuotas',     icon: DollarSign,      label: 'Cuotas' },
    { to: '/socios',     icon: Users,           label: 'Socios' },
  ]
  const adminLinks = [
    ...directorLinks,
  ]

  const links = isAdministrador ? adminLinks : isDirector ? directorLinks : socioLinks

  // Links que caben en la barra inferior (máx 4)
  const barLinks = links.slice(0, 4)

  const handleLogout = async () => {
    try { await signOut() } catch (e) { console.error(e) }
  }

  return (
    <>
      {/* ── Barra superior móvil ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 border-b md:hidden"
              style={{ backgroundColor: '#1e40af', minHeight: '64px' }}>
        {/* Logo + nombre sindicato */}
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.png" alt="Logo" className="w-11 h-11 object-contain rounded-full shrink-0" />
          <div className="min-w-0">
            <p className="text-white text-sm font-bold leading-tight truncate">
              {APP_CONFIG.nombreSindicato}
            </p>
          </div>
        </div>

        {/* Nombre usuario + rol */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="text-right">
            <p className="text-white text-xs font-semibold leading-tight truncate max-w-[110px]">
              {profile?.nombre?.split(' ')[0]} {profile?.nombre?.split(' ')[2] || ''}
            </p>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}>
              {isAdministrador ? 'Admin' : isDirector ? 'Director' : 'Socio'}
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="text-white p-1 rounded shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>


      {/* ── Menú lateral deslizante (drawer) ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          {/* Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col shadow-xl"
               style={{ backgroundColor: '#1e40af' }}>

            {/* Header del panel */}
            <div className="flex items-center justify-between p-4 border-b border-blue-700">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-full" />
                <div>
                  <p className="text-white text-sm font-semibold">
                    {profile?.nombre || 'Usuario'}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#3b82f6', color: '#1e3a8a' }}>
                    {isAdministrador ? 'Administrador' : isDirector ? 'Director' : 'Socio'}
                  </span>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {links.map(({ to, icon: Icon, label }) => {
                const isActive = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium',
                      isActive ? 'text-blue-900' : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    )}
                    style={isActive ? { backgroundColor: '#3b82f6' } : {}}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Cerrar sesión — siempre visible */}
            <div className="p-4 border-t border-blue-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Barra inferior con accesos rápidos ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
           style={{ backgroundColor: '#1e40af' }}>
        <div className="flex items-center justify-around h-16">
          {barLinks.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors"
                style={isActive ? { color: '#3b82f6' } : { color: 'rgba(255,255,255,0.7)' }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            )
          })}
          {/* Botón menú completo en barra inferior */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">Más</span>
          </button>
        </div>
      </nav>

    </>
  )
}
