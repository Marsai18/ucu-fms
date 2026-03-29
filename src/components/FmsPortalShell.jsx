import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Car, Sun, Moon, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import NotificationMenu from './NotificationMenu'

const navBtnClass = (active, isDarkMode) => {
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

/**
 * Shared chrome for client / driver / HOD portals — matches admin shell visuals.
 * All navigation and logout behavior come from props / callers (flows unchanged).
 */
export default function FmsPortalShell({
  children,
  menuItems,
  navSectionLabel = 'Navigation',
  routeTitles = {},
  defaultPageTitle = 'Portal',
  notifId,
  notifRole,
  portalTagline,
  userRoleLabel,
  onLogout,
  fontClassName = '',
}) {
  const location = useLocation()
  const { user } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(`#${notifId}`)) setNotifOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [notifId])

  const pageTitle = useMemo(() => {
    return routeTitles[location.pathname] || defaultPageTitle
  }, [location.pathname, routeTitles, defaultPageTitle])

  const initials = (user?.name || user?.username || user?.email || 'U').slice(0, 2).toUpperCase()

  const isActive = (path) => location.pathname === path

  return (
    <div className={`flex h-screen bg-[var(--bg-base)] transition-colors duration-150 ${fontClassName}`}>
      <aside className="w-[260px] flex flex-col overflow-y-auto custom-scroll shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0a0e14]">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-ucu-gold-500 to-ucu-gold-700 flex items-center justify-center shrink-0 fms-shell-brand-glow">
              <Car size={20} className="text-slate-900" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-display font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  UCU Fleet
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shrink-0">
                  System online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5 truncate">{portalTagline}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 px-3">
            {navSectionLabel}
          </h3>
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link key={item.path} to={item.path} className={navBtnClass(active, isDarkMode)}>
                <Icon size={20} strokeWidth={2} className="shrink-0 opacity-90" />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 p-3 mb-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ucu-gold-500 to-amber-700 flex items-center justify-center text-slate-900 text-xs font-bold font-display">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name || user?.username || user?.email || 'User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{userRoleLabel}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-amber-50/80 dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 transition-all text-sm font-medium border border-transparent hover:border-amber-200/60 dark:hover:border-amber-500/25"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-sm font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-base)] relative">
        <div className="absolute inset-0 bg-mesh-gradient dark:bg-mesh-dark pointer-events-none opacity-80 dark:opacity-35" />

        <header className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[rgba(12,16,24,0.92)] backdrop-blur-md">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
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
              id={notifId}
              notifOpen={notifOpen}
              setNotifOpen={setNotifOpen}
              unreadCount={unreadCount}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              notifications={notifications}
              role={notifRole}
              variant="shell"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scroll relative dark:bg-[#0b0e14]">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
