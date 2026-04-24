import { useState, useEffect, useCallback } from 'react'
import { getUsuarios, createUsuario, updateUsuario, toggleUsuarioActivo } from '../../services/usuariosService'
import { Plus, Search, Pencil, Power, PowerOff, ShieldCheck, Stethoscope, UserCog } from 'lucide-react'
import UsuarioFormModal from './UsuarioFormModal'
import toast from 'react-hot-toast'
import './Usuarios.css'

const ROL_CONFIG = {
  admin:     { label: 'Administrador', icon: ShieldCheck,  color: 'primary' },
  medico:    { label: 'Médico Especialista', icon: Stethoscope, color: 'success' },
  asistente: { label: 'Asistente', icon: UserCog, color: 'warning' },
}

export default function UsuariosView() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rolFiltro, setRolFiltro] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [editando, setEditando] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUsuarios({ search, rol: rolFiltro })
      setUsuarios(data)
    } catch (err) {
      toast.error('Error cargando usuarios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [search, rolFiltro])

  useEffect(() => { cargar() }, [cargar])

  async function handleToggle(u) {
    const nuevoEstado = !u.activo
    try {
      await toggleUsuarioActivo(u.id, nuevoEstado)
      toast.success(nuevoEstado ? `${u.nombre} activado` : `${u.nombre} desactivado`)
      cargar()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  function handleNuevo() { setEditando(null); setModalForm(true) }
  function handleEditar(u) { setEditando(u); setModalForm(true) }
  function handleClose(recargar) {
    setModalForm(false)
    setEditando(null)
    if (recargar) cargar()
  }

  return (
    <div className="usuarios-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="btn-nuevo-usuario" className="btn btn-primary" onClick={handleNuevo}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="card usuarios-filters">
        <div className="usuarios-search-wrap">
          <Search size={15} className="usuarios-search-icon" />
          <input
            id="search-usuarios"
            type="text"
            className="form-input"
            placeholder="Buscar por nombre, apellido o correo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <select id="filter-rol" className="form-select" style={{ maxWidth: 200 }}
          value={rolFiltro} onChange={e => setRolFiltro(e.target.value)}>
          <option value="">Todos los roles</option>
          {Object.entries(ROL_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>
          <UserCog size={48} strokeWidth={1} style={{ margin: '0 auto 1rem' }} />
          <p>No hay usuarios registrados con esos criterios</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={handleNuevo}>
            <Plus size={14} /> Crear primer usuario
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const cfg = ROL_CONFIG[u.rol] ?? { label: u.rol, color: 'neutral' }
                  const Icon = cfg.icon ?? UserCog
                  return (
                    <tr key={u.id} className={!u.activo ? 'usuario-inactivo' : ''}>
                      <td>
                        <div className="usuario-cell">
                          <div className="paciente-avatar" style={{ width:36, height:36, fontSize:'0.7rem', flexShrink:0 }}>
                            {u.nombre?.[0]}{u.apellido?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{u.nombre} {u.apellido}</p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`chip chip-${cfg.color}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{u.telefono || '—'}</td>
                      <td>
                        <span className={`chip ${u.activo ? 'chip-success' : 'chip-neutral'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          <button className="btn-icon" title="Editar usuario" onClick={() => handleEditar(u)}>
                            <Pencil size={15} />
                          </button>
                          <button
                            className={`btn-icon ${u.activo ? 'btn-icon-danger' : ''}`}
                            title={u.activo ? 'Desactivar' : 'Activar'}
                            onClick={() => handleToggle(u)}
                          >
                            {u.activo ? <PowerOff size={15} /> : <Power size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalForm && (
        <UsuarioFormModal
          usuario={editando}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
