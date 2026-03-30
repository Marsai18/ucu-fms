import React, { useMemo } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { MapPin, User, Car, Calendar, CheckCircle2, XCircle } from 'lucide-react'

const formatDateTime = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString()
}

const GatePassCard = ({ gatePass, size = 170 }) => {
  const scanUrl = useMemo(() => {
    if (!gatePass?.token) return null
    return `${window.location.origin}/gatepass/scan/${gatePass.token}`
  }, [gatePass?.token])

  const used = !!gatePass?.usedAt
  const StatusIcon = used ? XCircle : CheckCircle2

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-5">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gate Pass</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {gatePass?.trip?.tripCode || gatePass?.trip?.label || `Trip ${gatePass?.tripId}`}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2">
            <MapPin size={16} className="text-ucu-blue-500" />
            {gatePass?.trip?.origin || '—'} → {gatePass?.trip?.destination || '—'}
          </p>

          <div
            className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${
              used
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60'
                : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
            }`}
          >
            <StatusIcon size={16} />
            {used ? `Used: ${formatDateTime(gatePass.usedAt)}` : 'Not used yet'}
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-center">
          {scanUrl ? (
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <QRCodeCanvas value={scanUrl} size={size} />
            </div>
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400">No QR token</div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Driver</p>
          <p className="mt-2 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <User size={18} className="text-ucu-blue-500" />
            {gatePass?.driver?.name || '—'}
          </p>
          {gatePass?.driver?.phone ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Phone: {gatePass.driver.phone}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Client on board</p>
          <p className="mt-2 font-semibold text-slate-900 dark:text-white">
            {gatePass?.client?.name || gatePass?.client?.username || '—'}
          </p>
          {gatePass?.client?.email ? (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Email: {gatePass.client.email}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4 sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Route / Trip details</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 items-center text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-2">
              <Car size={16} className="text-ucu-blue-500" />{' '}
              {gatePass?.route?.distanceKm != null ? `${gatePass.route.distanceKm} km` : 'Distance: —'}
              {gatePass?.route?.durationMin != null ? ` • ~${gatePass.route.durationMin} min` : ''}
            </p>
            {gatePass?.route?.waypoints ? (
              <p>
                Via: <span className="font-medium text-slate-800 dark:text-slate-200">{gatePass.route.waypoints}</span>
              </p>
            ) : null}
            <p className="flex items-center gap-2 ml-auto">
              <Calendar size={16} className="text-ucu-blue-500" /> Issued: {formatDateTime(gatePass?.issuedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GatePassCard

