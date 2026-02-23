import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already authenticated, redirect
  if (isAuthenticated) {
    window.location.href = '/principal'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(correo, clave)
      window.location.href = '/principal'
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-entel-dark">
      {/* Animated mesh background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f14] to-[#1a1a24]" />
        <div
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-entel-orange/[0.07] rounded-full blur-[120px]"
          style={{ animation: 'meshFloat1 8s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-entel-amber/[0.05] rounded-full blur-[100px]"
          style={{ animation: 'meshFloat2 10s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-entel-orange/[0.03] rounded-full blur-[150px]"
          style={{ animation: 'meshFloat3 12s ease-in-out infinite' }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{ animation: 'cardFadeIn 600ms ease-out' }}
      >
        <div className="glass-card p-8">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-entel-orange to-entel-amber mb-5 shadow-lg shadow-entel-orange/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-sans font-bold text-white tracking-tight">
              Asistente Virtual
            </h1>
            <p className="text-white/50 font-sans text-sm mt-1.5">
              Plataforma de Monitoreo VoIP
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans flex items-center gap-2"
              style={{ animation: 'shake 400ms ease-out' }}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="correo" className="block text-sm font-sans font-medium text-white/70">
                Correo electronico
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@entel.com"
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 font-sans focus:outline-none focus:ring-2 focus:ring-entel-orange/50 focus:border-entel-orange/50 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="clave" className="block text-sm font-sans font-medium text-white/70">
                Contrasena
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  id="clave"
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Ingrese su contrasena"
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 font-sans focus:outline-none focus:ring-2 focus:ring-entel-orange/50 focus:border-entel-orange/50 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3 rounded-xl font-sans font-semibold text-white
                bg-gradient-to-r from-entel-orange to-entel-amber
                transition-all duration-200
                hover:shadow-lg hover:shadow-entel-orange/25 hover:-translate-y-0.5
                flex items-center justify-center gap-2
                ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {loading && (
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {loading ? 'Ingresando...' : 'Iniciar Sesion'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-white/30 font-sans">
              Entel VoIP Monitor v5.0.0 &bull; BESTSOL
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes meshFloat1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes meshFloat2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
        @keyframes meshFloat3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
        }
      `}</style>
    </div>
  )
}
