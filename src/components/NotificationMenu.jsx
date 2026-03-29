import React from 'react'
import { Bell } from 'lucide-react'
import NotificationItem from './NotificationItem'

/**
 * Shared bell + dropdown panel (visual only; behavior unchanged).
 * `variant`: admin | client | hod | driver — subtle accent tweaks.
 */
export default function NotificationMenu({
  id,
  notifOpen,
  setNotifOpen,
  unreadCount,
  markAsRead,
  markAllAsRead,
  notifications,
  role,
  bellButtonClassName = '',
  variant = 'default' // 'default' | 'shell' — shell adds gold dot when unread (benchmark)
}) {
  const accent =
    role === 'client'
      ? 'hover:bg-amber-100/80 dark:hover:bg-amber-500/15 focus-visible:ring-amber-400/40'
      : role === 'hod'
        ? 'hover:bg-amber-100/80 dark:hover:bg-amber-500/15 focus-visible:ring-amber-400/40'
        : role === 'driver'
          ? 'hover:bg-sky-100/80 dark:hover:bg-sky-500/15 focus-visible:ring-sky-400/40'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700/80 focus-visible:ring-[var(--color-primary)]/35'

  return (
    <div id={id} className="relative">
      <button
        type="button"
        onClick={() => setNotifOpen(!notifOpen)}
        className={`fms-notif-bell relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] dark:focus-visible:ring-offset-slate-800 ${accent} ${bellButtonClassName}`}
        aria-expanded={notifOpen}
        aria-haspopup="true"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Bell size={22} strokeWidth={2} className="relative z-10" />
        {unreadCount > 0 && variant === 'shell' && (
          <>
            <span
              className="absolute top-1.5 right-2 z-[1] h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)] ring-2 ring-slate-900 dark:ring-slate-950"
              aria-hidden
            />
            <span className="absolute -top-0.5 -right-0.5 z-[2] min-w-[1.25rem] h-5 px-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-800">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
        {unreadCount > 0 && variant !== 'shell' && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {notifOpen && (
        <div
          className="fms-notif-panel absolute right-0 mt-3 w-[min(100vw-1.5rem,24rem)] z-50 max-h-[min(28rem,70vh)] overflow-hidden flex flex-col animate-fade-in"
          role="dialog"
          aria-label="Notifications list"
        >
          <div className="fms-notif-panel__head shrink-0 px-4 py-3.5 flex justify-between items-center gap-3 border-b border-slate-200/90 dark:border-slate-600/80 bg-gradient-to-r from-slate-50/95 to-white dark:from-slate-800/98 dark:to-slate-800/95 backdrop-blur-md">
            <div>
              <span className="font-display font-semibold text-slate-900 dark:text-white text-sm tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  markAllAsRead()
                  setNotifOpen(false)
                }}
                className="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scroll divide-y divide-slate-100/90 dark:divide-slate-700/80 bg-white/98 dark:bg-slate-800/95">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mb-3">
                  <Bell size={24} className="text-slate-300 dark:text-slate-500" strokeWidth={1.75} />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">You&apos;re all caught up</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markAsRead}
                  onClose={() => setNotifOpen(false)}
                  role={role}
                  variant="dropdown"
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
