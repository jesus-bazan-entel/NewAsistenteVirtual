import client from './client'

// --- Types ---

export interface MatrizCanalDestino {
  id: number
  matrizId: number
  canalOrigenId: number
  canalDestinoId: number | null
  numeroExternoId: number | null
}

export interface Matriz {
  id_matriz: number
  nombre: string
  estado: boolean
}

export interface MatrizCanalDestinoInput {
  id_canal_origen: number
  id_canal_destino?: number | null
  id_numero_externo_destino?: number | null
  tipo: string
}

export interface CreateMatrizPayload {
  nombre: string
  matriz_data: MatrizCanalDestinoInput[]
}

export interface UpdateMatrizPayload {
  nombre?: string
  matriz_data?: MatrizCanalDestinoInput[]
}

export interface EscenarioDetalle {
  id_escenario: number
  id_ejecucion: number
  id_canal_origen: number
  id_destino: number
  tipo: string
  numero_intento: number | null
  uniqueid_en: string | null
  uniqueid_sal: string | null
  estado: string | null
  hangup_reason: string | null
  mos: string | null
  id_error: number | null
  hora_saliente: string | null
  hora_entrante: string | null
  canal_origen_numero: string | null
  destino_numero: string | null
  canal_origen_operador: string | null
  destino_operador: string | null
  error_mensaje: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Ejecucion {
  id_ejecucion: number
  numero_prueba: number | null
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: string | null
  id_prueba: number | null
  prueba_nombre: string | null
  matriz_nombre: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export interface EjecucionConDetalle extends Ejecucion {
  prueba: { id_prueba: number; nombre: string | null; nombre_matriz: string | null } | null
  escenarios: EscenarioDetalle[]
  escenarios_pasados: number
  escenarios_fallidos: number
  escenarios_pendientes: number
}

export interface Prueba {
  id_prueba: number
  nombre: string | null
  comentario: string | null
  correo: string | null
  tiempo_timbrado: number | null
  reintentos: number | null
  tipo: string | null
  tipo_lanzamiento: string | null
  activo: string | null
  ejecutado: string | null
  programacion: string | null
  fecha_lanzamiento: string | null
  hora_lanzamiento: string | null
  dias_lanzamiento: string | null
  id_matriz: number | null
  id_usuario: number | null
  matriz?: Matriz
  ejecuciones_count?: number
  ejecuciones?: Ejecucion[]
  ultimo_estado_ejecucion?: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreatePruebaPayload {
  nombre: string
  comentario: string
  correo: string
  tiempo_timbrado: number
  reintentos: number
  tipo_lanzamiento: string
  programacion?: string
  fecha_lanzamiento?: string | null
  hora_lanzamiento?: string | null
  dias_lanzamiento?: string | null
  id_matriz: number
  id_usuario: number
}

export interface UpdatePruebaPayload {
  nombre?: string
  comentario?: string
  correo?: string
  tiempo_timbrado?: number
  reintentos?: number
  tipo?: string
  tipo_lanzamiento?: string
  programacion?: string
  fecha_lanzamiento?: string | null
  hora_lanzamiento?: string | null
  dias_lanzamiento?: string | null
  id_matriz?: number
}

interface ApiResponse<T> {
  estado: boolean
  data: T
  error?: string
}

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

// --- Matrices ---

export async function getMatrices(): Promise<ApiResponse<Matriz[]>> {
  const response = await client.get('/matrices')
  return normalizeResponse<Matriz[]>(response.data, 'matrices')
}

export interface MatrizConConexiones {
  id_matriz: number
  nombre: string | null
  estado: boolean | null
  conexiones: MatrizConexionDetalle[]
}

export interface MatrizConexionDetalle {
  id_matriz_canal_destino: number
  id_matriz: number
  id_canal_origen: number
  id_canal_destino: number | null
  id_numero_externo_destino: number | null
  tipo: string
  estado: string | null
  canal_origen: unknown
  canal_destino: unknown
  numero_externo: unknown
}

export async function getMatrizDetalle(id: number): Promise<ApiResponse<MatrizConConexiones>> {
  const response = await client.get(`/matrices/${id}`)
  return normalizeResponse<MatrizConConexiones>(response.data, 'matriz')
}

export async function createMatriz(payload: CreateMatrizPayload): Promise<ApiResponse<Matriz>> {
  const response = await client.post('/matrices', payload)
  return normalizeMutationResponse<Matriz>(response.data)
}

export async function updateMatriz(id: number, payload: UpdateMatrizPayload): Promise<ApiResponse<Matriz>> {
  const response = await client.put(`/matrices/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<Matriz>
}

export async function deleteMatriz(id: number): Promise<ApiResponse<null>> {
  const response = await client.delete(`/matrices/${id}`)
  return normalizeSimpleResponse(response.data)
}

// --- Pruebas ---

export async function getPruebas(): Promise<ApiResponse<Prueba[]>> {
  const response = await client.get('/pruebas')
  return normalizeResponse<Prueba[]>(response.data, 'pruebas')
}

export async function createPrueba(payload: CreatePruebaPayload): Promise<ApiResponse<Prueba>> {
  const response = await client.post('/pruebas', payload)
  return normalizeMutationResponse<Prueba>(response.data)
}

export async function updatePrueba(id: number, payload: UpdatePruebaPayload): Promise<ApiResponse<Prueba>> {
  const response = await client.put(`/pruebas/${id}`, payload)
  return normalizeSimpleResponse(response.data) as unknown as ApiResponse<Prueba>
}

export async function deletePrueba(id: number): Promise<ApiResponse<null>> {
  const response = await client.delete(`/pruebas/${id}`)
  return normalizeSimpleResponse(response.data)
}

export async function ejecutarPrueba(id: number): Promise<ApiResponse<Ejecucion>> {
  const response = await client.post(`/pruebas/${id}/ejecutar`)
  return normalizeMutationResponse<Ejecucion>(response.data)
}

// --- Ejecuciones ---

export async function getEjecuciones(): Promise<ApiResponse<Ejecucion[]>> {
  const response = await client.get('/ejecuciones')
  return normalizeResponse<Ejecucion[]>(response.data, 'ejecuciones')
}

export async function getEjecucion(id: number): Promise<ApiResponse<EjecucionConDetalle>> {
  const response = await client.get(`/ejecuciones/${id}`)
  const raw = response.data as Record<string, unknown>
  const ejecucion = raw.ejecucion as EjecucionConDetalle
  return {
    estado: raw.estado as boolean,
    data: {
      ...ejecucion,
      escenarios_pasados: (raw.escenarios_pasados as number) ?? 0,
      escenarios_fallidos: (raw.escenarios_fallidos as number) ?? 0,
      escenarios_pendientes: (raw.escenarios_pendientes as number) ?? 0,
    },
    error: raw.error as string | undefined,
  }
}

// --- PDF / Reenviar ---

export async function downloadEjecucionPdf(id: number): Promise<void> {
  const response = await client.get(`/ejecuciones/${id}/pdf`, {
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Reporte_Ejecucion_${id}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function reenviarReporte(id: number): Promise<ApiResponse<null>> {
  const response = await client.post(`/ejecuciones/${id}/reenviar`)
  return normalizeSimpleResponse(response.data)
}

// --- Ultima Ejecucion ---

export async function getUltimaEjecucion(pruebaId: number): Promise<ApiResponse<EjecucionConDetalle>> {
  const response = await client.get(`/pruebas/${pruebaId}/ultima-ejecucion`)
  const raw = response.data as Record<string, unknown>
  const ejecucion = raw.ejecucion as EjecucionConDetalle
  return {
    estado: raw.estado as boolean,
    data: {
      ...ejecucion,
      escenarios_pasados: (raw.escenarios_pasados as number) ?? 0,
      escenarios_fallidos: (raw.escenarios_fallidos as number) ?? 0,
      escenarios_pendientes: (raw.escenarios_pendientes as number) ?? 0,
    },
    error: raw.error as string | undefined,
  }
}
