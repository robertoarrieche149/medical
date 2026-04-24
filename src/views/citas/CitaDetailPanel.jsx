import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { cancelarCita, updateCita } from '../../services/citasService'
import { CalendarDays, User, Clock, FileText, X, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ESTADO_CHIP = {
  programada: 'chip-secondary',
  confirmada: 'chip-primary',
  completada: 'chip-success',
  cancelada: 'chip-danger',
  no_asistio: 'chip-neutral',
}

const TIPO_LABEL = {
  primera_vez: 'Primera vez',
  control: 'Control',
  procedimiento: 'Procedimiento',
}

export default function CitaDetailPanel({ cita, onClose, onReload }) {
  if (!cita) {
    return (
      <div className="cita-detail-panel">
        <div className="cita-detail-empty">
          <CalendarDays size={40} strokeWidth={1} />
          <p className="text-sm">Selecciona una cita del calendario para ver sus detalles</p>
        </div>
      </div>
    )
  }

  async function handleConfirmar() {
    try {
      await updateCita(cita.id, { estado: 'confirmada' })
      toast.success('Cita confirmada')
      onReload(); onClose()
    } catch (err) { toast.error('Error: ' + err.message) }
  }

  async function handleCompletar() {
    try {
      await updateCita(cita.id, { estado: 'completada' })
      toast.success('Cita completada')
      onReload(); onClose()
    } catch (err) { toast.error('Error: ' + err.message) }
  }

  async function handleCancelar() {
    const motivo = window.prompt('Motivo de cancelación (opcional):')
    if (motivo === null) return
    try {
      await cancelarCita(cita.id, motivo)
      toast.success('Cita cancelada')
      onReload(); onClose()
    } catch (err) { toast.error('Error: ' + err.message) }
  }

  const fechaHora = parseISO(cita.fecha_hora)

  return (
    <div className="cita-detail-panel animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="card-title">Detalle de Cita</h3>
        <button className="btn-icon" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="cita-detail-row">
        <span className="cita-detail-label"><User size={11} style={{ display:'inline', marginRight:4 }} />Paciente</span>
        <span className="cita-detail-value">
          {cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : '—'}
        </span>
        {cita.paciente?.cedula && <span className="text-xs text-muted">CI: {cita.paciente.cedula}</span>}
      </div>

      <div className="cita-detail-row">
        <span className="cita-detail-label"><Clock size={11} style={{ display:'inline', marginRight:4 }} />Fecha y Hora</span>
        <span className="cita-detail-value" style={{ textTransform:'capitalize' }}>
          {format(fechaHora, "EEEE d 'de' MMMM", { locale: es })}
        </span>
        <span className="text-sm text-primary font-semibold">
          {format(fechaHora, 'HH:mm')} · {cita.duracion_minutos} min
        </span>
      </div>

      <div className="cita-detail-row">
        <span className="cita-detail-label"><FileText size={11} style={{ display:'inline', marginRight:4 }} />Tipo</span>
        <span className="cita-detail-value">{TIPO_LABEL[cita.tipo] ?? cita.tipo}</span>
      </div>

      <div className="cita-detail-row">
        <span className="cita-detail-label">Estado</span>
        <span className={`chip ${ESTADO_CHIP[cita.estado] ?? 'chip-neutral'}`} style={{ width:'fit-content' }}>
          {cita.estado.replace('_', ' ')}
        </span>
      </div>

      {cita.notas && (
        <div className="cita-detail-row">
          <span className="cita-detail-label">Notas</span>
          <span className="text-sm text-muted">{cita.notas}</span>
        </div>
      )}

      {cita.estado === 'programada' && (
        <div className="flex flex-col gap-2" style={{ marginTop:'auto' }}>
          <button className="btn btn-primary btn-sm w-full" onClick={handleConfirmar}>
            <CheckCircle size={14} /> Confirmar cita
          </button>
          <button className="btn btn-danger btn-sm w-full" onClick={handleCancelar}>
            <XCircle size={14} /> Cancelar cita
          </button>
        </div>
      )}

      {cita.estado === 'confirmada' && (
        <div className="flex flex-col gap-2" style={{ marginTop:'auto' }}>
          <button className="btn btn-primary btn-sm w-full" onClick={handleCompletar}>
            <CheckCircle size={14} /> Marcar completada
          </button>
          <button className="btn btn-danger btn-sm w-full" onClick={handleCancelar}>
            <XCircle size={14} /> Cancelar cita
          </button>
        </div>
      )}
    </div>
  )
}
