import { useState } from 'react'
import { createConsulta, updateConsulta } from '../../services/consultasService'
import { X, Loader, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

const INITIAL = {
  paciente_id: '', cita_id: '', fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().slice(0, 5),
  motivo_consulta: '', anamnesis: '', examen_fisico: '',
  diagnostico: '', tratamiento: '', plan_seguimiento: '', notas_medico: '',
}

export default function ConsultaFormModal({ consulta, pacientes, medicoId, onClose }) {
  const esEdicion = !!consulta
  const [form, setForm] = useState(esEdicion ? {
    ...INITIAL,
    ...consulta,
    fecha: consulta.fecha?.split('T')[0] ?? INITIAL.fecha,
    hora: consulta.fecha ? new Date(consulta.fecha).toTimeString().slice(0,5) : INITIAL.hora,
  } : INITIAL)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('datos')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.paciente_id) { toast.error('Selecciona un paciente'); return }
    if (!form.diagnostico) { toast.error('El diagnóstico es obligatorio'); return }

    const fechaISO = new Date(`${form.fecha}T${form.hora}:00`).toISOString()
    const payload = { ...form, fecha: fechaISO, medico_id: medicoId }
    delete payload.hora

    setLoading(true)
    try {
      if (esEdicion) {
        await updateConsulta(consulta.id, payload)
        toast.success('Consulta actualizada')
      } else {
        await createConsulta(payload)
        toast.success('Consulta registrada exitosamente')
      }
      onClose(true)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const TABS = [
    { key: 'datos', label: 'Anamnesis' },
    { key: 'diagnostico', label: 'Diagnóstico' },
    { key: 'plan', label: 'Plan / Notas' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className="modal-box" style={{ maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{
              width:38, height:38, borderRadius:'var(--radius-md)',
              background:'var(--gradient-primary)', display:'flex',
              alignItems:'center', justifyContent:'center', color:'var(--on-primary)',
            }}>
              <Stethoscope size={18} />
            </div>
            <div>
              <h2 style={{ fontSize:'1.125rem', fontFamily:'var(--font-headline)' }}>
                {esEdicion ? 'Editar Consulta' : 'Nueva Consulta'}
              </h2>
              <p className="text-xs text-muted">Registro clínico completo</p>
            </div>
          </div>
          <button className="btn-icon" onClick={() => onClose(false)}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`modal-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)} type="button">
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'datos' && (
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Paciente *</label>
                <select name="paciente_id" className="form-select"
                  value={form.paciente_id} onChange={handleChange} required>
                  <option value="">Seleccionar paciente…</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} — CI: {p.cedula}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input name="fecha" type="date" className="form-input"
                  value={form.fecha} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Hora</label>
                <input name="hora" type="time" className="form-input"
                  value={form.hora} onChange={handleChange} />
              </div>

              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Motivo de Consulta</label>
                <input name="motivo_consulta" className="form-input"
                  value={form.motivo_consulta} onChange={handleChange}
                  placeholder="Ej: Dolor lumbar, hematuria, disuria…" />
              </div>

              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Anamnesis</label>
                <textarea name="anamnesis" className="form-textarea" rows={4}
                  value={form.anamnesis} onChange={handleChange}
                  placeholder="Historia clínica detallada del episodio actual…" />
              </div>

              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Examen Físico</label>
                <textarea name="examen_fisico" className="form-textarea" rows={3}
                  value={form.examen_fisico} onChange={handleChange}
                  placeholder="Hallazgos del examen físico general y urológico…" />
              </div>
            </div>
          )}

          {tab === 'diagnostico' && (
            <div className="form-grid" style={{ gridTemplateColumns:'1fr' }}>
              <div className="form-group">
                <label className="form-label">Diagnóstico *</label>
                <input name="diagnostico" className="form-input"
                  value={form.diagnostico} onChange={handleChange}
                  placeholder="Ej: Hiperplasia prostática benigna CIE-10: N40" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tratamiento / Prescripción</label>
                <textarea name="tratamiento" className="form-textarea" rows={5}
                  value={form.tratamiento} onChange={handleChange}
                  placeholder="Medicamentos, dosis, duración, indicaciones…" />
              </div>
            </div>
          )}

          {tab === 'plan' && (
            <div className="form-grid" style={{ gridTemplateColumns:'1fr' }}>
              <div className="form-group">
                <label className="form-label">Plan de Seguimiento</label>
                <textarea name="plan_seguimiento" className="form-textarea" rows={4}
                  value={form.plan_seguimiento} onChange={handleChange}
                  placeholder="Próxima consulta, estudios solicitados, interconsultas…" />
              </div>
              <div className="form-group">
                <label className="form-label">Notas del Médico</label>
                <textarea name="notas_medico" className="form-textarea" rows={4}
                  value={form.notas_medico} onChange={handleChange}
                  placeholder="Observaciones privadas del médico…" />
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><Loader size={14} className="spin" /> Guardando…</>
                : esEdicion ? 'Guardar cambios' : 'Registrar Consulta'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
