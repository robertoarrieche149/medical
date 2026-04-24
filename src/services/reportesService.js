import { supabase } from '../lib/supabaseClient'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export async function getKpisDashboard(medicoId = null) {
  const hoy = new Date()
  const inicioHoy = startOfDay(hoy).toISOString()
  const finHoy = endOfDay(hoy).toISOString()

  // Citas de hoy
  let queryCitas = supabase
    .from('citas')
    .select('estado', { count: 'exact' })
    .gte('fecha_hora', inicioHoy)
    .lte('fecha_hora', finHoy)

  if (medicoId) queryCitas = queryCitas.eq('medico_id', medicoId)

  const { data: citasHoy, count: totalHoy } = await queryCitas

  // Nuevos pacientes este mes
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
  const { count: nuevosPacientes } = await supabase
    .from('pacientes')
    .select('id', { count: 'exact' })
    .gte('creado_en', inicioMes)
    .eq('activo', true)

  // Total pacientes
  const { count: totalPacientes } = await supabase
    .from('pacientes')
    .select('id', { count: 'exact' })
    .eq('activo', true)

  const atendidos = citasHoy?.filter(c => c.estado === 'completada').length ?? 0
  const ausencias = citasHoy?.filter(c => c.estado === 'no_asistio').length ?? 0

  return {
    citasHoy: totalHoy ?? 0,
    atendidos,
    ausencias,
    nuevosPacientes: nuevosPacientes ?? 0,
    totalPacientes: totalPacientes ?? 0,
  }
}

export async function getEstadisticasSemanales(semanas = 8, medicoId = null) {
  const resultado = []
  const hoy = new Date()

  for (let i = semanas - 1; i >= 0; i--) {
    const finSemana = endOfDay(subDays(hoy, i * 7))
    const inicioSemana = startOfDay(subDays(hoy, i * 7 + 6))

    let query = supabase
      .from('citas')
      .select('estado', { count: 'exact' })
      .gte('fecha_hora', inicioSemana.toISOString())
      .lte('fecha_hora', finSemana.toISOString())

    if (medicoId) query = query.eq('medico_id', medicoId)

    const { data, count } = await query
    const noAsistio = data?.filter(c => c.estado === 'no_asistio').length ?? 0

    resultado.push({
      semana: format(inicioSemana, 'dd/MM'),
      total: count ?? 0,
      asistencia: (count ?? 0) - noAsistio,
      ausencias: noAsistio,
    })
  }

  return resultado
}

export async function getDistribucionPorTipo(medicoId = null) {
  let query = supabase
    .from('citas')
    .select('tipo')
    .in('estado', ['completada', 'confirmada', 'programada'])

  if (medicoId) query = query.eq('medico_id', medicoId)

  const { data, error } = await query
  if (error) throw error

  const dist = { primera_vez: 0, control: 0, procedimiento: 0 }
  data?.forEach(c => { dist[c.tipo] = (dist[c.tipo] ?? 0) + 1 })

  return [
    { name: 'Primera vez', value: dist.primera_vez, color: '#47f1e4' },
    { name: 'Control', value: dist.control, color: '#b6c4ff' },
    { name: 'Procedimiento', value: dist.procedimiento, color: '#ffac4c' },
  ]
}
