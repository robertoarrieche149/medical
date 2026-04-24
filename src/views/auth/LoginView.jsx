import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock, Stethoscope, Loader } from 'lucide-react'
import './LoginView.css'

export default function LoginView() {
  const { login, user, perfil } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && perfil) navigate(from, { replace: true })
  }, [user, perfil, navigate, from])


  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Bienvenido a UroGestión')
      // Esperamos que el useEffect redirija al cargar user y perfil
    } catch (err) {
      const msg = err.message
      toast.error(
        msg === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : msg === 'Email not confirmed'
          ? 'Debes confirmar tu correo antes de ingresar'
          : msg
      )
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Fondo */}
      <div className="login-bg">
        <div className="login-bg-glow" />
        <div className="login-bg-watermark">
          <Stethoscope size={320} strokeWidth={0.5} />
        </div>
      </div>

      {/* Card */}
      <div className="login-card card-glass animate-fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <Stethoscope size={22} />
          </div>
          <h1 className="login-title">UroGestión</h1>
          <p className="login-subtitle">Sistema de Gestión de Citas · Urología</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Correo electrónico</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email"
                name="email"
                type="email"
                className="form-input login-input"
                placeholder="usuario@urogestion.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                name="password"
                type="password"
                className="form-input login-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading
              ? <><Loader size={16} className="spin" /> Verificando...</>
              : 'Iniciar Sesión'
            }
          </button>
        </form>

        <div className="login-footer">
          <Link to="/recuperar-password" className="login-forgot">
            ¿Olvidaste tu contraseña?
          </Link>
          <span className="text-xs text-muted">UroGestión v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
