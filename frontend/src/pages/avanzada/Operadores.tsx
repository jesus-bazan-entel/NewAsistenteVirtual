import { useState, useCallback, useEffect } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import {
  getOperadores,
  createOperador,
  updateOperador,
  deleteOperador,
  getTecnologias,
  type Operador,
  type Tecnologia,
} from '../../api/config-avanzada'

interface FormData {
  nombre: string
  codigo: string
  tecnologias: number[]
}

const emptyForm: FormData = {
  nombre: '',
  codigo: '',
  tecnologias: [],
}

export default function Operadores() {
  const { addToast } = useToast()

  const fetchOperadores = useCallback(() => getOperadores(), [])
  const { data: operadores, loading, refetch } = useCrud<Operador[]>(fetchOperadores, { refreshInterval: 24000 })

  const fetchTecnologias = useCallback(() => getTecnologias(), [])
  const { data: tecnologias } = useCrud<Tecnologia[]>(fetchTecnologias)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
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

  const handleEdit = (op: Operador) => {
    setEditingId(op.id_operador_telefonico)
    setForm({
      nombre: op.nombre,
      codigo: op.codigo || '',
      tecnologias: op.tecnologias?.map((t) => t.id_tecnologia) || [],
    })
    setModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const toggleTecnologia = (tecId: number) => {
    setForm((f) => ({
      ...f,
      tecnologias: f.tecnologias.includes(tecId)
        ? f.tecnologias.filter((id) => id !== tecId)
        : [...f.tecnologias, tecId],
    }))
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      addToast('warning', 'El nombre del operador es obligatorio')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const res = await updateOperador(editingId, {
          nombre: form.nombre,
          codigo: form.codigo,
          tecnologias: form.tecnologias,
        })
        if (res.estado) {
          addToast('success', 'Operador actualizado correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al actualizar operador')
        }
      } else {
        const res = await createOperador({
          nombre: form.nombre,
          codigo: form.codigo,
          tecnologias: form.tecnologias,
        })
        if (res.estado) {
          addToast('success', 'Operador creado correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al crear operador')
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
      const res = await deleteOperador(deleteId)
      if (res.estado) {
        addToast('success', 'Operador eliminado correctamente')
        setDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al eliminar operador')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Operador>[] = [
    { key: 'id_operador_telefonico', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    {
      key: 'codigo',
      label: 'Codigo',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-white/60">{row.codigo || '-'}</span>
      ),
    },
    {
      key: '_tecnologias',
      label: 'Tecnologias',
      sortable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.tecnologias && row.tecnologias.length > 0 ? (
            row.tecnologias.map((tec) => (
              <span
                key={tec.id_tecnologia}
                className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-sans"
              >
                {tec.nombre}
              </span>
            ))
          ) : (
            <span className="text-white/30 text-xs">Sin tecnologias</span>
          )}
        </div>
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
              handleDeleteClick(row.id_operador_telefonico)
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
          <h1 className="text-2xl font-sans font-bold text-white">Operadores</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Administracion de operadores telefonicos
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Operador
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={operadores || []}
        loading={loading}
      />

      {/* Create/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Operador' : 'Nuevo Operador'}
        size="md"
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
        <div className="space-y-4">
          <TextInput
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={(val) => setForm((f) => ({ ...f, nombre: val }))}
            placeholder="Ej: Claro, Movistar, Entel"
            required
          />
          <TextInput
            label="Codigo"
            name="codigo"
            value={form.codigo}
            onChange={(val) => setForm((f) => ({ ...f, codigo: val }))}
            placeholder="Codigo del operador (ej: ENT, CLA, MOV)"
          />

          {/* Tecnologias checkbox list */}
          <div className="space-y-1.5">
            <label className="block text-sm font-sans font-medium text-white/70">
              Tecnologias asociadas
            </label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              {(tecnologias || []).length === 0 ? (
                <p className="text-white/40 text-sm font-sans">Cargando tecnologias...</p>
              ) : (
                (tecnologias || []).map((tec) => (
                  <label key={tec.id_tecnologia} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.tecnologias.includes(tec.id_tecnologia)}
                      onChange={() => toggleTecnologia(tec.id_tecnologia)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-entel-orange focus:ring-entel-orange/50 focus:ring-2"
                    />
                    <span className="text-sm font-sans text-white/70">{tec.nombre}</span>
                  </label>
                ))
              )}
            </div>
          </div>
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
          Esta seguro de que desea eliminar este operador? Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
