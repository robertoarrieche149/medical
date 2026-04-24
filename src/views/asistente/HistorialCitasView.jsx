import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Search, Calendar, User, Clock, FilterX } from 'lucide-react'
import toast from 'react-hot-toast'
import './HistorialCitas.css'

const ESTADOS = ['programada', 'confirmada', 'completada', 'cancelada', 'no_asistio']
const ESTADO_CFG = {
  programada:  { label: 'Programada',  color: 'primary' },
  confirmada:  { label: 'Confirmada',  color: 'success' },
  completada:  { label: 'Completada',  color: 'neutral' },
  cancelada:   { label: 'Cancelada',   color: 'error' },
  no_asistio:  { label: 'No asistió',  color: 'warning' },
}

export default function HistorialCitasView() {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchCedula, setSearchCedula] = useState('')
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const buscarHistorial = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('citas')
        .select(`
          *,
          paciente:paciente_id (id, nombre, apellido, cedula, telefono),
          asistente:asistente_id (nombre, apellido)
        `)
        .order('fecha_hora', { ascending: false })

      if (pacienteEncontrado) q = q.eq('paciente_id', pacienteEncontrado.id)
      if (filtroEstado) q = q.eq('estado', filtroEstado)
      if (filtroDesde) q = q.gte('fecha_hora', filtroDesde)
      if (filtroHasta) q = q.lte('fecha_hora', filtroHasta + 'T23:59:59')

      q = q.limit(100)
      const { data, error } = await q
      if (error) throw error
      setCitas(data || [])
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [pacienteEncontrado, filtroEstado, filtroDesde, filtroHasta])

  useEffect(() => { buscarHistorial() }, [buscarHistorial])

  async function handleBuscarPaciente(e) {
    e.preventDefault()
    if (!searchCedula.trim()) {
      setPacienteEncontrado(null)
      return
    }
    const { data, error } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido, cedula, telefono, fecha_nacimiento')
      .eq('cedula', searchCedula.trim())
      .single()
    if (error || !data) {
      toast.error('No se encontró paciente con esa cédula')
      setPacienteEncontrado(null)
    } else {
      setPacienteEncontrado(data)
      toast.success(`Paciente: ${data.nombre} ${data.apellido}`)
    }
  }

  function limpiarFiltros() {
    setSearchCedula('')
    setPacienteEncontrado(null)
    setFiltroEstado('')
    setFiltroDesde('')
    setFiltroHasta('')
  }

  async function cambiarEstado(cita, nuevoEstado) {
    try {
      await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', cita.id)
      toast.success('Estado actualizado')
      buscarHistorial()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  return (
    <div className="historial-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Citas</h1>
          <p className="page-subtitle">{citas.length} cita{citas.length !== 1 ? 's' : ''} encontrada{citas.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={limpiarFiltros}>
          <FilterX size={14} /> Limpiar filtros
        </button>
      </div>

      {/* Buscador por cédula */}
      <div className="card historial-filters">
        <form className="historial-cedula-form" onSubmit={handleBuscarPaciente}>
          <div style={{ position:'relative', flex:1 }}>
            <User size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'var(--outline)' }} />
            <input className="form-input" placeholder="Buscar por cédula (Ej: V-12345678)"
              value={searchCedula} onChange={e => setSearchCedula(e.target.value)}
              style={{ paddingLeft:'2.5rem' }} />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={14} /> Buscar
          </button>
        </form>

        <div className="historial-filtros-extra">
          <select className="form-select" style={{ maxWidth:180 }}
            value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_CFG[e]?.label}</option>)}
          </select>
          <input type="date" className="form-input" style={{ maxWidth:170 }}
            value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
          <span className="text-xs text-muted">hasta</span>
          <input type="date" className="form-input" style={{ maxWidth:170 }}
            value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
        </div>
      </div>

      {/* Perfil del paciente encontrado */}
      {pacienteEncontrado && (
        <div className="card paciente-perfil-mini">
          <div className="paciente-avatar" style={{ width:44, height:44 }}>
            {pacienteEncontrado.nombre[0]}{pacienteEncontrado.apellido[0]}
          </div>
          <div style={{ flex:1 }}>
            <p className="font-semibold">{pacienteEncontrado.nombre} {pacienteEncontrado.apellido}</p>
            <p className="text-xs text-muted">C.I. {pacienteEncontrado.cedula} · {pacienteEncontrado.telefono || 'Sin teléfono'}</p>
          </div>
          <span className="chip chip-primary">{citas.length} cita{citas.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight:300 }}><div className="spinner" /></div>
      ) : citas.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--on-surface-variant)' }}>
          <Calendar size={48} strokeWidth={1} style={{ margin:'0 auto 1rem' }} />
          <p>No se encontraron citas con esos filtros</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Paciente</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Agendada por</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.map(c => {
                  const cfg = ESTADO_CFG[c.estado] ?? { label: c.estado, color: 'neutral' }
                  const puedeModificar = ['programada','confirmada'].includes(c.estado)
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Clock size={13} style={{ color:'var(--primary)', flexShrink:0 }} />
                          <div>
                            <p className="text-sm font-semibold">
                              {new Date(c.fecha_hora).toLocaleDateString('es-VE', { day:'numeric', month:'short', year:'numeric' })}
                            </p>
                            <p className="text-xs text-muted">
                              {new Date(c.fecha_hora).toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {!pacienteEncontrado && (
                          <div>
                            <p className="text-sm font-semibold">{c.paciente?.nombre} {c.paciente?.apellido}</p>
                            <p className="text-xs text-muted">{c.paciente?.cedula}</p>
                          </div>
                        )}
                        {pacienteEncontrado && <span className="text-sm text-muted">—</span>}
                      </td>
                      <td><span className="chip chip-neutral">{c.tipo?.replace('_', ' ')}</span></td>
                      <td><span className={`chip chip-${cfg.color}`}>{cfg.label}</span></td>
                      <td className="text-xs text-muted">
                        {c.asistente ? `${c.asistente.nombre} ${c.asistente.apellido}` : '—'}
                      </td>
                      <td className="text-xs text-muted" style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis' }}>
                        {c.notas || '—'}
                      </td>
                      <td>
                        {puedeModificar && (
                          <div className="flex gap-1">
                            <button className="btn btn-sm btn-secondary" style={{ fontSize:'0.7rem' }}
                              onClick={() => cambiarEstado(c, 'confirmada')}>
                              Confirmar
                            </button>
                            <button className="btn btn-sm" style={{ fontSize:'0.7rem', background:'var(--error-container)', color:'var(--on-error-container)' }}
                              onClick={() => cambiarEstado(c, 'cancelada')}>
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
