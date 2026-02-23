import { useState, useEffect, useCallback } from 'react'

interface ApiResponse<T> {
  estado: boolean
  data: T
  error?: string
}

interface UseCrudOptions {
  immediate?: boolean
  refreshInterval?: number
}

interface UseCrudReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCrud<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  opts: UseCrudOptions = {},
): UseCrudReturn<T> {
  const { immediate = true, refreshInterval } = opts

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchFn()
      if (response.estado) {
        setData(response.data)
      } else {
        setError(response.error || 'Error desconocido')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexion'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    if (immediate) {
      refetch()
    }
  }, [immediate, refetch])

  useEffect(() => {
    if (!refreshInterval) return
    const id = setInterval(() => { refetch() }, refreshInterval)
    return () => clearInterval(id)
  }, [refreshInterval, refetch])

  return { data, loading, error, refetch }
}
