import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getBloques, generarSlots, DIAS_SEMANA } from '../../services/bloquesService'
import { X, Loader, CalendarPlus, User, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const TIPOS = [
  { value: 'primera_vez',  label: 'Primera vez' },
  { value: 'control',      label: 'Control' },
  { value: 'procedimiento',label: 'Procedimiento' },
]

export default function CitaFormModal({ asistente_id, onClose }) {
  const [step, setStep] = useState('paciente') // 'paciente' | 'cita'
  const [searchCedula, setSearchCedula] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [paciente, setPaciente] = useState(null)
  const [bloques, setBloques] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    fecha: '', slot: '', tipo: 'primera_vez', notas: '',
  })

  useEffect(() => { getBloques().then(setBloques) }, [])

  useEffect(() => {
    if (form.fecha) setSlots(generarSlots(bloques, form.fecha))
  }, [form.fecha, bloques])

  async function buscarPaciente(e) {
    e.preventDefault()
    if (!searchCedula.trim()) return
    setBuscando(true)
    try {
      const { data, error } = await supabase
        .from('pacientes').select('*').eq('cedula', searchCedula.trim()).single()
      if (error || !data) { toast.error('Paciente no encontrado'); return }
      setPaciente(data)
      setStep('cita')
    } catch (err) { toast.error('Error: ' + err.message) }
    finally { setBuscando(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fecha || !form.slot) { toast.error('Selecciona fecha y horario'); return }

    const fechaHora = new Date(`${form.fecha}T${form.slot}:00`)

    // Verificar traslape
    const inicio = new Date(fechaHora.getTime() - 1000)
    const fin = new Date(fechaHora.getTime() + 30 * 60000)
    const { data: traslape } = await supabase
      .from('citas')
      .select('id')
      .gte('fecha_hora', inicio.toISOString())
      .lte('fecha_hora', fin.toISOString())
      .not('estado', 'eq', 'cancelada')
    if (traslape?.length) { toast.error('Ese horario ya tiene una cita agendada'); return }

    // Obtener admin
    const { data: admin } = await supabase
      .from('usuarios').select('id').eq('rol', 'admin').eq('activo', true).single()

    setLoading(true)
    try {
      await supabase.from('citas').insert([{
        paciente_id: paciente.id,
        medico_id: admin?.id,
        asistente_id,
        fecha_hora: fechaHora.toISOString(),
        tipo: form.tipo,
        estado: 'programada',
        notas: form.notas || null,
        duracion_minutos: 30,
      }])
      toast.success('Cita agendada exitosamente')
      onClose(true)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Mínimo: mañana
  const minFecha = new Date(); minFecha.setDate(minFecha.getDate())
  const minStr = minFecha.toISOString().split('T')[0]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{ width:38, height:38, borderRadius:'var(--radius-md)', background:'var(--gradient-primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--on-primary)' }}>
              <CalendarPlus size={18} />
            </div>
            <div>
              <h2 style={{ fontSize:'1.125rem', fontFamily:'var(--font-headline)' }}>Nueva Cita</h2>
              {paciente && <p className="text-xs text-muted">{paciente.nombre} {paciente.apellido} · C.I. {paciente.cedula}</p>}
            </div>
          </div>
          <button className="btn-icon" onClick={() => onClose(false)}><X size={18} /></button>
        </div>

        {step === 'paciente' ? (
          <form onSubmit={buscarPaciente}>
            <p className="text-sm text-muted" style={{ marginBottom:'1.25rem' }}>Ingresa la cédula del paciente para agendar su cita.</p>
            <div className="form-group">
              <label className="form-label">Cédula del paciente *</label>
              <input className="form-input" placeholder="V-12345678"
                value={searchCedula} onChange={e => setSearchCedula(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={buscando}>
                {buscando ? <><Loader size={14} className="spin" /> Buscando…</> : <><Search size={14} /> Buscar</>}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input type="date" className="form-input" min={minStr}
                  value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value, slot: '' }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Horario disponible *</label>
                <select className="form-select" value={form.slot}
                  onChange={e => setForm(p => ({ ...p, slot: e.target.value }))}>
                  <option value="">Seleccionar hora</option>
                  {slots.length === 0 && form.fecha && <option disabled>Sin horario ese día</option>}
                  {slots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Tipo de consulta *</label>
                <select className="form-select" value={form.tipo}
                  onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Notas</label>
                <textarea className="form-input" rows={2} placeholder="Motivo de consulta, instrucciones…"
                  value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setStep('paciente')}>← Cambiar paciente</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><Loader size={14} className="spin" /> Agendando…</> : 'Agendar Cita'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
