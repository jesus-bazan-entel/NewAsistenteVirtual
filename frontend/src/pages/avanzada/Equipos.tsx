import { useState, useCallback, useEffect } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import SelectInput from '../../components/forms/SelectInput'
import {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  getTecnologias,
  getOperadores,
  type Equipo,
  type Tecnologia,
  type Operador,
} from '../../api/config-avanzada'
import { getSedes, type Sede } from '../../api/config-general'

interface CanalForm {
  id_canal?: number
  numero: string
  nro_ranura: string
  id_tecnologia: string
  id_operador: string
  posicion: string
}

interface FormData {
  nombre: string
  ip: string
  tipo: string
  ranuras: string
  sedeId: string
  canales: CanalForm[]
}

const emptyCanal: CanalForm = {
  numero: '',
  nro_ranura: '',
  id_tecnologia: '',
  id_operador: '',
  posicion: '',
}

const emptyForm: FormData = {
  nombre: '',
  ip: '',
  tipo: '',
  ranuras: '',
  sedeId: '',
  canales: [],
}

const tipoOptions = [
  { value: 'gateway', label: 'Gateway' },
  { value: 'pbx', label: 'PBX' },
  { value: 'ata', label: 'ATA' },
  { value: 'sip_trunk', label: 'SIP Trunk' },
]

export default function Equipos() {
  const { addToast } = useToast()

  const fetchEquipos = useCallback(() => getEquipos(), [])
  const { data: equipos, loading, refetch } = useCrud<Equipo[]>(fetchEquipos, { refreshInterval: 24000 })

  const fetchSedes = useCallback(() => getSedes(), [])
  const { data: sedes } = useCrud<Sede[]>(fetchSedes)

  const fetchTecnologias = useCallback(() => getTecnologias(), [])
  const { data: tecnologias } = useCrud<Tecnologia[]>(fetchTecnologias)

  const fetchOperadores = useCallback(() => getOperadores(), [])
  const { data: operadores } = useCrud<Operador[]>(fetchOperadores)

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

  // Build technology options for channel forms
  const tecOptions = (tecnologias || []).map((tec) => ({
    value: String(tec.id_tecnologia),
    label: tec.nombre,
  }))

  // Build operator options for channel forms
  const opOptions = (operadores || []).map((op) => ({
    value: String(op.id_operador_telefonico),
    label: op.nombre,
  }))

  const sedeOptions = (sedes || []).map((s) => ({
    value: s.id_sede,
    label: s.nombre,
  }))

  const handleCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const handleEdit = (equipo: Equipo) => {
    setEditingId(equipo.id_equipo)
    setForm({
      nombre: equipo.nombre || '',
      ip: equipo.ip || '',
      tipo: equipo.tipo || '',
      ranuras: equipo.ranuras || '',
      sedeId: equipo.id_sede ? String(equipo.id_sede) : '',
      canales: (equipo.canales || []).map((c, i) => {
        // We need to find the id_tecnologia and id_operador from the tecnologia_operador join
        // The canal has nombre_tecnologia and nombre_operador but not the IDs directly
        // We need to look them up from the loaded data
        let idTecnologia = ''
        let idOperador = ''

        if (c.id_tecnologia_operador && operadores && tecnologias) {
          // Find which operador has which tecnologia matching this id_tecnologia_operador
          for (const op of operadores) {
            for (const tec of op.tecnologias || []) {
              // We can match by name since we have nombre_tecnologia and nombre_operador
              if (c.nombre_tecnologia === tec.nombre && c.nombre_operador === op.nombre) {
                idTecnologia = String(tec.id_tecnologia)
                idOperador = String(op.id_operador_telefonico)
              }
            }
          }
        }

        return {
          id_canal: c.id_canal,
          numero: c.numero || '',
          nro_ranura: c.nro_ranura != null ? String(c.nro_ranura) : '',
          id_tecnologia: idTecnologia,
          id_operador: idOperador,
          posicion: c.posicion != null ? String(c.posicion) : String(i),
        }
      }),
    })
    setModalOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
    setDeleteModalOpen(true)
  }

  const addCanal = () => {
    setForm((f) => ({
      ...f,
      canales: [...f.canales, { ...emptyCanal }],
    }))
  }

  const removeCanal = (index: number) => {
    setForm((f) => ({
      ...f,
      canales: f.canales.filter((_, i) => i !== index),
    }))
  }

  const updateCanal = (index: number, field: keyof CanalForm, value: string) => {
    setForm((f) => ({
      ...f,
      canales: f.canales.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }))
  }

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.ip.trim()) {
      addToast('warning', 'Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      const payload = {
        nombre: form.nombre,
        ip: form.ip,
        tipo: form.tipo,
        ranuras: form.ranuras,
        id_sede: form.sedeId ? Number(form.sedeId) : null,
        canales: form.canales.map((c, i) => ({
          id_tecnologia: Number(c.id_tecnologia) || 0,
          id_operador: Number(c.id_operador) || 0,
          nro_ranura: c.nro_ranura ? Number(c.nro_ranura) : undefined,
          numero: c.numero || undefined,
          posicion: c.posicion ? Number(c.posicion) : i,
          id_canal: c.id_canal,
        })),
      }

      if (editingId) {
        const res = await updateEquipo(editingId, payload)
        if (res.estado) {
          addToast('success', 'Equipo actualizado correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al actualizar equipo')
        }
      } else {
        const res = await createEquipo(payload)
        if (res.estado) {
          addToast('success', 'Equipo creado correctamente')
          setModalOpen(false)
          refetch()
        } else {
          addToast('error', res.error || 'Error al crear equipo')
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
      const res = await deleteEquipo(deleteId)
      if (res.estado) {
        addToast('success', 'Equipo eliminado correctamente')
        setDeleteModalOpen(false)
        setDeleteId(null)
        refetch()
      } else {
        addToast('error', res.error || 'Error al eliminar equipo')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Equipo>[] = [
    { key: 'id_equipo', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    {
      key: 'ip',
      label: 'IP',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm text-white/70">{row.ip || '-'}</span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm text-white/60">{row.tipo || '-'}</span>
      ),
    },
    {
      key: 'sede.nombre',
      label: 'Sede',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-sans">
          {row.sede?.nombre || '-'}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => {
        const activo = row.estado === 'A'
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
      key: '_canales',
      label: 'Canales',
      sortable: false,
      render: (row) => (
        <span className="text-white/50 text-xs">{row.canales?.length ?? 0} canales</span>
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
              handleDeleteClick(row.id_equipo)
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
          <h1 className="text-2xl font-sans font-bold text-white">Equipos</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Administracion de equipos y canales de comunicacion
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Equipo
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={equipos || []}
        loading={loading}
      />

      {/* Create/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Equipo' : 'Nuevo Equipo'}
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
          {/* Equipment fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={(val) => setForm((f) => ({ ...f, nombre: val }))}
              placeholder="Nombre del equipo"
              required
            />
            <TextInput
              label="IP"
              name="ip"
              value={form.ip}
              onChange={(val) => setForm((f) => ({ ...f, ip: val }))}
              placeholder="192.168.1.1"
              required
            />
            <SelectInput
              label="Tipo"
              name="tipo"
              value={form.tipo}
              onChange={(val) => setForm((f) => ({ ...f, tipo: val }))}
              options={tipoOptions}
              placeholder="Seleccione tipo"
            />
            <TextInput
              label="Ranuras"
              name="ranuras"
              value={form.ranuras}
              onChange={(val) => setForm((f) => ({ ...f, ranuras: val }))}
              placeholder="8"
            />
            <SelectInput
              label="Sede"
              name="sedeId"
              value={form.sedeId}
              onChange={(val) => setForm((f) => ({ ...f, sedeId: val }))}
              options={sedeOptions}
              placeholder="Seleccione una sede"
            />
          </div>

          {/* Channels sub-form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-sans font-medium text-white/70">
                Canales
              </label>
              <Button variant="ghost" size="sm" onClick={addCanal}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Agregar Canal
              </Button>
            </div>

            {form.canales.length === 0 ? (
              <div className="rounded-xl border border-white/10 p-6 bg-white/[0.02] text-center">
                <p className="text-white/30 text-sm font-sans">
                  No hay canales configurados. Haga clic en "Agregar Canal" para agregar uno.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto rounded-xl border border-white/10 p-4 bg-white/[0.02]">
                {form.canales.map((canal, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <TextInput
                        label="Numero"
                        name={`canal-numero-${index}`}
                        value={canal.numero}
                        onChange={(val) => updateCanal(index, 'numero', val)}
                        placeholder="987100001"
                      />
                      <TextInput
                        label="Ranura"
                        name={`canal-ranura-${index}`}
                        value={canal.nro_ranura}
                        onChange={(val) => updateCanal(index, 'nro_ranura', val)}
                        placeholder="1"
                      />
                      <SelectInput
                        label="Tecnologia"
                        name={`canal-tec-${index}`}
                        value={canal.id_tecnologia}
                        onChange={(val) => updateCanal(index, 'id_tecnologia', val)}
                        options={tecOptions}
                        placeholder="Seleccione"
                      />
                      <SelectInput
                        label="Operador"
                        name={`canal-op-${index}`}
                        value={canal.id_operador}
                        onChange={(val) => updateCanal(index, 'id_operador', val)}
                        options={opOptions}
                        placeholder="Seleccione"
                      />
                    </div>
                    <button
                      onClick={() => removeCanal(index)}
                      className="mt-6 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      title="Eliminar canal"
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
                ))}
              </div>
            )}
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
          Esta seguro de que desea eliminar este equipo y todos sus canales asociados? Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
