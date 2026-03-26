import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Car,
  Calendar,
  User,
  Wrench,
  LayoutDashboard,
  UserCircle,
  Users,
  Fuel,
  AlertTriangle,
  Shield,
  Navigation,
  Activity,
  LogOut,
  Sun,
  Moon,
  Bell,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import NotificationItem from './NotificationItem'
import { prefetchRoute } from '../utils/prefetch'

const Layout = ({ children }) => {
  const location = useLocation()
  const { logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const close = (e) => { if (!e.target.closest('#admin-notif')) setNotifOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const menuItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, section: 'Main' },
    { path: '/dashboard', label: 'Dashboard & Reports', icon: BarChart3, section: 'Main' },
    { path: '/vehicles', label: 'Vehicle Management', icon: Car, section: 'Fleet' },
    { path: '/drivers', label: 'Driver Management', icon: Users, section: 'Fleet' },
    { path: '/booking', label: 'Booking Requests', icon: Calendar, section: 'Operations' },
    { path: '/trips', label: 'Trip Management', icon: User, section: 'Operations' },
    { path: '/maintenance', label: 'Maintenance Tracking', icon: Wrench, section: 'Operations' },
    { path: '/fuel', label: 'Fuel Management', icon: Fuel, section: 'Operations' },
    { path: '/gps', label: 'GPS Tracking', icon: Navigation, section: 'Monitoring' },
    { path: '/performance', label: 'Performance Monitoring', icon: Activity, section: 'Monitoring' },
    { path: '/incidents', label: 'Incident Management', icon: AlertTriangle, section: 'Safety' },
    { path: '/compliance', label: 'Compliance & Safety', icon: Shield, section: 'Safety' },
  ]

  const menuSections = useMemo(() => [
    { name: 'Main', items: menuItems.filter(item => item.section === 'Main') },
    { name: 'Fleet', items: menuItems.filter(item => item.section === 'Fleet') },
    { name: 'Operations', items: menuItems.filter(item => item.section === 'Operations') },
    { name: 'Monitoring', items: menuItems.filter(item => item.section === 'Monitoring') },
    { name: 'Safety', items: menuItems.filter(item => item.section === 'Safety') },
  ], [])

  const isActive = (path) => location.pathname === path

  return (
    <div className="flex h-screen bg-[var(--bg-base)] transition-colors duration-150">
      {/* Sidebar - collapsible */}
      <aside
        className={`${sidebarCollapsed ? 'w-[72px]' : 'w-64'} flex flex-col overflow-y-auto custom-scroll bg-[var(--bg-surface)] dark:bg-slate-800/95 border-r border-[var(--border-default)] transition-all duration-150 ease-out shrink-0`}
      >
        <div className="p-4 border-b border-[var(--border-default)] bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
          <div className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Car size={20} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h2 className="text-lg font-display font-bold text-white tracking-tight truncate">Fleet Management</h2>
                <p className="text-xs text-white/80 font-medium">UCU System</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3">
          {menuSections.map((section) => (
            <div key={section.name} className="mb-5">
              {!sidebarCollapsed && (
                <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
                  {section.name}
                </h3>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => prefetchRoute(item.path)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 text-sm font-medium ${
                      sidebarCollapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={20} strokeWidth={2} className="shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--border-default)] space-y-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all text-sm font-medium"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <><ChevronLeft size={20} /><span>Collapse</span></>}
          </button>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-all text-sm font-medium border border-transparent hover:border-amber-200 dark:hover:border-amber-500/30`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!sidebarCollapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={logout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-sm font-medium`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-base)] relative">
        <div className="absolute inset-0 bg-mesh-gradient dark:bg-mesh-dark pointer-events-none opacity-80" />
        {/* Top Header / Notification Bar */}
        <header className="relative bg-[var(--bg-surface)] dark:bg-slate-800/90 backdrop-blur-xl border-b border-[var(--border-default)] px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center shadow-lg ring-2 ring-white/20 dark:ring-slate-600/40">
              <span className="text-white font-display font-bold text-lg">UCU</span>
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-[var(--text-primary)] tracking-tight">Fleet Management System</h1>
              <p className="text-xs text-[var(--text-muted)] font-medium">Uganda Christian University</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div id="admin-notif" className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 relative transition-colors duration-200"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-[28rem] overflow-y-auto custom-scroll animate-fade-in">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); setNotifOpen(false); }}
                        className="text-xs text-[var(--color-primary)] hover:underline font-medium"
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
                        role="admin"
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
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-all duration-200 hover:scale-105"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
              <UserCircle size={22} className="text-white" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scroll relative">
          <div className="p-6 lg:p-8">
            {children}
          </div>
          <footer className="relative bg-[var(--bg-surface)] dark:bg-slate-800/60 backdrop-blur-sm border-t border-[var(--border-default)] px-6 py-4 flex justify-between items-center mt-6">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              © 2025 UCU Fleet Management System. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-secondary)]"></div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default Layout
