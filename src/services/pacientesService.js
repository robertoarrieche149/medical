import { supabase } from '../lib/supabaseClient'

// ─── CRUD PACIENTES ───────────────────────────────────────────

export async function getPacientes({ search = '', prioridad = '', page = 1, limit = 20 } = {}) {
  let query = supabase
    .from('pacientes')
    .select('*', { count: 'exact' })
    .eq('activo', true)
    .order('apellido', { ascending: true })
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.or(
      `nombre.ilike.%${search}%,apellido.ilike.%${search}%,cedula.ilike.%${search}%`
    )
  }

  if (prioridad) {
    query = query.eq('prioridad_clinica', prioridad)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data, total: count }
}

export async function getPacienteById(id) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createPaciente(paciente) {
  const { data, error } = await supabase
    .from('pacientes')
    .insert([paciente])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePaciente(id, updates) {
  const { data, error } = await supabase
    .from('pacientes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePaciente(id) {
  // Soft delete: marcamos como inactivo
  const { error } = await supabase
    .from('pacientes')
    .update({ activo: false })
    .eq('id', id)

  if (error) throw error
}

// ─── HISTORIAL CLÍNICO ────────────────────────────────────────

export async function getConsultasByPaciente(pacienteId) {
  const { data, error } = await supabase
    .from('consultas')
    .select(`
      *,
      medico:medico_id (nombre, apellido),
      estudios (*)
    `)
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false })

  if (error) throw error
  return data
}
