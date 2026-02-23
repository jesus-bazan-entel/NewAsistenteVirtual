import { useState, useCallback, useEffect } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import {
  getLdapConfigs,
  createLdapConfig,
  updateLdapConfig,
  deleteLdapConfig,
  type LdapConfig,
} from '../../api/config-general'

interface LdapData {
  nombre: string
  ip: string
  puerto: string
  alias: string
  nombre_distinguido: string
  tipo_enlace: string
  usuario: string
  clave: string
}

const emptyLdapData: LdapData = {
  nombre: '',
  ip: '',
  puerto: '389',
  alias: '',
  nombre_distinguido: '',
  tipo_enlace: '',
  usuario: '',
  clave: '',
}

function parseLdapData(raw: string): LdapData {
  try {
    const parsed = JSON.parse(raw)
    return {
      nombre: parsed.nombre || '',
      ip: parsed.ip || '',
      puerto: parsed.puerto || '389',
      alias: parsed.alias || '',
      nombre_distinguido: parsed.nombre_distinguido || '',
      tipo_enlace: parsed.tipo_enlace || '',
      usuario: parsed.usuario || '',
      clave: parsed.clave || '',
    }
  } catch {
    return { ...emptyLdapData }
  }
}

interface LdapRow extends LdapConfig {
  parsed: LdapData
}

export default function LdapConfigPage() {
  const { addToast } = useToast()

  const fetchConfigs = useCallback(() => getLdapConfigs(), [])
  const { data: configs, loading, refetch } = useCrud<LdapConfig[]>(fetchConfigs, { refreshInterval: 24000 })

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<LdapData>(emptyLdapData)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!modalOpen) {
      setForm(emptyLdapData)
      setEditingId(null)
    }
  }, [modalOpen])

  const rows: LdapRow[] = (configs || [])
    .filter((c) => c.nombre === 'conf_ldap' && c.data.includes('"ip"'))
    .map((c) => ({
      ...c,
      parsed: parseLdapData(c.data),
    }))

  const handleCreate = () => {
    setEditingId(null)
    setForm(emptyLdapData)
    setModalOpen(true)
  }

  const handleEdit = (row: LdapRow) => {
    setEditingId(row.id)
    setForm(row.parsed)
    setModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.ip.trim() || !form.usuario.trim()) {
      addToast('warning', 'Complete los campos obligatorios (IP y Usuario)')
      return
    }

    setSaving(true)
    try {
      const dataJson = JSON.stringify({
        nombre: form.nombre,
        ip: form.ip,
        puerto: form.puerto,
        alias: form.alias,
        nombre_distinguido: form.nombre_distinguido,
        tipo_enlace: form.tipo_enlace,
        usuario: form.usuario,
        clave: form.clave,
      })

      const payload = { nombre: 'conf_ldap', data: dataJson }

      if (editingId) {
        const res = await updateLdapConfig(editingId, payload)
        if (res.estado) {
          addToast('success', 'Configuracion LDAP actualizada')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al actualizar')
        }
      } else {
        const res = await createLdapConfig(payload)
        if (res.estado) {
          addToast('success', 'Configuracion LDAP creada')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al crear')
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
      const res = await deleteLdapConfig(deleteId)
      if (res.estado) {
        addToast('success', 'Configuracion LDAP eliminada')
        setDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al eliminar')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<LdapRow>[] = [
    { key: 'id', label: 'ID', sortable: true },
    {
      key: 'parsed',
      label: 'Nombre',
      sortable: false,
      render: (row) => <span>{row.parsed.nombre || '-'}</span>,
    },
    {
      key: 'parsed',
      label: 'IP / Puerto',
      sortable: false,
      render: (row) => (
        <span className="font-mono text-sm">
          {row.parsed.ip}:{row.parsed.puerto}
        </span>
      ),
    },
    {
      key: 'parsed',
      label: 'Usuario',
      sortable: false,
      render: (row) => <span>{row.parsed.usuario || '-'}</span>,
    },
    {
      key: 'parsed',
      label: 'Base DN',
      sortable: false,
      render: (row) => (
        <span className="text-xs text-white/50 max-w-[200px] truncate block">
          {row.parsed.tipo_enlace || '-'}
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
              handleDeleteClick(row.id)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white">Configuracion LDAP</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Administracion de conexiones LDAP del sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Configuracion
        </Button>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Configuracion LDAP' : 'Nueva Configuracion LDAP'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={(val) => setForm((f) => ({ ...f, nombre: val }))}
            placeholder="Nombre de la configuracion"
          />
          <TextInput
            label="Alias"
            name="alias"
            value={form.alias}
            onChange={(val) => setForm((f) => ({ ...f, alias: val }))}
            placeholder="Alias"
          />
          <TextInput
            label="IP del servidor"
            name="ip"
            value={form.ip}
            onChange={(val) => setForm((f) => ({ ...f, ip: val }))}
            placeholder="192.168.1.100"
            required
          />
          <TextInput
            label="Puerto"
            name="puerto"
            value={form.puerto}
            onChange={(val) => setForm((f) => ({ ...f, puerto: val }))}
            placeholder="389"
          />
          <div className="md:col-span-2">
            <TextInput
              label="Nombre Distinguido (DN)"
              name="nombre_distinguido"
              value={form.nombre_distinguido}
              onChange={(val) => setForm((f) => ({ ...f, nombre_distinguido: val }))}
              placeholder="cn=Admin,ou=Users,dc=example,dc=com"
            />
          </div>
          <div className="md:col-span-2">
            <TextInput
              label="Tipo de Enlace (Base DN)"
              name="tipo_enlace"
              value={form.tipo_enlace}
              onChange={(val) => setForm((f) => ({ ...f, tipo_enlace: val }))}
              placeholder="DC=example,DC=com"
            />
          </div>
          <TextInput
            label="Usuario"
            name="usuario"
            value={form.usuario}
            onChange={(val) => setForm((f) => ({ ...f, usuario: val }))}
            placeholder="admin@domain.com"
            required
          />
          <TextInput
            label="Clave"
            name="clave"
            type="password"
            value={form.clave}
            onChange={(val) => setForm((f) => ({ ...f, clave: val }))}
            placeholder="Contrasena LDAP"
          />
        </div>
      </Modal>

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
          Esta seguro de que desea eliminar esta configuracion LDAP? Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
