import { useState, useCallback, useEffect } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import {
  getPerfiles,
  createPerfil,
  updatePerfil,
  deletePerfil,
  getModulos,
  type Perfil,
  type Modulo,
} from '../../api/config-general'

interface FormData {
  nombre: string
  descripcion: string
  submodulos: number[]
}

const emptyForm: FormData = {
  nombre: '',
  descripcion: '',
  submodulos: [],
}

export default function Perfiles() {
  const { addToast } = useToast()

  // Data fetching
  const fetchPerfiles = useCallback(() => getPerfiles(), [])
  const { data: perfiles, loading, refetch } = useCrud<Perfil[]>(fetchPerfiles, { refreshInterval: 24000 })

  const fetchModulos = useCallback(() => getModulos(), [])
  const { data: modulos } = useCrud<Modulo[]>(fetchModulos)

  // Modal state
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

  const handleEdit = (perfil: Perfil) => {
    setEditingId(perfil.id_perfil)
    setForm({
      nombre: perfil.nombre,
      descripcion: perfil.descripcion || '',
      submodulos: perfil.submodulos?.map((s) => s.id_submodulo) || [],
    })
    setModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const toggleSubmodulo = (subId: number) => {
    setForm((f) => ({
      ...f,
      submodulos: f.submodulos.includes(subId)
        ? f.submodulos.filter((id) => id !== subId)
        : [...f.submodulos, subId],
    }))
  }

  const toggleModulo = (modulo: Modulo) => {
    const subIds = modulo.submodulos.map((s) => s.id_submodulo)
    const allSelected = subIds.every((id) => form.submodulos.includes(id))
    setForm((f) => ({
      ...f,
      submodulos: allSelected
        ? f.submodulos.filter((id) => !subIds.includes(id))
        : [...new Set([...f.submodulos, ...subIds])],
    }))
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      addToast('warning', 'El nombre del perfil es obligatorio')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const res = await updatePerfil(editingId, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          submodulos: form.submodulos,
        })
        if (res.estado) {
          addToast('success', 'Perfil actualizado correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al actualizar perfil')
        }
      } else {
        const res = await createPerfil({
          nombre: form.nombre,
          descripcion: form.descripcion,
          submodulos: form.submodulos,
        })
        if (res.estado) {
          addToast('success', 'Perfil creado correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al crear perfil')
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
      const res = await deletePerfil(deleteId)
      if (res.estado) {
        addToast('success', 'Perfil eliminado correctamente')
        setDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else if (res.fk_conflict) {
        setDeleteModalOpen(false)
        setForceDeleteModalOpen(true)
      } else {
        addToast('error', res.error || 'Error al eliminar perfil')
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
      const res = await deletePerfil(deleteId, true)
      if (res.estado) {
        addToast('success', 'Perfil eliminado y usuarios desvinculados correctamente')
        setForceDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al eliminar perfil')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Perfil>[] = [
    { key: 'id_perfil', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    {
      key: 'descripcion',
      label: 'Descripcion',
      sortable: true,
      render: (row) => (
        <span className="text-white/60">
          {row.descripcion || '-'}
        </span>
      ),
    },
    {
      key: '_submodulos',
      label: 'Permisos',
      sortable: false,
      render: (row) => (
        <span className="text-white/50 text-xs">
          {row.submodulos?.length ?? 0} submodulos
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
              handleDeleteClick(row.id_perfil)
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
          <h1 className="text-2xl font-sans font-bold text-white">Perfiles</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Administracion de perfiles y permisos
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Perfil
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={perfiles || []}
        loading={loading}
      />

      {/* Create/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Perfil' : 'Nuevo Perfil'}
        size="lg"
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
          <TextInput
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={(val) => setForm((f) => ({ ...f, nombre: val }))}
            placeholder="Nombre del perfil"
            required
          />
          <TextInput
            label="Descripcion"
            name="descripcion"
            value={form.descripcion}
            onChange={(val) => setForm((f) => ({ ...f, descripcion: val }))}
            placeholder="Descripcion del perfil (opcional)"
          />

          {/* Submodulos grouped by modulo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-sans font-medium text-white/70">
              Permisos de acceso
            </label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              {(modulos || []).length === 0 ? (
                <p className="text-white/40 text-sm font-sans">Cargando modulos...</p>
              ) : (
                (modulos || []).map((modulo) => {
                  const subIds = modulo.submodulos.map((s) => s.id_submodulo)
                  const allSelected = subIds.length > 0 && subIds.every((id) => form.submodulos.includes(id))
                  const someSelected = subIds.some((id) => form.submodulos.includes(id))

                  return (
                    <div key={modulo.id_modulo} className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected
                          }}
                          onChange={() => toggleModulo(modulo)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-entel-orange focus:ring-entel-orange/50 focus:ring-2"
                        />
                        <span className="text-sm font-sans font-semibold text-white/80">
                          {modulo.nombre}
                        </span>
                      </label>
                      <div className="ml-6 space-y-1.5">
                        {modulo.submodulos.map((sub) => (
                          <label key={sub.id_submodulo} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.submodulos.includes(sub.id_submodulo)}
                              onChange={() => toggleSubmodulo(sub.id_submodulo)}
                              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-entel-orange focus:ring-entel-orange/50 focus:ring-2"
                            />
                            <span className="text-sm font-sans text-white/60">{sub.nombre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })
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
          Esta seguro de que desea eliminar este perfil? Esta accion no se puede deshacer.
        </p>
      </Modal>

      {/* Force delete modal (FK conflict) */}
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
              Este perfil tiene usuarios asociados que seran desvinculados.
            </p>
          </div>
          <p className="text-white/70 font-sans text-sm">
            Desea eliminar el perfil? Los usuarios asociados quedaran sin perfil asignado. Esta accion es irreversible.
          </p>
        </div>
      </Modal>
    </div>
  )
}
