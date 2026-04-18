import { useState } from 'react'
import { DollarSign, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ResumenCuotas from '../components/cuotas/ResumenCuotas'
import CargaCuotasExcel from '../components/cuotas/CargaCuotasExcel'
import PreviewCuotas from '../components/cuotas/PreviewCuotas'
import ConfirmarCuotas from '../components/cuotas/ConfirmarCuotas'
import TablaCuotasConfirmadas from '../components/cuotas/TablaCuotasConfirmadas'

export default function CuotasPage() {
  const { isAdministrador } = useAuth()
  const [periodo, setPeriodo] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleProcesado = () => setRefreshKey(k => k + 1)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Título */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#1e40af' }}>
        <DollarSign className="w-5 h-5 text-white" />
        <div>
          <h1 className="text-xl font-bold text-white">Gestión de Cuotas</h1>
          <p className="text-xs text-blue-100">
            {isAdministrador ? 'Carga, validación y confirmación de cuotas' : 'Consulta de cuotas'}
          </p>
        </div>
      </div>

      {/* Resumen */}
      <ResumenCuotas key={refreshKey} />

      {/* Solo Administrador: Período, Carga, Preview y Confirmación */}
      {isAdministrador && (
        <>
          {/* Período */}
          <div className="rounded-lg border overflow-hidden shadow-sm">
            <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#1e40af' }}>
              <Calendar className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">Período a cargar</span>
            </div>
            <div className="p-4" style={{ backgroundColor: '#eff6ff' }}>
              <input
                type="month"
                value={periodo}
                onChange={e => setPeriodo(e.target.value)}
                className="border rounded px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: '#1e40af' }}
              />
            </div>
          </div>

          {/* Carga Excel */}
          <CargaCuotasExcel periodo={periodo} onProcesado={handleProcesado} />

          {/* Preview */}
          <PreviewCuotas periodo={periodo} key={`preview-${refreshKey}`} />

          {/* Confirmación */}
          <ConfirmarCuotas onFinish={handleProcesado} />
        </>
      )}

      {/* Histórico — visible para todos */}
      <TablaCuotasConfirmadas key={`tabla-${refreshKey}`} />

    </div>
  )
}
