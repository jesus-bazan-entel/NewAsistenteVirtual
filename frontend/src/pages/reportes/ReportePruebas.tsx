import { useState, useCallback } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import EscenarioStatus from '../../components/pruebas/EscenarioStatus'
import {
  getEjecuciones,
  getEjecucion,
  downloadEjecucionPdf,
  reenviarReporte,
  type Ejecucion,
  type EjecucionConDetalle,
} from '../../api/pruebas'

function formatFechaES(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function getEstadoBadgeClass(estado: string | null): string {
  const upper = (estado || '').toUpperCase()
  switch (upper) {
    case 'FINALIZADO':
      return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
    case 'PENDIENTE':
      return 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
    case 'CREADO':
      return 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
    case 'ERROR':
      return 'bg-red-500/10 border border-red-500/20 text-red-400'
    default:
      return 'bg-white/5 border border-white/10 text-white/60'
  }
}

export default function ReportePruebas() {
  const { addToast } = useToast()

  // Data fetching
  const fetchEjecuciones = useCallback(() => getEjecuciones(), [])
  const { data: ejecuciones, loading } = useCrud<Ejecucion[]>(fetchEjecuciones, { refreshInterval: 24000 })

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedEjecucion, setSelectedEjecucion] = useState<EjecucionConDetalle | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const handleVerDetalle = async (ejecucionId: number) => {
    setLoadingDetail(true)
    setDetailModalOpen(true)
    try {
      const res = await getEjecucion(ejecucionId)
      if (res.estado) {
        setSelectedEjecucion(res.data)
      } else {
        addToast('error', res.error || 'Error al cargar el detalle de la ejecucion')
        setDetailModalOpen(false)
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
      setDetailModalOpen(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleDescargarPDF = async (ejecucionId: number) => {
    addToast('info', `Generando PDF para la ejecucion #${ejecucionId}...`)
    try {
      await downloadEjecucionPdf(ejecucionId)
      addToast('success', 'PDF descargado correctamente')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al descargar el PDF')
    }
  }

  const handleReenviarReporte = async (ejecucionId: number) => {
    addToast('info', `Enviando reporte por correo para la ejecucion #${ejecucionId}...`)
    try {
      const res = await reenviarReporte(ejecucionId)
      if (res.estado) {
        addToast('success', 'Reporte enviado por correo correctamente')
      } else {
        addToast('error', res.error || 'Error al enviar el reporte')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al enviar el reporte')
    }
  }

  const columns: Column<Ejecucion>[] = [
    { key: 'id_ejecucion', label: 'ID', sortable: true },
    {
      key: 'prueba_nombre',
      label: 'Prueba',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-white/90 font-sans text-sm font-medium">
            {row.prueba_nombre || `Prueba #${row.id_prueba}`}
          </span>
          {row.matriz_nombre && (
            <span className="text-white/40 text-xs font-sans">{row.matriz_nombre}</span>
          )}
        </div>
      ),
    },
    {
      key: 'fecha_inicio',
      label: 'Fecha Inicio',
      sortable: true,
      render: (row) => (
        <span className="text-white/70 text-sm font-sans">
          {formatFechaES(row.fecha_inicio)}
        </span>
      ),
    },
    {
      key: 'fecha_fin',
      label: 'Fecha Fin',
      sortable: true,
      render: (row) => (
        <span className="text-white/70 text-sm font-sans">
          {formatFechaES(row.fecha_fin)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <span
          className={`
            px-2.5 py-1 rounded-lg text-xs font-sans font-medium
            ${getEstadoBadgeClass(row.estado)}
          `}
        >
          {row.estado || '-'}
        </span>
      ),
    },
    {
      key: 'numero_prueba',
      label: 'Escenarios',
      sortable: true,
      render: (row) => (
        <span className="text-white/60 text-sm font-mono">{row.numero_prueba ?? 0}</span>
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
              handleVerDetalle(row.id_ejecucion)
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-entel-orange hover:bg-entel-orange/10 transition-all"
            title="Ver Detalle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDescargarPDF(row.id_ejecucion)
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
            title="Descargar PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleReenviarReporte(row.id_ejecucion)
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            title="Reenviar Reporte por Correo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
          <h1 className="text-2xl font-sans font-bold text-white">Reporte de Pruebas</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Consulta de ejecuciones y resultados de pruebas VoIP
          </p>
        </div>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={ejecuciones || []}
        loading={loading}
      />

      {/* Detail modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedEjecucion(null)
        }}
        title={
          selectedEjecucion?.prueba?.nombre
            ? `Ejecucion: ${selectedEjecucion.prueba.nombre}`
            : `Detalle de Ejecucion #${selectedEjecucion?.id_ejecucion || ''}`
        }
        size="xl"
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setDetailModalOpen(false)
              setSelectedEjecucion(null)
            }}
          >
            Cerrar
          </Button>
        }
      >
        {loadingDetail ? (
          <div className="space-y-4">
            <div className="h-6 bg-white/5 rounded animate-pulse w-1/2" />
            <div className="h-20 bg-white/5 rounded animate-pulse" />
            <div className="h-40 bg-white/5 rounded animate-pulse" />
          </div>
        ) : selectedEjecucion ? (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-3 text-center">
                <p className="text-xs text-white/40 font-sans mb-1">Prueba</p>
                <p className="text-sm text-white font-sans font-medium">
                  {selectedEjecucion.prueba?.nombre || `#${selectedEjecucion.id_prueba}`}
                </p>
                {selectedEjecucion.prueba?.nombre_matriz && (
                  <p className="text-xs text-white/40 font-sans mt-0.5">
                    {selectedEjecucion.prueba.nombre_matriz}
                  </p>
                )}
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-xs text-white/40 font-sans mb-1">Estado</p>
                <span
                  className={`
                    px-2.5 py-1 rounded-lg text-xs font-sans font-medium
                    ${getEstadoBadgeClass(selectedEjecucion.estado)}
                  `}
                >
                  {selectedEjecucion.estado || '-'}
                </span>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-xs text-white/40 font-sans mb-1">Inicio</p>
                <p className="text-sm text-white/70 font-sans">
                  {formatFechaES(selectedEjecucion.fecha_inicio)}
                </p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-xs text-white/40 font-sans mb-1">Fin</p>
                <p className="text-sm text-white/70 font-sans">
                  {formatFechaES(selectedEjecucion.fecha_fin)}
                </p>
              </div>
            </div>

            {/* Result summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-3 text-center">
                <p className="text-2xl font-mono font-bold text-emerald-400">
                  {selectedEjecucion.escenarios_pasados}
                </p>
                <p className="text-xs text-white/40 font-sans">Exitosos</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-2xl font-mono font-bold text-red-400">
                  {selectedEjecucion.escenarios_fallidos}
                </p>
                <p className="text-xs text-white/40 font-sans">Fallidos</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-2xl font-mono font-bold text-yellow-400">
                  {selectedEjecucion.escenarios_pendientes}
                </p>
                <p className="text-xs text-white/40 font-sans">Pendientes</p>
              </div>
            </div>

            {/* Escenarios */}
            <div className="space-y-3">
              <h3 className="text-sm font-sans font-semibold text-white/70">Escenarios</h3>
              <EscenarioStatus
                escenarios={selectedEjecucion.escenarios || []}
                loading={false}
              />
            </div>
          </div>
        ) : (
          <p className="text-white/40 text-center py-8 font-sans text-sm">
            No se pudo cargar el detalle de la ejecucion
          </p>
        )}
      </Modal>
    </div>
  )
}
