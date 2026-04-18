import { supabase } from '../lib/supabase'

export async function confirmarCuotaImportada(fila) {
  const {
    id,
    rut,
    nombre,
    tipo,
    monto,
    periodo
  } = fila

  try {
    /* ================= SOCIO ================= */
    if (tipo === 'SOCIO') {
      const { data: socio } = await supabase
        .from('socios')
        .select('*')
        .eq('rut', rut)
        .single()

      if (!socio) {
        await marcarError(id, 'Socio no existe')
        return { ok: false }
      }

      await supabase.from('cuotas').insert({
        socio_id: socio.id,
        monto,
        periodo,
        estado: 'pagado'
      })
    }

    /* ================= APORTANTE ================= */
    if (tipo === 'APORTANTE') {
      let { data: aportante } = await supabase
        .from('aportantes')
        .select('*')
        .eq('rut', rut)
        .single()

      if (!aportante) {
        const { data: nuevo } = await supabase
          .from('aportantes')
          .insert({ rut, nombre })
          .select()
          .single()

        aportante = nuevo
      }

      await supabase.from('aportes').insert({
        aportante_id: aportante.id,
        monto,
        periodo
      })
    }

    await supabase
      .from('cuotas_importacion')
      .update({ estado: 'confirmado' })
      .eq('id', id)

    return { ok: true }

  } catch (err) {
    console.error(err)
    await marcarError(id, 'Error al confirmar')
    return { ok: false }
  }
}

async function marcarError(id, observacion) {
  await supabase
    .from('cuotas_importacion')
    .update({
      estado: 'error',
      observacion
    })
    .eq('id', id)
}
