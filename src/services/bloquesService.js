import { supabase } from '../lib/supabaseClient'

// ─── BLOQUES HORARIOS ──────────────────────────────────────────

export async function getBloques() {
  const { data, error } = await supabase
    .from('bloques_horarios')
    .select('*')
    .order('dia_semana')
    .order('hora_inicio')
  if (error) throw error
  return data
}

export async function upsertBloque(bloque) {
  const { data, error } = await supabase
    .from('bloques_horarios')
    .upsert(bloque, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleBloqueActivo(id, activo) {
  const { data, error } = await supabase
    .from('bloques_horarios')
    .update({ activo })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBloque(id) {
  const { error } = await supabase
    .from('bloques_horarios')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Genera array de slots disponibles para una fecha dada
// Retorna: ['08:00', '08:30', '09:00', ...]
export function generarSlots(bloques, fecha) {
  const diasSemana = ['lunes','martes','miercoles','jueves','viernes','sabado']
  const jsDay = new Date(fecha).getDay() // 0=Dom..6=Sab
  // Convertir: Lun=0..Sab=5 (nuestro formato)
  const diaIdx = jsDay === 0 ? null : jsDay - 1  // Domingo no disponible

  if (diaIdx === null) return []

  const bloquesDelDia = bloques.filter(b => b.dia_semana === diaIdx && b.activo)
  const slots = []

  for (const bloque of bloquesDelDia) {
    const [hIni, mIni] = bloque.hora_inicio.split(':').map(Number)
    const [hFin, mFin] = bloque.hora_fin.split(':').map(Number)
    let minutos = hIni * 60 + mIni
    const finMinutos = hFin * 60 + mFin

    while (minutos + bloque.duracion_slot <= finMinutos) {
      const h = String(Math.floor(minutos / 60)).padStart(2, '0')
      const m = String(minutos % 60).padStart(2, '0')
      slots.push(`${h}:${m}`)
      minutos += bloque.duracion_slot
    }
  }

  return slots
}

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
