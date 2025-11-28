import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is already authenticated
    const token = api.getToken()
    if (token) {
      // Verify token by getting current user
      api.request('/auth/me')
        .then(userData => {
          setIsAuthenticated(true)
          setUser(userData)
        })
        .catch(() => {
          // Token invalid, clear it
          api.setToken(null)
          setIsAuthenticated(false)
          setUser(null)
        })
    } else {
      // Fallback to old storage for migration
      const stored = localStorage.getItem('ucu_fms_auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        setIsAuthenticated(true)
        setUser(parsed)
      }
    }
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.login(username, password)
      
      if (response.token || response.user) {
        setIsAuthenticated(true)
        const userData = response.user || {
          username,
          email: username.includes('@') ? username : undefined,
          role: response.role || (username === 'masai' ? 'admin' : 'client')
        }
        setUser(userData)
        // Keep old storage for compatibility
        localStorage.setItem('ucu_fms_auth', JSON.stringify(userData))
        return { ok: true, user: userData }
      }
      
      return { ok: false, error: response.error || 'Invalid credentials' }
    } catch (error) {
      // Fallback for hardcoded client credentials
      if (username === 'client@ucu.ac.ug' && password === 'client123') {
        const demoUser = {
          id: '2',
          username: 'client@ucu.ac.ug',
          email: 'client@ucu.ac.ug',
          role: 'client',
          name: 'Client User'
        }
        setIsAuthenticated(true)
        setUser(demoUser)
        localStorage.setItem('ucu_fms_auth', JSON.stringify(demoUser))
        return { ok: true, user: demoUser }
      }
      return { ok: false, error: error.message || 'Login failed' }
    }
  }

  const logout = () => {
    api.setToken(null)
    localStorage.removeItem('ucu_fms_auth')
    setIsAuthenticated(false)
    setUser(null)
  }

  const value = useMemo(() => ({ isAuthenticated, user, login, logout }), [isAuthenticated, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}





