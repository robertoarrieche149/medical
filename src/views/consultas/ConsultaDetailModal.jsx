import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { uploadEstudio, getEstudiosByConsulta, deleteEstudio } from '../../services/consultasService'
import { useAuth } from '../../context/AuthContext'
import {
  X, FileText, Upload, Trash2, Download, Loader,
  Stethoscope, User, Clock, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const TIPOS_ESTUDIO = ['Ecografía', 'Tomografía', 'RMN', 'Laboratorio', 'Biopsia', 'Uroflujometría', 'Cistoscopía', 'Otro']

export default function ConsultaDetailModal({ consulta: c, onClose }) {
  const { user } = useAuth()
  const [estudios, setEstudios] = useState(c.estudios ?? [])
  const [uploading, setUploading] = useState(false)
  const [tipoEstudio, setTipoEstudio] = useState('Ecografía')
  const [descEstudio, setDescEstudio] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const fecha = c.fecha ? format(parseISO(c.fecha), "EEEE d 'de' MMMM yyyy · HH:mm", { locale: es }) : '—'

  async function recargarEstudios() {
    try {
      const data = await getEstudiosByConsulta(c.id)
      setEstudios(data)
    } catch {}
  }

  async function handleUpload(file) {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast.error('Archivo demasiado grande (máx. 20 MB)'); return }
    setUploading(true)
    try {
      await uploadEstudio(c.id, c.paciente_id, file, tipoEstudio, descEstudio, user?.id)
      toast.success('Estudio subido correctamente')
      setDescEstudio('')
      await recargarEstudios()
    } catch (err) {
      toast.error('Error subiendo archivo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(estudio) {
    if (!window.confirm(`¿Eliminar "${estudio.archivo_nombre}"?`)) return
    try {
      await deleteEstudio(estudio.id, estudio.archivo_url)
      toast.success('Estudio eliminado')
      await recargarEstudios()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '800px', maxHeight: '92vh', overflowY: 'auto' }}>
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
              <h2 style={{ fontSize:'1.125rem', fontFamily:'var(--font-headline)' }}>Detalle de Consulta</h2>
              <p className="text-xs text-muted" style={{ textTransform:'capitalize' }}>{fecha}</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
          {/* Columna izquierda — datos clínicos */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {/* Paciente */}
            <InfoSection icon={<User size={14} />} title="Paciente">
              <p className="font-semibold">{c.paciente?.nombre} {c.paciente?.apellido}</p>
              <p className="text-xs text-muted">CI: {c.paciente?.cedula ?? '—'}</p>
            </InfoSection>

            {c.motivo_consulta && (
              <InfoSection icon={<AlertCircle size={14} />} title="Motivo de Consulta">
                <p className="text-sm">{c.motivo_consulta}</p>
              </InfoSection>
            )}

            {c.anamnesis && (
              <InfoSection title="Anamnesis">
                <p className="text-sm" style={{ whiteSpace:'pre-wrap' }}>{c.anamnesis}</p>
              </InfoSection>
            )}

            {c.examen_fisico && (
              <InfoSection title="Examen Físico">
                <p className="text-sm" style={{ whiteSpace:'pre-wrap' }}>{c.examen_fisico}</p>
              </InfoSection>
            )}

            {c.diagnostico && (
              <InfoSection title="Diagnóstico">
                <p className="text-sm font-semibold text-primary">{c.diagnostico}</p>
              </InfoSection>
            )}

            {c.tratamiento && (
              <InfoSection title="Tratamiento / Prescripción">
                <p className="text-sm" style={{ whiteSpace:'pre-wrap' }}>{c.tratamiento}</p>
              </InfoSection>
            )}

            {c.plan_seguimiento && (
              <InfoSection title="Plan de Seguimiento">
                <p className="text-sm" style={{ whiteSpace:'pre-wrap' }}>{c.plan_seguimiento}</p>
              </InfoSection>
            )}
          </div>

          {/* Columna derecha — estudios */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <h3 className="card-title">
              <FileText size={15} style={{ display:'inline', marginRight:6 }} />
              Estudios Adjuntos ({estudios.length})
            </h3>

            {/* Upload */}
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.625rem' }}>
                <select className="form-select" value={tipoEstudio}
                  onChange={e => setTipoEstudio(e.target.value)}>
                  {TIPOS_ESTUDIO.map(t => <option key={t}>{t}</option>)}
                </select>
                <input className="form-input" placeholder="Descripción (opcional)"
                  value={descEstudio} onChange={e => setDescEstudio(e.target.value)} />
              </div>

              <div
                className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input type="file" ref={fileRef}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.dcm,.mp4"
                  onChange={e => handleUpload(e.target.files?.[0])} />
                {uploading
                  ? <><Loader size={20} className="spin" /><span className="text-sm text-muted">Subiendo…</span></>
                  : <>
                      <Upload size={20} color="var(--outline)" />
                      <span className="text-sm text-muted">Arrastra o haz clic para subir</span>
                      <span className="text-xs text-muted">PDF, JPG, PNG, MP4 · máx. 20 MB</span>
                    </>
                }
              </div>
            </div>

            {/* Lista de estudios */}
            {estudios.length === 0 ? (
              <p className="text-muted text-sm" style={{ textAlign:'center', padding:'1rem 0' }}>
                No hay estudios adjuntos
              </p>
            ) : (
              <div className="estudios-list">
                {estudios.map(est => (
                  <div key={est.id} className="estudio-item">
                    <div className="estudio-item-info">
                      <span className="estudio-type-badge">{est.tipo_estudio}</span>
                      <span className="estudio-nombre" title={est.archivo_nombre}>
                        {est.archivo_nombre}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <a href={est.archivo_url} target="_blank" rel="noopener noreferrer"
                        className="btn-icon" title="Descargar">
                        <Download size={14} />
                      </a>
                      <button className="btn-icon btn-icon-danger" title="Eliminar"
                        onClick={() => handleDelete(est)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

function InfoSection({ icon, title, children }) {
  return (
    <div style={{
      background:'var(--surface-container-high)',
      borderRadius:'var(--radius-md)',
      padding:'0.875rem',
    }}>
      <span style={{
        fontSize:'0.7rem', fontWeight:700, color:'var(--on-surface-variant)',
        textTransform:'uppercase', letterSpacing:'0.05em',
        display:'flex', alignItems:'center', gap:'0.25rem', marginBottom:'0.375rem',
      }}>
        {icon} {title}
      </span>
      {children}
    </div>
  )
}
