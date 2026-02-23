import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import {
  getMatrices,
  createMatriz,
  deleteMatriz,
  type Matriz,
} from '../../api/pruebas'

interface FormData {
  nombre: string
}

const emptyForm: FormData = {
  nombre: '',
}

export default function Matrices() {
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Data fetching
  const fetchMatrices = useCallback(() => getMatrices(), [])
  const { data: matrices, loading, refetch } = useCrud<Matriz[]>(fetchMatrices, { refreshInterval: 24000 })

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setForm(emptyForm)
    }
  }, [modalOpen])

  const handleCreate = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      addToast('warning', 'El nombre de la matriz es obligatorio')
      return
    }

    setSaving(true)
    try {
      const res = await createMatriz({
        nombre: form.nombre,
        matriz_data: [],
      })
      if (res.estado) {
        addToast('success', 'Matriz creada correctamente')
        setModalOpen(false)
        navigate(`/generador-pruebas/matrices/${res.data.id_matriz}`)
      } else {
        addToast('error', res.error || 'Error al crear la matriz')
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
      const res = await deleteMatriz(deleteId)
      if (res.estado) {
        addToast('success', 'Matriz eliminada correctamente')
        setDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al eliminar la matriz')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Matriz>[] = [
    { key: 'id_matriz', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <span
          className={`
            px-2.5 py-1 rounded-lg text-xs font-sans font-medium
            ${
              row.estado
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }
          `}
        >
          {row.estado ? 'Activo' : 'Inactivo'}
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
              navigate(`/generador-pruebas/matrices/${row.id_matriz}`)
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-entel-orange hover:bg-entel-orange/10 transition-all"
            title="Configurar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteClick(row.id_matriz)
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          <h1 className="text-2xl font-sans font-bold text-white">Matrices de Prueba</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Administracion de matrices de conexiones para pruebas VoIP
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Matriz
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={matrices || []}
        loading={loading}
      />

      {/* Create modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Matriz"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Crear
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextInput
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={(val) => setForm((f) => ({ ...f, nombre: val }))}
            placeholder="Nombre de la matriz"
            required
          />
          <p className="text-xs text-white/40 font-sans">
            Despues de crear la matriz sera redirigido a la pagina de configuracion donde podra agregar las conexiones origen-destino.
          </p>
        </div>
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
          Esta seguro de que desea eliminar esta matriz? Se eliminaran tambien todas las conexiones asociadas. Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
