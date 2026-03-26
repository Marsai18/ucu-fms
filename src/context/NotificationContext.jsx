import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import api from '../utils/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const userId = user?.id

  const fetchNotifications = useCallback(async (isBackground = false) => {
    if (!isAuthenticated || !userId) return
    try {
      if (!isBackground) setLoading(true)
      const data = await api.getNotifications()
      const newList = Array.isArray(data) ? data : []
      setNotifications(prev => {
        if (prev.length !== newList.length) return newList
        const changed = prev.some((p, i) => {
          const n = newList[i]
          return !n || String(p.id) !== String(n.id) || !!p.read !== !!n.read
        })
        return changed ? newList : prev
      })
    } catch (err) {
      if (!isBackground) setNotifications([])
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [isAuthenticated, userId])

  useEffect(() => {
    fetchNotifications(false)
    const interval = setInterval(() => fetchNotifications(true), 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = useCallback(async (id) => {
    try {
      await api.markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }), [notifications, unreadCount, loading, fetchNotifications])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) return { notifications: [], unreadCount: 0, markAsRead: () => {}, markAllAsRead: () => {} }
  return ctx
}
