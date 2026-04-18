import { supabase } from '../lib/supabase'

/**
 * Normaliza RUT:
 * - sin puntos
 * - sin guión
 * - en minúsculas
 */
export const normalizarRut = (rut) => {
  if (!rut) return null
  return rut.toString().replace(/\./g, '').replace(/-/g, '').toLowerCase().trim()
}

/**
 * Convierte texto de periodo a formato YYYY-MM
 * Ej: "2025-01", "01-2025", "enero 2025"
 */
export const normalizarPeriodo = (periodo) => {
  return periodo?.toString().trim()
}

/**
 * Guarda cuotas desde Excel
 * @param {Array} filasExcel  Filas leídas desde XLSX
 * @param {String} periodo   Periodo seleccionado (YYYY-MM)
 */
export const guardarCuotasDesdeExcel = async (filasExcel, periodo) => {
  const resultados = {
    guardadas: [],
    rutNoExiste: [],
    rutInactivo: [],
    errores: []
  }

  for (const fila of filasExcel) {
    try {
      const rut = normalizarRut(fila.Rut)
      const tipo = fila.Tipo?.toLowerCase() // socio | aportante
      const valorPagado = Number(fila['Valor pagado'] || 0)
      const nombre = fila.Nombre?.toString().trim()

      if (!rut || !tipo || !valorPagado) {
        resultados.errores.push({ fila, error: 'Datos incompletos' })
        continue
      }

      // 1️⃣ Buscar socio/aportante por RUT
      const { data: persona, error: personaError } = await supabase
        .from('profiles')
        .select('id, estado')
        .eq('rut', rut)
        .single()

      if (personaError || !persona) {
        resultados.rutNoExiste.push({ rut, nombre, tipo, valorPagado })
        continue
      }

      if (persona.estado === 'inactivo') {
        resultados.rutInactivo.push({ rut, nombre, tipo, valorPagado })
        continue
      }

      // 2️⃣ Guardar cuota
      const { error: cuotaError } = await supabase
        .from('cuotas')
        .insert({
          profile_id: persona.id,
          rut,
          tipo,
          valor_pagado: valorPagado,
          periodo
        })

      if (cuotaError) throw cuotaError

      resultados.guardadas.push({ rut, valorPagado })
    } catch (err) {
      resultados.errores.push({ fila, error: err.message })
    }
  }

  return resultados
}
