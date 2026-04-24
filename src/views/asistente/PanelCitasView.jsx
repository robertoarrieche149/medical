import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { getBloques, generarSlots } from '../../services/bloquesService'
import { useAuth } from '../../context/AuthContext'
import {
  CalendarDays, Plus, Search, Clock, User, CheckCircle2,
  XCircle, AlertCircle, ChevronLeft, ChevronRight, Loader
} from 'lucide-react'
import CitaFormModal from './CitaFormModal'
import CitaDetailPanel from './CitaDetailPanel'
import toast from 'react-hot-toast'
import './PanelCitas.css'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const ESTADO_CFG = {
  programada:  { label: 'Programada',  color: 'primary',  Icon: Clock },
  confirmada:  { label: 'Confirmada',  color: 'success',  Icon: CheckCircle2 },
  completada:  { label: 'Completada',  color: 'neutral',  Icon: CheckCircle2 },
  cancelada:   { label: 'Cancelada',   color: 'error',    Icon: XCircle },
  no_asistio:  { label: 'No asistió',  color: 'warning',  Icon: AlertCircle },
}

function getLunes(ref = new Date()) {
  const d = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function diasDeSemana(lunes) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    return d
  })
}

export default function PanelCitasView() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [lunes, setLunes] = useState(getLunes)
  const [dias, setDias] = useState(diasDeSemana(getLunes()))
  const [citas, setCitas] = useState([])
  const [bloques, setBloques] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalForm, setModalForm] = useState(false)
  const [citaSelected, setCitaSelected] = useState(null)
  const [panelDetalle, setPanelDetalle] = useState(false)

  const cargarSemana = useCallback(async (lunes) => {
    setLoading(true)
    const inicio = lunes.toISOString()
    const fin = new Date(lunes.getTime() + 6 * 24 * 60 * 60 * 1000 + 86399999).toISOString()
    try {
      const [{ data }, bls] = await Promise.all([
        supabase.from('citas')
          .select(`*, paciente:paciente_id(nombre, apellido, cedula, telefono)`)
          .gte('fecha_hora', inicio)
          .lte('fecha_hora', fin)
          .order('fecha_hora'),
        getBloques(),
      ])
      setCitas(data || [])
      setBloques(bls)
    } catch (err) {
      toast.error('Error cargando citas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const nuevos = diasDeSemana(lunes)
    setDias(nuevos)
    cargarSemana(lunes)
  }, [lunes, cargarSemana])

  function semanaAnterior() { const d = new Date(lunes); d.setDate(d.getDate() - 7); setLunes(d) }
  function semanaSiguiente() { const d = new Date(lunes); d.setDate(d.getDate() + 7); setLunes(d) }
  function irHoy() { setLunes(getLunes()) }

  function citasDelDia(dia) {
    const ds = dia.toDateString()
    return citas.filter(c => new Date(c.fecha_hora).toDateString() === ds)
  }

  function abrirDetalle(cita) { setCitaSelected(cita); setPanelDetalle(true) }

  return (
    <div className="panel-citas-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda de Citas</h1>
          <p className="page-subtitle">Semana del {lunes.toLocaleDateString('es-VE', { day:'numeric', month:'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={irHoy}>Hoy</button>
          <button id="btn-nueva-cita" className="btn btn-primary" onClick={() => setModalForm(true)}>
            <Plus size={16} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Navegación semana */}
      <div className="card semana-nav">
        <button className="btn-icon" onClick={semanaAnterior}><ChevronLeft size={18} /></button>
        <div className="semana-dias">
          {dias.map((dia, i) => {
            const esHoy = dia.toDateString() === new Date().toDateString()
            const citasDia = citasDelDia(dia)
            return (
              <div key={i} className={`semana-dia ${esHoy ? 'semana-dia-hoy' : ''}`}>
                <span className="semana-dia-label">{DIAS[i]}</span>
                <span className="semana-dia-num">{dia.getDate()}</span>
                {citasDia.length > 0 && (
                  <span className="semana-dia-badge">{citasDia.length}</span>
                )}
              </div>
            )
          })}
        </div>
        <button className="btn-icon" onClick={semanaSiguiente}><ChevronRight size={18} /></button>
      </div>

      {/* Grid de citas por día */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="citas-semana-grid">
          {dias.map((dia, i) => {
            const citasDia = citasDelDia(dia)
            const esHoy = dia.toDateString() === new Date().toDateString()
            const slotsDisp = generarSlots(bloques, dia)
            return (
              <div key={i} className={`dia-columna card ${esHoy ? 'dia-columna-hoy' : ''}`}>
                <div className="dia-columna-header">
                  <span className="dia-columna-nombre">{DIAS[i]}</span>
                  <span className="dia-columna-fecha">
                    {dia.toLocaleDateString('es-VE', { day:'numeric', month:'short' })}
                  </span>
                  {slotsDisp.length === 0 && (
                    <span className="chip chip-neutral" style={{ fontSize:'0.65rem' }}>Sin horario</span>
                  )}
                </div>

                {citasDia.length === 0 ? (
                  <p className="dia-sin-citas text-xs text-muted">Sin citas</p>
                ) : (
                  <div className="dia-citas-lista">
                    {citasDia.map(cita => {
                      const cfg = ESTADO_CFG[cita.estado] ?? ESTADO_CFG.programada
                      const Icon = cfg.Icon
                      return (
                        <button key={cita.id} className={`cita-card-mini cita-${cfg.color}`}
                          onClick={() => abrirDetalle(cita)}>
                          <div className="cita-mini-hora">
                            <Clock size={11} />
                            {new Date(cita.fecha_hora).toLocaleTimeString('es-VE', { hour:'2-digit', minute:'2-digit' })}
                          </div>
                          <div className="cita-mini-paciente">
                            <User size={11} />
                            {cita.paciente?.nombre} {cita.paciente?.apellido}
                          </div>
                          <div className="cita-mini-tipo">{cita.tipo?.replace('_', ' ')}</div>
                          <span className={`chip chip-${cfg.color}`} style={{ fontSize:'0.6rem', padding:'1px 6px' }}>
                            <Icon size={9} /> {cfg.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modales */}
      {modalForm && (
        <CitaFormModal
          bloques={bloques}
          asistente_id={perfil?.id}
          onClose={(recargar) => { setModalForm(false); if (recargar) cargarSemana(lunes) }}
        />
      )}
      {panelDetalle && citaSelected && (
        <CitaDetailPanel
          cita={citaSelected}
          onClose={(recargar) => { setPanelDetalle(false); if (recargar) cargarSemana(lunes) }}
        />
      )}
    </div>
  )
}
