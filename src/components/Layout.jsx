import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Car,
  Calendar,
  User,
  Wrench,
  LayoutDashboard,
  Users,
  Fuel,
  AlertTriangle,
  Shield,
  Navigation,
  Activity,
  UserCog,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import NotificationMenu from './NotificationMenu'
import { prefetchRoute } from '../utils/prefetch'
import api from '../utils/api'

const ROUTE_TITLES = {
  '/admin': 'Dashboard overview',
  '/dashboard': 'Dashboard overview',
  '/users': 'User management',
  '/vehicles': 'Fleet vehicles',
  '/drivers': 'Drivers',
  '/booking': 'Bookings',
  '/trips': 'Trip management',
  '/maintenance': 'Maintenance',
  '/fuel': 'Fuel logs',
  '/gps': 'Live tracking',
  '/performance': 'Performance',
  '/incidents': 'Incidents',
  '/compliance': 'Compliance & safety',
}

const roleLabel = (user) => {
  if (!user) return 'User'
  if (user.role === 'admin' || user.username === 'masai') return 'Fleet Manager'
  return user.role || 'Administrator'
}

const Layout = ({ children }) => {
  const location = useLocation()
  const { logout, user } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [navCounts, setNavCounts] = useState({ fleet: null, drivers: null, bookings: null })

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('#admin-notif')) setNotifOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .getDashboardStats()
      .then((d) => {
        if (cancelled || !d?.stats) return
        setNavCounts({
          fleet: d.stats.totalVehicles,
          drivers: d.stats.totalDrivers,
          bookings: d.stats.pendingBookings,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const menuItems = useMemo(
    () => [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, section: 'overview' },
      { path: '/dashboard', label: 'Reports & analytics', icon: BarChart3, section: 'overview' },
      {
        path: '/vehicles',
        label: 'Fleet vehicles',
        icon: Car,
        section: 'overview',
        badge: 'fleet',
      },
      { path: '/drivers', label: 'Drivers', icon: Users, section: 'overview', badge: 'drivers' },
      {
        path: '/booking',
        label: 'Bookings',
        icon: Calendar,
        section: 'overview',
        badge: 'bookings',
      },
      { path: '/gps', label: 'Live tracking', icon: Navigation, section: 'operations' },
      { path: '/fuel', label: 'Fuel logs', icon: Fuel, section: 'operations' },
      { path: '/maintenance', label: 'Maintenance', icon: Wrench, section: 'operations' },
      { path: '/trips', label: 'Trip reports', icon: User, section: 'operations' },
      { path: '/performance', label: 'Performance', icon: Activity, section: 'operations' },
      { path: '/users', label: 'User management', icon: UserCog, section: 'administration' },
      { path: '/incidents', label: 'Incidents', icon: AlertTriangle, section: 'administration' },
      { path: '/compliance', label: 'Compliance & safety', icon: Shield, section: 'administration' },
    ],
    []
  )

  const menuSections = useMemo(
    () => [
      { name: 'Overview', key: 'overview' },
      { name: 'Operations', key: 'operations' },
      { name: 'Administration', key: 'administration' },
    ],
    []
  )

  const pageTitle = useMemo(() => {
    return ROUTE_TITLES[location.pathname] || 'UCU Fleet'
  }, [location.pathname])

  const isActive = (path) => location.pathname === path

  const badgeValue = (key) => {
    if (!key || navCounts[key] == null) return null
    const n = navCounts[key]
    return n > 99 ? '99+' : String(n)
  }

  const navBtnClass = (active) => {
    const base =
      'flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 text-sm font-medium border border-transparent'
    if (active) {
      if (isDarkMode) {
        return `${base} fms-shell-nav-active`
      }
      return `${base} bg-[var(--color-primary)] text-white shadow-md`
    }
    return `${base} text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white`
  }

  const initials = (user?.name || user?.username || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-[var(--bg-base)] transition-colors duration-150">
      <aside
        className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'} flex flex-col overflow-y-auto custom-scroll shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0a0e14] transition-all duration-200 ease-out`}
      >
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-ucu-gold-500 to-ucu-gold-700 flex items-center justify-center shrink-0 fms-shell-brand-glow">
              <Car size={20} className="text-slate-900" strokeWidth={2} />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-display font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    UCU Fleet
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shrink-0">
                    System online
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">Fleet operations</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3">
          {menuSections.map((section) => (
            <div key={section.key} className="mb-5">
              {!sidebarCollapsed && (
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 px-3">
                  {section.name}
                </h3>
              )}
              {menuItems
                .filter((item) => item.section === section.key)
                .map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  const bv = item.badge ? badgeValue(item.badge) : null
                  const isBookings = item.badge === 'bookings'
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onMouseEnter={() => prefetchRoute(item.path)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`${navBtnClass(active)} ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon size={20} strokeWidth={2} className="shrink-0 opacity-90" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {bv != null && (
                            <span
                              className={`shrink-0 min-w-[1.35rem] h-6 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                                isBookings && Number(bv) > 0
                                  ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/35'
                                  : 'bg-ucu-gold-500/15 text-ucu-gold-200 ring-1 ring-ucu-gold-500/25'
                              }`}
                            >
                              {bv}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          {!sidebarCollapsed && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 p-3 mb-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ucu-gold-500 to-amber-700 flex items-center justify-center text-slate-900 text-xs font-bold font-display">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {user?.name || user?.username || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{roleLabel(user)}</p>
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all text-sm font-medium"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <><ChevronLeft size={20} /><span>Collapse</span></>}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-amber-50/80 dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 transition-all text-sm font-medium border border-transparent hover:border-amber-200/60 dark:hover:border-amber-500/25`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!sidebarCollapsed && <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>}
          </button>
          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-sm font-medium`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-base)] relative">
        <div className="absolute inset-0 bg-mesh-gradient dark:bg-mesh-dark pointer-events-none opacity-80 dark:opacity-35" />

        <header className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[rgba(12,16,24,0.92)] backdrop-blur-md">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight capitalize">
              {pageTitle}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="text-ucu-gold-600 dark:text-ucu-gold-400 font-medium">UCU Fleet</span>
              <span className="mx-1.5 text-slate-400">/</span>
              <span className="text-slate-600 dark:text-slate-300">{pageTitle}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <NotificationMenu
              id="admin-notif"
              notifOpen={notifOpen}
              setNotifOpen={setNotifOpen}
              unreadCount={unreadCount}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              notifications={notifications}
              role="admin"
              variant="shell"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scroll relative dark:bg-[#0b0e14]">
          <div className="p-6 lg:p-8">{children}</div>
          <footer className="relative bg-[var(--bg-surface)] dark:bg-slate-900/40 backdrop-blur-sm border-t border-[var(--border-default)] dark:border-slate-800/80 px-6 py-4 flex justify-between items-center mt-6">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              © {new Date().getFullYear()} UCU Fleet Management. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-ucu-gold-500" />
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default Layout
