import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { X, CheckCircle2, XCircle, UserCheck, Clock, Phone, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCIONES = [
  { estado: 'confirmada', label: 'Confirmar', color: 'success' },
  { estado: 'no_asistio', label: 'No asistió', color: 'warning' },
  { estado: 'cancelada',  label: 'Cancelar', color: 'error' },
]

export default function CitaDetailPanel({ cita, onClose }) {
  const [loading, setLoading] = useState(false)
  const p = cita.paciente || {}
  const puedeActuar = ['programada', 'confirmada'].includes(cita.estado)

  async function cambiarEstado(nuevoEstado) {
    setLoading(true)
    try {
      await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', cita.id)
      toast.success('Estado actualizado')
      onClose(true)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 style={{ fontSize:'1.125rem', fontFamily:'var(--font-headline)' }}>Detalle de Cita</h2>
          <button className="btn-icon" onClick={() => onClose(false)}><X size={18} /></button>
        </div>

        {/* Info del paciente */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'1rem', background:'var(--surface-container-high)', borderRadius:'var(--radius-md)', marginBottom:'1.25rem' }}>
          <div className="paciente-avatar">
            {p.nombre?.[0]}{p.apellido?.[0]}
          </div>
          <div>
            <p className="font-semibold">{p.nombre} {p.apellido}</p>
            <p className="text-xs text-muted">C.I. {p.cedula}</p>
            {p.telefono && (
              <p className="text-xs" style={{ display:'flex', alignItems:'center', gap:4 }}>
                <Phone size={10} /> {p.telefono}
              </p>
            )}
          </div>
        </div>

        {/* Info de la cita */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'1.5rem' }}>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} style={{ color:'var(--primary)' }} />
            <strong>{new Date(cita.fecha_hora).toLocaleDateString('es-VE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</strong>
            <span>a las</span>
            <strong>{new Date(cita.fecha_hora).toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' })}</strong>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FileText size={14} style={{ color:'var(--primary)' }} />
            <span>Tipo: <strong>{cita.tipo?.replace('_', ' ')}</strong></span>
          </div>
          {cita.notas && (
            <div className="text-sm" style={{ padding:'0.625rem', background:'var(--surface-container)', borderRadius:'var(--radius-sm)', marginTop:'0.25rem' }}>
              <p className="text-muted" style={{ fontSize:'0.7rem', marginBottom:2 }}>Notas</p>
              <p>{cita.notas}</p>
            </div>
          )}
        </div>

        {/* Acciones */}
        {puedeActuar ? (
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {ACCIONES.map(a => (
              <button key={a.estado} disabled={loading}
                className={`btn btn-sm`}
                style={{ flex:1,
                  background: a.color === 'success' ? 'rgba(102,212,119,0.15)' : a.color === 'error' ? 'rgba(255,180,171,0.15)' : 'rgba(255,213,0,0.15)',
                  color: a.color === 'success' ? '#66d477' : a.color === 'error' ? 'var(--error)' : '#c8a200',
                }}
                onClick={() => cambiarEstado(a.estado)}>
                {a.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted" style={{ textAlign:'center' }}>
            Esta cita ya fue <strong>{cita.estado}</strong> — no puede modificarse.
          </p>
        )}

        <div className="modal-footer" style={{ marginTop:'1rem' }}>
          <button className="btn btn-secondary" onClick={() => onClose(false)}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
