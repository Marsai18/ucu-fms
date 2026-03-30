import React, { useEffect, useMemo, useState } from 'react'
import { MapPin, Calendar, User, Navigation2, Clock, FileText, AlertCircle, Download, Car, Fuel, History, Search, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const statusStyles = {
  'In_Progress': 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400',
  'In Progress': 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400',
  Pending: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
  Completed: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  Cancelled: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
}
const displayStatus = (s) => s === 'In_Progress' ? 'In Progress' : s

const TripManagement = () => {
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [startOdometer, setStartOdometer] = useState('')
  const [endOdometer, setEndOdometer] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [historyModal, setHistoryModal] = useState(null) // { trip, loading }
  const [historyData, setHistoryData] = useState(null)
  const [tripHistorySearch, setTripHistorySearch] = useState('')
  const [copiedTripId, setCopiedTripId] = useState(null)

  const fetchTrips = React.useCallback(async () => {
    try {
      const response = await api.getTrips()
      const parsedTrips = Array.isArray(response) ? response : []
      setTrips(parsedTrips)
      setSelectedTripId(prev => {
        if (!prev && parsedTrips.length) return parsedTrips[0].id
        return prev
      })
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Could not load trips')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchTrips()
  }, [fetchTrips])

  // Live refresh when there are in-progress trips (every 15 seconds)
  const hasInProgress = useMemo(() => trips.some(t => (t.status === 'In_Progress' || t.status === 'In Progress')), [trips])
  useEffect(() => {
    if (!hasInProgress) return
    const interval = setInterval(fetchTrips, 15000)
    return () => clearInterval(interval)
  }, [hasInProgress, fetchTrips])

  const selectedTrip = useMemo(() => {
    return trips.find(trip => trip.id === selectedTripId) || null
  }, [selectedTripId, trips])

  useEffect(() => {
    if (selectedTrip) {
      setStartOdometer(selectedTrip.startOdometer?.toString() || '')
      setEndOdometer(selectedTrip.endOdometer?.toString() || '')
      setNotes(selectedTrip.driverNotes || '')
    }
  }, [selectedTrip])

  const setActiveTrip = (tripId) => {
    setSelectedTripId(tripId)
  }

  const handleTripUpdate = async (tripId, updates, successMessage) => {
    if (!tripId) return
    try {
      setSaving(true)
      const updated = await api.updateTrip(tripId, updates)
      setTrips(prev => prev.map(trip => trip.id === updated.id ? updated : trip))
      toast.success(successMessage)
    } catch (error) {
      toast.error(error.message || 'Failed to update trip')
    } finally {
      setSaving(false)
    }
  }

  const handleStartTrip = () => {
    if (!selectedTrip) return
    handleTripUpdate(
      selectedTrip.id,
      { status: 'In_Progress', actualDeparture: new Date().toISOString() },
      'Trip started'
    )
  }

  const handleCompleteTrip = () => {
    if (!selectedTrip) return
    if (!endOdometer) {
      toast.error('Please capture end odometer reading first')
      return
    }
    handleTripUpdate(
      selectedTrip.id,
      { status: 'Completed', actualArrival: new Date().toISOString(), endOdometer: Number(endOdometer), driverNotes: notes },
      'Trip completed'
    )
  }

  const handleCancelTrip = () => {
    if (!selectedTrip) return
    handleTripUpdate(selectedTrip.id, { status: 'Cancelled' }, 'Trip cancelled')
  }

  const handleStartOdometerUpdate = () => {
    if (!selectedTrip) return
    if (!startOdometer) {
      toast.error('Start odometer is required')
      return
    }
    handleTripUpdate(selectedTrip.id, { startOdometer: Number(startOdometer) }, 'Start odometer updated')
  }

  const handleEndOdometerUpdate = () => {
    if (!selectedTrip) return
    if (!endOdometer) {
      toast.error('End odometer is required')
      return
    }
    if (startOdometer && Number(endOdometer) < Number(startOdometer)) {
      toast.error('End odometer must be greater than start odometer')
      return
    }
    handleTripUpdate(selectedTrip.id, { endOdometer: Number(endOdometer) }, 'End odometer updated')
  }

  const handleNotesUpdate = () => {
    if (!selectedTrip) return
    handleTripUpdate(selectedTrip.id, { driverNotes: notes }, 'Driver notes saved')
  }

  const handleQuickAction = (trip, action) => {
    if (action === 'start') {
      handleTripUpdate(trip.id, { status: 'In_Progress', actualDeparture: new Date().toISOString() }, `Trip ${trip.tripCode || trip.id} started`)
    }
    if (action === 'complete') {
      if (!trip.endOdometer) {
        toast.error('Update end odometer before completing the trip')
        return
      }
      handleTripUpdate(trip.id, { status: 'Completed', actualArrival: new Date().toISOString() }, `Trip ${trip.tripCode || trip.id} completed`)
    }
    if (action === 'cancel') {
      handleTripUpdate(trip.id, { status: 'Cancelled' }, `Trip ${trip.tripCode || trip.id} cancelled`)
    }
  }

  const distanceTraveled = useMemo(() => {
    if (!startOdometer || !endOdometer) return 'N/A'
    return Number(endOdometer) - Number(startOdometer)
  }, [startOdometer, endOdometer])

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => new Date(b.departureTime || b.scheduledDeparture || b.createdAt || 0) - new Date(a.departureTime || a.scheduledDeparture || a.createdAt || 0))
  }, [trips])

  const filteredHistoryTrips = useMemo(() => {
    const q = (tripHistorySearch || '').trim().toLowerCase()
    if (!q) return sortedTrips
    return sortedTrips.filter((t) => {
      const tripId = String(t.tripCode || t.id || '').toLowerCase()
      const rawId = String(t.id || '').toLowerCase()
      return tripId.includes(q) || rawId.includes(q)
    })
  }, [sortedTrips, tripHistorySearch])

  const copyTripId = (tripId, e) => {
    e?.stopPropagation?.()
    const text = tripId
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedTripId(text)
      toast.success('Trip ID copied to clipboard')
      setTimeout(() => setCopiedTripId(null), 2000)
    }).catch(() => toast.error('Could not copy'))
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold text-ucu-blue-600 dark:text-ucu-blue-400 uppercase tracking-widest">Operations</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mt-1 tracking-tight">Trip Management for Drivers</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Monitor live trips, update odometer readings, and keep accurate driver notes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Assigned Trips */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu">
          <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Assigned Trips</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tap to view trip details</p>
              </div>
              {hasInProgress && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold animate-pulse">
                  Live
                </span>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[680px] overflow-y-auto custom-scroll">
            {trips.map((trip) => {
              const statusClass = statusStyles[trip.status] || 'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400'
              const active = selectedTripId === trip.id
              return (
                <button
                  key={trip.id}
                  onClick={() => setActiveTrip(trip.id)}
                  className={`w-full text-left rounded-xl border px-4 py-4 transition-all ${
                    active ? 'border-ucu-blue-500 bg-ucu-blue-50 dark:bg-ucu-blue-500/20 shadow-ucu' : 'border-slate-200 dark:border-slate-600 hover:border-ucu-blue-300 dark:hover:border-ucu-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{trip.tripCode || trip.id}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                      {displayStatus(trip.status)}
                    </span>
                  </div>
                  {trip.driverNotes && trip.driverNotes.startsWith('Declined:') && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mb-1 line-clamp-2" title={trip.driverNotes}>
                      {trip.driverNotes}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2 mb-1">
                    <MapPin size={16} className="text-ucu-blue-500" />
                    <span className="line-clamp-1">{trip.destination || trip.dropoffLocation || 'Destination TBD'}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2">
                    <Calendar size={16} className="text-ucu-blue-500" />
                    <span>{formatDate(trip.scheduledDeparture || trip.departureTime)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {trip.status === 'Pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickAction(trip, 'start')
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 hover:bg-ucu-blue-200 dark:hover:bg-ucu-blue-500/30"
                      >
                        Start
                      </button>
                    )}
                    {trip.status === 'In_Progress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickAction(trip, 'complete')
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30"
                      >
                        Complete
                      </button>
                    )}
                    {!['Completed', 'Cancelled'].includes(trip.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickAction(trip, 'cancel')
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </button>
              )
            })}

            {!trips.length && (
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                No trips available yet. Create one from the admin dashboard.
              </div>
            )}
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          {selectedTrip ? (
            <>
              <div className="flex flex-wrap items-center gap-3 justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedTrip.tripCode || selectedTrip.id}</h2>
                  <p className="text-gray-500">{selectedTrip.destination || selectedTrip.dropoffLocation} • {selectedTrip.driverName || selectedTrip.driverId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[selectedTrip.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {displayStatus(selectedTrip.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={handleStartTrip}
                  disabled={selectedTrip.status !== 'Pending' || saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-ucu-gradient text-white shadow-ucu disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-ucu-lg transition-all"
                >
                  Start Trip
                </button>
                <button
                  onClick={handleCompleteTrip}
                  disabled={selectedTrip.status !== 'In_Progress' || saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-ucu-gold-100 dark:bg-ucu-gold-500/20 text-ucu-gold-700 dark:text-ucu-gold-400 hover:bg-ucu-gold-200 dark:hover:bg-ucu-gold-500/30 disabled:opacity-40 transition-all"
                >
                  Complete Trip
                </button>
                <button
                  onClick={handleCancelTrip}
                  disabled={['Completed', 'Cancelled'].includes(selectedTrip.status) || saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                >
                  Cancel Trip
                </button>
              </div>

              <section className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Odometer Readings (km)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm text-gray-600 mb-2">Start Odometer</label>
                    <input
                      type="number"
                      value={startOdometer}
                      onChange={(e) => setStartOdometer(e.target.value)}
                      className="w-full rounded-lg border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                      placeholder="Enter reading"
                    />
                    <button
                      onClick={handleStartOdometerUpdate}
                      disabled={selectedTrip.status === 'Completed' || saving}
                      className="mt-3 w-full rounded-lg bg-ucu-gold-100 dark:bg-ucu-gold-500/20 text-ucu-gold-700 dark:text-ucu-gold-400 py-2 text-sm font-semibold hover:bg-ucu-gold-200 dark:hover:bg-ucu-gold-500/30 disabled:opacity-40 transition-all"
                    >
                      Update
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm text-gray-600 mb-2">End Odometer</label>
                    <input
                      type="number"
                      value={endOdometer}
                      onChange={(e) => setEndOdometer(e.target.value)}
                      className="w-full rounded-lg border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                      placeholder="Enter reading"
                    />
                    <button
                      onClick={handleEndOdometerUpdate}
                      disabled={selectedTrip.status !== 'In_Progress' || saving}
                      className="mt-3 w-full rounded-lg bg-ucu-gradient text-white py-2 text-sm font-semibold shadow-ucu hover:shadow-ucu-lg disabled:opacity-40 transition-all"
                    >
                      Update
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  Distance Traveled: <span className="font-semibold text-gray-900">{distanceTraveled}</span>{distanceTraveled !== 'N/A' && ' km'}
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps & Locations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 flex items-center gap-2 mb-1">
                      <Clock size={16} className="text-primary-500" />
                      Departure Time
                    </p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedTrip.departureTime || selectedTrip.scheduledDeparture)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 flex items-center gap-2 mb-1">
                      <Clock size={16} className="text-primary-500" />
                      Arrival Time
                    </p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedTrip.actualArrival)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 flex items-center gap-2 mb-1">
                      <Navigation2 size={16} className="text-primary-500" />
                      Origin
                    </p>
                    <p className="font-semibold text-gray-900">{selectedTrip.origin || selectedTrip.pickupLocation || 'Unknown'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-gray-500 flex items-center gap-2 mb-1">
                      <Navigation2 size={16} className="text-primary-500 rotate-180" />
                      Destination
                    </p>
                    <p className="font-semibold text-gray-900">{selectedTrip.destination || selectedTrip.dropoffLocation || 'Unknown'}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Notes</h3>
                <textarea
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  placeholder="Capture observations, incidents, or handover notes..."
                />
                <button
                  onClick={handleNotesUpdate}
                  disabled={saving}
                  className="mt-3 px-5 py-2 rounded-lg bg-ucu-gradient text-white text-sm font-semibold shadow-ucu hover:shadow-ucu-lg disabled:opacity-40 transition-all"
                >
                  Save Notes
                </button>
              </section>

              <section className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Feedback</h3>
                {selectedTrip.driverNotes && selectedTrip.driverNotes.startsWith('Declined:') ? (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 flex items-start gap-3">
                    <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-rose-800 dark:text-rose-400">Driver declined this trip</p>
                      <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">{selectedTrip.driverNotes.replace('Declined: ', '')}</p>
                    </div>
                  </div>
                ) : selectedTrip.driverNotes ? (
                  <div className="mt-3 p-3 rounded-lg bg-ucu-blue-50 dark:bg-ucu-blue-900/20 border border-ucu-blue-200 dark:border-ucu-blue-700">
                    <p className="text-xs font-semibold text-ucu-blue-700 dark:text-ucu-blue-400">Driver notes</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedTrip.driverNotes}</p>
                  </div>
                ) : selectedTrip.status === 'Pending' ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">Awaiting driver response</p>
                ) : null}
              </section>

            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a trip to view details.
            </div>
          )}
        </div>
      </div>

      {/* Trip History */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <History size={24} className="text-ucu-blue-500" />
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Trip History</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Search by Trip ID • Click ID to view details • Copy ID to clipboard</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tripHistorySearch}
                onChange={(e) => setTripHistorySearch(e.target.value)}
                placeholder="Search by Trip ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-ucu-blue-500/30 focus:border-ucu-blue-500"
              />
            </div>
            {tripHistorySearch.trim() && (
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {filteredHistoryTrips.length} result{filteredHistoryTrips.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-700/30">
                <th className="text-left py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Trip ID</th>
                <th className="text-left py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Route</th>
                <th className="text-left py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Conducted</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistoryTrips.map((trip) => {
                const displayId = trip.tripCode || `TR-${trip.id}`
                const isCopied = copiedTripId === displayId
                return (
                  <tr
                    key={trip.id}
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            setHistoryModal({ tripId: trip.id, loading: true })
                            setHistoryData(null)
                            try {
                              const data = await api.getTripHistory(trip.id)
                              setHistoryData(data)
                              setHistoryModal(prev => prev ? { ...prev, loading: false } : null)
                            } catch (err) {
                              toast.error(err.message || 'Failed to load trip history')
                              setHistoryModal(null)
                            }
                          }}
                          className="font-semibold text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline text-left"
                        >
                          {displayId}
                        </button>
                        <button
                          onClick={(e) => copyTripId(displayId, e)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-ucu-blue-600 dark:hover:text-ucu-blue-400 transition-colors"
                          title="Copy Trip ID"
                        >
                          {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {(trip.origin || '—')} → {trip.destination || trip.dropoffLocation || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[trip.status] || 'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400'}`}>
                        {displayStatus(trip.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {formatDate(trip.departureTime || trip.scheduledDeparture)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!trips.length && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">No trips yet.</p>
        )}
        {trips.length > 0 && !filteredHistoryTrips.length && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">No trips match &quot;{tripHistorySearch}&quot;</p>
        )}
      </div>

      {/* Trip History Detail Modal */}
      {historyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setHistoryModal(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {historyModal.loading ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
                <p className="text-slate-500 dark:text-slate-400">Loading trip details...</p>
              </div>
            ) : historyData ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <History size={24} className="text-ucu-blue-500" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {historyData.tripCode || `TR-${historyData.id}`} — Trip Details
                    </h3>
                    <button
                      onClick={(e) => copyTripId(historyData.tripCode || `TR-${historyData.id}`, e)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-ucu-blue-600 dark:hover:text-ucu-blue-400 transition-colors"
                      title="Copy Trip ID"
                    >
                      {copiedTripId === (historyData.tripCode || `TR-${historyData.id}`) ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <button
                    onClick={() => setHistoryModal(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-6">
                  <section>
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Client</h4>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-700/30">
                      {historyData.client ? (
                        <div className="flex items-center gap-2">
                          <User size={18} className="text-ucu-blue-500" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{historyData.client.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{historyData.client.email || historyData.client.username}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400">No client linked</p>
                      )}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Vehicle</h4>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-700/30">
                      {historyData.vehicle ? (
                        <div className="flex items-center gap-2">
                          <Car size={18} className="text-ucu-blue-500" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{historyData.vehicle.plateNumber}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{historyData.vehicle.make} {historyData.vehicle.model}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400">No vehicle assigned</p>
                      )}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Driver</h4>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-700/30">
                      {historyData.driver ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{historyData.driver.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{historyData.driver.email}</p>
                        </div>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400">No driver assigned</p>
                      )}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">When Conducted</h4>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-700/30 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Departure</p>
                        <p className="font-medium text-slate-900 dark:text-white">{formatDate(historyData.departureTime || historyData.scheduledDeparture)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Arrival</p>
                        <p className="font-medium text-slate-900 dark:text-white">{formatDate(historyData.actualArrival)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Origin</p>
                        <p className="font-medium text-slate-900 dark:text-white">{historyData.origin || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Destination</p>
                        <p className="font-medium text-slate-900 dark:text-white">{historyData.destination || historyData.dropoffLocation || '—'}</p>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Fuel size={16} /> Fuel Logs (Driver&apos;s logs for this vehicle)
                    </h4>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                      {historyData.fuelLogs?.length > 0 ? (
                        <div className="divide-y divide-slate-200 dark:divide-slate-600 max-h-48 overflow-y-auto">
                          {historyData.fuelLogs.map((log) => (
                            <div key={log.id} className="p-4 flex justify-between items-center">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{log.quantity} L • UGX {(log.cost || 0).toLocaleString()}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(log.createdAt)}</p>
                              </div>
                              {log.distanceCovered != null && (
                                <span className="text-xs text-slate-600 dark:text-slate-400">{log.distanceCovered} km</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="p-4 text-slate-500 dark:text-slate-400 text-center">No fuel logs for this driver</p>
                      )}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <FileText size={16} /> Driver Notes
                    </h4>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-700/30">
                      {historyData.driverNotes ? (
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{historyData.driverNotes}</p>
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400">No driver notes</p>
                      )}
                    </div>
                  </section>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default TripManagement








