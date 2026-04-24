import { useState } from 'react'
import { createCita } from '../../services/citasService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { X, Loader, CalendarDays } from 'lucide-react'

const DURACIONES = [15, 20, 30, 45, 60, 90, 120]

export default function CitaFormModal({ slotInicial, pacientes, onClose }) {
  const { user, perfil } = useAuth()
  const [loading, setLoading] = useState(false)

  const slotDate = slotInicial ? new Date(slotInicial) : new Date()
  const fechaLocal = `${slotDate.getFullYear()}-${String(slotDate.getMonth()+1).padStart(2,'0')}-${String(slotDate.getDate()).padStart(2,'0')}`
  const horaLocal = `${String(slotDate.getHours()).padStart(2,'0')}:00`

  const [form, setForm] = useState({
    paciente_id: '',
    fecha: fechaLocal,
    hora: horaLocal,
    tipo: 'primera_vez',
    duracion_minutos: 30,
    notas: '',
  })

  function handleChange(e) {
    const val = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value
    setForm(prev => ({ ...prev, [e.target.name]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.paciente_id) { toast.error('Selecciona un paciente'); return }

    const fechaHora = new Date(`${form.fecha}T${form.hora}:00`).toISOString()

    setLoading(true)
    try {
      await createCita({
        paciente_id: form.paciente_id,
        medico_id: perfil?.id ?? user?.id,
        asistente_id: null,
        fecha_hora: fechaHora,
        tipo: form.tipo,
        duracion_minutos: form.duracion_minutos,
        notas: form.notas,
        estado: 'programada',
      })
      toast.success('Cita programada exitosamente')
      onClose(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className="modal-box" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{
              width:38, height:38, borderRadius:'var(--radius-md)',
              background:'var(--gradient-primary)', display:'flex',
              alignItems:'center', justifyContent:'center', color:'var(--on-primary)',
            }}>
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 style={{ fontSize:'1.125rem', fontFamily:'var(--font-headline)' }}>Nueva Cita</h2>
              <p className="text-xs text-muted">Complete los datos para programar la cita</p>
            </div>
          </div>
          <button className="btn-icon" onClick={() => onClose(false)}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cita-form-grid">
            <div className="form-group" style={{ gridColumn:'1 / -1' }}>
              <label className="form-label">Paciente *</label>
              <select name="paciente_id" className="form-select" value={form.paciente_id} onChange={handleChange} required>
                <option value="">Seleccionar paciente…</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} — CI: {p.cedula}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input name="fecha" type="date" className="form-input" value={form.fecha} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Hora *</label>
              <input name="hora" type="time" className="form-input" value={form.hora} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Consulta</label>
              <select name="tipo" className="form-select" value={form.tipo} onChange={handleChange}>
                <option value="primera_vez">Primera vez</option>
                <option value="control">Control</option>
                <option value="procedimiento">Procedimiento</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duración</label>
              <select name="duracion_minutos" className="form-select" value={form.duracion_minutos} onChange={handleChange}>
                {DURACIONES.map(d => (
                  <option key={d} value={d}>{d} minutos</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn:'1 / -1' }}>
              <label className="form-label">Notas (opcional)</label>
              <textarea name="notas" className="form-textarea" rows={3}
                value={form.notas} onChange={handleChange}
                placeholder="Motivo de consulta, indicaciones previas…" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Loader size={14} className="spin" /> Guardando…</> : 'Programar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
