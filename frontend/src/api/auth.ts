import client from './client'

export interface SubmoduloAcceso {
  id_submodulo: number
  nombre: string
  ruta: string
  icono: string
}

export interface ModuloAcceso {
  id_modulo: number
  nombre: string
  ruta: string
  icono: string
  submodulos: SubmoduloAcceso[]
}

export interface UsuarioLogin {
  id_usuario: number
  nombres: string
  apellidos: string
  id_perfil: number
  accesos: ModuloAcceso[]
}

export interface LoginResponse {
  estado: boolean
  token?: string
  usuario?: UsuarioLogin
  error?: string
}

export async function login(correo: string, clave: string): Promise<LoginResponse> {
  const response = await client.post<LoginResponse>('/auth/login', { correo, clave })
  return response.data
}
