import { useState, useCallback, useEffect } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import {
  getTecnologias,
  createTecnologia,
  updateTecnologia,
  deleteTecnologia,
  type Tecnologia,
} from '../../api/config-avanzada'

interface FormData {
  nombre: string
}

const emptyForm: FormData = {
  nombre: '',
}

export default function Tecnologias() {
  const { addToast } = useToast()

  const fetchTecnologias = useCallback(() => getTecnologias(), [])
  const { data: tecnologias, loading, refetch } = useCrud<Tecnologia[]>(fetchTecnologias, { refreshInterval: 24000 })

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [forceDeleteModalOpen, setForceDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!modalOpen) {
      setForm(emptyForm)
      setEditingId(null)
    }
  }, [modalOpen])

  const handleCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleEdit = (tec: Tecnologia) => {
    setEditingId(tec.id_tecnologia)
    setForm({ nombre: tec.nombre })
    setModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      addToast('warning', 'El nombre de la tecnologia es obligatorio')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const res = await updateTecnologia(editingId, { nombre: form.nombre })
        if (res.estado) {
          addToast('success', 'Tecnologia actualizada correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al actualizar tecnologia')
        }
      } else {
        const res = await createTecnologia({ nombre: form.nombre })
        if (res.estado) {
          addToast('success', 'Tecnologia creada correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al crear tecnologia')
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
      const res = await deleteTecnologia(deleteId)
      if (res.estado) {
        addToast('success', 'Tecnologia eliminada correctamente')
        setDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else if (res.fk_conflict) {
        setDeleteModalOpen(false)
        setForceDeleteModalOpen(true)
      } else {
        addToast('error', res.error || 'Error al eliminar tecnologia')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const handleForceDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await deleteTecnologia(deleteId, true)
      if (res.estado) {
        addToast('success', 'Tecnologia y registros asociados eliminados correctamente')
        setForceDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al eliminar tecnologia')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Tecnologia>[] = [
    { key: 'id_tecnologia', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    {
      key: '_actions',
      label: 'Acciones',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row) }}
            className="p-1.5 rounded-lg text-white/40 hover:text-entel-orange hover:bg-entel-orange/10 transition-all"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.id_tecnologia) }}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white">Tecnologias</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Administracion de tecnologias de comunicacion
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Tecnologia
        </Button>
      </div>

      <DataTable columns={columns} data={tecnologias || []} loading={loading} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Tecnologia' : 'Nueva Tecnologia'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editingId ? 'Actualizar' : 'Crear'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextInput label="Nombre" name="nombre" value={form.nombre} onChange={(val) => setForm((f) => ({ ...f, nombre: val }))} placeholder="Ej: GSM, SIP, PRI, 4G LTE" required />
        </div>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Eliminacion"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Eliminar</Button>
          </>
        }
      >
        <p className="text-white/70 font-sans text-sm">
          Esta seguro de que desea eliminar esta tecnologia? Esta accion no se puede deshacer.
        </p>
      </Modal>

      <Modal
        isOpen={forceDeleteModalOpen}
        onClose={() => { setForceDeleteModalOpen(false); setDeleteId(null) }}
        title="Registro con dependencias"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setForceDeleteModalOpen(false); setDeleteId(null) }}>Cancelar</Button>
            <Button variant="danger" onClick={handleForceDelete} loading={deleting}>Eliminar todo</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-amber-300 font-sans text-sm font-medium">
              Esta tecnologia tiene operadores, canales u otros registros asociados.
            </p>
          </div>
          <p className="text-white/70 font-sans text-sm">
            Desea eliminar la tecnologia junto con todos sus registros dependientes? Esta accion es irreversible.
          </p>
        </div>
      </Modal>
    </div>
  )
}
