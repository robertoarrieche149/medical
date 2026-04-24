import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protege rutas requiriendo autenticación.
 * Si se pasa `roles`, también verifica que el usuario tenga el rol adecuado.
 * Muestra spinner mientras carga el perfil.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, perfil, loading } = useAuth()
  const location = useLocation()

  // Esperar a que cargue tanto el user como el perfil
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="text-muted text-sm">Verificando sesión...</p>
      </div>
    )
  }

  // No autenticado → login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Autenticado pero perfil aún cargando (race condition)
  // Damos tiempo a que cargue; si perfil sigue null después de loading=false, el usuario
  // no tiene registro en la tabla usuarios → acceso denegado
  if (roles.length > 0) {
    if (!perfil) {
      return <Navigate to="/unauthorized" replace />
    }
    if (!roles.includes(perfil.rol)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}
