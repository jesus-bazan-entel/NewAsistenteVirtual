import { useState } from 'react'
import type { CanalDetalle, NumeroExterno } from '../../api/config-avanzada'
import SelectInput from '../forms/SelectInput'
import Button from '../ui/Button'

// --- Types ---

export interface Conexion {
  canalOrigenId: number
  canalDestinoId: number | null
  numeroExternoId: number | null
}

interface MatrizEditorProps {
  conexiones: Conexion[]
  canales: CanalDetalle[]
  numerosExternos: NumeroExterno[]
  onChange: (conexiones: Conexion[]) => void
}

type TipoDestino = 'Canal' | 'Externo'

// --- Component ---

export default function MatrizEditor({
  conexiones,
  canales,
  numerosExternos,
  onChange,
}: MatrizEditorProps) {
  const [origenId, setOrigenId] = useState<string>('')
  const [tipoDestino, setTipoDestino] = useState<TipoDestino>('Canal')
  const [destinoId, setDestinoId] = useState<string>('')

  const canalOptions = canales
    .filter((c) => c.estado !== 'I' && c.numero && c.numero !== 'null')
    .map((c) => ({
      value: c.id_canal,
      label: `${c.numero || '-'} - ${c.nombre_operador || 'Sin operador'} (${c.nombre_equipo || 'Canal'})`,
    }))

  const externoOptions = numerosExternos
    .map((n) => ({
      value: n.id_numero_externo,
      label: `${n.numero}${n.comentario ? ` - ${n.comentario}` : ''}`,
    }))

  const destinoOptions = tipoDestino === 'Canal' ? canalOptions : externoOptions

  const handleAdd = () => {
    if (!origenId || !destinoId) return

    const newConexion: Conexion = {
      canalOrigenId: Number(origenId),
      canalDestinoId: tipoDestino === 'Canal' ? Number(destinoId) : null,
      numeroExternoId: tipoDestino === 'Externo' ? Number(destinoId) : null,
    }

    // Prevent duplicates
    const exists = conexiones.some(
      (c) =>
        c.canalOrigenId === newConexion.canalOrigenId &&
        c.canalDestinoId === newConexion.canalDestinoId &&
        c.numeroExternoId === newConexion.numeroExternoId,
    )

    if (exists) return

    onChange([...conexiones, newConexion])
    setOrigenId('')
    setDestinoId('')
  }

  const handleRemove = (index: number) => {
    onChange(conexiones.filter((_, i) => i !== index))
  }

  const getCanalName = (id: number | null): string => {
    if (id == null) return '-'
    const canal = canales.find((c) => c.id_canal === id)
    return canal ? `${canal.numero || '-'} - ${canal.nombre_operador || 'Sin operador'} (${canal.nombre_equipo || 'Canal'})` : `Canal #${id}`
  }

  const getExternoName = (id: number | null): string => {
    if (id == null) return '-'
    const ext = numerosExternos.find((n) => n.id_numero_externo === id)
    return ext ? ext.numero : `#${id}`
  }

  return (
    <div className="space-y-4">
      {/* Add connection form */}
      <div className="glass-card p-4">
        <h4 className="text-sm font-sans font-medium text-white/70 mb-3">
          Agregar conexion
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <SelectInput
            label="Canal Origen"
            name="canalOrigen"
            value={origenId}
            onChange={setOrigenId}
            options={canalOptions}
            placeholder="Seleccionar origen..."
          />
          <SelectInput
            label="Tipo Destino"
            name="tipoDestino"
            value={tipoDestino}
            onChange={(v) => {
              setTipoDestino(v as TipoDestino)
              setDestinoId('')
            }}
            options={[
              { value: 'Canal', label: 'Canal' },
              { value: 'Externo', label: 'Numero Externo' },
            ]}
          />
          <SelectInput
            label="Destino"
            name="destino"
            value={destinoId}
            onChange={setDestinoId}
            options={destinoOptions}
            placeholder="Seleccionar destino..."
          />
          <Button
            variant="primary"
            size="md"
            onClick={handleAdd}
            disabled={!origenId || !destinoId}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </Button>
        </div>
      </div>

      {/* Connections table */}
      {conexiones.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                    Canal Origen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                    Destino
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {conexiones.map((con, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-sm text-white/50 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-white/80 font-sans">
                      {getCanalName(con.canalOrigenId)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`
                          inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                          ${
                            con.canalDestinoId != null
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }
                        `}
                      >
                        {con.canalDestinoId != null ? 'Canal' : 'Externo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80 font-sans">
                      {con.canalDestinoId != null
                        ? getCanalName(con.canalDestinoId)
                        : getExternoName(con.numeroExternoId)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(idx)}
                        className="text-red-400/60 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
                        title="Eliminar conexion"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 border-t border-white/[0.06] text-xs text-white/40">
            {conexiones.length} conexion{conexiones.length !== 1 ? 'es' : ''} configurada{conexiones.length !== 1 ? 's' : ''}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <svg
            className="w-12 h-12 text-white/10 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <p className="text-sm text-white/40 font-sans">
            No hay conexiones configuradas. Agregue una conexion usando el formulario de arriba.
          </p>
        </div>
      )}
    </div>
  )
}
