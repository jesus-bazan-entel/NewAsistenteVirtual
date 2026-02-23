import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import type { ModuloAcceso } from '../../api/auth'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

// --- Menu icon mapping by module/route name ---

function MenuIcon({ name }: { name: string }) {
  const lower = name.toLowerCase()

  // Dashboard / Principal
  if (lower.includes('principal') || lower.includes('dashboard')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    )
  }

  // Configuration general (gear)
  if (lower.includes('configuracion general') || lower.includes('config-general') || lower.includes('configuraci')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    )
  }

  // Advanced configuration (sliders)
  if (lower.includes('avanzada') || lower.includes('advanced')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    )
  }

  // Pruebas / Tests (play button / beaker)
  if (lower.includes('prueba') || lower.includes('generador') || lower.includes('test')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }

  // Reports (chart)
  if (lower.includes('reporte') || lower.includes('report')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    )
  }

  // Default (circle dot)
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

// --- Module section with expand/collapse ---

function ModuleSection({ modulo }: { modulo: ModuloAcceso }) {
  const [expanded, setExpanded] = useState(true)

  // Build the route prefix from the module name
  // The Vue app uses modulo.ruta, but in the React auth type ModuloAcceso doesn't have ruta.
  // We derive the prefix from the submodule routes if available.
  const getSubmoduleRoute = (sub: { ruta: string }) => {
    // Submodule ruta is the full path like "/configuracion-general/usuarios"
    return sub.ruta
  }

  return (
    <div className="pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 text-xs text-white/40 uppercase tracking-wider font-sans font-medium mb-2 hover:text-white/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MenuIcon name={modulo.nombre} />
          <span>{modulo.nombre}</span>
        </div>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`
          space-y-0.5 overflow-hidden transition-all duration-300
          ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        {modulo.submodulos.map((sub) => (
          <NavLink
            key={sub.id_submodulo}
            to={getSubmoduleRoute(sub)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-sans transition-all duration-200 ${
                isActive
                  ? 'text-entel-orange bg-entel-orange/10 border-l-2 border-entel-orange'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-current opacity-50 flex-shrink-0`}
            />
            <span>{sub.nombre}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

// --- Sidebar ---

export default function Sidebar({ open, onClose }: SidebarProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const modulos = usuario?.accesos || []

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen
          w-64 bg-gradient-to-b from-[#0f0f14] to-[#1a1a24]
          border-r border-white/5
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.08]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-entel-orange to-entel-amber flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-white font-sans font-semibold text-lg">Entel</span>
        </div>

        {/* User panel */}
        {usuario && (
          <div className="p-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-entel-orange to-entel-amber flex items-center justify-center text-white font-semibold flex-shrink-0">
                {(usuario.nombres || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-sans font-medium text-sm truncate">
                  {usuario.nombres} {usuario.apellidos}
                </p>
                <p className="text-white/50 text-xs truncate">Perfil #{usuario.id_perfil}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)] scrollbar-thin">
          {/* Principal / Dashboard link */}
          <NavLink
            to="/principal"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-sans transition-all duration-200 ${
                isActive
                  ? 'text-entel-orange bg-entel-orange/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <MenuIcon name="principal" />
            <span>Principal</span>
          </NavLink>

          {/* Dynamic modules from user accesos */}
          {modulos.map((modulo) => (
            <ModuleSection key={modulo.id_modulo} modulo={modulo} />
          ))}
        </nav>
      </aside>
    </>
  )
}
