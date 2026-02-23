import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const token = useAuthStore((s) => s.token)
  const usuario = useAuthStore((s) => s.usuario)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)

  return {
    token,
    usuario,
    isAuthenticated,
    login,
    logout,
  }
}
