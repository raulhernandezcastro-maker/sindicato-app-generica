import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { History, BarChart2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Card, CardContent } from "../ui/card";
import { Spinner } from "../ui/spinner";

const formatPeriodo = (p) => {
  if (!p) return '-'
  const str = p.length === 7 ? p + '-01' : p
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}
const fmt   = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`
const TH    = ({ children, right }) => (
  <th className="px-3 py-2 text-xs font-semibold text-left whitespace-nowrap"
      style={{ backgroundColor: '#3b82f6', color: '#1e3a8a', textAlign: right ? 'right' : 'left' }}>
    {children}
  </th>
)
const TD    = ({ children, right, bold, accent }) => (
  <td className={`px-3 py-2 text-sm border-b ${bold ? 'font-bold' : ''}`}
      style={{ textAlign: right ? 'right' : 'left', color: accent ? '#1e40af' : undefined }}>
    {children}
  </td>
)

export default function TablaCuotasConfirmadas() {
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [periodo, setPeriodo]   = useState("")
  const [tipo, setTipo]         = useState("")
  const [busqueda, setBusqueda] = useState("")

  const [allRows, setAllRows] = useState([])

  // Al montar: cargar TODOS los datos (para resumen y detalle sin filtros)
  useEffect(() => { cargarTodo() }, [])

  // Al cambiar filtros: recargar solo el detalle
  useEffect(() => {
    if (allRows.length === 0) return  // esperar que allRows esté listo
    cargarDetalle()
  }, [periodo, tipo, allRows])

  const cargarTodo = async () => {
    setLoading(true)
    try {
      // Paginar para superar el límite de 1000 filas de Supabase
      let allData = []
      let from = 0
      const pageSize = 1000
      while (true) {
        const { data, error } = await supabase
          .from("cuotas_importacion")
          .select("*")
          .eq("estado", "confirmado")
          .order("periodo", { ascending: false })
          .range(from, from + pageSize - 1)
        if (error) { console.error("Error cargando cuotas:", error); break }
        if (!data || data.length === 0) break
        allData = [...allData, ...data]
        if (data.length < pageSize) break
        from += pageSize
      }
      setAllRows(allData)
      setRows(allData)
    } catch (err) {
      console.error("Error inesperado cargando cuotas:", err)
    } finally {
      setLoading(false)
    }
  }

  const cargarDetalle = () => {
    let filtradas = [...allRows]
    if (periodo) filtradas = filtradas.filter(r => r.periodo === `${periodo}-01`)
    if (tipo)    filtradas = filtradas.filter(r => r.tipo === tipo)
    setRows(filtradas)
  }

  const limpiarFiltros = () => { setPeriodo(""); setTipo(""); setBusqueda("") }

  // Resumen por período
  const resumenPorPeriodo = useMemo(() => {
    const map = {}
    // Si hay filtro de período o tipo, usar rows (filtrados); si no, usar allRows (todos)
    const source = (periodo || tipo) ? rows : allRows
    source.forEach(r => {
      const p = r.periodo || 'Sin período'
      if (!map[p]) map[p] = { periodo: p, cantSocios: 0, totalSocios: 0, cantAportantes: 0, totalAportantes: 0 }
      if (r.tipo === 'SOCIO') {
        map[p].cantSocios++
        map[p].totalSocios += Number(r.valor_pagado || 0)
      } else if (r.tipo === 'APORTANTE') {
        map[p].cantAportantes++
        map[p].totalAportantes += Number(r.valor_pagado || 0)
      }
    })
    return Object.values(map).sort((a, b) => b.periodo.localeCompare(a.periodo))
  }, [rows, allRows, periodo, tipo])

  const totalesGenerales = useMemo(() => ({
    cantSocios:      resumenPorPeriodo.reduce((s, r) => s + r.cantSocios, 0),
    totalSocios:     resumenPorPeriodo.reduce((s, r) => s + r.totalSocios, 0),
    cantAportantes:  resumenPorPeriodo.reduce((s, r) => s + r.cantAportantes, 0),
    totalAportantes: resumenPorPeriodo.reduce((s, r) => s + r.totalAportantes, 0),
  }), [resumenPorPeriodo])

  // Detalle filtrado
  const rowsFiltradas = useMemo(() => {
    return busqueda.trim()
      ? rows.filter(r => {
          const q = busqueda.toLowerCase()
          return r.rut?.toLowerCase().includes(q) || r.nombre?.toLowerCase().includes(q)
        })
      : rows
  }, [rows, busqueda])

  return (
    <div className="space-y-4">

      {/* ── Encabezado Histórico ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#1e40af' }}>
        <History className="w-5 h-5 text-white" />
        <h2 className="text-lg font-bold text-white">Histórico de Cuotas Confirmadas</h2>
      </div>

      {/* ── Resumen por Período ── */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: '#1e40af' }}>
          <BarChart2 className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Resumen por Período</span>
        </div>
        <div style={{ backgroundColor: '#eff6ff' }}>
          {loading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <TH>Período</TH>
                    <TH right>N° Socios</TH>
                    <TH right>Total Pagado Socios</TH>
                    <TH right>N° Aportantes</TH>
                    <TH right>Total Pagado Aportantes</TH>
                    <TH right>Total General</TH>
                  </tr>
                </thead>
                <tbody>
                  {resumenPorPeriodo.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-muted-foreground py-6 text-sm">Sin datos confirmados</td></tr>
                  ) : (
                    resumenPorPeriodo.map(r => (
                      <tr key={r.periodo} className="hover:bg-blue-50 transition-colors">
                        <TD><span className="font-medium">{formatPeriodo(r.periodo)}</span></TD>
                        <TD right>{r.cantSocios}</TD>
                        <TD right accent>{fmt(r.totalSocios)}</TD>
                        <TD right>{r.cantAportantes}</TD>
                        <TD right accent>{fmt(r.totalAportantes)}</TD>
                        <TD right bold accent>{fmt(r.totalSocios + r.totalAportantes)}</TD>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#1e40af' }}>
                    <td className="px-3 py-2 text-sm font-bold text-white">Total General</td>
                    <td className="px-3 py-2 text-sm font-bold text-white text-right">{totalesGenerales.cantSocios}</td>
                    <td className="px-3 py-2 text-sm font-bold text-white text-right">{fmt(totalesGenerales.totalSocios)}</td>
                    <td className="px-3 py-2 text-sm font-bold text-white text-right">{totalesGenerales.cantAportantes}</td>
                    <td className="px-3 py-2 text-sm font-bold text-white text-right">{fmt(totalesGenerales.totalAportantes)}</td>
                    <td className="px-3 py-2 text-sm font-bold text-white text-right">{fmt(totalesGenerales.totalSocios + totalesGenerales.totalAportantes)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Detalle ── */}
      <Card className="overflow-hidden">
        {/* Filtros */}
        <div className="p-4 space-y-3" style={{ backgroundColor: '#eff6ff' }}>
          {/* Fila 1: Período + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#1e40af' }}>Período</label>
              <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)}
                     className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none"
                     style={{ borderColor: '#1e40af' }} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#1e40af' }}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                      className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none"
                      style={{ borderColor: '#1e40af' }}>
                <option value="">Todos</option>
                <option value="SOCIO">Socio</option>
                <option value="APORTANTE">Aportante</option>
              </select>
            </div>
          </div>
          {/* Fila 2: Buscar + Limpiar */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold block mb-1" style={{ color: '#1e40af' }}>Buscar RUT o Nombre</label>
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                     placeholder="Ej: 12345678 o Juan"
                     className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none"
                     style={{ borderColor: '#1e40af' }} />
            </div>
            <button onClick={limpiarFiltros}
                    className="px-4 py-1.5 rounded text-sm font-medium border transition-colors hover:bg-blue-50 shrink-0"
                    style={{ borderColor: '#1e40af', color: '#1e40af' }}>
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla detalle */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-8 text-center"><Spinner /></div>
            ) : !rowsFiltradas.length ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No hay cuotas confirmadas para los filtros seleccionados
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <TH>RUT</TH>
                    <TH>Nombre</TH>
                    <TH>Tipo</TH>
                    <TH>Período</TH>
                    <TH right>Monto</TH>
                    <TH>Fecha</TH>
                  </tr>
                </thead>
                <tbody>
                  {rowsFiltradas.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                      <TD>{r.rut}</TD>
                      <TD>{r.nombre}</TD>
                      <TD>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: r.tipo === 'SOCIO' ? '#dbeafe' : '#d6eaf8',
                                color: r.tipo === 'SOCIO' ? '#1e40af' : '#1a5276'
                              }}>
                          {r.tipo}
                        </span>
                      </TD>
                      <TD>{formatPeriodo(r.periodo)}</TD>
                      <TD right accent>{fmt(r.valor_pagado)}</TD>
                      <TD>{r.created_at ? new Date(r.created_at).toLocaleDateString('es-CL') : '-'}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
