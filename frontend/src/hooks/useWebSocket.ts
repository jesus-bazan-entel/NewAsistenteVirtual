import { useEffect, useRef, useCallback } from 'react'
import { useCallStore, type CallEvent } from '../stores/callStore'

interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addEvent = useCallStore((s) => s.addEvent)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectCountRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as CallEvent
        addEvent(parsed)
      } catch {
        // Ignore unparseable messages
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (reconnectCountRef.current < maxReconnectAttempts) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectCountRef.current += 1
          connect()
        }, reconnectInterval)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [addEvent, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    reconnectCountRef.current = maxReconnectAttempts // prevent reconnect
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [maxReconnectAttempts])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return { connect, disconnect }
}
