import { useState } from 'react'
import { createUsuario, updateUsuario } from '../../services/usuariosService'
import { X, Loader, UserPlus, ShieldCheck, UserCog, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'admin',     label: 'Administrador',  icon: ShieldCheck, desc: 'Acceso total — Especialista' },
  { value: 'asistente', label: 'Asistente',       icon: UserCog,     desc: 'Agenda, cobros y pacientes' },
]

const INITIAL = {
  nombre: '', apellido: '', email: '', password: '',
  rol: 'asistente', telefono: '',
}

export default function UsuarioFormModal({ usuario, onClose }) {
  const esEdicion = !!usuario
  const [form, setForm] = useState(esEdicion ? {
    ...INITIAL, ...usuario, password: ''
  } : INITIAL)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre || !form.apellido || !form.rol) {
      toast.error('Nombre, apellido y rol son obligatorios')
      return
    }
    if (!esEdicion && (!form.email || !form.password)) {
      toast.error('El correo y la contraseña son obligatorios para nuevos usuarios')
      return
    }
    if (!esEdicion && form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      if (esEdicion) {
        await updateUsuario(usuario.id, form)
        toast.success('Usuario actualizado')
      } else {
        await createUsuario(form)
        toast.success(`Usuario ${form.nombre} creado exitosamente`)
      }
      onClose(true)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className="modal-box" style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div style={{
              width:38, height:38, borderRadius:'var(--radius-md)',
              background:'var(--gradient-primary)', display:'flex',
              alignItems:'center', justifyContent:'center', color:'var(--on-primary)',
            }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h2 style={{ fontSize:'1.125rem', fontFamily:'var(--font-headline)' }}>
                {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <p className="text-xs text-muted">
                {esEdicion ? `Modificar perfil de ${usuario.nombre}` : 'Crear cuenta y asignar rol'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={() => onClose(false)}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Selector de rol visual */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label className="form-label" style={{ marginBottom:'0.625rem', display:'block' }}>
              Rol del sistema *
            </label>
            <div className="rol-selector">
              {ROLES.map(r => {
                const Icon = r.icon
                const selected = form.rol === r.value
                return (
                  <button key={r.value} type="button"
                    className={`rol-option ${selected ? 'selected' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, rol: r.value }))}
                  >
                    <Icon size={20} />
                    <span className="rol-option-label">{r.label}</span>
                    <span className="rol-option-desc">{r.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input name="nombre" className="form-input"
                value={form.nombre} onChange={handleChange} placeholder="Nombre" required />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input name="apellido" className="form-input"
                value={form.apellido} onChange={handleChange} placeholder="Apellido" required />
            </div>

            {!esEdicion && (
              <>
                <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                  <label className="form-label">Correo electrónico *</label>
                  <input name="email" type="email" className="form-input"
                    value={form.email} onChange={handleChange}
                    placeholder="usuario@urogestion.com" required />
                </div>

                <div className="form-group" style={{ gridColumn:'1 / -1' }}>
                  <label className="form-label">Contraseña *</label>
                  <div style={{ position:'relative' }}>
                    <input name="password" type={showPass ? 'text' : 'password'}
                      className="form-input" value={form.password} onChange={handleChange}
                      placeholder="Mínimo 6 caracteres" style={{ paddingRight:'3rem' }} />
                    <button type="button" className="btn-icon" title="Mostrar/ocultar"
                      style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)' }}
                      onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ gridColumn:'1 / -1' }}>
              <label className="form-label">Teléfono</label>
              <input name="telefono" className="form-input"
                value={form.telefono} onChange={handleChange}
                placeholder="+58 414 000 0000" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><Loader size={14} className="spin" /> Guardando…</>
                : esEdicion ? 'Guardar cambios' : 'Crear Usuario'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
