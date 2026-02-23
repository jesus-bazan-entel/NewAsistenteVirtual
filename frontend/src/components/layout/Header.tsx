import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-gradient-to-r from-[#0f0f14] to-[#1a1a24] border-b border-white/[0.08] backdrop-blur-lg">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side: hamburger + brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label={sidebarOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-entel-orange to-entel-amber flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <span className="text-white font-sans font-semibold text-lg tracking-tight">
              Entel <span className="text-white/50 font-normal">VoIP Monitor</span>
            </span>
          </div>
        </div>

        {/* Right side: user + logout */}
        <div className="flex items-center gap-4">
          {usuario && (
            <span className="hidden md:block text-sm text-white/60 font-sans">
              {usuario.nombres} {usuario.apellidos}
            </span>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-entel-orange transition-colors font-sans text-sm px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Cerrar sesion</span>
          </button>
        </div>
      </div>
    </header>
  )
}
