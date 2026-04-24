import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  BarChart3, UserCog, LogOut, Clock, DollarSign, History,
} from 'lucide-react'
import './Sidebar.css'

// Menú según rol
const NAV_ADMIN = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pacientes',  icon: Users,            label: 'Pacientes' },
  { to: '/citas',      icon: CalendarDays,     label: 'Agenda' },
  { to: '/consultas',  icon: Stethoscope,      label: 'Módulo Clínico' },
  { to: '/horarios',   icon: Clock,            label: 'Mis Horarios' },
  { to: '/reportes',   icon: BarChart3,        label: 'Reportes' },
  { to: '/usuarios',   icon: UserCog,          label: 'Usuarios' },
]

const NAV_ASISTENTE = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Inicio' },
  { to: '/agenda',          icon: CalendarDays,    label: 'Agenda' },
  { to: '/cobros',          icon: DollarSign,      label: 'Panel de Cobros' },
  { to: '/historial-citas', icon: History,         label: 'Historial de Citas' },
  { to: '/pacientes',       icon: Users,           label: 'Pacientes' },
]

const ROL_LABEL = {
  admin:     'Especialista',
  asistente: 'Asistente',
}

export default function Sidebar() {
  const { perfil, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await logout(); navigate('/login') }
    catch { toast.error('Error al cerrar sesión') }
  }

  const navItems = isAdmin ? NAV_ADMIN : NAV_ASISTENTE

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Stethoscope size={20} />
        </div>
        <div>
          <span className="sidebar-logo-name">UroGestión</span>
          <span className="sidebar-logo-sub">Sistema de Urología</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Perfil usuario */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {perfil ? `${perfil.nombre[0]}${perfil.apellido[0]}` : '??'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Cargando...'}
            </span>
            <span className="sidebar-user-role">
              {ROL_LABEL[perfil?.rol] ?? perfil?.rol ?? ''}
            </span>
          </div>
        </div>
        <button className="btn-icon sidebar-logout" onClick={handleLogout} title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}
