import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent } from "../ui/card";

export default function ResumenCuotas() {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({
    pendientes: 0,
    conError: 0,
    confirmadas: 0,
    sinSocio: 0,
  });

  useEffect(() => {
    cargarResumen();
  }, []);

  const cargarResumen = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("cuotas_importacion")
        .select("estado, estado_validacion");

      if (error) throw error;

      let pendientes = 0;
      let conError = 0;
      let confirmadas = 0;
      let sinSocio = 0;

      data.forEach((r) => {
        if (r.estado === "confirmado") {
          confirmadas++;
        } else if (r.estado === "sin_socio") {
          sinSocio++;
        } else if (r.estado_validacion === "error") {
          conError++;
        } else {
          pendientes++;
        }
      });

      setResumen({ pendientes, conError, confirmadas, sinSocio });
    } catch (err) {
      console.error("Error cargando resumen de cuotas:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6">Cargando…</CardContent></Card>
        <Card><CardContent className="p-6">Cargando…</CardContent></Card>
        <Card><CardContent className="p-6">Cargando…</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Cuotas Pendientes</p>
          <p className="text-3xl font-bold text-yellow-600">
            {resumen.pendientes}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Cuotas con Error</p>
          <p className="text-3xl font-bold text-red-600">
            {resumen.conError}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Sin Socio (en espera)</p>
          <p className="text-3xl font-bold text-orange-500">
            {resumen.sinSocio}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Cuotas Confirmadas</p>
          <p className="text-3xl font-bold text-blue-600">
            {resumen.confirmadas}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
