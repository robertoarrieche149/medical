import { supabase } from '../lib/supabaseClient'

// ─── OBTENER PAGOS ─────────────────────────────────────────────

export async function getPagos({ paciente_id, desde, hasta, estado } = {}) {
  let q = supabase
    .from('pagos')
    .select(`
      *,
      paciente:paciente_id (id, nombre, apellido, cedula),
      cita:cita_id (fecha_hora, tipo),
      asistente:asistente_id (nombre, apellido)
    `)
    .order('fecha_pago', { ascending: false })

  if (paciente_id) q = q.eq('paciente_id', paciente_id)
  if (estado)      q = q.eq('estado', estado)
  if (desde)       q = q.gte('fecha_pago', desde)
  if (hasta)       q = q.lte('fecha_pago', hasta)

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getPagosPorCita(cita_id) {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('cita_id', cita_id)
  if (error) throw error
  return data
}

// ─── CREAR PAGO ───────────────────────────────────────────────

export async function createPago({
  cita_id, paciente_id, asistente_id, concepto,
  monto_usd, monto_bs, tasa_cambio,
  metodo_pago, estado = 'pagado', referencia, notas,
}) {
  const { data, error } = await supabase
    .from('pagos')
    .insert([{
      cita_id, paciente_id, asistente_id, concepto,
      monto_usd, monto_bs, tasa_cambio,
      metodo_pago, estado, referencia, notas,
      fecha_pago: new Date().toISOString(),
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── ANULAR PAGO ──────────────────────────────────────────────

export async function anularPago(id, motivo) {
  const { data, error } = await supabase
    .from('pagos')
    .update({ estado: 'anulado', notas: motivo })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── RESUMEN DEL DÍA ──────────────────────────────────────────

export async function getResumenHoy() {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString()

  const { data, error } = await supabase
    .from('pagos')
    .select('monto_usd, monto_bs, metodo_pago, estado')
    .gte('fecha_pago', inicio)
    .lt('fecha_pago', fin)
    .eq('estado', 'pagado')

  if (error) throw error

  return {
    totalUSD: data.reduce((s, p) => s + (p.monto_usd || 0), 0),
    totalBs:  data.reduce((s, p) => s + (p.monto_bs  || 0), 0),
    cantidad: data.length,
    porMetodo: data.reduce((acc, p) => {
      acc[p.metodo_pago] = (acc[p.metodo_pago] || 0) + 1
      return acc
    }, {}),
  }
}

export const METODOS_PAGO = [
  { value: 'efectivo_usd',  label: 'Efectivo USD',    icon: '💵' },
  { value: 'efectivo_bs',   label: 'Efectivo Bs',     icon: '💴' },
  { value: 'transferencia', label: 'Transferencia',   icon: '🏦' },
  { value: 'tarjeta',       label: 'Tarjeta',         icon: '💳' },
  { value: 'zelle',         label: 'Zelle',           icon: '📱' },
  { value: 'seguro',        label: 'Seguro Médico',   icon: '🏥' },
]
