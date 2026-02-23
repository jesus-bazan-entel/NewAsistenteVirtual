import { create } from 'zustand'
import { login as apiLogin, type UsuarioLogin } from '../api/auth'

interface AuthState {
  token: string | null
  usuario: UsuarioLogin | null
  isAuthenticated: boolean
  login: (correo: string, clave: string) => Promise<void>
  logout: () => void
}

function loadFromStorage(): { token: string | null; usuario: UsuarioLogin | null } {
  try {
    const token = localStorage.getItem('token')
    const usuarioRaw = localStorage.getItem('usuario')
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null
    return { token, usuario }
  } catch {
    return { token: null, usuario: null }
  }
}

const stored = loadFromStorage()

export const useAuthStore = create<AuthState>((set) => ({
  token: stored.token,
  usuario: stored.usuario,
  isAuthenticated: !!stored.token,

  login: async (correo: string, clave: string) => {
    const response = await apiLogin(correo, clave)
    if (!response.estado || !response.token || !response.usuario) {
      throw new Error(response.error || 'Error al iniciar sesión')
    }
    const { token, usuario } = response
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuario))
    set({ token, usuario, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    set({ token: null, usuario: null, isAuthenticated: false })
  },
}))
