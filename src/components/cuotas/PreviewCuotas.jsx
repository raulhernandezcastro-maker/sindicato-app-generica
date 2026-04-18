import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'

export default function PreviewCuotas({ periodo }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!periodo) {
      setRows([])
      return
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

  const load = async () => {
    setLoading(true)

    // Convertir YYYY-MM a YYYY-MM-01 para que coincida con lo guardado
    const periodoDate = `${periodo}-01`

    const { data, error } = await supabase
      .from('cuotas_importacion')
      .select('*')
      .eq('periodo', periodoDate)
      .in('estado', ['pendiente', 'sin_socio', 'error'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando preview cuotas:', error)
      setRows([])
    } else {
      setRows(data || [])
    }

    setLoading(false)
  }

  if (!periodo) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Seleccione un período para ver las cuotas
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          Cargando vista previa...
        </CardContent>
      </Card>
    )
  }

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No hay cuotas importadas para este período
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa de cuotas importadas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Observación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.rut}</TableCell>
                <TableCell>{r.nombre}</TableCell>
                <TableCell>{r.tipo}</TableCell>
                <TableCell>{r.periodo}</TableCell>
                <TableCell>${r.valor_pagado}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.estado === 'error' ? 'destructive'
                      : r.estado === 'sin_socio' ? 'outline'
                      : 'secondary'
                    }
                  >
                    {r.estado === 'sin_socio' ? 'sin socio' : r.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.observacion || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
