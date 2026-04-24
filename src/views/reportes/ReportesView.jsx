import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getKpisDashboard,
  getEstadisticasSemanales,
  getDistribucionPorTipo,
} from '../../services/reportesService'
import { getCitasByFecha } from '../../services/citasService'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Download, FileSpreadsheet, FileText, BarChart3, TrendingUp } from 'lucide-react'
import { exportarPDF, exportarExcel } from './reportesExport'
import toast from 'react-hot-toast'
import './Reportes.css'

export default function ReportesView() {
  const { perfil, isAdmin } = useAuth()
  const [periodo, setPeriodo] = useState('mes')
  const [kpis, setKpis] = useState(null)
  const [semanas, setSemanas] = useState([])
  const [distribucion, setDistribucion] = useState([])
  const [citasMes, setCitasMes] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [kpiData, semanasData, distData] = await Promise.all([
        getKpisDashboard(),
        getEstadisticasSemanales(12),
        getDistribucionPorTipo(),
      ])
      setKpis(kpiData)
      setSemanas(semanasData)
      setDistribucion(distData)

      // Citas del mes actual para la tabla
      const inicio = startOfMonth(new Date()).toISOString()
      const fin = endOfMonth(new Date()).toISOString()
      const citas = await getCitasByFecha(inicio, fin)
      setCitasMes(citas)
    } catch (err) {
      toast.error('Error cargando reportes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function handleExportPDF() {
    setExportando(true)
    try {
      await exportarPDF({ kpis, semanas, distribucion, citasMes })
      toast.success('PDF generado exitosamente')
    } catch (err) {
      toast.error('Error generando PDF: ' + err.message)
    } finally {
      setExportando(false)
    }
  }

  async function handleExportExcel() {
    setExportando(true)
    try {
      exportarExcel({ kpis, citasMes })
      toast.success('Excel descargado')
    } catch (err) {
      toast.error('Error generando Excel: ' + err.message)
    } finally {
      setExportando(false)
    }
  }

  const mesTitulo = format(new Date(), "MMMM yyyy", { locale: es })

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
      <p className="text-muted text-sm">Cargando estadísticas…</p>
    </div>
  )

  return (
    <div className="reportes-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-subtitle" style={{ textTransform:'capitalize' }}>
            <BarChart3 size={13} style={{ display:'inline', marginRight:4 }} />
            {mesTitulo} · {citasMes.length} citas en el mes
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleExportExcel} disabled={exportando}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF} disabled={exportando}>
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      {/* KPIs resumen */}
      <div className="reportes-kpis">
        <KpiReporte label="Total citas hoy" value={kpis?.citasHoy ?? 0} color="primary" />
        <KpiReporte label="Atendidos hoy" value={kpis?.atendidos ?? 0} color="success" />
        <KpiReporte label="Ausencias hoy" value={kpis?.ausencias ?? 0} color="danger" />
        <KpiReporte label="Nuevos pacientes (mes)" value={kpis?.nuevosPacientes ?? 0} color="warning" />
        <KpiReporte label="Total pacientes activos" value={kpis?.totalPacientes ?? 0} color="secondary" />
        <KpiReporte
          label="Tasa asistencia"
          value={kpis?.citasHoy
            ? `${Math.round((kpis.atendidos / kpis.citasHoy) * 100)}%`
            : '—'}
          color="primary"
        />
      </div>

      {/* Gráficos fila 1 */}
      <div className="reportes-charts-row">
        <div className="card reportes-chart-big">
          <div className="card-header">
            <h3 className="card-title">Tendencia de Citas (12 semanas)</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={semanas} margin={{ left:-20, right:8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,74,72,0.1)" />
              <XAxis dataKey="semana" tick={{ fill:'var(--on-surface-variant)', fontSize:10 }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--on-surface-variant)', fontSize:10 }}
                axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{
                background:'var(--surface-container-high)', border:'none',
                borderRadius:'0.5rem', fontSize:'0.8125rem',
              }} />
              <Line type="monotone" dataKey="total" name="Total" stroke="var(--primary)"
                strokeWidth={2} dot={{ fill:'var(--primary)', r:3 }} />
              <Line type="monotone" dataKey="asistencia" name="Asistidos"
                stroke="var(--secondary)" strokeWidth={2} dot={{ fill:'var(--secondary)', r:3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tipo de Consulta</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={distribucion} cx="50%" cy="44%"
                innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {distribucion.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{
                background:'var(--surface-container-high)', border:'none',
                borderRadius:'0.5rem', fontSize:'0.8125rem',
              }} />
              <Legend iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize:'0.8125rem', color:'var(--on-surface-variant)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos fila 2 — barras de asistencia */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Asistencia vs Ausencias (semanas recientes)</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={semanas.slice(-8)} barSize={14} margin={{ left:-20, right:8 }}>
            <XAxis dataKey="semana" tick={{ fill:'var(--on-surface-variant)', fontSize:10 }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:'var(--on-surface-variant)', fontSize:10 }}
              axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{
              background:'var(--surface-container-high)', border:'none',
              borderRadius:'0.5rem', fontSize:'0.8125rem',
            }} />
            <Bar dataKey="asistencia" name="Asistencia" fill="var(--primary)" radius={[4,4,0,0]} />
            <Bar dataKey="ausencias" name="Ausencias" fill="var(--error)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla citas del mes */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <TrendingUp size={16} style={{ display:'inline', marginRight:6 }} />
            Citas del mes ({citasMes.length})
          </h3>
        </div>
        {citasMes.length === 0 ? (
          <p className="text-muted text-sm" style={{ padding:'1rem 0' }}>No hay citas este mes.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasMes.slice(0, 25).map(cita => (
                  <tr key={cita.id}>
                    <td className="text-sm">
                      {format(new Date(cita.fecha_hora), 'd MMM', { locale: es })}
                    </td>
                    <td className="text-sm font-semibold text-primary">
                      {format(new Date(cita.fecha_hora), 'HH:mm')}
                    </td>
                    <td className="text-sm">
                      {cita.paciente ? `${cita.paciente.nombre} ${cita.paciente.apellido}` : '—'}
                    </td>
                    <td>
                      <span className={`chip chip-${
                        cita.tipo === 'primera_vez' ? 'primary'
                        : cita.tipo === 'control' ? 'secondary' : 'warning'
                      }`}>
                        {cita.tipo === 'primera_vez' ? 'Primera vez'
                          : cita.tipo === 'control' ? 'Control' : 'Procedimiento'}
                      </span>
                    </td>
                    <td>
                      <span className={`chip chip-${
                        cita.estado === 'completada' ? 'success'
                        : cita.estado === 'cancelada' ? 'danger'
                        : cita.estado === 'no_asistio' ? 'neutral' : 'secondary'
                      }`}>
                        {cita.estado.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {citasMes.length > 25 && (
              <p className="text-xs text-muted" style={{ padding:'0.75rem 1rem' }}>
                Mostrando 25 de {citasMes.length}. Exporta a Excel para ver todas.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiReporte({ label, value, color }) {
  return (
    <div className={`reporte-kpi card kpi-${color}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={{ fontSize:'1.75rem' }}>{value}</span>
    </div>
  )
}
