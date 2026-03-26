import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Car,
  AlertTriangle,
  Wrench,
  Calendar,
  MapPin,
  User,
  Phone,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from 'lucide-react'

const getNotificationConfig = (n, role) => {
  const type = (n.type || '').toLowerCase()
  const configs = {
    // Admin
    admin: {
      new_booking: { path: '/booking', icon: Calendar, color: 'ucu-blue', label: 'View requests' },
      booking_for_admin: { path: '/booking', icon: Calendar, color: 'ucu-blue', label: 'Assign driver' },
      incident_reported: { path: '/incidents', icon: AlertTriangle, color: 'rose', label: 'View & respond' },
      incident_report: { path: '/incidents', icon: AlertTriangle, color: 'rose', label: 'View & respond' },
      incident_admin_response: { path: '/incidents', icon: AlertTriangle, color: 'rose', label: 'View incident' },
      maintenance_alert: { path: '/maintenance', icon: Wrench, color: 'amber', label: 'View maintenance' },
      trip_assigned: { path: '/trips', icon: MapPin, color: 'emerald', label: 'View trips' },
      trip_declined: { path: '/trips', icon: MapPin, color: 'amber', label: 'View trips' },
      trip_accepted: { path: '/trips', icon: MapPin, color: 'emerald', label: 'View trips' },
      trip_report_submitted: { path: '/trips', icon: FileText, color: 'emerald', label: 'View report' },
      driver_assignment_feedback: { path: '/trips', icon: User, color: 'ucu-blue', label: 'View feedback' },
      fuel_logged: { path: '/fuel', icon: Car, color: 'slate', label: 'View fuel logs' },
      vehicle_registered: { path: '/vehicles', icon: Car, color: 'emerald', label: 'View vehicles' }
    },
    client: {
      booking_rejected: { path: '/client/history', icon: XCircle, color: 'rose', label: 'View history' },
      booking_hod_approved: { path: '/client/history', icon: CheckCircle2, color: 'ucu-blue', label: 'View status' },
      booking_confirmed: { path: '/client/history', icon: CheckCircle2, color: 'emerald', label: 'View details' },
      new_booking: { path: '/client/history', icon: Calendar, color: 'ucu-blue', label: 'View requests' }
    },
    driver: {
      trip_assigned: { path: '/driver/trips', icon: MapPin, color: 'emerald', label: 'View trips' },
      incident_admin_response: { path: '/driver/incidents', icon: AlertTriangle, color: 'ucu-blue', label: 'View response' }
    },
    hod: {
      new_booking: { path: '/hod/requests', icon: Calendar, color: 'ucu-blue', label: 'Review requests' },
      booking_for_admin: { path: '/hod/requests', icon: Calendar, color: 'ucu-blue', label: 'View requests' }
    }
  }
  const roleConfig = configs[role] || configs.admin
  return roleConfig[type] || { icon: Bell, color: 'slate', label: null }
}

const colorStyles = {
  'ucu-blue': 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 border-ucu-blue-200 dark:border-ucu-blue-500/30',
  rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
  amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  slate: 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'
}

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onClose,
  role = 'admin',
  variant = 'dropdown' // 'dropdown' | 'card'
}) {
  const navigate = useNavigate()
  const config = getNotificationConfig(notification, role)
  const Icon = config.icon
  const colorClass = colorStyles[config.color] || colorStyles.slate
  const isUnread = !notification.read

  const handleClick = () => {
    onMarkRead(notification.id)
    onClose?.()
    if (config.path) {
      navigate(config.path)
    }
  }

  const baseClasses = variant === 'card'
    ? `p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.99] ${
        isUnread
          ? 'border-ucu-blue-200/80 dark:border-ucu-blue-500/30 bg-ucu-blue-50/50 dark:bg-ucu-blue-500/10'
          : 'border-slate-200/80 dark:border-slate-600/50 bg-slate-50/50 dark:bg-slate-700/30'
      }`
    : `p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
        isUnread ? 'bg-sky-50/50 dark:bg-sky-500/10' : ''
      } border-l-4 border-l-transparent ${
        config.color === 'rose' ? 'border-l-rose-500' : config.color === 'amber' ? 'border-l-amber-500' : ''
      }`

  return (
    <div
      onClick={handleClick}
      className={`${baseClasses} group`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`${notification.title} - ${config.label || 'View'}`}
    >
      <div className="flex gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-slate-900 dark:text-white ${isUnread ? '' : 'font-medium'}`}>
              {notification.title}
            </p>
            {isUnread && (
              <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-ucu-blue-500 mt-1.5" aria-hidden />
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          {(notification.driverName || notification.driverPhone || notification.vehicleDetails) && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-600/50 space-y-1.5">
              {notification.driverName && (
                <p className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <User size={14} className="text-ucu-blue-500 shrink-0" />
                  <strong>Driver:</strong> {notification.driverName}
                </p>
              )}
              {notification.driverPhone && (
                <p className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Phone size={14} className="text-ucu-blue-500 shrink-0" />
                  <strong>Contact:</strong> {notification.driverPhone}
                </p>
              )}
              {notification.vehicleDetails && (
                <p className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Car size={14} className="text-ucu-blue-500 shrink-0" />
                  <strong>Vehicle:</strong> {notification.vehicleDetails}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Clock size={12} />
              {formatTimeAgo(notification.createdAt)}
            </span>
            {config.label && (
              <span className="text-xs font-medium text-ucu-blue-600 dark:text-ucu-blue-400 flex items-center gap-0.5 group-hover:gap-1 transition-all">
                {config.label}
                <ChevronRight size={14} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
