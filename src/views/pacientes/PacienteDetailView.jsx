import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPacienteById, getConsultasByPaciente } from '../../services/pacientesService'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, User, Phone, Mail, AlertTriangle, Clock, Stethoscope, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import './Pacientes.css'

const PRIORIDAD_CHIP = { normal:'chip-success', alta:'chip-warning', urgente:'chip-danger' }

export default function PacienteDetailView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabActivo, setTabActivo] = useState('info')

  useEffect(() => {
    async function cargar() {
      try {
        const [p, c] = await Promise.all([
          getPacienteById(id),
          getConsultasByPaciente(id),
        ])
        setPaciente(p)
        setConsultas(c)
      } catch (err) {
        toast.error('Error cargando paciente: ' + err.message)
        navigate('/pacientes')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  )

  if (!paciente) return null

  const edad = paciente.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(paciente.fecha_nacimiento)) / (365.25*24*60*60*1000))
    : null

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{paciente.nombre} {paciente.apellido}</h1>
            <p className="page-subtitle">CI: {paciente.cedula} {edad ? `· ${edad} años` : ''}</p>
          </div>
        </div>
        <span className={`chip ${PRIORIDAD_CHIP[paciente.prioridad_clinica]}`}>
          Prioridad {paciente.prioridad_clinica}
        </span>
      </div>

      {/* Alergias */}
      {paciente.alergias && (
        <div style={{
          background:'rgba(255,180,171,0.08)', border:'1px solid rgba(255,180,171,0.2)',
          borderRadius:'var(--radius-md)', padding:'0.75rem 1rem',
          display:'flex', gap:'0.625rem', alignItems:'center',
        }}>
          <AlertTriangle size={16} color="var(--error)" />
          <span style={{ fontSize:'0.875rem', color:'var(--error)' }}>
            <strong>Alergias:</strong> {paciente.alergias}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="modal-tabs" style={{ margin:0 }}>
        {[
          { key:'info', label:'Información General' },
          { key:'historial', label:`Historial Clínico (${consultas.length})` },
        ].map(t => (
          <button key={t.key} className={`modal-tab ${tabActivo === t.key ? 'active' : ''}`}
            onClick={() => setTabActivo(t.key)} type="button">
            {t.label}
          </button>
        ))}
      </div>

      {tabActivo === 'info' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom:'1rem' }}>
              <User size={16} style={{ display:'inline', marginRight:6 }} />Datos Personales
            </h3>
            <InfoRow label="Nombre completo" value={`${paciente.nombre} ${paciente.apellido}`} />
            <InfoRow label="Cédula" value={paciente.cedula} />
            <InfoRow label="Sexo" value={paciente.sexo ?? '—'} />
            <InfoRow label="Fecha de nacimiento" value={paciente.fecha_nacimiento
              ? format(parseISO(paciente.fecha_nacimiento), 'd MMM yyyy', { locale: es }) : '—'} />
            <InfoRow label="Teléfono" value={paciente.telefono ?? '—'} icon={<Phone size={12} />} />
            <InfoRow label="Correo" value={paciente.email ?? '—'} icon={<Mail size={12} />} />
            <InfoRow label="Dirección" value={paciente.direccion ?? '—'} />
          </div>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom:'1rem' }}>
              <FileText size={16} style={{ display:'inline', marginRight:6 }} />Antecedentes
            </h3>
            <InfoRow label="Antecedentes médicos" value={paciente.antecedentes_medicos ?? 'Sin registros'} />
            <InfoRow label="Factores de riesgo" value={paciente.factores_riesgo ?? 'Sin registros'} />
            <InfoRow label="Alergias" value={paciente.alergias ?? 'Ninguna conocida'} />
          </div>
        </div>
      )}

      {tabActivo === 'historial' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom:'1.25rem' }}>
            <Stethoscope size={16} style={{ display:'inline', marginRight:6 }} />Historial de Consultas
          </h3>
          {consultas.length === 0 ? (
            <p className="text-muted text-sm" style={{ padding:'1rem 0' }}>No hay consultas registradas.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {consultas.map(c => (
                <div key={c.id} style={{
                  background:'var(--surface-container-high)', borderRadius:'var(--radius-md)',
                  padding:'1rem', borderLeft:'3px solid var(--primary)',
                }}>
                  <div className="flex items-center justify-between" style={{ marginBottom:'0.5rem' }}>
                    <span className="text-sm font-semibold text-primary">
                      <Clock size={12} style={{ display:'inline', marginRight:4 }} />
                      {format(parseISO(c.fecha), "d MMM yyyy · HH:mm", { locale: es })}
                    </span>
                    <span className="text-xs text-muted">
                      Dr. {c.medico?.nombre} {c.medico?.apellido}
                    </span>
                  </div>
                  {c.diagnostico && <p className="text-sm" style={{ marginBottom:'0.25rem' }}><strong>Diagnóstico:</strong> {c.diagnostico}</p>}
                  {c.tratamiento && <p className="text-sm text-muted">{c.tratamiento}</p>}
                  {c.estudios?.length > 0 && (
                    <p className="text-xs text-primary" style={{ marginTop:'0.5rem' }}>
                      📎 {c.estudios.length} estudio(s) adjunto(s)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div style={{ padding:'0.5rem 0', borderBottom:'1px solid rgba(59,74,72,0.08)' }}>
      <span style={{ fontSize:'0.7rem', color:'var(--on-surface-variant)', display:'block',
        textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.125rem' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize:'0.9375rem', color:'var(--on-surface)' }}>{value}</span>
    </div>
  )
}
