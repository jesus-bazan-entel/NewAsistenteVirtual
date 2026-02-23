import { useState, useCallback, useEffect, useRef } from 'react'
import { useCrud } from '../../hooks/useCrud'
import { useToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import SelectInput from '../../components/forms/SelectInput'
import {
  getAsteriskConfig,
  updateAsteriskConfig,
  testAsteriskConnection,
  reconnectAsterisk,
  getAsteriskStatus,
  syncAsteriskConfig,
  type AsteriskConfigData,
  type AsteriskConfigResponse,
} from '../../api/config-avanzada'

const emptyForm: AsteriskConfigData = {
  host: '',
  puerto: 5038,
  usuario: 'admin',
  clave: '',
  entorno: 'local',
  activo: false,
}

export default function ConfigAsterisk() {
  const { addToast } = useToast()

  const fetchConfig = useCallback(() => getAsteriskConfig(), [])
  const { data: config, loading, refetch } = useCrud<AsteriskConfigResponse>(fetchConfig, { refreshInterval: 24000 })

  const [form, setForm] = useState<AsteriskConfigData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [connected, setConnected] = useState(false)
  const statusInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Populate form when config loads
  useEffect(() => {
    if (config) {
      setForm({
        host: config.host,
        puerto: config.puerto,
        usuario: config.usuario,
        clave: config.clave,
        entorno: config.entorno,
        activo: config.activo,
      })
    }
  }, [config])

  // Poll connection status every 10s
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getAsteriskStatus()
        if (res.estado) {
          setConnected(res.data.conectado)
        }
      } catch {
        setConnected(false)
      }
    }
    fetchStatus()
    statusInterval.current = setInterval(fetchStatus, 10000)
    return () => {
      if (statusInterval.current) clearInterval(statusInterval.current)
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateAsteriskConfig(form)
      if (res.estado) {
        addToast('success', 'Configuracion guardada correctamente')
        refetch()
      } else {
        addToast('error', res.error || 'Error al guardar configuracion')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!form.host.trim()) {
      addToast('warning', 'Ingrese el host del servidor Asterisk')
      return
    }
    setTesting(true)
    try {
      const res = await testAsteriskConnection(form)
      if (res.estado) {
        addToast('success', res.mensaje || 'Conexion exitosa')
      } else {
        addToast('error', res.error || 'Error de conexion')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setTesting(false)
    }
  }

  const handleReconnect = async () => {
    setReconnecting(true)
    try {
      const res = await reconnectAsterisk()
      if (res.estado) {
        addToast('success', res.mensaje || 'Reconexion iniciada')
        // Wait a moment then refresh status
        setTimeout(async () => {
          try {
            const status = await getAsteriskStatus()
            if (status.estado) setConnected(status.data.conectado)
          } catch { /* ignore */ }
        }, 2000)
      } else {
        addToast('error', res.error || 'Error al reconectar')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setReconnecting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncAsteriskConfig()
      if (res.estado) {
        addToast('success', res.mensaje || 'Configuracion sincronizada')
      } else {
        addToast('error', res.error || 'Error al sincronizar')
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-entel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white">Configuracion Asterisk</h1>
          <p className="text-white/50 text-sm font-sans mt-1">
            Configuracion de conexion AMI al servidor Asterisk
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/[0.06]">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'
              }`}
            />
            <span className={`text-sm font-sans ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/[0.06] p-6">
        <div className="space-y-6">
          {/* Active toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-white font-sans font-medium">Conexion AMI</h3>
              <p className="text-white/40 text-sm font-sans mt-0.5">
                Activar o desactivar la conexion al servidor Asterisk
              </p>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.activo ? 'bg-entel-orange' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  form.activo ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Host"
              name="host"
              value={form.host}
              onChange={(val) => setForm((f) => ({ ...f, host: val }))}
              placeholder="192.168.1.10"
              required
            />
            <TextInput
              label="Puerto"
              name="puerto"
              type="number"
              value={String(form.puerto)}
              onChange={(val) => setForm((f) => ({ ...f, puerto: parseInt(val) || 5038 }))}
              placeholder="5038"
              required
            />
            <TextInput
              label="Usuario"
              name="usuario"
              value={form.usuario}
              onChange={(val) => setForm((f) => ({ ...f, usuario: val }))}
              placeholder="admin"
              required
            />
            <TextInput
              label="Clave"
              name="clave"
              type="password"
              value={form.clave}
              onChange={(val) => setForm((f) => ({ ...f, clave: val }))}
              placeholder="Contrasena AMI"
              required
            />
            <SelectInput
              label="Entorno"
              name="entorno"
              value={form.entorno}
              onChange={(val) => setForm((f) => ({ ...f, entorno: val }))}
              options={[
                { value: 'local', label: 'Local' },
                { value: 'remote', label: 'Remoto' },
              ]}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
            <Button onClick={handleSave} loading={saving}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar
            </Button>
            <Button variant="secondary" onClick={handleTest} loading={testing}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Probar Conexion
            </Button>
            <Button variant="secondary" onClick={handleReconnect} loading={reconnecting}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reconectar
            </Button>
            <Button variant="secondary" onClick={handleSync} loading={syncing}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar Configs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
