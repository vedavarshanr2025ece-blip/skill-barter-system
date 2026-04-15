import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'

const WebSocketContext = createContext(null)

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export function WebSocketProvider({ children }) {
  const { user } = useAuth()
  const wsRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const pingIntervalRef = useRef(null)

  const connect = useCallback(() => {
    const token = localStorage.getItem('sb_token')
    if (!token || !user) return

    const ws = new WebSocket(`${WS_BASE}/api/v1/ws/notifications?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      // Send ping every 30s to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, 30000)
    }

    ws.onmessage = (event) => {
      if (event.data === 'pong') return
      try {
        const msg = JSON.parse(event.data)
        setNotifications(prev => [
          { ...msg, id: Date.now(), read: false },
          ...prev.slice(0, 49),  // keep last 50
        ])
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = () => {
      setIsConnected(false)
      clearInterval(pingIntervalRef.current)
      // Reconnect after 3 seconds if user is still logged in
      if (user) setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }, [user])

  useEffect(() => {
    if (user) {
      connect()
    } else {
      // Clean up on logout
      if (wsRef.current) wsRef.current.close()
      setNotifications([])
      setIsConnected(false)
    }
    return () => {
      if (wsRef.current) wsRef.current.close()
      clearInterval(pingIntervalRef.current)
    }
  }, [user])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <WebSocketContext.Provider value={{ notifications, unreadCount, isConnected, markAllRead }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocket must be used inside <WebSocketProvider>')
  return ctx
}
