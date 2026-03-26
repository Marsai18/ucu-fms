import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard,
  Send,
  History,
  LogOut,
  Sun,
  Moon,
  User,
  Car,
  Bell
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import NotificationItem from './NotificationItem'

const ClientLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const close = (e) => { if (!e.target.closest('#client-notif')) setNotifOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const menuItems = [
    { path: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/client/vehicles', label: 'Available Vehicles', icon: Car },
    { path: '/client/request', label: 'New Request', icon: Send },
    { path: '/client/history', label: 'Request History', icon: History },
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    logout()
    navigate('/client/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)] transition-colors duration-300 font-client">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--bg-surface)] dark:bg-slate-800 border-r border-[var(--border-default)] flex flex-col overflow-y-auto custom-scroll">
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-ucu-blue-600 to-ucu-blue-800">
          <h2 className="text-xl font-bold text-white font-client tracking-tight">Fleet Portal</h2>
          <p className="text-sm text-ucu-gold-200/90 mt-1 font-semibold">UCU Client</p>
        </div>
        
        {/* User Info */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-ucu-blue-100 dark:bg-ucu-blue-500/20 rounded-xl">
              <User className="text-ucu-blue-600 dark:text-ucu-blue-400" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate font-client">
                {user?.name || user?.email || 'Client'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'client@ucu.ac.ug'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  active
                    ? 'bg-ucu-blue-500 text-white shadow-lg'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon size={20} />
                <span className="font-semibold font-client">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/95 dark:bg-slate-800/95 border-b border-slate-200/80 dark:border-slate-700/80 px-6 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-client tracking-tight">
              UCU Fleet Management — Client Portal
            </h1>
            <div id="client-notif" className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2.5 rounded-xl hover:bg-ucu-gold-100 dark:hover:bg-ucu-gold-500/20 text-slate-600 dark:text-slate-300 relative"
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
                    <span className="font-semibold text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); setNotifOpen(false); }}
                        className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {notifications.slice(0, 15).map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onMarkRead={markAsRead}
                        onClose={() => setNotifOpen(false)}
                        role="client"
                        variant="dropdown"
                      />
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-8 text-center">
                        <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default ClientLayout










