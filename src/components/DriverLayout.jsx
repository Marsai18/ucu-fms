import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  Route,
  LogOut,
  Sun,
  Moon,
  Car,
  Bell,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import NotificationItem from './NotificationItem'

const DriverLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const close = (e) => { if (!e.target.closest('#driver-notif')) setNotifOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const menuItems = [
    { path: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/driver/trips', label: 'My Trips', icon: MapPin },
    { path: '/driver/routes', label: 'Assigned Routes', icon: Route },
    { path: '/driver/incidents', label: 'Report Incident', icon: AlertTriangle },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/driver/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)] transition-colors duration-300">
      <aside className="w-64 bg-[var(--bg-surface)] dark:bg-slate-800 border-r border-[var(--border-default)] flex flex-col overflow-y-auto custom-scroll">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-[#2563EB] to-[#1d4ed8]">
          <h2 className="text-lg font-bold text-white">Fleet Portal</h2>
          <p className="text-xs text-ucu-gold-200 mt-1 font-medium">UCU Driver</p>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-ucu-gold-100 dark:bg-ucu-gold-500/20 rounded-lg">
              <Car className="text-ucu-gold-600 dark:text-ucu-gold-400" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'Driver'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'driver@ucu.ac.ug'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 mb-1 rounded-lg transition-all duration-200 text-sm ${
                  active
                    ? 'bg-ucu-blue-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-ucu-gold-50 dark:hover:bg-ucu-gold-500/10 hover:text-ucu-gold-700 dark:hover:text-ucu-gold-400 transition-all text-sm font-medium"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[var(--bg-surface)] dark:bg-slate-800/95 border-b border-[var(--border-default)] px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              UCU Fleet Management - Driver Portal
            </h1>
            <div id="driver-notif" className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2.5 rounded-xl hover:bg-ucu-gold-100 dark:hover:bg-ucu-gold-500/20 text-gray-600 dark:text-gray-300 relative"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-[28rem] overflow-y-auto custom-scroll">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800">
                    <span className="font-semibold text-gray-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); setNotifOpen(false); }}
                        className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.slice(0, 15).map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onMarkRead={markAsRead}
                        onClose={() => setNotifOpen(false)}
                        role="driver"
                        variant="dropdown"
                      />
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-8 text-center">
                        <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DriverLayout
