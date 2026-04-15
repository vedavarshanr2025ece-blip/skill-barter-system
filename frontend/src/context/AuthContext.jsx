import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, userAPI } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — try to restore session from token in localStorage
  useEffect(() => {
    const token = localStorage.getItem('sb_token')
    if (!token) { setLoading(false); return }
    userAPI.me()
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('sb_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await authAPI.login(username, password)
    localStorage.setItem('sb_token', res.data.access_token)
    const meRes = await userAPI.me()
    setUser(meRes.data)
    return meRes.data
  }, [])

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data)
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sb_token')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await userAPI.me()
    setUser(res.data)
    return res.data
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
