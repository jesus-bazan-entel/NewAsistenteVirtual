import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

interface ModuleCardData {
  title: string
  description: string
  link: string
  icon: JSX.Element
  color: string
}

const moduleCards: ModuleCardData[] = [
  {
    title: 'Config. General',
    description: 'Administra usuarios, perfiles y permisos del sistema.',
    link: '/configuracion-general/usuarios',
    color: 'from-blue-500/20 to-blue-600/20',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Config. Avanzada',
    description: 'Gestiona tecnologias, operadores, equipos y numeros externos.',
    link: '/configuracion-avanzada/tecnologias',
    color: 'from-purple-500/20 to-purple-600/20',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    ),
  },
  {
    title: 'Generador de Pruebas',
    description: 'Crea matrices de prueba y lanza ejecuciones automaticas.',
    link: '/generador-pruebas/matrices',
    color: 'from-entel-orange/20 to-entel-amber/20',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Reportes',
    description: 'Visualiza resultados y estadisticas de pruebas.',
    link: '/reportes/reporte-pruebas',
    color: 'from-emerald-500/20 to-emerald-600/20',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const greeting = (() => {
    const hour = now.getHours()
    if (hour < 12) return 'Buenos dias'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div
        className="glass-card p-8 relative overflow-hidden"
        style={{ animation: 'fadeSlideIn 500ms ease-out' }}
      >
        {/* Decorative gradient blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-entel-orange/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-white/50 text-sm font-sans mb-1">
              {greeting}
            </p>
            <h1 className="text-3xl font-sans font-bold text-white tracking-tight">
              {usuario?.nombres || 'Usuario'}
            </h1>
            <p className="text-white/50 font-sans mt-2">
              Bienvenido al panel de monitoreo VoIP
            </p>
          </div>

          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-white tracking-wider">
              {formatTime(now)}
            </div>
            <p className="text-white/40 font-sans text-sm mt-1 capitalize">
              {formatDate(now)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div
        className="flex flex-wrap gap-3"
        style={{ animation: 'fadeSlideIn 500ms ease-out 100ms both' }}
      >
        <Link to="/generador-pruebas/lanzador-pruebas">
          <Button variant="primary" size="md">
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
            Lanzar Prueba
          </Button>
        </Link>
        <Link to="/reportes/reporte-pruebas">
          <Button variant="secondary" size="md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Ver Reportes
          </Button>
        </Link>
      </div>

      {/* Module cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {moduleCards.map((mod, index) => (
          <Link
            key={mod.title}
            to={mod.link}
            className="group block"
            style={{
              animation: `fadeSlideIn 500ms ease-out ${200 + index * 100}ms both`,
            }}
          >
            <Card className="h-full group-hover:border-entel-orange/20 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div
                  className={`
                    flex items-center justify-center w-14 h-14 rounded-2xl
                    bg-gradient-to-br ${mod.color}
                    text-white group-hover:scale-110 transition-transform duration-300
                  `}
                >
                  {mod.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-sans font-semibold text-white group-hover:text-entel-orange transition-colors duration-200">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-white/50 font-sans mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-white/20 group-hover:text-entel-orange group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
