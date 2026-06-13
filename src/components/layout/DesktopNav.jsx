import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, FileText, Scale, Gift, Handshake, User, Users,
  DollarSign, LayoutDashboard, LogOut, HelpCircle,
  ShieldAlert, ClipboardList, Vote, MessageSquare,
} from 'lucide-react'
import { APP_CONFIG } from '../../config'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export function DesktopNav() {
  const location = useLocation()
  const { isAdministrador, isDirector, signOut, profile } = useAuth()

  const socioLinks = [
    { to: '/',           icon: Home,          label: 'Inicio' },
    { to: '/avisos',     icon: FileText,      label: 'Avisos' },
    { to: '/beneficios', icon: Gift,          label: 'Beneficios' },
    { to: '/convenios',  icon: Handshake,     label: 'Convenios' },
    { to: '/leyes',      icon: Scale,         label: 'Leyes Laborales' },
    { to: '/encuestas',  icon: ClipboardList, label: 'Encuestas' },
    { to: '/votaciones', icon: Vote,          label: 'Votaciones' },
    { to: '/chat-beneficios', icon: MessageSquare, label: 'Chat Beneficios' },
    { to: '/perfil',     icon: User,          label: 'Mi Perfil' },
    { to: '/faq',        icon: HelpCircle,    label: 'Preguntas Frecuentes' },
  ]

  const directorLinks = [
    ...socioLinks,
    { to: '/dashboard',        icon: LayoutDashboard, label: 'Panel de Gestión' },
    { to: '/cuotas',           icon: DollarSign,      label: 'Cuotas' },
    { to: '/socios',           icon: Users,           label: 'Gestión de Socios' },
    { to: '/denuncias',        icon: ShieldAlert,     label: 'Denuncias' },
    { to: '/encuestas/admin',  icon: ClipboardList,   label: 'Encuestas Admin' },
    { to: '/votaciones/admin', icon: Vote,            label: 'Votaciones Admin' },
  ]

  const adminLinks = [ ...directorLinks ]

  const links = isAdministrador ? adminLinks : isDirector ? directorLinks : socioLinks

  const handleLogout = async () => {
    try { await signOut() } catch (e) { console.error(e) }
  }

  const getInitials = (nombre) => {
    if (!nombre) return 'U'
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r fixed left-0 top-0"
           style={{ backgroundColor: APP_CONFIG.colorPrimarioOscuro }}>

      {/* ── Logo + nombre sindicato ── */}
      <div className="p-4 border-b flex flex-col items-center gap-2"
           style={{ borderColor: `${APP_CONFIG.colorPrimario}60` }}>
        <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain rounded-full" />
        <div className="text-center">
          <p className="text-xs font-medium text-blue-100 leading-tight">
            {APP_CONFIG.nombreSindicato}
          </p>
          <p className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
             style={{ backgroundColor: APP_CONFIG.colorAcento, color: APP_CONFIG.colorTextoSobreAcento }}>
            {isAdministrador ? 'Administrador' : isDirector ? 'Director' : 'Socio'}
          </p>
        </div>
      </div>

      {/* ── Links de navegación ── */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive ? 'font-semibold' : 'text-blue-100 hover:text-white hover:bg-blue-700'
                )}
                style={isActive
                  ? { backgroundColor: APP_CONFIG.colorAcento, color: APP_CONFIG.colorTextoSobreAcento }
                  : {}}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── Usuario + cerrar sesión ── */}
      <div className="p-4 border-t space-y-3" style={{ borderColor: `${APP_CONFIG.colorPrimario}60` }}>
        <div className="flex items-center space-x-3 px-2">
          <Avatar>
            <AvatarImage src={profile?.foto_url} />
            <AvatarFallback style={{ backgroundColor: APP_CONFIG.colorAcento, color: APP_CONFIG.colorTextoSobreAcento }}>
              {getInitials(profile?.nombre)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{profile?.nombre}</p>
            <p className="text-xs truncate text-blue-200">{profile?.email}</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full text-white hover:text-white"
          style={{ borderColor: APP_CONFIG.colorAcento }}
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  )
}
