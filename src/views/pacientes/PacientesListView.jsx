import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPacientes, deletePaciente } from '../../services/pacientesService'
import PacienteFormModal from './PacienteFormModal'
import toast from 'react-hot-toast'
import { Plus, Search, Eye, Pencil, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import './Pacientes.css'

const PRIORIDAD_CHIP = {
  normal: 'chip-success',
  alta: 'chip-warning',
  urgente: 'chip-danger',
}

const PRIORIDAD_LABEL = {
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

const PAGE_LIMIT = 15

export default function PacientesListView() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data, total: t } = await getPacientes({ search, prioridad, page, limit: PAGE_LIMIT })
      setPacientes(data)
      setTotal(t)
    } catch (err) {
      toast.error('Error cargando pacientes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [search, prioridad, page])

  useEffect(() => { cargar() }, [cargar])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, prioridad])

  async function handleEliminar(id, nombre) {
    if (!window.confirm(`¿Eliminar a ${nombre}? Esta acción es irreversible.`)) return
    try {
      await deletePaciente(id)
      toast.success('Paciente eliminado')
      cargar()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  function handleEditar(paciente) {
    setEditando(paciente)
    setModalOpen(true)
  }

  function handleNuevo() {
    setEditando(null)
    setModalOpen(true)
  }

  function handleModalClose(recargar) {
    setModalOpen(false)
    setEditando(null)
    if (recargar) cargar()
  }

  const totalPages = Math.ceil(total / PAGE_LIMIT)

  return (
    <div className="pacientes-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">{total} paciente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button id="btn-nuevo-paciente" className="btn btn-primary" onClick={handleNuevo}>
          <Plus size={16} /> Nuevo Paciente
        </button>
      </div>

      {/* Filtros */}
      <div className="pacientes-filters card">
        <div className="filter-search">
          <Search size={16} className="filter-search-icon" />
          <input
            id="search-pacientes"
            type="text"
            className="form-input"
            placeholder="Buscar por nombre, apellido o cédula…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          id="filter-prioridad"
          className="form-select filter-select"
          value={prioridad}
          onChange={e => setPrioridad(e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          <option value="normal">Normal</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="card">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: '300px' }}>
            <div className="spinner" />
          </div>
        ) : pacientes.length === 0 ? (
          <div className="pacientes-empty">
            <Users size={48} strokeWidth={1} />
            <p>No se encontraron pacientes</p>
            <button className="btn btn-primary btn-sm" onClick={handleNuevo}>
              <Plus size={14} /> Registrar primero
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre completo</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Prioridad</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map(p => (
                  <tr key={p.id}>
                    <td className="text-sm font-semibold">{p.cedula}</td>
                    <td>
                      <div className="paciente-nombre">
                        <div className="paciente-avatar">
                          {p.nombre[0]}{p.apellido[0]}
                        </div>
                        <div>
                          <span className="font-semibold">{p.nombre} {p.apellido}</span>
                          {p.fecha_nacimiento && (
                            <span className="text-xs text-muted" style={{ display: 'block' }}>
                              {calcularEdad(p.fecha_nacimiento)} años
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{p.telefono || '—'}</td>
                    <td className="text-sm truncate" style={{ maxWidth: '180px' }}>{p.email || '—'}</td>
                    <td>
                      <span className={`chip ${PRIORIDAD_CHIP[p.prioridad_clinica]}`}>
                        {PRIORIDAD_LABEL[p.prioridad_clinica]}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-row">
                        <button
                          className="btn-icon"
                          title="Ver expediente"
                          onClick={() => navigate(`/pacientes/${p.id}`)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Editar"
                          onClick={() => handleEditar(p)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          title="Eliminar"
                          onClick={() => handleEliminar(p.id, `${p.nombre} ${p.apellido}`)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="text-sm text-muted">
              Página {page} de {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <PacienteFormModal
          paciente={editando}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

function calcularEdad(fechaNacimiento) {
  const diff = Date.now() - new Date(fechaNacimiento).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}
