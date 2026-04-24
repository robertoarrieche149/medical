import { useState, useEffect, useCallback } from 'react'
import { getBloques, upsertBloque, toggleBloqueActivo, deleteBloque, DIAS_SEMANA } from '../../services/bloquesService'
import { Plus, Power, PowerOff, Trash2, Clock, Save, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import './BloquesHorario.css'

const SLOTS_OPT = [15, 20, 30, 45, 60]

const EMPTY_FORM = { dia_semana: 0, hora_inicio: '08:00', hora_fin: '12:00', duracion_slot: 30 }

export default function BloquesHorarioView() {
  const [bloques, setBloques] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [guardando, setGuardando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try { setBloques(await getBloques()) }
    catch (err) { toast.error('Error: ' + err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function handleGuardar(e) {
    e.preventDefault()
    if (form.hora_fin <= form.hora_inicio) {
      toast.error('La hora de fin debe ser mayor a la de inicio')
      return
    }
    setGuardando(true)
    try {
      await upsertBloque({ ...form, activo: true })
      toast.success('Bloque guardado')
      setForm(EMPTY_FORM)
      setMostrarForm(false)
      cargar()
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleToggle(b) {
    try {
      await toggleBloqueActivo(b.id, !b.activo)
      cargar()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este bloque horario?')) return
    try { await deleteBloque(id); toast.success('Bloque eliminado'); cargar() }
    catch (err) { toast.error('Error: ' + err.message) }
  }

  // Agrupar por día
  const porDia = DIAS_SEMANA.map((dia, idx) => ({
    dia, idx,
    bloques: bloques.filter(b => b.dia_semana === idx),
  }))

  return (
    <div className="bloques-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Horarios Disponibles</h1>
          <p className="page-subtitle">Define los bloques en que la asistente puede agendar citas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setMostrarForm(v => !v)}>
          <Plus size={16} /> Agregar bloque
        </button>
      </div>

      {/* Formulario nuevo bloque */}
      {mostrarForm && (
        <div className="card bloque-form-card">
          <h3 style={{ marginBottom:'1rem', fontSize:'0.9375rem', fontWeight:700 }}>Nuevo bloque horario</h3>
          <form onSubmit={handleGuardar} className="bloque-form">
            <div className="form-group">
              <label className="form-label">Día</label>
              <select className="form-select" value={form.dia_semana}
                onChange={e => setForm(p => ({ ...p, dia_semana: Number(e.target.value) }))}>
                {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hora inicio</label>
              <input type="time" className="form-input" value={form.hora_inicio}
                onChange={e => setForm(p => ({ ...p, hora_inicio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Hora fin</label>
              <input type="time" className="form-input" value={form.hora_fin}
                onChange={e => setForm(p => ({ ...p, hora_fin: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Duración slot</label>
              <select className="form-select" value={form.duracion_slot}
                onChange={e => setForm(p => ({ ...p, duracion_slot: Number(e.target.value) }))}>
                {SLOTS_OPT.map(s => <option key={s} value={s}>{s} min</option>)}
              </select>
            </div>
            <div className="bloque-form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? <><Loader size={14} className="spin" /> Guardando…</> : <><Save size={14} /> Guardar</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid por día */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="bloques-grid">
          {porDia.map(({ dia, idx, bloques: bls }) => (
            <div key={idx} className="card dia-bloque-card">
              <div className="dia-bloque-header">
                <span className="dia-bloque-nombre">{dia}</span>
                <span className="chip chip-neutral" style={{ fontSize:'0.7rem' }}>
                  {bls.filter(b => b.activo).length} activo{bls.filter(b => b.activo).length !== 1 ? 's' : ''}
                </span>
              </div>

              {bls.length === 0 ? (
                <p className="text-xs text-muted" style={{ padding:'0.75rem 0' }}>Sin horario configurado</p>
              ) : (
                <div className="bloques-lista">
                  {bls.map(b => (
                    <div key={b.id} className={`bloque-item ${!b.activo ? 'bloque-inactivo' : ''}`}>
                      <Clock size={13} style={{ color:'var(--primary)', flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <span className="bloque-horas">{b.hora_inicio.slice(0,5)} – {b.hora_fin.slice(0,5)}</span>
                        <span className="bloque-duracion">{b.duracion_slot} min/cita</span>
                      </div>
                      <div className="flex gap-1">
                        <button className="btn-icon" title={b.activo ? 'Desactivar' : 'Activar'} onClick={() => handleToggle(b)}>
                          {b.activo ? <PowerOff size={13} /> : <Power size={13} />}
                        </button>
                        <button className="btn-icon btn-icon-danger" title="Eliminar" onClick={() => handleEliminar(b.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Leyenda */}
      <div className="card" style={{ padding:'1rem 1.5rem' }}>
        <p className="text-xs text-muted">
          💡 <strong>¿Cómo funciona?</strong> — La asistente solo puede agendar citas dentro de los horarios activos que defines aquí.
          Cada bloque se divide en slots de la duración que configures (ej: 30 min = slots a las 8:00, 8:30, 9:00…).
        </p>
      </div>
    </div>
  )
}
