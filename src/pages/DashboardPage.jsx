import React, { useEffect, useState, useCallback } from 'react'
import { Users, UserCheck, FileText, FolderOpen, LayoutDashboard, TrendingUp, PieChart, UserX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/spinner'

const StatCard = ({ title, value, icon: Icon, color, bg, loading }) => (
  <div className="rounded-lg border overflow-hidden shadow-sm">
    <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#1e40af' }}>
      <Icon className="w-4 h-4 text-white" />
      <span className="text-white text-xs font-semibold">{title}</span>
    </div>
    <div className="px-4 py-5 flex items-center justify-between" style={{ backgroundColor: '#eff6ff' }}>
      {loading
        ? <div className="h-9 w-12 bg-blue-100 rounded animate-pulse" />
        : <span className="text-4xl font-bold" style={{ color }}>{value}</span>
      }
      <div className="p-3 rounded-full" style={{ backgroundColor: bg }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
  </div>
)

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSocios: 0, totalDirectores: 0, totalAportantes: 0, totalUsuarios: 0,
    sociosInactivos: 0,
    inactivosSocios: 0, inactivosDirectores: 0, inactivosAportantes: 0,
    totalAvisos: 0, totalDocumentos: 0,
  })
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)

      const [
        { data: rolesData },
        { data: perfilesData },
        { count: totalAvisos },
        { count: totalDocumentos },
      ] = await Promise.all([
        supabase.from('roles').select('user_id, role_name'),
        supabase.from('profiles').select('id, estado'),
        supabase.from('avisos').select('id', { count: 'exact' }),
        supabase.from('documentos').select('id', { count: 'exact' }),
      ])

      // Mapa de estado por user_id
      const estadoMap = {}
      ;(perfilesData || []).forEach(p => { estadoMap[p.id] = p.estado })

      // Agrupar roles por usuario
      const rolesMap = {}
      ;(rolesData || []).forEach(r => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = []
        rolesMap[r.user_id].push(r.role_name)
      })

      // Contar activos e inactivos por rol
      let totalSocios = 0, totalDirectores = 0, totalAportantes = 0
      let inactivosSocios = 0, inactivosDirectores = 0, inactivosAportantes = 0

      Object.entries(rolesMap).forEach(([userId, roles]) => {
        const activo = estadoMap[userId] === 'activo'

        // Administrador no se cuenta en ningún grupo
        if (roles.includes('administrador')) return

        if (activo) {
          if (roles.includes('director'))       totalDirectores++
          else if (roles.includes('aportante')) totalAportantes++
          else if (roles.includes('socio'))     totalSocios++
        } else {
          if (roles.includes('director'))       inactivosDirectores++
          else if (roles.includes('aportante')) inactivosAportantes++
          else if (roles.includes('socio'))     inactivosSocios++
        }
      })

      // Total Usuarios activos = Socios + Directores + Aportantes
      const totalUsuarios = totalSocios + totalDirectores + totalAportantes
      const sociosInactivos = inactivosSocios + inactivosDirectores + inactivosAportantes

      setStats({
        totalSocios, totalDirectores, totalAportantes, totalUsuarios,
        sociosInactivos,
        inactivosSocios, inactivosDirectores, inactivosAportantes,
        totalAvisos: totalAvisos || 0,
        totalDocumentos: totalDocumentos || 0,
      })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  // Socios Activos = Socios + Directores (ambos son socios vigentes)
  const sociosActivos = stats.totalSocios + stats.totalDirectores

  const porcentajeSocios = stats.totalUsuarios > 0
    ? Math.round((stats.totalSocios / stats.totalUsuarios) * 100)
    : 0

  const cardsUsuarios = [
    { title: 'Total Socios',            value: stats.totalSocios,     icon: UserCheck, color: '#1e40af', bg: '#dbeafe' },
    { title: 'Total Socios Directores', value: stats.totalDirectores, icon: Users,     color: '#1a5276', bg: '#d6eaf8' },
    { title: 'Total Aportantes',        value: stats.totalAportantes, icon: Users,     color: '#6c3483', bg: '#e8daef' },
    { title: 'Total Usuarios',          value: stats.totalUsuarios,   icon: Users,     color: '#d35400', bg: '#fdebd0' },
  ]

  const cardsContenido = [
    { title: 'Avisos Publicados', value: stats.totalAvisos,     icon: FileText,   color: '#1a5276', bg: '#d6eaf8' },
    { title: 'Documentos',        value: stats.totalDocumentos, icon: FolderOpen, color: '#d35400', bg: '#fdebd0' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Título */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#1e40af' }}>
        <LayoutDashboard className="w-5 h-5 text-white" />
        <div>
          <h1 className="text-xl font-bold text-white">Panel de Gestión</h1>
          <p className="text-xs text-blue-100">Estadísticas generales del sindicato</p>
        </div>
      </div>

      {/* Tarjetas de usuarios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsUsuarios.map(c => <StatCard key={c.title} {...c} loading={loading} />)}
      </div>

      {/* Tarjetas de contenido */}
      <div className="grid grid-cols-2 gap-4">
        {cardsContenido.map(c => <StatCard key={c.title} {...c} loading={loading} />)}
      </div>

      {/* Resumen */}
      {!loading && (
        <div className="rounded-lg border overflow-hidden shadow-sm">
          <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#1e40af' }}>
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">Resumen General</span>
          </div>
          <div className="p-5 space-y-1" style={{ backgroundColor: '#eff6ff' }}>

            {/* Socios Activos = Socios + Directores */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <span className="font-medium text-sm">Socios Activos</span>
                <span className="text-xs text-muted-foreground ml-2">(Socios + Directores)</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: '#1e40af' }}>{sociosActivos}</span>
            </div>

            {/* Inactivos — desglosados por rol */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <span className="font-medium text-sm">Dados de Baja</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({stats.inactivosSocios} socios
                  {stats.inactivosDirectores > 0 && ` · ${stats.inactivosDirectores} directores`}
                  {stats.inactivosAportantes > 0 && ` · ${stats.inactivosAportantes} aportantes`})
                </span>
              </div>
              <span className="text-2xl font-bold" style={{ color: '#c0392b' }}>{stats.sociosInactivos}</span>
            </div>

            {/* Porcentaje de Socios */}
            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" style={{ color: '#1e40af' }} />
                  <span className="font-semibold text-sm">Porcentaje de Socios</span>
                  <span className="text-xs text-muted-foreground">(Socios ÷ Total Usuarios)</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: '#1e40af' }}>{porcentajeSocios}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${porcentajeSocios}%`, backgroundColor: '#1e40af' }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{stats.totalSocios} socios</span>
                <span>{stats.totalUsuarios} usuarios totales</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
