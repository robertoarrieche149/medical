import { supabase } from '../lib/supabaseClient'

// ─── CITAS ────────────────────────────────────────────────────

export async function getCitasByFecha(fechaInicio, fechaFin, medicoId = null) {
  let query = supabase
    .from('citas')
    .select(`
      *,
      paciente:paciente_id (id, nombre, apellido, cedula, telefono),
      medico:medico_id (id, nombre, apellido)
    `)
    .gte('fecha_hora', fechaInicio)
    .lte('fecha_hora', fechaFin)
    .order('fecha_hora', { ascending: true })

  if (medicoId) {
    query = query.eq('medico_id', medicoId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getCitaById(id) {
  const { data, error } = await supabase
    .from('citas')
    .select(`
      *,
      paciente:paciente_id (*),
      medico:medico_id (id, nombre, apellido),
      asistente:asistente_id (id, nombre, apellido)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Verifica si hay traslape de horario para un médico.
 * Retorna true si hay conflicto.
 */
export async function verificarTraslape(medicoId, fechaHora, duracionMinutos, excluirId = null) {
  const inicio = new Date(fechaHora)
  const fin = new Date(inicio.getTime() + duracionMinutos * 60000)

  let query = supabase
    .from('citas')
    .select('id, fecha_hora, duracion_minutos')
    .eq('medico_id', medicoId)
    .in('estado', ['programada', 'confirmada'])
    .gte('fecha_hora', new Date(inicio.getTime() - 8 * 60 * 60000).toISOString())
    .lte('fecha_hora', fin.toISOString())

  if (excluirId) {
    query = query.neq('id', excluirId)
  }

  const { data, error } = await query
  if (error) throw error

  // Verificar traslape real
  for (const cita of data) {
    const citaInicio = new Date(cita.fecha_hora)
    const citaFin = new Date(citaInicio.getTime() + cita.duracion_minutos * 60000)
    if (inicio < citaFin && fin > citaInicio) return true
  }
  return false
}

export async function createCita(cita) {
  const traslape = await verificarTraslape(
    cita.medico_id,
    cita.fecha_hora,
    cita.duracion_minutos ?? 30
  )
  if (traslape) {
    throw new Error('Ya existe una cita en ese horario para el médico seleccionado.')
  }

  const { data, error } = await supabase
    .from('citas')
    .insert([cita])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCita(id, updates) {
  if (updates.fecha_hora || updates.duracion_minutos) {
    const citaActual = await getCitaById(id)
    const traslape = await verificarTraslape(
      updates.medico_id ?? citaActual.medico_id,
      updates.fecha_hora ?? citaActual.fecha_hora,
      updates.duracion_minutos ?? citaActual.duracion_minutos,
      id
    )
    if (traslape) {
      throw new Error('Ya existe una cita en ese horario para el médico seleccionado.')
    }
  }

  const { data, error } = await supabase
    .from('citas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelarCita(id, motivo) {
  return updateCita(id, { estado: 'cancelada', motivo_cancelacion: motivo })
}

export async function getResumenDia(fecha, medicoId = null) {
  const inicio = new Date(fecha)
  inicio.setHours(0, 0, 0, 0)
  const fin = new Date(fecha)
  fin.setHours(23, 59, 59, 999)

  const citas = await getCitasByFecha(inicio.toISOString(), fin.toISOString(), medicoId)

  return {
    total: citas.length,
    programadas: citas.filter(c => c.estado === 'programada').length,
    confirmadas: citas.filter(c => c.estado === 'confirmada').length,
    completadas: citas.filter(c => c.estado === 'completada').length,
    canceladas: citas.filter(c => c.estado === 'cancelada').length,
    noAsistio: citas.filter(c => c.estado === 'no_asistio').length,
    citas,
  }
}
