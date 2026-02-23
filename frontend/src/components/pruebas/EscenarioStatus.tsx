import type { EscenarioDetalle } from '../../api/pruebas'

interface EscenarioStatusProps {
  escenarios: EscenarioDetalle[]
  loading?: boolean
}

// --- Status badge config ---

interface BadgeConfig {
  bg: string
  border: string
  text: string
  label: string
}

function getStatusBadge(estado: string | null): BadgeConfig {
  const upper = (estado || '').toUpperCase()
  switch (upper) {
    case 'EXITOSO':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        label: 'EXITOSO',
      }
    case 'FALLIDO':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
        label: 'FALLIDO',
      }
    case 'ERROR':
      return {
        bg: 'bg-red-900/20',
        border: 'border-red-900/30',
        text: 'text-red-300',
        label: 'ERROR',
      }
    case 'TIMEOUT':
      return {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        text: 'text-orange-400',
        label: 'TIMEOUT',
      }
    case 'PENDIENTE':
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-400',
        label: 'PENDIENTE',
      }
    case 'CREADO':
      return {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        text: 'text-cyan-400',
        label: 'CREADO',
      }
    default:
      return {
        bg: 'bg-white/5',
        border: 'border-white/10',
        text: 'text-white/60',
        label: estado || '-',
      }
  }
}

// --- Hangup reason parser ---

function parseHangupReason(raw: string | null): string {
  if (!raw) return '-'
  try {
    const parsed = JSON.parse(raw)
    const cause = parsed.cause || ''
    const desc = parsed.description || ''
    return desc ? `${desc} (cause ${cause})` : cause || '-'
  } catch {
    return raw
  }
}

// --- Skeleton Row ---

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-white/5 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

// --- Component ---

export default function EscenarioStatus({ escenarios, loading = false }: EscenarioStatusProps) {
  // Summary counts
  const total = escenarios.length
  const exitosos = escenarios.filter(
    (e) => (e.estado || '').toUpperCase() === 'EXITOSO',
  ).length
  const fallidos = escenarios.filter(
    (e) => ['FALLIDO', 'ERROR', 'TIMEOUT'].includes((e.estado || '').toUpperCase()),
  ).length
  const pendientes = total - exitosos - fallidos

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {!loading && total > 0 && (
        <div className="flex items-center gap-6 text-sm font-sans">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-white/60">Exitosos: <span className="text-emerald-400 font-medium">{exitosos}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-white/60">Fallidos: <span className="text-red-400 font-medium">{fallidos}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-white/60">Pendientes: <span className="text-yellow-400 font-medium">{pendientes}</span></span>
          </div>
          <div className="ml-auto text-white/40">
            Total: {total}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!loading && total > 0 && (
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
          {exitosos > 0 && (
            <div
              className="bg-emerald-400 transition-all duration-500"
              style={{ width: `${(exitosos / total) * 100}%` }}
            />
          )}
          {fallidos > 0 && (
            <div
              className="bg-red-400 transition-all duration-500"
              style={{ width: `${(fallidos / total) * 100}%` }}
            />
          )}
          {pendientes > 0 && (
            <div
              className="bg-yellow-400/40 transition-all duration-500"
              style={{ width: `${(pendientes / total) * 100}%` }}
            />
          )}
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                  Destino
                </th>
                <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                  Intento
                </th>
                <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : escenarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/40 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-10 h-10 text-white/10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span>No hay escenarios disponibles</span>
                    </div>
                  </td>
                </tr>
              ) : (
                escenarios.map((esc) => {
                  const badge = getStatusBadge(esc.estado)
                  const motivo = esc.error_mensaje || parseHangupReason(esc.hangup_reason)

                  return (
                    <tr key={esc.id_escenario} className="hover:bg-white/[0.02] transition-colors">
                      {/* Origen */}
                      <td className="px-4 py-3 text-sm text-white/80 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-entel-orange flex-shrink-0" />
                          <div>
                            <span>{esc.canal_origen_numero || '-'}</span>
                            {esc.canal_origen_operador && (
                              <span className="text-white/40 text-xs ml-1">({esc.canal_origen_operador})</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Destino */}
                      <td className="px-4 py-3 text-sm text-white/80 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-entel-amber flex-shrink-0" />
                          <div>
                            <span>{esc.destino_numero || '-'}</span>
                            {esc.destino_operador && (
                              <span className="text-white/40 text-xs ml-1">({esc.destino_operador})</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${badge.bg} ${badge.border} ${badge.text}
                          `}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Intento */}
                      <td className="px-4 py-3 text-sm text-white/60 font-mono">
                        {(esc.numero_intento ?? 0) + 1}
                      </td>

                      {/* Motivo */}
                      <td className="px-4 py-3 text-sm text-white/60 font-sans max-w-xs truncate">
                        {motivo}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
