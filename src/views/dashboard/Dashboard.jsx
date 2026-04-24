import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getKpisDashboard, getEstadisticasSemanales, getDistribucionPorTipo } from '../../services/reportesService'
import { getResumenDia } from '../../services/citasService'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { CalendarDays, Users, UserCheck, UserX, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import './Dashboard.css'

const KPI_CONFIG = [
  { key: 'citasHoy', label: 'Citas Hoy', icon: CalendarDays, color: 'primary' },
  { key: 'atendidos', label: 'Atendidos', icon: UserCheck, color: 'success' },
  { key: 'ausencias', label: 'Ausencias', icon: UserX, color: 'danger' },
  { key: 'nuevosPacientes', label: 'Nuevos Pacientes', icon: TrendingUp, color: 'warning' },
  { key: 'totalPacientes', label: 'Total Pacientes', icon: Users, color: 'secondary' },
]

export default function Dashboard() {
  const { perfil, isMedico } = useAuth()
  const [kpis, setKpis] = useState(null)
  const [semanas, setSemanas] = useState([])
  const [distribucion, setDistribucion] = useState([])
  const [citasHoy, setCitasHoy] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const medicoId = isMedico ? perfil?.id : null
        const [kpiData, semanasData, distData, resumenDia] = await Promise.all([
          getKpisDashboard(medicoId),
          getEstadisticasSemanales(8, medicoId),
          getDistribucionPorTipo(medicoId),
          getResumenDia(new Date(), medicoId),
        ])
        setKpis(kpiData)
        setSemanas(semanasData)
        setDistribucion(distData)
        setCitasHoy(resumenDia.citas.slice(0, 6))
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    if (perfil) cargar()
  }, [perfil, isMedico])

  const hoy = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p className="text-muted text-sm">Cargando dashboard…</p>
      </div>
    )
  }

  return (
    <div className="dashboard animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Buenos días, {perfil?.nombre ?? 'usuario'} 👋
          </h1>
          <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>{hoy}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="dashboard-kpis">
        {KPI_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className={`kpi-card kpi-${color}`}>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{kpis?.[key] ?? 0}</span>
            <Icon size={48} className="kpi-icon" />
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="dashboard-charts">
        {/* Citas por semana */}
        <div className="card dashboard-chart-card">
          <div className="card-header">
            <h3 className="card-title">Citas por Semana</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={semanas} barSize={18}>
              <XAxis
                dataKey="semana"
                tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--on-surface-variant)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-container-high)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'var(--on-surface)',
                  fontSize: '0.8125rem',
                }}
              />
              <Bar dataKey="asistencia" name="Asistencia" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ausencias" name="Ausencias" fill="var(--error)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por tipo */}
        <div className="card dashboard-chart-card">
          <div className="card-header">
            <h3 className="card-title">Tipo de Consulta</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distribucion}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {distribucion.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-container-high)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Próximas citas del día */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Citas de Hoy</h3>
          <a href="/citas" className="text-sm text-primary">Ver agenda completa →</a>
        </div>
        {citasHoy.length === 0 ? (
          <p className="text-muted text-sm" style={{ padding: '1rem 0' }}>
            No hay citas registradas para hoy.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasHoy.map(cita => (
                  <tr key={cita.id}>
                    <td className="text-sm font-semibold text-primary">
                      {format(new Date(cita.fecha_hora), 'HH:mm')}
                    </td>
                    <td>
                      {cita.paciente
                        ? `${cita.paciente.nombre} ${cita.paciente.apellido}`
                        : '—'}
                    </td>
                    <td>
                      <span className={`chip chip-${
                        cita.tipo === 'primera_vez' ? 'primary'
                        : cita.tipo === 'control' ? 'secondary'
                        : 'warning'
                      }`}>
                        {cita.tipo === 'primera_vez' ? 'Primera vez'
                          : cita.tipo === 'control' ? 'Control'
                          : 'Procedimiento'}
                      </span>
                    </td>
                    <td>
                      <span className={`chip chip-${
                        cita.estado === 'completada' ? 'success'
                        : cita.estado === 'cancelada' ? 'danger'
                        : cita.estado === 'no_asistio' ? 'neutral'
                        : 'secondary'
                      }`}>
                        {cita.estado.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
