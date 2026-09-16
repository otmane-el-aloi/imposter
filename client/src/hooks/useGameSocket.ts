import { useState, useEffect, useRef, useCallback } from 'react'
import { GameState, NetworkInfo, ReactionEvent } from '../types/game'

function getOrCreateClientId(): string {
  let id = localStorage.getItem('imposter_client_id')
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    localStorage.setItem('imposter_client_id', id)
  }
  return id
}

interface ExtendedWebSocket extends WebSocket {
  _pingInterval?: ReturnType<typeof setInterval>
}

export function useGameSocket() {
  const [clientId] = useState<string>(getOrCreateClientId)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [recentReaction, setRecentReaction] = useState<{ id: number; data: ReactionEvent } | null>(null)

  const socketRef = useRef<ExtendedWebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reactionCounterRef = useRef<number>(0)

  // Fetch local network info (LAN IP, server URL)
  useEffect(() => {
    const fetchNetInfo = async () => {
      try {
        const res = await fetch('/api/network-info')
        if (res.ok) {
          const data: NetworkInfo = await res.json()
          setNetworkInfo(data)
        }
      } catch (e) {
        setNetworkInfo({
          local_ip: window.location.hostname,
          port: 8000,
          server_url: `http://${window.location.hostname}:8000`,
          is_offline_capable: true
        })
      }
    }
    fetchNetInfo()
  }, [])

  const connect = useCallback(() => {
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    let host = window.location.host
    if (window.location.port === '5173') {
      host = `${window.location.hostname}:8000`
    }
    const wsUrl = `${protocol}//${host}/ws/${clientId}`

    const ws = new WebSocket(wsUrl) as ExtendedWebSocket
    socketRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      setErrorMessage(null)
      if (ws._pingInterval) clearInterval(ws._pingInterval)
      ws._pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'ping' }))
        }
      }, 10000)
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'state_update') {
          setGameState(msg.state as GameState)
        } else if (msg.type === 'reaction') {
          reactionCounterRef.current += 1
          setRecentReaction({
            id: reactionCounterRef.current,
            data: {
              player_id: msg.player_id,
              player_name: msg.player_name,
              avatar: msg.avatar,
              emoji: msg.emoji
            }
          })
        } else if (msg.type === 'error') {
          setErrorMessage(msg.message)
          setTimeout(() => setErrorMessage(null), 5000)
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      if (ws._pingInterval) clearInterval(ws._pingInterval)
      reconnectTimeoutRef.current = setTimeout(connect, 2000)
    }

    ws.onerror = (err) => {
      console.warn('WebSocket error, waiting to reconnect...', err)
    }
  }, [clientId])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (socketRef.current) {
        if (socketRef.current._pingInterval) clearInterval(socketRef.current._pingInterval)
        socketRef.current.close()
      }
    }
  }, [connect])

  const sendAction = (action: string, payload: Record<string, unknown> = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action, ...payload }))
    } else {
      setErrorMessage('Reconnecting to server... Please wait a second.')
    }
  }

  return {
    clientId,
    isConnected,
    gameState,
    errorMessage,
    networkInfo,
    recentReaction,
    clearError: () => setErrorMessage(null),
    sendAction
  }
}
