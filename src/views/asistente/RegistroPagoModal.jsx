import { useState } from 'react'
import { createPago, METODOS_PAGO } from '../../services/pagosService'
import { supabase } from '../../lib/supabaseClient'
import { X, Loader, Search, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const CONCEPTOS = ['Primera consulta', 'Control', 'Procedimiento', 'Examen', 'Otro']

export default function RegistroPagoModal({ asistente_id, onClose }) {
  const [step, setStep] = useState('buscar') // 'buscar' | 'form'
  const [searchCedula, setSearchCedula] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [paciente, setPaciente] = useState(null)
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    cita_id: '', concepto: 'Primera consulta',
    monto_usd: '', monto_bs: '', tasa_cambio: '',
    metodo_pago: 'efectivo_usd', referencia: '', notas: '',
  })

  async function buscarPaciente() {
    if (!searchCedula.trim()) return
    setBuscando(true)
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('cedula', searchCedula.trim())
        .single()
      if (error || !data) { toast.error('Paciente no encontrado con esa cédula'); return }
      setPaciente(data)

      // Citas pendientes de pago
      const { data: citasDat } = await supabase
        .from('citas')
        .select('id, fecha_hora, tipo, estado')
        .eq('paciente_id', data.id)
        .in('estado', ['programada', 'confirmada', 'completada'])
        .order('fecha_hora', { ascending: false })
        .limit(10)
      setCitas(citasDat || [])
      setStep('form')
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setBuscando(false)
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.metodo_pago) { toast.error('Selecciona método de pago'); return }
    if (!form.monto_usd && !form.monto_bs) { toast.error('Ingresa al menos un monto'); return }
    setLoading(true)
    try {
      await createPago({
        cita_id: form.cita_id || null,
        paciente_id: paciente.id,
        asistente_id,
        concepto: form.concepto,
        monto_usd: form.monto_usd ? Number(form.monto_usd) : null,
        monto_bs: form.monto_bs ? Number(form.monto_bs) : null,
        tasa_cambio: form.tasa_cambio ? Number(form.tasa_cambio) : null,
        metodo_pago: form.metodo_pago,
        referencia: form.referencia || null,
        notas: form.notas || null,
      })
      toast.success('Pago registrado exitosamente')
      onClose(true)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className="modal-box" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{ width:38, height:38, borderRadius:'var(--radius-md)', background:'var(--gradient-primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--on-primary)' }}>
              <DollarSign size={18} />
            </div>
            <div>
              <h2 style={{ fontSize:'1.125rem', fontFamily:'var(--font-headline)' }}>Registrar Cobro</h2>
              {paciente && <p className="text-xs text-muted">{paciente.nombre} {paciente.apellido} · C.I. {paciente.cedula}</p>}
            </div>
          </div>
          <button className="btn-icon" onClick={() => onClose(false)}><X size={18} /></button>
        </div>

        {step === 'buscar' ? (
          <div>
            <p className="text-sm text-muted" style={{ marginBottom:'1.25rem' }}>
              Busca al paciente por su número de cédula para registrar el cobro.
            </p>
            <div className="form-group">
              <label className="form-label">Cédula del paciente *</label>
              <input className="form-input" placeholder="Ej: V-12345678"
                value={searchCedula} onChange={e => setSearchCedula(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarPaciente()} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={buscarPaciente} disabled={buscando}>
                {buscando ? <><Loader size={14} className="spin" /> Buscando…</> : <><Search size={14} /> Buscar paciente</>}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Cita asociada */}
            {citas.length > 0 && (
              <div className="form-group">
                <label className="form-label">Cita asociada (opcional)</label>
                <select name="cita_id" className="form-select" value={form.cita_id} onChange={handleChange}>
                  <option value="">Sin cita específica</option>
                  {citas.map(c => (
                    <option key={c.id} value={c.id}>
                      {new Date(c.fecha_hora).toLocaleDateString('es-VE')} — {c.tipo?.replace('_', ' ')} ({c.estado})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Concepto *</label>
                <select name="concepto" className="form-select" value={form.concepto} onChange={handleChange}>
                  {CONCEPTOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Monto USD</label>
                <input name="monto_usd" type="number" step="0.01" className="form-input"
                  placeholder="0.00" value={form.monto_usd} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Monto Bs</label>
                <input name="monto_bs" type="number" step="0.01" className="form-input"
                  placeholder="0.00" value={form.monto_bs} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Tasa BCV</label>
                <input name="tasa_cambio" type="number" step="0.01" className="form-input"
                  placeholder="Tasa del día" value={form.tasa_cambio} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Método de pago *</label>
                <select name="metodo_pago" className="form-select" value={form.metodo_pago} onChange={handleChange}>
                  {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Referencia / Voucher</label>
                <input name="referencia" className="form-input"
                  placeholder="Nro. de transferencia, comprobante…" value={form.referencia} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Notas</label>
                <textarea name="notas" className="form-input" rows={2}
                  placeholder="Observaciones adicionales…" value={form.notas} onChange={handleChange} />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setStep('buscar')}>← Cambiar paciente</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><Loader size={14} className="spin" /> Guardando…</> : 'Registrar Pago'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
