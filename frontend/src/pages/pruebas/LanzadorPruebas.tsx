import { useState, useCallback, useEffect } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import SelectInput from '../../components/forms/SelectInput'
import {
  getPruebas,
  createPrueba,
  updatePrueba,
  deletePrueba,
  ejecutarPrueba,
  getMatrices,
  getUltimaEjecucion,
  type Prueba,
  type Matriz,
  type EjecucionConDetalle,
} from '../../api/pruebas'
import { useAuthStore } from '../../stores/authStore'

interface FormData {
  nombre: string
  matrizId: string
  correo: string
  tiempo_timbrado: string
  reintentos: string
  tipo_lanzamiento: string
  programacion: string
  fecha_lanzamiento: string
  hora_lanzamiento: string
  dias_lanzamiento: string
  comentario: string
}

const emptyForm: FormData = {
  nombre: '',
  matrizId: '',
  correo: '',
  tiempo_timbrado: '30',
  reintentos: '1',
  tipo_lanzamiento: 'Instantaneo',
  programacion: 'U',
  fecha_lanzamiento: '',
  hora_lanzamiento: '',
  dias_lanzamiento: '',
  comentario: '',
}

// ---------------------------------------------------------------------------
// Inline execution results sub-component
// ---------------------------------------------------------------------------

function getEscenarioStatusBadge(estado: string | null) {
  const upper = (estado || '').toUpperCase()
  switch (upper) {
    case 'EXITOSO':
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'EXITOSO' }
    case 'FALLIDO':
      return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'FALLIDO' }
    case 'TIMEOUT':
      return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'TIMEOUT' }
    case 'ERROR':
      return { bg: 'bg-red-900/20', border: 'border-red-900/30', text: 'text-red-300', label: 'ERROR' }
    case 'PENDIENTE':
      return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', label: 'PENDIENTE' }
    case 'CREADO':
      return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', label: 'CREADO' }
    default:
      return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/60', label: estado || '-' }
  }
}

function parseHangupReason(raw: string | null): string {
  if (!raw) return '-'
  try {
    const parsed = JSON.parse(raw)
    const cause = parsed.cause || ''
    const desc = parsed.description || ''
    return desc ? `${desc} (${cause})` : cause || '-'
  } catch {
    return raw
  }
}

function ResultadosEjecucion({
  ejecucion,
  onClose,
}: {
  ejecucion: EjecucionConDetalle
  onClose: () => void
}) {
  const total = ejecucion.escenarios.length
  const pasados = ejecucion.escenarios_pasados
  const fallidos = ejecucion.escenarios_fallidos
  const pendientes = ejecucion.escenarios_pendientes
  const porcentaje = total > 0 ? Math.round((pasados / total) * 100) : 0
  const isPolling = ejecucion.estado !== 'FINALIZADO'

  const estadoBadge = ejecucion.estado === 'FINALIZADO'
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-sans font-semibold text-white">Resultados de Ejecucion</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoBadge}`}>
            {ejecucion.estado || 'PENDIENTE'}
          </span>
          {isPolling && (
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Actualizando...
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          title="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-6 text-sm font-sans">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-white/60">
            Exitosos: <span className="text-emerald-400 font-medium">{pasados}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-white/60">
            Fallidos: <span className="text-red-400 font-medium">{fallidos}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="text-white/60">
            Pendientes: <span className="text-yellow-400 font-medium">{pendientes}</span>
          </span>
        </div>
        <div className="ml-auto text-white/50 font-medium">
          {pasados} de {total} exitosos ({porcentaje}%)
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
          {pasados > 0 && (
            <div
              className="bg-emerald-400 transition-all duration-500"
              style={{ width: `${(pasados / total) * 100}%` }}
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

      {/* Escenarios table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-2.5 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                Origen
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                Destino
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                Intento
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider">
                Motivo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {ejecucion.escenarios.map((esc) => {
              const badge = getEscenarioStatusBadge(esc.estado)
              const motivo = esc.error_mensaje || parseHangupReason(esc.hangup_reason)

              return (
                <tr key={esc.id_escenario} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-sm text-white/80 font-sans">
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
                  <td className="px-4 py-2.5 text-sm text-white/80 font-sans">
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
                  <td className="px-4 py-2.5 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.border} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-white/60 font-mono">
                    {(esc.numero_intento ?? 0) + 1}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-white/60 font-sans max-w-xs truncate">
                    {motivo}
                  </td>
                </tr>
              )
            })}
            {ejecucion.escenarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/40 text-sm">
                  No hay escenarios disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function LanzadorPruebas() {
  const { addToast } = useToast()
  const usuario = useAuthStore((s) => s.usuario)

  // Data fetching
  const fetchPruebas = useCallback(() => getPruebas(), [])
  const { data: pruebas, loading, refetch } = useCrud<Prueba[]>(fetchPruebas, { refreshInterval: 24000 })

  const fetchMatrices = useCallback(() => getMatrices(), [])
  const { data: matrices } = useCrud<Matriz[]>(fetchMatrices)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [ejecutarModalOpen, setEjecutarModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [ejecutarId, setEjecutarId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [executing, setExecuting] = useState(false)

  // Inline results state
  const [activeEjecucionPruebaId, setActiveEjecucionPruebaId] = useState<number | null>(null)
  const [ejecucionActiva, setEjecucionActiva] = useState<EjecucionConDetalle | null>(null)

  // "Ver" modal state
  const [verModalOpen, setVerModalOpen] = useState(false)
  const [verPruebaId, setVerPruebaId] = useState<number | null>(null)
  const [verEjecucion, setVerEjecucion] = useState<EjecucionConDetalle | null>(null)
  const [verLoading, setVerLoading] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setForm(emptyForm)
      setEditingId(null)
    }
  }, [modalOpen])

  // Poll for execution results
  useEffect(() => {
    if (!activeEjecucionPruebaId) return

    let active = true
    const poll = async () => {
      try {
        const res = await getUltimaEjecucion(activeEjecucionPruebaId)
        if (active && res.estado) {
          setEjecucionActiva(res.data)
        }
      } catch {
        // Silently ignore polling errors
      }
    }

    poll() // immediate first call
    const intervalId = setInterval(poll, 5000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [activeEjecucionPruebaId])

  // Stop polling when ejecucion is FINALIZADO
  useEffect(() => {
    if (ejecucionActiva?.estado === 'FINALIZADO') {
      setActiveEjecucionPruebaId(null)
    }
  }, [ejecucionActiva?.estado])

  // Poll for "Ver" modal execution results
  useEffect(() => {
    if (!verPruebaId || !verModalOpen) return

    let active = true
    const poll = async () => {
      try {
        const res = await getUltimaEjecucion(verPruebaId)
        if (active && res.estado) {
          setVerEjecucion(res.data)
          setVerLoading(false)
        }
      } catch {
        // Silently ignore polling errors
      }
    }

    setVerLoading(true)
    poll()
    const intervalId = setInterval(poll, 5000)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [verPruebaId, verModalOpen])

  // Stop polling "Ver" modal when ejecucion is FINALIZADO
  useEffect(() => {
    if (verEjecucion?.estado === 'FINALIZADO') {
      // Keep modal open but stop polling (no need to set verPruebaId to null)
    }
  }, [verEjecucion?.estado])

  const handleVerClick = (id: number) => {
    setVerPruebaId(id)
    setVerEjecucion(null)
    setVerLoading(true)
    setVerModalOpen(true)
  }

  const matrizOptions = (matrices || []).map((m) => ({
    value: m.id_matriz,
    label: m.nombre,
  }))

  const tipoLanzamientoOptions = [
    { value: 'Instantaneo', label: 'Instantaneo' },
    { value: 'Programado', label: 'Programado' },
  ]

  const programacionOptions = [
    { value: 'U', label: 'Una vez' },
    { value: 'T', label: 'Repetitivo' },
  ]

  const handleCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleEdit = (prueba: Prueba) => {
    setEditingId(prueba.id_prueba)
    setForm({
      nombre: prueba.nombre || '',
      matrizId: String(prueba.id_matriz || ''),
      correo: prueba.correo || '',
      tiempo_timbrado: String(prueba.tiempo_timbrado ?? 30),
      reintentos: String(prueba.reintentos ?? 1),
      tipo_lanzamiento: prueba.tipo_lanzamiento === 'Programado' ? 'Programado' : 'Instantaneo',
      programacion: prueba.programacion || 'U',
      fecha_lanzamiento: prueba.fecha_lanzamiento || '',
      hora_lanzamiento: prueba.hora_lanzamiento ? prueba.hora_lanzamiento.substring(0, 5) : '',
      dias_lanzamiento: prueba.dias_lanzamiento || '',
      comentario: prueba.comentario || '',
    })
    setModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const handleEjecutarClick = (id: number) => {
    setEjecutarId(id)
    setEjecutarModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.matrizId) {
      addToast('warning', 'Complete los campos obligatorios (nombre y matriz)')
      return
    }

    setSaving(true)
    try {
      const isProgramado = form.tipo_lanzamiento === 'Programado'

      const payload = {
        nombre: form.nombre,
        id_matriz: Number(form.matrizId),
        comentario: form.comentario || '',
        correo: form.correo || '',
        tiempo_timbrado: Number(form.tiempo_timbrado) || 30,
        reintentos: Number(form.reintentos) || 1,
        tipo_lanzamiento: form.tipo_lanzamiento,
        programacion: isProgramado ? form.programacion : undefined,
        fecha_lanzamiento: isProgramado && form.fecha_lanzamiento ? form.fecha_lanzamiento : null,
        hora_lanzamiento: isProgramado && form.hora_lanzamiento ? form.hora_lanzamiento : null,
        dias_lanzamiento: isProgramado && form.dias_lanzamiento ? form.dias_lanzamiento : undefined,
        id_usuario: usuario?.id_usuario || 0,
      }

      if (editingId) {
        const res = await updatePrueba(editingId, payload)
        if (res.estado) {
          addToast('success', 'Prueba actualizada correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al actualizar la prueba')
        }
      } else {
        const res = await createPrueba(payload)
        if (res.estado) {
          setModalOpen(false)
          refetch()
          // For Instantaneo, the backend auto-executes; show results panel
          if (form.tipo_lanzamiento === 'Instantaneo' && res.data?.id_prueba) {
            addToast('success', 'Prueba creada y ejecucion iniciada')
            setActiveEjecucionPruebaId(res.data.id_prueba)
            setEjecucionActiva(null)
          } else {
            addToast('success', 'Prueba creada correctamente')
          }
        } else {
          addToast('error', res.error || 'Error al crear la prueba')
        }
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await deletePrueba(deleteId)
      if (res.estado) {
        addToast('success', 'Prueba eliminada correctamente')
        setDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al eliminar la prueba')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const handleEjecutar = async () => {
    if (!ejecutarId) return
    setExecuting(true)
    try {
      const res = await ejecutarPrueba(ejecutarId)
      if (res.estado) {
        addToast('success', 'Prueba ejecutada correctamente. La ejecucion ha iniciado.')
        setActiveEjecucionPruebaId(ejecutarId)
        setEjecucionActiva(null)
        setEjecutarModalOpen(false)
        setEjecutarId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al ejecutar la prueba')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setExecuting(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const upper = estado.toUpperCase()
    switch (upper) {
      case 'FINALIZADO':
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
      case 'PENDIENTE':
        return 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
      case 'CREADO':
        return 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
      default:
        return 'bg-white/5 border border-white/10 text-white/60'
    }
  }

  const columns: Column<Prueba>[] = [
    { key: 'id_prueba', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    {
      key: 'matriz',
      label: 'Matriz',
      sortable: false,
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-sans">
          {row.matriz?.nombre || '-'}
        </span>
      ),
    },
    {
      key: 'tipo_lanzamiento',
      label: 'Tipo',
      sortable: true,
      render: (row) => (
        <span className="text-white/70 text-sm font-sans">
          {row.tipo_lanzamiento || 'Instantaneo'}
        </span>
      ),
    },
    {
      key: 'ultimo_estado_ejecucion',
      label: 'Estado',
      sortable: true,
      render: (row) => {
        const estado = row.ultimo_estado_ejecucion
        if (!estado) {
          return (
            <span className="px-2.5 py-1 rounded-lg text-xs font-sans font-medium bg-white/5 border border-white/10 text-white/40">
              SIN EJECUTAR
            </span>
          )
        }
        return (
          <span
            className={`
              px-2.5 py-1 rounded-lg text-xs font-sans font-medium
              ${getEstadoBadge(estado)}
            `}
          >
            {estado}
          </span>
        )
      },
    },
    {
      key: '_lanzamientos',
      label: 'Lanzamientos',
      sortable: false,
      render: (row) => (
        <span className="text-white/50 text-sm font-mono">
          {row.ejecuciones_count ?? row.ejecuciones?.length ?? 0}
        </span>
      ),
    },
    {
      key: '_actions',
      label: 'Acciones',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleVerClick(row.id_prueba)
            }}
            disabled={(row.ejecuciones_count ?? 0) === 0}
            className={`p-1.5 rounded-lg transition-all ${
              (row.ejecuciones_count ?? 0) === 0
                ? 'text-white/20 cursor-not-allowed'
                : 'text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10'
            }`}
            title="Ver ultima ejecucion"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEjecutarClick(row.id_prueba)
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            title="Ejecutar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(row)
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-entel-orange hover:bg-entel-orange/10 transition-all"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteClick(row.id_prueba)
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Eliminar"
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
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white">Ejecutar Pruebas</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Crear, administrar y ejecutar pruebas de llamadas VoIP
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Prueba
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={pruebas || []}
        loading={loading}
      />

      {/* Inline execution results */}
      {ejecucionActiva && (
        <ResultadosEjecucion
          ejecucion={ejecucionActiva}
          onClose={() => {
            setEjecucionActiva(null)
            setActiveEjecucionPruebaId(null)
          }}
        />
      )}

      {/* Create/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Prueba' : 'Nueva Prueba'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Actualizar' : 'Crear'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={(val) => setForm((f) => ({ ...f, nombre: val }))}
              placeholder="Nombre de la prueba"
              required
            />
            <SelectInput
              label="Matriz"
              name="matrizId"
              value={form.matrizId}
              onChange={(val) => setForm((f) => ({ ...f, matrizId: val }))}
              options={matrizOptions}
              placeholder="Seleccione una matriz"
              required
            />
            <TextInput
              label="Correo de notificacion"
              name="correo"
              type="email"
              value={form.correo}
              onChange={(val) => setForm((f) => ({ ...f, correo: val }))}
              placeholder="correo@ejemplo.com"
            />
            <TextInput
              label="Timeout (seg)"
              name="tiempo_timbrado"
              type="number"
              value={form.tiempo_timbrado}
              onChange={(val) => setForm((f) => ({ ...f, tiempo_timbrado: val }))}
              placeholder="30"
            />
            <TextInput
              label="Reintentos"
              name="reintentos"
              type="number"
              value={form.reintentos}
              onChange={(val) => setForm((f) => ({ ...f, reintentos: val }))}
              placeholder="1"
            />
            <SelectInput
              label="Tipo de lanzamiento"
              name="tipo_lanzamiento"
              value={form.tipo_lanzamiento}
              onChange={(val) => setForm((f) => ({ ...f, tipo_lanzamiento: val }))}
              options={tipoLanzamientoOptions}
            />
          </div>

          {/* Programacion fields - only shown when tipo is Programado */}
          {form.tipo_lanzamiento === 'Programado' && (
            <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <h4 className="text-sm font-sans font-medium text-white/70">Configuracion de Programacion</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput
                  label="Frecuencia"
                  name="programacion"
                  value={form.programacion}
                  onChange={(val) => setForm((f) => ({ ...f, programacion: val }))}
                  options={programacionOptions}
                />
                <TextInput
                  label="Fecha de lanzamiento"
                  name="fecha_lanzamiento"
                  type="date"
                  value={form.fecha_lanzamiento}
                  onChange={(val) => setForm((f) => ({ ...f, fecha_lanzamiento: val }))}
                />
                <TextInput
                  label="Hora de lanzamiento"
                  name="hora_lanzamiento"
                  type="time"
                  value={form.hora_lanzamiento}
                  onChange={(val) => setForm((f) => ({ ...f, hora_lanzamiento: val }))}
                />
                <TextInput
                  label="Dias de lanzamiento"
                  name="dias_lanzamiento"
                  value={form.dias_lanzamiento}
                  onChange={(val) => setForm((f) => ({ ...f, dias_lanzamiento: val }))}
                  placeholder="L,M,X,J,V"
                />
              </div>
            </div>
          )}

          <TextInput
            label="Comentario"
            name="comentario"
            value={form.comentario}
            onChange={(val) => setForm((f) => ({ ...f, comentario: val }))}
            placeholder="Comentario o descripcion adicional"
          />
        </div>
      </Modal>

      {/* Execute confirmation modal */}
      <Modal
        isOpen={ejecutarModalOpen}
        onClose={() => setEjecutarModalOpen(false)}
        title="Confirmar Ejecucion"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEjecutarModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEjecutar} loading={executing}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              </svg>
              Ejecutar
            </Button>
          </>
        }
      >
        <p className="text-white/70 font-sans text-sm">
          Esta seguro de que desea ejecutar esta prueba? Se iniciara el proceso de llamadas segun la configuracion de la matriz asociada.
        </p>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Eliminacion"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-white/70 font-sans text-sm">
          Esta seguro de que desea eliminar esta prueba? Se eliminaran tambien todas las ejecuciones asociadas. Esta accion no se puede deshacer.
        </p>
      </Modal>

      {/* Ver ultima ejecucion modal */}
      <Modal
        isOpen={verModalOpen}
        onClose={() => {
          setVerModalOpen(false)
          setVerPruebaId(null)
          setVerEjecucion(null)
        }}
        title="Ultima Ejecucion"
        size="xl"
        footer={
          <Button variant="secondary" onClick={() => {
            setVerModalOpen(false)
            setVerPruebaId(null)
            setVerEjecucion(null)
          }}>
            Cerrar
          </Button>
        }
      >
        {verLoading && !verEjecucion ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-entel-orange/30 border-t-entel-orange rounded-full animate-spin" />
            <span className="ml-3 text-white/50 text-sm font-sans">Cargando ejecucion...</span>
          </div>
        ) : verEjecucion ? (
          <ResultadosEjecucion
            ejecucion={verEjecucion}
            onClose={() => {
              setVerModalOpen(false)
              setVerPruebaId(null)
              setVerEjecucion(null)
            }}
          />
        ) : (
          <p className="text-white/50 text-sm font-sans text-center py-8">
            No se encontraron ejecuciones para esta prueba.
          </p>
        )}
      </Modal>
    </div>
  )
}
