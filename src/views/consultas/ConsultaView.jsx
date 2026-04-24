import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPacientes } from '../../services/pacientesService'
import { createConsulta, updateConsulta } from '../../services/consultasService'
import { getCitasByFecha } from '../../services/citasService'
import { supabase } from '../../lib/supabaseClient'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Stethoscope, Search, Plus, Eye, Pencil, FileText } from 'lucide-react'
import ConsultaFormModal from './ConsultaFormModal'
import ConsultaDetailModal from './ConsultaDetailModal'
import toast from 'react-hot-toast'
import './Consulta.css'

export default function ConsultaView() {
  const { perfil, isMedico } = useAuth()
  const [consultas, setConsultas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [editando, setEditando] = useState(null)

  const cargarConsultas = useCallback(async () => {
    setLoading(true)
    try {
      const medicoId = isMedico ? perfil?.id : null
      let query = supabase
        .from('consultas')
        .select(`
          *,
          paciente:paciente_id (id, nombre, apellido, cedula),
          medico:medico_id (id, nombre, apellido),
          cita:cita_id (id, tipo, fecha_hora),
          estudios (id, tipo_estudio, archivo_nombre)
        `)
        .order('fecha', { ascending: false })
        .limit(60)

      if (medicoId) query = query.eq('medico_id', medicoId)

      const { data, error } = await query
      if (error) throw error
      setConsultas(data ?? [])
    } catch (err) {
      toast.error('Error cargando consultas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [perfil, isMedico])

  useEffect(() => { if (perfil) cargarConsultas() }, [cargarConsultas])

  useEffect(() => {
    getPacientes({ limit: 300 }).then(({ data }) => setPacientes(data)).catch(() => {})
  }, [])

  const filtradas = consultas.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.paciente?.nombre?.toLowerCase().includes(q) ||
      c.paciente?.apellido?.toLowerCase().includes(q) ||
      c.diagnostico?.toLowerCase().includes(q)
    )
  })

  function handleNueva() { setEditando(null); setModalForm(true) }
  function handleEditar(c) { setEditando(c); setModalForm(true) }
  function handleDetalle(c) { setModalDetalle(c) }

  function handleFormClose(recargar) {
    setModalForm(false)
    setEditando(null)
    if (recargar) cargarConsultas()
  }

  return (
    <div className="consulta-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Módulo Clínico</h1>
          <p className="page-subtitle">{filtradas.length} consulta{filtradas.length !== 1 ? 's' : ''} registrada{filtradas.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="btn-nueva-consulta" className="btn btn-primary" onClick={handleNueva}>
          <Plus size={16} /> Nueva Consulta
        </button>
      </div>

      {/* Buscador */}
      <div className="card consulta-search-bar">
        <Search size={16} className="consulta-search-icon" />
        <input
          id="search-consultas"
          type="text"
          className="form-input"
          placeholder="Buscar por paciente o diagnóstico…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="card consulta-empty">
          <Stethoscope size={48} strokeWidth={1} />
          <p>No hay consultas registradas</p>
          <button className="btn btn-primary btn-sm" onClick={handleNueva}>
            <Plus size={14} /> Registrar primera consulta
          </button>
        </div>
      ) : (
        <div className="consulta-grid">
          {filtradas.map(c => (
            <ConsultaCard
              key={c.id}
              consulta={c}
              onDetalle={() => handleDetalle(c)}
              onEditar={() => handleEditar(c)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {modalForm && (
        <ConsultaFormModal
          consulta={editando}
          pacientes={pacientes}
          medicoId={perfil?.id}
          onClose={handleFormClose}
        />
      )}

      {modalDetalle && (
        <ConsultaDetailModal
          consulta={modalDetalle}
          onClose={() => { setModalDetalle(null); cargarConsultas() }}
        />
      )}
    </div>
  )
}

function ConsultaCard({ consulta: c, onDetalle, onEditar }) {
  const fecha = c.fecha ? format(parseISO(c.fecha), "d MMM yyyy", { locale: es }) : '—'
  const hora = c.fecha ? format(parseISO(c.fecha), 'HH:mm') : ''

  return (
    <div className="consulta-card card">
      <div className="consulta-card-header">
        <div className="consulta-card-patient">
          <div className="paciente-avatar" style={{ width:36, height:36, fontSize:'0.7rem' }}>
            {c.paciente?.nombre?.[0]}{c.paciente?.apellido?.[0]}
          </div>
          <div>
            <span className="font-semibold text-sm">
              {c.paciente?.nombre} {c.paciente?.apellido}
            </span>
            <span className="text-xs text-muted" style={{ display:'block' }}>
              CI: {c.paciente?.cedula ?? '—'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-icon" title="Ver detalle y estudios" onClick={onDetalle}>
            <Eye size={15} />
          </button>
          <button className="btn-icon" title="Editar consulta" onClick={onEditar}>
            <Pencil size={15} />
          </button>
        </div>
      </div>

      <div className="consulta-card-body">
        {c.diagnostico && (
          <div className="consulta-field">
            <span className="consulta-field-label">Diagnóstico</span>
            <p className="consulta-field-value truncate">{c.diagnostico}</p>
          </div>
        )}
        {c.tratamiento && (
          <div className="consulta-field">
            <span className="consulta-field-label">Tratamiento</span>
            <p className="consulta-field-value truncate">{c.tratamiento}</p>
          </div>
        )}
        {c.notas_medico && (
          <div className="consulta-field">
            <span className="consulta-field-label">Notas</span>
            <p className="consulta-field-value truncate text-muted" style={{ fontSize:'0.8125rem' }}>
              {c.notas_medico}
            </p>
          </div>
        )}
      </div>

      <div className="consulta-card-footer">
        <span className="text-xs text-muted">
          {fecha} {hora && `· ${hora}`}
        </span>
        <div className="flex gap-2 items-center">
          {c.estudios?.length > 0 && (
            <span className="chip chip-primary" style={{ gap:'0.25rem' }}>
              <FileText size={10} /> {c.estudios.length}
            </span>
          )}
          <span className="text-xs text-muted">
            Dr. {c.medico?.apellido ?? '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
