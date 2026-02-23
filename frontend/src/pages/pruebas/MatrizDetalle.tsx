import { useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import Card from '../../components/ui/Card'
import MatrizEditor, { type Conexion } from '../../components/pruebas/MatrizEditor'
import {
  getMatrizDetalle,
  updateMatriz,
  type MatrizConConexiones,
} from '../../api/pruebas'
import {
  getEquipos,
  getNumerosExternos,
  type CanalDetalle,
  type Equipo,
  type NumeroExterno,
} from '../../api/config-avanzada'

export default function MatrizDetalle() {
  const { id } = useParams<{ id: string }>()
  const { addToast } = useToast()

  const matrizId = Number(id)

  // Data fetching
  const fetchMatriz = useCallback(() => getMatrizDetalle(matrizId), [matrizId])
  const { data: matriz, loading: loadingMatriz, refetch } = useCrud<MatrizConConexiones>(fetchMatriz, { refreshInterval: 24000 })

  const fetchEquipos = useCallback(() => getEquipos(), [])
  const { data: equipos } = useCrud<Equipo[]>(fetchEquipos)

  const fetchNumerosExternos = useCallback(() => getNumerosExternos(), [])
  const { data: numerosExternos } = useCrud<NumeroExterno[]>(fetchNumerosExternos)

  // Local state
  const [nombre, setNombre] = useState('')
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [saving, setSaving] = useState(false)

  // Extract all canales from all equipos
  const allCanales: CanalDetalle[] = (equipos || []).flatMap((eq) => eq.canales || [])

  // Sync state when data loads
  useEffect(() => {
    if (matriz) {
      setNombre(matriz.nombre || '')
      const conn: Conexion[] = (matriz.conexiones || []).map((cd) => ({
        canalOrigenId: cd.id_canal_origen,
        canalDestinoId: cd.id_canal_destino ?? null,
        numeroExternoId: cd.id_numero_externo_destino ?? null,
      }))
      setConexiones(conn)
    }
  }, [matriz])

  const handleSave = async () => {
    if (!nombre.trim()) {
      addToast('warning', 'El nombre de la matriz es obligatorio')
      return
    }

    setSaving(true)
    try {
      const res = await updateMatriz(matrizId, {
        nombre,
        matriz_data: conexiones.map((c) => ({
          id_canal_origen: c.canalOrigenId,
          id_canal_destino: c.canalDestinoId,
          id_numero_externo_destino: c.numeroExternoId,
          tipo: c.canalDestinoId != null ? 'C' : 'E',
        })),
      })
      if (res.estado) {
        addToast('success', 'Matriz actualizada correctamente')
        refetch()
      } else {
        addToast('error', res.error || 'Error al actualizar la matriz')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  if (loadingMatriz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="glass-card p-6">
          <div className="space-y-4">
            <div className="h-10 bg-white/5 rounded animate-pulse" />
            <div className="h-40 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!matriz) {
    return (
      <div className="space-y-6">
        <Link
          to="/generador-pruebas/matrices"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a Matrices
        </Link>
        <Card>
          <div className="text-center py-8">
            <p className="text-white/40 font-sans">Matriz no encontrada</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link and header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link
            to="/generador-pruebas/matrices"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Matrices
          </Link>
          <h1 className="text-2xl font-sans font-bold text-white">Configurar Matriz</h1>
          <p className="text-white/50 text-sm font-sans">
            {conexiones.length} conexion{conexiones.length !== 1 ? 'es' : ''} configurada{conexiones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Guardar Cambios
        </Button>
      </div>

      {/* Matrix name */}
      <Card
        title="Datos de la Matriz"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        }
      >
        <div className="max-w-md">
          <TextInput
            label="Nombre de la Matriz"
            name="nombre"
            value={nombre}
            onChange={setNombre}
            placeholder="Nombre de la matriz"
            required
          />
        </div>
      </Card>

      {/* Connections editor */}
      <div className="space-y-3">
        <h2 className="text-lg font-sans font-semibold text-white">Conexiones</h2>
        <MatrizEditor
          conexiones={conexiones}
          canales={allCanales}
          numerosExternos={numerosExternos || []}
          onChange={setConexiones}
        />
      </div>
    </div>
  )
}
