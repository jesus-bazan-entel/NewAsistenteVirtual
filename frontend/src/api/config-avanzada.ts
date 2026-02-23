import client from './client'

// --- Types ---

export interface Tecnologia {
  id_tecnologia: number
  nombre: string
}

export interface CreateTecnologiaPayload {
  nombre: string
}

export interface UpdateTecnologiaPayload {
  nombre: string
}

export interface Operador {
  id_operador_telefonico: number
  nombre: string
  codigo: string
  tecnologias: Tecnologia[]
}

export interface CreateOperadorPayload {
  nombre: string
  codigo: string
  tecnologias: number[]
}

export interface UpdateOperadorPayload {
  nombre: string
  codigo: string
  tecnologias: number[]
}

export interface CanalDetalle {
  id_canal: number
  id_tecnologia_operador: number | null
  id_equipo: number | null
  estado: string | null
  nro_ranura: number | null
  numero: string | null
  posicion: number | null
  estado_llamada: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  nombre_tecnologia: string | null
  nombre_operador: string | null
  nombre_equipo: string | null
}

export interface Sede {
  id_sede: number
  nombre: string
}

export interface Equipo {
  id_equipo: number
  nombre: string | null
  ip: string | null
  tipo: string | null
  ranuras: string | null
  id_sede: number | null
  estado: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  canales: CanalDetalle[]
  sede: Sede | null
}

export interface CreateCanalEquipoPayload {
  id_tecnologia: number
  id_operador: number
  nro_ranura?: number
  numero?: string
  posicion?: number
  id_canal?: number
}

export interface CreateEquipoPayload {
  nombre: string
  ip: string
  tipo: string
  ranuras: string
  id_sede: number | null
  canales: CreateCanalEquipoPayload[]
}

export interface UpdateEquipoPayload {
  nombre: string
  ip: string
  tipo: string
  ranuras: string
  id_sede: number | null
  canales: CreateCanalEquipoPayload[]
}

export interface NumeroExterno {
  id_numero_externo: number
  nombre: string
  comentario: string
  numero: string
}

export interface CreateNumeroExternoPayload {
  nombre: string
  comentario: string
  numero: string
}

export interface UpdateNumeroExternoPayload {
  nombre: string
  comentario: string
  numero: string
}

interface ApiResponse<T> {
  estado: boolean
  data: T
  error?: string
  mensaje?: string
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

// --- Tecnologias ---

export async function getTecnologias(): Promise<ApiResponse<Tecnologia[]>> {
  const response = await client.get('/tecnologias')
  return normalizeResponse<Tecnologia[]>(response.data, 'tecnologias')
}

export async function createTecnologia(payload: CreateTecnologiaPayload): Promise<ApiResponse<Tecnologia>> {
  const response = await client.post('/tecnologias', payload)
  return normalizeMutationResponse<Tecnologia>(response.data)
}

export async function updateTecnologia(id: number, payload: UpdateTecnologiaPayload): Promise<ApiResponse<Tecnologia>> {
  const response = await client.put(`/tecnologias/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<Tecnologia>
}

export async function deleteTecnologia(id: number, force = false): Promise<ApiResponse<null>> {
  try {
    const response = await client.delete(`/tecnologias/${id}${force ? '?force=true' : ''}`)
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

// --- Operadores ---

export async function getOperadores(): Promise<ApiResponse<Operador[]>> {
  const response = await client.get('/operadores-telefonicos')
  return normalizeResponse<Operador[]>(response.data, 'operadores')
}

export async function createOperador(payload: CreateOperadorPayload): Promise<ApiResponse<Operador>> {
  const response = await client.post('/operadores-telefonicos', payload)
  return normalizeMutationResponse<Operador>(response.data)
}

export async function updateOperador(id: number, payload: UpdateOperadorPayload): Promise<ApiResponse<Operador>> {
  const response = await client.put(`/operadores-telefonicos/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<Operador>
}

export async function deleteOperador(id: number): Promise<ApiResponse<null>> {
  const response = await client.delete(`/operadores-telefonicos/${id}`)
  return normalizeSimpleResponse(response.data)
}

// --- Equipos ---

export async function getEquipos(): Promise<ApiResponse<Equipo[]>> {
  const response = await client.get('/equipos')
  return normalizeResponse<Equipo[]>(response.data, 'equipos')
}

export async function createEquipo(payload: CreateEquipoPayload): Promise<ApiResponse<Equipo>> {
  const response = await client.post('/equipos', payload)
  return normalizeMutationResponse<Equipo>(response.data)
}

export async function updateEquipo(id: number, payload: UpdateEquipoPayload): Promise<ApiResponse<Equipo>> {
  const response = await client.put(`/equipos/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<Equipo>
}

export async function deleteEquipo(id: number): Promise<ApiResponse<null>> {
  const response = await client.delete(`/equipos/${id}`)
  return normalizeSimpleResponse(response.data)
}

// --- Numeros Externos ---

export async function getNumerosExternos(): Promise<ApiResponse<NumeroExterno[]>> {
  const response = await client.get('/numeros-externos')
  return normalizeResponse<NumeroExterno[]>(response.data, 'numeros_externos')
}

export async function createNumeroExterno(payload: CreateNumeroExternoPayload): Promise<ApiResponse<NumeroExterno>> {
  const response = await client.post('/numeros-externos', payload)
  return normalizeMutationResponse<NumeroExterno>(response.data)
}

export async function updateNumeroExterno(id: number, payload: UpdateNumeroExternoPayload): Promise<ApiResponse<NumeroExterno>> {
  const response = await client.put(`/numeros-externos/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<NumeroExterno>
}

export async function deleteNumeroExterno(id: number, force = false): Promise<ApiResponse<null>> {
  try {
    const response = await client.delete(`/numeros-externos/${id}${force ? '?force=true' : ''}`)
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

// --- Asterisk Config ---

export interface AsteriskConfigData {
  host: string
  puerto: number
  usuario: string
  clave: string
  entorno: string
  activo: boolean
}

export interface AsteriskConfigResponse extends AsteriskConfigData {
  id: number
  created_at: string | null
  updated_at: string | null
}

export async function getAsteriskConfig(): Promise<ApiResponse<AsteriskConfigResponse>> {
  const response = await client.get('/asterisk-config')
  return response.data
}

export async function updateAsteriskConfig(data: AsteriskConfigData): Promise<ApiResponse<null>> {
  const response = await client.put('/asterisk-config', data)
  return normalizeSimpleResponse(response.data)
}

export async function testAsteriskConnection(data: AsteriskConfigData): Promise<ApiResponse<null>> {
  const response = await client.post('/asterisk-config/test', data)
  return response.data
}

export async function reconnectAsterisk(): Promise<ApiResponse<null>> {
  const response = await client.post('/asterisk-config/reconnect')
  return response.data
}

export async function getAsteriskStatus(): Promise<ApiResponse<{ conectado: boolean }>> {
  const response = await client.get('/asterisk-config/status')
  return response.data
}

export async function syncAsteriskConfig(): Promise<ApiResponse<null>> {
  const response = await client.post('/asterisk-config/sync')
  return response.data
}
