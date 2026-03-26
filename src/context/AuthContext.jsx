import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken()
      if (token) {
        try {
          const userData = await api.request('/auth/me')
          setIsAuthenticated(true)
          setUser(userData)
        } catch {
          api.setToken(null)
          setIsAuthenticated(false)
          setUser(null)
        }
      } else {
        const stored = localStorage.getItem('ucu_fms_auth')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            setIsAuthenticated(true)
            setUser(parsed)
          } catch {
            setIsAuthenticated(false)
            setUser(null)
          }
        }
      }
      setIsInitialized(true)
    }
    initAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.login(username, password)
      
      if (response.token || response.user) {
        setIsAuthenticated(true)
        const userData = response.user || {
          id: response.user?.id,
          username,
          email: username.includes('@') ? username : undefined,
          role: response.user?.role || response.role || (username === 'masai' ? 'admin' : 'client'),
          driverId: response.user?.driverId,
          name: response.user?.name
        }
        setUser(userData)
        localStorage.setItem('ucu_fms_auth', JSON.stringify(userData))
        return { ok: true, user: userData }
      }
      
      return { ok: false, error: response.error || 'Invalid credentials' }
    } catch (error) {
      // Fallback: try demo-token endpoint if main login failed (e.g. backend was starting)
      try {
        const demoRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/demo-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
        if (demoRes.ok) {
          const data = await demoRes.json()
          if (data.token && data.user) {
            api.setToken(data.token)
            setIsAuthenticated(true)
            setUser(data.user)
            localStorage.setItem('ucu_fms_auth', JSON.stringify(data.user))
            return { ok: true, user: data.user }
          }
        }
      } catch (_) {}
      return { ok: false, error: error.message || 'Login failed. Make sure the backend is running on http://localhost:5000' }
    }
  }

  const logout = () => {
    api.setToken(null)
    localStorage.removeItem('ucu_fms_auth')
    setIsAuthenticated(false)
    setUser(null)
  }

  const value = useMemo(() => ({ isAuthenticated, user, login, logout, isInitialized }), [isAuthenticated, user, isInitialized])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}





