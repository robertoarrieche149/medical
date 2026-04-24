import { supabase } from '../lib/supabaseClient'

// ─── LISTAR USUARIOS ──────────────────────────────────────────

export async function getUsuarios({ search = '', rol = '' } = {}) {
  let query = supabase
    .from('usuarios')
    .select('*')
    .order('nombre', { ascending: true })

  if (rol) query = query.eq('rol', rol)

  const { data, error } = await query
  if (error) throw error

  if (search) {
    const q = search.toLowerCase()
    return data.filter(u =>
      u.nombre?.toLowerCase().includes(q) ||
      u.apellido?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  }
  return data
}

// ─── CREAR USUARIO VÍA EDGE FUNCTION ─────────────────────────

export async function createUsuario({ email, password, nombre, apellido, rol, telefono }) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Sin sesión activa')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-usuario`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ email, password, nombre, apellido, rol, telefono }),
    }
  )

  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Error creando usuario')
  return body.usuario
}

// ─── ACTUALIZAR PERFIL ────────────────────────────────────────

export async function updateUsuario(id, { nombre, apellido, rol, telefono, activo }) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ nombre, apellido, rol, telefono, activo })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── TOGGLE ACTIVO ────────────────────────────────────────────

export async function toggleUsuarioActivo(id, activo) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ activo })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
