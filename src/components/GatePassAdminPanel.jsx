import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import GatePassCard from './GatePassCard'
import { Calendar, KeyRound, RefreshCcw, Truck } from 'lucide-react'

const GatePassAdminPanel = () => {
  const [trips, setTrips] = useState([])
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [selectedTripId, setSelectedTripId] = useState('')
  const [gatePass, setGatePass] = useState(null)
  const [generating, setGenerating] = useState(false)

  const eligibleTrips = useMemo(() => {
    return (trips || []).filter((t) => {
      const s = (t.status || '').toLowerCase().replace('_', ' ')
      return (s === 'pending' || s === 'in progress') && t.driverId != null && t.driverId !== ''
    })
  }, [trips])

  const fetchTrips = useCallback(async () => {
    try {
      setLoadingTrips(true)
      const res = await api.getTrips()
      setTrips(Array.isArray(res) ? res : [])
    } catch (e) {
      toast.error(e.message || 'Failed to load trips')
      setTrips([])
    } finally {
      setLoadingTrips(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  useEffect(() => {
    if (eligibleTrips.length && !selectedTripId) {
      setSelectedTripId(String(eligibleTrips[0].id))
    }
  }, [eligibleTrips, selectedTripId])

  useEffect(() => {
    setGatePass(null)
  }, [selectedTripId])

  const selectedTrip = useMemo(() => {
    return eligibleTrips.find((t) => String(t.id) === String(selectedTripId)) || null
  }, [eligibleTrips, selectedTripId])

  const handleGenerate = async () => {
    if (!selectedTripId) {
      toast.error('Select a trip first')
      return
    }
    setGenerating(true)
    try {
      const res = await api.createGatePass(selectedTripId)
      setGatePass(res)
      toast.success('Gate pass ready')
    } catch (e) {
      toast.error(e.message || 'Failed to generate gate pass')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-ucu-blue-200 dark:border-ucu-blue-700 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <KeyRound size={22} className="text-ucu-blue-500" /> Gate Pass
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate a one-time QR token for the selected in-progress trip. The token becomes unusable after first scan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[260px]">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Trip (assigned)
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 py-2 px-3 text-sm"
              disabled={loadingTrips || eligibleTrips.length === 0}
            >
              {eligibleTrips.length === 0 ? (
                <option value="">No in-progress trips found</option>
              ) : (
                eligibleTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tripCode || `TR-${t.id}`} • {t.destination || '—'}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || loadingTrips || !selectedTripId}
            className="px-5 py-2.5 rounded-lg bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {generating ? <RefreshCcw size={18} className="animate-spin" /> : <Truck size={18} />}
            {generating ? 'Generating…' : 'Generate Gate Pass'}
          </button>
        </div>
      </div>

      {loadingTrips ? (
        <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Loading trips…
        </div>
      ) : eligibleTrips.length === 0 ? (
        <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          No trips eligible for gate passes right now.
        </div>
      ) : (
        <div className="mt-6">
          {selectedTrip && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Selected: <span className="font-semibold">{selectedTrip.tripCode || `TR-${selectedTrip.id}`}</span> • {selectedTrip.origin || '—'} → {selectedTrip.destination || '—'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar size={14} /> {selectedTrip.scheduledDeparture || selectedTrip.departureTime ? new Date(selectedTrip.scheduledDeparture || selectedTrip.departureTime).toLocaleString() : 'Time pending'}
              </p>
            </div>
          )}
          {gatePass ? <GatePassCard gatePass={gatePass} /> : <div className="text-sm text-slate-500 dark:text-slate-400 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600">Generate a gate pass to see the QR and trip/client details.</div>}
        </div>
      )}
    </div>
  )
}

export default GatePassAdminPanel

