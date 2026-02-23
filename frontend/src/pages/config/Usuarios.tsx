import { useState, useCallback, useEffect } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import SelectInput from '../../components/forms/SelectInput'
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getPerfiles,
  type Usuario,
  type Perfil,
} from '../../api/config-general'

interface FormData {
  nombres: string
  apellidos: string
  correo: string
  clave: string
  perfilId: string
}

const emptyForm: FormData = {
  nombres: '',
  apellidos: '',
  correo: '',
  clave: '',
  perfilId: '',
}

export default function Usuarios() {
  const { addToast } = useToast()

  // Data fetching
  const fetchUsuarios = useCallback(() => getUsuarios(), [])
  const { data: usuarios, loading, refetch } = useCrud<Usuario[]>(fetchUsuarios, { refreshInterval: 24000 })

  const fetchPerfiles = useCallback(() => getPerfiles(), [])
  const { data: perfiles } = useCrud<Perfil[]>(fetchPerfiles)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [forceDeleteModalOpen, setForceDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setForm(emptyForm)
      setEditingId(null)
    }
  }, [modalOpen])

  const perfilOptions = (perfiles || []).map((p) => ({
    value: p.id_perfil,
    label: p.nombre,
  }))

  const handleCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingId(usuario.id_usuario)
    setForm({
      nombres: usuario.nombres || '',
      apellidos: usuario.apellidos || '',
      correo: usuario.correo || '',
      clave: '',
      perfilId: usuario.id_perfil ? String(usuario.id_perfil) : '',
    })
    setModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombres.trim() || !form.correo.trim() || !form.perfilId) {
      addToast('warning', 'Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const payload: Parameters<typeof updateUsuario>[1] = {
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo,
          id_perfil: Number(form.perfilId),
        }
        if (form.clave.trim()) {
          payload.clave = form.clave
        }
        const res = await updateUsuario(editingId, payload)
        if (res.estado) {
          addToast('success', 'Usuario actualizado correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al actualizar usuario')
        }
      } else {
        if (!form.clave.trim()) {
          addToast('warning', 'La contrasena es obligatoria para nuevos usuarios')
          setSaving(false)
          return
        }
        const res = await createUsuario({
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo,
          clave: form.clave,
          id_perfil: Number(form.perfilId),
        })
        if (res.estado) {
          addToast('success', 'Usuario creado correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al crear usuario')
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
      const res = await deleteUsuario(deleteId)
      if (res.estado) {
        addToast('success', 'Usuario eliminado correctamente')
        setDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else if (res.fk_conflict) {
        setDeleteModalOpen(false)
        setForceDeleteModalOpen(true)
      } else {
        addToast('error', res.error || 'Error al eliminar usuario')
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
      const res = await deleteUsuario(deleteId, true)
      if (res.estado) {
        addToast('success', 'Usuario y registros asociados eliminados correctamente')
        setForceDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al eliminar usuario')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Usuario>[] = [
    { key: 'id_usuario', label: 'ID', sortable: true },
    {
      key: 'nombres',
      label: 'Nombre',
      sortable: true,
      render: (row) => (
        <span>{[row.nombres, row.apellidos].filter(Boolean).join(' ') || '-'}</span>
      ),
    },
    { key: 'correo', label: 'Correo', sortable: true },
    {
      key: 'perfil_nombre',
      label: 'Perfil',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-sans">
          {row.perfil_nombre || '-'}
        </span>
      ),
    },
    {
      key: 'acceso',
      label: 'Estado',
      sortable: true,
      render: (row) => {
        const activo = row.acceso === 'A'
        return (
          <span
            className={`
              px-2.5 py-1 rounded-lg text-xs font-sans font-medium
              ${
                activo
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }
            `}
          >
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        )
      },
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
              handleDeleteClick(row.id_usuario)
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
          <h1 className="text-2xl font-sans font-bold text-white">Usuarios</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Administracion de usuarios del sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={usuarios || []}
        loading={loading}
      />

      {/* Create/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
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
            label="Nombres"
            name="nombres"
            value={form.nombres}
            onChange={(val) => setForm((f) => ({ ...f, nombres: val }))}
            placeholder="Nombres"
            required
          />
          <TextInput
            label="Apellidos"
            name="apellidos"
            value={form.apellidos}
            onChange={(val) => setForm((f) => ({ ...f, apellidos: val }))}
            placeholder="Apellidos"
          />
          <TextInput
            label="Correo"
            name="correo"
            type="email"
            value={form.correo}
            onChange={(val) => setForm((f) => ({ ...f, correo: val }))}
            placeholder="usuario@entel.com"
            required
          />
          <TextInput
            label={editingId ? 'Contrasena (dejar vacio para no cambiar)' : 'Contrasena'}
            name="clave"
            type="password"
            value={form.clave}
            onChange={(val) => setForm((f) => ({ ...f, clave: val }))}
            placeholder={editingId ? 'Nueva contrasena (opcional)' : 'Contrasena'}
            required={!editingId}
          />
          <SelectInput
            label="Perfil"
            name="perfilId"
            value={form.perfilId}
            onChange={(val) => setForm((f) => ({ ...f, perfilId: val }))}
            options={perfilOptions}
            placeholder="Seleccione un perfil"
            required
          />
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
          Esta seguro de que desea eliminar este usuario? Esta accion no se puede deshacer.
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
            <Button variant="secondary" onClick={() => { setForceDeleteModalOpen(false); setDeleteId(null) }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleForceDelete} loading={deleting}>
              Eliminar todo
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-amber-300 font-sans text-sm font-medium">
              Este usuario tiene pruebas, ejecuciones y escenarios asociados.
            </p>
          </div>
          <p className="text-white/70 font-sans text-sm">
            Desea eliminar el usuario junto con todos sus registros dependientes? Esta accion es irreversible.
          </p>
        </div>
      </Modal>
    </div>
  )
}
