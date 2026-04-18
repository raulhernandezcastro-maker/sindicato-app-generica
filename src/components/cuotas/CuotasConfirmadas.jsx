import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function CuotasConfirmadas() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("cuotas_importacion")
      .select("*")
      .eq("estado", "confirmada")
      .order("created_at", { ascending: false });

    if (!error) {
      setRows(data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          Cargando cuotas confirmadas...
        </CardContent>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No hay cuotas confirmadas
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuotas Confirmadas</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.rut}</TableCell>
                <TableCell>{r.nombre}</TableCell>
                <TableCell>{r.tipo}</TableCell>
                <TableCell>{r.periodo}</TableCell>
                <TableCell>${r.valor_pagado}</TableCell>
                <TableCell>
                  <Badge variant="success">confirmada</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
