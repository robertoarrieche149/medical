import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { getCitasByFecha } from '../../services/citasService'
import { getPacientes } from '../../services/pacientesService'
import CitaFormModal from './CitaFormModal'
import CitaDetailPanel from './CitaDetailPanel'
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import './Citas.css'

const HORAS = Array.from({ length: 13 }, (_, i) => i + 7) // 7:00 – 19:00
const DIAS = [0, 1, 2, 3, 4, 5] // Lun–Sab (offset desde startOfWeek)

const TIPO_COLOR = {
  primera_vez: 'cita-primera',
  control: 'cita-control',
  procedimiento: 'cita-procedimiento',
}

export default function CitasView() {
  const [semana, setSemana] = useState(new Date())
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [slotSeleccionado, setSlotSeleccionado] = useState(null)
  const [pacientes, setPacientes] = useState([])

  const lunesActual = startOfWeek(semana, { weekStartsOn: 1 })
  const sabadoActual = endOfWeek(semana, { weekStartsOn: 1 })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCitasByFecha(lunesActual.toISOString(), sabadoActual.toISOString())
      setCitas(data)
    } catch (err) {
      toast.error('Error cargando citas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [semana])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    getPacientes({ limit: 200 }).then(({ data }) => setPacientes(data)).catch(() => {})
  }, [])

  function getCitasDia(diaOffset) {
    const dia = addDays(lunesActual, diaOffset)
    return citas.filter(c => isSameDay(parseISO(c.fecha_hora), dia))
  }

  function getCitaEnSlot(diaOffset, hora) {
    return getCitasDia(diaOffset).filter(c => {
      const h = new Date(c.fecha_hora).getHours()
      return h === hora
    })
  }

  function handleSlotClick(diaOffset, hora) {
    const dia = addDays(lunesActual, diaOffset)
    dia.setHours(hora, 0, 0, 0)
    setSlotSeleccionado(dia.toISOString())
    setCitaSeleccionada(null)
    setModalOpen(true)
  }

  function handleCitaClick(e, cita) {
    e.stopPropagation()
    setCitaSeleccionada(cita)
  }

  function handleModalClose(recargar) {
    setModalOpen(false)
    setSlotSeleccionado(null)
    if (recargar) cargar()
  }

  const titleSemana = `${format(lunesActual, "d 'de' MMMM", { locale: es })} — ${format(addDays(lunesActual, 5), "d 'de' MMMM yyyy", { locale: es })}`

  return (
    <div className="citas-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda de Citas</h1>
          <p className="page-subtitle">{titleSemana}</p>
        </div>
        <button id="btn-nueva-cita" className="btn btn-primary" onClick={() => { setSlotSeleccionado(null); setModalOpen(true) }}>
          <Plus size={16} /> Nueva Cita
        </button>
      </div>

      <div className="citas-layout">
        {/* Calendario */}
        <div className="citas-calendar-wrap card">
          {/* Navegación de semana */}
          <div className="calendar-nav">
            <button className="btn-icon" onClick={() => setSemana(s => subWeeks(s, 1))}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSemana(new Date())}>
              Hoy
            </button>
            <button className="btn-icon" onClick={() => setSemana(s => addWeeks(s, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>

          {loading ? (
            <div className="loading-screen" style={{ minHeight: '400px' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="calendar-grid">
              {/* Encabezado días */}
              <div className="calendar-time-gutter" />
              {DIAS.map(offset => {
                const dia = addDays(lunesActual, offset)
                const esHoy = isSameDay(dia, new Date())
                return (
                  <div key={offset} className={`calendar-day-header ${esHoy ? 'hoy' : ''}`}>
                    <span className="calendar-day-name">
                      {format(dia, 'EEE', { locale: es })}
                    </span>
                    <span className={`calendar-day-num ${esHoy ? 'hoy' : ''}`}>
                      {format(dia, 'd')}
                    </span>
                  </div>
                )
              })}

              {/* Filas de horas */}
              {HORAS.map(hora => (
                <>
                  <div key={`t-${hora}`} className="calendar-time-label">
                    {hora}:00
                  </div>
                  {DIAS.map(offset => {
                    const citasSlot = getCitaEnSlot(offset, hora)
                    return (
                      <div
                        key={`slot-${offset}-${hora}`}
                        className="calendar-slot"
                        onClick={() => handleSlotClick(offset, hora)}
                      >
                        {citasSlot.map(cita => (
                          <div
                            key={cita.id}
                            className={`cita-block ${TIPO_COLOR[cita.tipo] ?? ''}`}
                            onClick={e => handleCitaClick(e, cita)}
                            title={`${cita.paciente?.nombre ?? ''} ${cita.paciente?.apellido ?? ''}`}
                          >
                            <span className="cita-block-hora">
                              {format(parseISO(cita.fecha_hora), 'HH:mm')}
                            </span>
                            <span className="cita-block-nombre truncate">
                              {cita.paciente?.nombre ?? '?'} {cita.paciente?.apellido ?? ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          )}

          {/* Leyenda */}
          <div className="calendar-legend">
            <span className="legend-item"><span className="legend-dot cita-primera" />Primera vez</span>
            <span className="legend-item"><span className="legend-dot cita-control" />Control</span>
            <span className="legend-item"><span className="legend-dot cita-procedimiento" />Procedimiento</span>
          </div>
        </div>

        {/* Panel lateral — detalle de cita */}
        <CitaDetailPanel
          cita={citaSeleccionada}
          onClose={() => setCitaSeleccionada(null)}
          onReload={cargar}
        />
      </div>

      {/* Modal nueva/editar cita */}
      {modalOpen && (
        <CitaFormModal
          slotInicial={slotSeleccionado}
          pacientes={pacientes}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}
