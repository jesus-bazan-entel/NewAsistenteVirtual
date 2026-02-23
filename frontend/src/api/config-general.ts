import client from './client'

// --- Types ---

export interface Usuario {
  id_usuario: number
  nombres: string
  apellidos: string
  correo: string
  acceso: string
  id_perfil: number | null
  perfil_nombre: string | null
}

export interface CreateUsuarioPayload {
  nombres: string
  apellidos: string
  correo: string
  clave: string
  id_perfil: number
}

export interface UpdateUsuarioPayload {
  nombres: string
  apellidos: string
  correo: string
  clave?: string
  id_perfil: number
}

export interface Submodulo {
  id_submodulo: number
  nombre: string
  ruta: string
  icono: string
  id_modulo: number | null
}

export interface UsuarioResumen {
  id_usuario: number
  nombres: string | null
  apellidos: string | null
}

export interface Perfil {
  id_perfil: number
  nombre: string
  descripcion: string
  estado: string
  submodulos: Submodulo[]
  usuarios: UsuarioResumen[]
}

export interface CreatePerfilPayload {
  nombre: string
  descripcion: string
  submodulos: number[]
}

export interface UpdatePerfilPayload {
  nombre: string
  descripcion: string
  submodulos: number[]
}

export interface Modulo {
  id_modulo: number
  nombre: string
  ruta: string
  icono: string
  submodulos: Submodulo[]
}

export interface Sede {
  id_sede: number
  nombre: string
}

export interface ApiResponse<T> {
  estado: boolean
  data: T
  error?: string
  fk_conflict?: boolean
}

// Helper to normalize backend responses that use named keys instead of "data"
function normalizeResponse<T>(raw: Record<string, unknown>, dataKey: string): ApiResponse<T> {
  return {
    estado: raw.estado as boolean,
    data: raw[dataKey] as T,
    error: raw.error as string | undefined,
  }
}

function normalizeSimpleResponse(raw: Record<string, unknown>): ApiResponse<null> {
  return {
    estado: raw.estado as boolean,
    data: null,
    error: raw.error as string | undefined,
  }
}

function normalizeMutationResponse<T>(raw: Record<string, unknown>): ApiResponse<T> {
  return {
    estado: raw.estado as boolean,
    data: raw.data as T,
    error: raw.error as string | undefined,
  }
}

// --- Usuarios ---

export async function getUsuarios(): Promise<ApiResponse<Usuario[]>> {
  const response = await client.get('/usuarios')
  return normalizeResponse<Usuario[]>(response.data, 'usuarios')
}

export async function createUsuario(payload: CreateUsuarioPayload): Promise<ApiResponse<Usuario>> {
  const response = await client.post('/usuarios', payload)
  return normalizeMutationResponse<Usuario>(response.data)
}

export async function updateUsuario(id: number, payload: UpdateUsuarioPayload): Promise<ApiResponse<Usuario>> {
  const response = await client.put(`/usuarios/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<Usuario>
}

export async function deleteUsuario(id: number, force = false): Promise<ApiResponse<null>> {
  try {
    const response = await client.delete(`/usuarios/${id}${force ? '?force=true' : ''}`)
    return normalizeSimpleResponse(response.data)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response: { status: number; data: Record<string, unknown> } }
      if (axiosErr.response?.status === 409) {
        return { estado: false, data: null, error: axiosErr.response.data.error as string, fk_conflict: true } as ApiResponse<null>
      }
    }
    throw err
  }
}

// --- Perfiles ---

export async function getPerfiles(): Promise<ApiResponse<Perfil[]>> {
  const response = await client.get('/perfiles')
  return normalizeResponse<Perfil[]>(response.data, 'perfiles')
}

export async function createPerfil(payload: CreatePerfilPayload): Promise<ApiResponse<Perfil>> {
  const response = await client.post('/perfiles', payload)
  return normalizeMutationResponse<Perfil>(response.data)
}

export async function updatePerfil(id: number, payload: UpdatePerfilPayload): Promise<ApiResponse<Perfil>> {
  const response = await client.put(`/perfiles/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<Perfil>
}

export async function deletePerfil(id: number, force = false): Promise<ApiResponse<null>> {
  try {
    const response = await client.delete(`/perfiles/${id}${force ? '?force=true' : ''}`)
    return normalizeSimpleResponse(response.data)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response: { status: number; data: Record<string, unknown> } }
      if (axiosErr.response?.status === 409) {
        return { estado: false, data: null, error: axiosErr.response.data.error as string, fk_conflict: true } as ApiResponse<null>
      }
    }
    throw err
  }
}

// --- Modulos ---

export async function getModulos(): Promise<ApiResponse<Modulo[]>> {
  const response = await client.get('/modulos')
  return normalizeResponse<Modulo[]>(response.data, 'modulos')
}

// --- Sedes ---

export async function getSedes(): Promise<ApiResponse<Sede[]>> {
  const response = await client.get('/sedes')
  return normalizeResponse<Sede[]>(response.data, 'sedes')
}

// --- LDAP Config ---

export interface LdapConfig {
  id: number
  nombre: string
  data: string
}

export interface CreateLdapConfigPayload {
  nombre: string
  data: string
}

export async function getLdapConfigs(): Promise<ApiResponse<LdapConfig[]>> {
  const response = await client.get('/ldap-config')
  return normalizeResponse<LdapConfig[]>(response.data, 'ldap_configs')
}

export async function createLdapConfig(payload: CreateLdapConfigPayload): Promise<ApiResponse<LdapConfig>> {
  const response = await client.post('/ldap-config', payload)
  return normalizeMutationResponse<LdapConfig>(response.data)
}

export async function updateLdapConfig(id: number, payload: CreateLdapConfigPayload): Promise<ApiResponse<LdapConfig>> {
  const response = await client.put(`/ldap-config/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<LdapConfig>
}

export async function deleteLdapConfig(id: number): Promise<ApiResponse<null>> {
  const response = await client.delete(`/ldap-config/${id}`)
  return normalizeSimpleResponse(response.data)
}
