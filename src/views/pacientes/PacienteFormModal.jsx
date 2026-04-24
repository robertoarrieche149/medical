import { useState } from 'react'
import { createPaciente, updatePaciente } from '../../services/pacientesService'
import toast from 'react-hot-toast'
import { X, Loader, User } from 'lucide-react'

const INITIAL_FORM = {
  cedula: '', nombre: '', apellido: '', fecha_nacimiento: '',
  sexo: '', telefono: '', email: '', direccion: '',
  antecedentes_medicos: '', factores_riesgo: '', alergias: '',
  prioridad_clinica: 'normal',
}

export default function PacienteFormModal({ paciente, onClose }) {
  const esEdicion = !!paciente
  const [form, setForm] = useState(esEdicion ? { ...INITIAL_FORM, ...paciente } : INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('datos')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cedula || !form.nombre || !form.apellido) {
      toast.error('Cédula, nombre y apellido son obligatorios')
      return
    }
    setLoading(true)
    try {
      if (esEdicion) {
        await updatePaciente(paciente.id, form)
        toast.success('Paciente actualizado')
      } else {
        await createPaciente(form)
        toast.success('Paciente registrado exitosamente')
      }
      onClose(true)
    } catch (err) {
      toast.error(err.message.includes('duplicate') || err.message.includes('unique')
        ? 'Ya existe un paciente con esa cédula'
        : 'Error: ' + err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className="modal-box" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--on-primary)',
            }}>
              <User size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-headline)' }}>
                {esEdicion ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h2>
              <p className="text-xs text-muted">
                {esEdicion ? `Editando: ${paciente.nombre} ${paciente.apellido}` : 'Complete los datos del paciente'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={() => onClose(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {[
            { key: 'datos', label: 'Datos Personales' },
            { key: 'clinico', label: 'Antecedentes Clínicos' },
          ].map(t => (
            <button
              key={t.key}
              className={`modal-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'datos' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Cédula *</label>
                <input name="cedula" className="form-input" value={form.cedula}
                  onChange={handleChange} placeholder="V-12345678" required />
              </div>
              <div className="form-group">
                <label className="form-label">Prioridad Clínica</label>
                <select name="prioridad_clinica" className="form-select"
                  value={form.prioridad_clinica} onChange={handleChange}>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input name="nombre" className="form-input" value={form.nombre}
                  onChange={handleChange} placeholder="Juan" required />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido *</label>
                <input name="apellido" className="form-input" value={form.apellido}
                  onChange={handleChange} placeholder="Pérez" required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de Nacimiento</label>
                <input name="fecha_nacimiento" type="date" className="form-input"
                  value={form.fecha_nacimiento} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Sexo</label>
                <select name="sexo" className="form-select" value={form.sexo} onChange={handleChange}>
                  <option value="">Seleccionar…</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input name="telefono" className="form-input" value={form.telefono}
                  onChange={handleChange} placeholder="+58 412-0000000" />
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input name="email" type="email" className="form-input" value={form.email}
                  onChange={handleChange} placeholder="paciente@email.com" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Dirección</label>
                <input name="direccion" className="form-input" value={form.direccion}
                  onChange={handleChange} placeholder="Av. Principal, Caracas" />
              </div>
            </div>
          )}

          {tab === 'clinico' && (
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="form-group">
                <label className="form-label">Alergias</label>
                <input name="alergias" className="form-input" value={form.alergias}
                  onChange={handleChange} placeholder="Ej: Penicilina, Aspirina" />
              </div>
              <div className="form-group">
                <label className="form-label">Antecedentes Médicos</label>
                <textarea name="antecedentes_medicos" className="form-textarea" rows={4}
                  value={form.antecedentes_medicos} onChange={handleChange}
                  placeholder="Hipertensión, Diabetes, cirugías previas…" />
              </div>
              <div className="form-group">
                <label className="form-label">Factores de Riesgo</label>
                <textarea name="factores_riesgo" className="form-textarea" rows={3}
                  value={form.factores_riesgo} onChange={handleChange}
                  placeholder="Tabaquismo, sedentarismo, obesidad…" />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><Loader size={14} className="spin" /> Guardando…</>
                : esEdicion ? 'Guardar Cambios' : 'Registrar Paciente'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
