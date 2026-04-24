import { supabase } from '../lib/supabaseClient'

// ─── CONSULTAS CLÍNICAS ───────────────────────────────────────

export async function createConsulta(consulta) {
  const { data, error } = await supabase
    .from('consultas')
    .insert([consulta])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateConsulta(id, updates) {
  const { data, error } = await supabase
    .from('consultas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── ESTUDIOS / ARCHIVOS ──────────────────────────────────────

export async function uploadEstudio(consultaId, pacienteId, file, tipoEstudio, descripcion, userId) {
  const ext = file.name.split('.').pop()
  const filePath = `estudios/${pacienteId}/${consultaId}/${Date.now()}.${ext}`

  // Subir a Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('estudios')
    .upload(filePath, file, { upsert: false })

  if (storageError) throw storageError

  const { data: urlData } = supabase.storage
    .from('estudios')
    .getPublicUrl(filePath)

  // Registrar en la tabla estudios
  const { data, error } = await supabase
    .from('estudios')
    .insert([{
      consulta_id: consultaId,
      paciente_id: pacienteId,
      tipo_estudio: tipoEstudio,
      descripcion,
      archivo_url: urlData.publicUrl,
      archivo_nombre: file.name,
      archivo_tipo: file.type,
      creado_por: userId,
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getEstudiosByConsulta(consultaId) {
  const { data, error } = await supabase
    .from('estudios')
    .select('*')
    .eq('consulta_id', consultaId)
    .order('fecha', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteEstudio(id, archivoUrl) {
  // Extraer path relativo del URL para borrarlo de Storage
  const urlObj = new URL(archivoUrl)
  const pathParts = urlObj.pathname.split('/estudios/')
  if (pathParts[1]) {
    await supabase.storage.from('estudios').remove([pathParts[1]])
  }

  const { error } = await supabase.from('estudios').delete().eq('id', id)
  if (error) throw error
}
