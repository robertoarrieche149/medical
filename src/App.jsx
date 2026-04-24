import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Vistas compartidas
import LoginView        from './views/auth/LoginView'
import Dashboard        from './views/dashboard/Dashboard'
import PacientesListView from './views/pacientes/PacientesListView'
import PacienteDetailView from './views/pacientes/PacienteDetailView'

// Vistas Admin
import CitasView        from './views/citas/CitasView'
import ConsultaView     from './views/consultas/ConsultaView'
import ReportesView     from './views/reportes/ReportesView'
import UsuariosView     from './views/usuarios/UsuariosView'
import BloquesHorarioView from './views/admin/BloquesHorarioView'

// Vistas Asistente
import PanelCitasView   from './views/asistente/PanelCitasView'
import PanelCobroView   from './views/asistente/PanelCobroView'
import HistorialCitasView from './views/asistente/HistorialCitasView'

function ComingSoon({ nombre }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem' }}>
      <div style={{ fontSize:'3rem' }}>🚧</div>
      <h2 style={{ fontFamily:'var(--font-headline)', color:'var(--on-surface)' }}>{nombre}</h2>
      <p style={{ color:'var(--on-surface-variant)' }}>Vista en construcción</p>
    </div>
  )
}

function Unauthorized() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem' }}>
      <div style={{ fontSize:'3rem' }}>🔒</div>
      <h2 style={{ fontFamily:'var(--font-headline)', color:'var(--on-surface)' }}>Acceso Denegado</h2>
      <p style={{ color:'var(--on-surface-variant)' }}>No tienes permisos para acceder a esta sección.</p>
      <a href="/dashboard" className="btn btn-primary btn-sm">Volver al inicio</a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--surface-container-high)',
              color: 'var(--on-surface)',
              border: '1px solid var(--outline-variant)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#47f1e4', secondary: '#003733' } },
            error: { iconTheme: { primary: '#ffb4ab', secondary: '#690005' } },
          }}
        />

        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protegidas — con layout */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* ── COMPARTIDAS (admin + asistente) ─────────────── */}
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="pacientes" element={
              <ProtectedRoute roles={['admin','asistente']}>
                <PacientesListView />
              </ProtectedRoute>
            } />
            <Route path="pacientes/:id" element={
              <ProtectedRoute roles={['admin','asistente']}>
                <PacienteDetailView />
              </ProtectedRoute>
            } />

            {/* ── ADMIN ───────────────────────────────────────── */}
            <Route path="citas" element={
              <ProtectedRoute roles={['admin']}>
                <CitasView />
              </ProtectedRoute>
            } />
            <Route path="consultas" element={
              <ProtectedRoute roles={['admin']}>
                <ConsultaView />
              </ProtectedRoute>
            } />
            <Route path="reportes" element={
              <ProtectedRoute roles={['admin']}>
                <ReportesView />
              </ProtectedRoute>
            } />
            <Route path="usuarios" element={
              <ProtectedRoute roles={['admin']}>
                <UsuariosView />
              </ProtectedRoute>
            } />
            <Route path="horarios" element={
              <ProtectedRoute roles={['admin']}>
                <BloquesHorarioView />
              </ProtectedRoute>
            } />

            {/* ── ASISTENTE ───────────────────────────────────── */}
            <Route path="agenda" element={
              <ProtectedRoute roles={['asistente']}>
                <PanelCitasView />
              </ProtectedRoute>
            } />
            <Route path="cobros" element={
              <ProtectedRoute roles={['asistente']}>
                <PanelCobroView />
              </ProtectedRoute>
            } />
            <Route path="historial-citas" element={
              <ProtectedRoute roles={['asistente']}>
                <HistorialCitasView />
              </ProtectedRoute>
            } />

            <Route path="actividad" element={
              <ProtectedRoute roles={['admin']}>
                <ComingSoon nombre="Log de Actividad" />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
