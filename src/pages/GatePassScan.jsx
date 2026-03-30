import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  QrCode,
  User,
  MapPin,
  Car,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'

const formatDateTime = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString()
}

const GatePassScan = () => {
  const { token } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null) // { valid, used, gatePass }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.scanGatePass(token)
        if (cancelled) return
        setData(res)
      } catch (e) {
        if (cancelled) return
        setError(e.message || 'Failed to validate gate pass')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token])

  const statusPill = useMemo(() => {
    const used = !!data?.used
    return used
      ? {
          label: 'Already used',
          cls: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
          Icon: XCircle,
        }
      : {
          label: 'Valid (scannable once)',
          cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
          Icon: CheckCircle2,
        }
  }, [data?.used])

  const gatePass = data?.gatePass

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-ucu-blue-50/30 dark:from-slate-950 dark:to-ucu-blue-950/10 p-4 flex items-start justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QrCode className="text-ucu-blue-500" size={20} />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Gate Pass Scan</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-sm font-semibold"
          >
            Back
          </button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-6">
            <p className="text-slate-600 dark:text-slate-300 font-medium">Validating gate pass…</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-rose-500 mt-0.5" size={22} />
              <div>
                <p className="font-bold text-rose-700 dark:text-rose-300">Invalid or missing gate pass</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : !gatePass ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">No gate pass data found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Trip</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {gatePass.trip?.tripCode || gatePass.trip?.label || `Trip ${gatePass.tripId}`}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2">
                  <MapPin size={16} className="text-ucu-blue-500" />
                  {gatePass.trip?.origin || '—'} → {gatePass.trip?.destination || '—'}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-2 ${statusPill.cls}`}>
                <statusPill.Icon size={16} />
                {statusPill.label}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Driver</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <User size={18} className="text-ucu-blue-500" />
                  {gatePass.driver?.name || '—'}
                </p>
                {gatePass.driver?.phone && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Phone: {gatePass.driver.phone}</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Client on board</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {gatePass.client?.name || gatePass.client?.username || '—'}
                </p>
                {gatePass.client?.email && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Email: {gatePass.client.email}</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Route / Trip details</p>
                <div className="mt-2 space-y-1.5">
                  <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Car size={16} className="text-ucu-blue-500" />
                    {gatePass.route?.distanceKm != null ? `${gatePass.route.distanceKm} km` : 'Distance: —'}
                    {gatePass.route?.durationMin != null ? ` • ~${gatePass.route.durationMin} min` : ''}
                  </p>
                  {gatePass.route?.waypoints ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Via: <span className="font-medium text-slate-800 dark:text-slate-200">{gatePass.route.waypoints}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gate status</p>
                <div className="mt-2 space-y-1.5">
                  <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Calendar size={16} className="text-ucu-blue-500" />
                    Issued: {formatDateTime(gatePass.issuedAt)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Calendar size={16} className="text-ucu-blue-500" />
                    {gatePass.usedAt ? `Used: ${formatDateTime(gatePass.usedAt)}` : 'Not used yet'}
                  </p>
                  {gatePass.passengers != null && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Passengers: <span className="font-semibold text-slate-800 dark:text-slate-200">{gatePass.passengers}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (!gatePass?.token) return
                  const url = `${window.location.origin}/gatepass/scan/${gatePass.token}`
                  navigator.clipboard
                    ?.writeText(url)
                    .then(() => toast.success('Scan link copied'))
                    .catch(() => toast.error('Could not copy link'))
                }}
                className="px-4 py-2 rounded-lg bg-ucu-blue-500 text-white font-semibold text-sm hover:bg-ucu-blue-600"
              >
                Copy Scan Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GatePassScan

