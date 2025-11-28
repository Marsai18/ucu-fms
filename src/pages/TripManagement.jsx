import React, { useEffect, useMemo, useState } from 'react'
import { MapPin, Calendar, User, Navigation2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const statusStyles = {
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-800 border-rose-200'
}

const TripManagement = () => {
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [startOdometer, setStartOdometer] = useState('')
  const [endOdometer, setEndOdometer] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await api.getTrips()
        const parsedTrips = Array.isArray(response) ? response : []
        setTrips(parsedTrips)
        if (parsedTrips.length) {
          setSelectedTripId(parsedTrips[0].id)
          setStartOdometer(parsedTrips[0].startOdometer?.toString() || '')
          setEndOdometer(parsedTrips[0].endOdometer?.toString() || '')
          setNotes(parsedTrips[0].driverNotes || '')
        }
      } catch (error) {
        console.error(error)
        toast.error(error.message || 'Could not load trips')
      } finally {
        setLoading(false)
      }
    }
    fetchTrips()
  }, [])

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
      { status: 'In Progress', departureTime: new Date().toISOString() },
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
      { status: 'Completed', arrivalTime: new Date().toISOString(), endOdometer: Number(endOdometer), driverNotes: notes },
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
      handleTripUpdate(trip.id, { status: 'In Progress', departureTime: new Date().toISOString() }, `Trip ${trip.tripCode || trip.id} started`)
    }
    if (action === 'complete') {
      if (!trip.endOdometer) {
        toast.error('Update end odometer before completing the trip')
        return
      }
      handleTripUpdate(trip.id, { status: 'Completed', arrivalTime: new Date().toISOString() }, `Trip ${trip.tripCode || trip.id} completed`)
    }
    if (action === 'cancel') {
      handleTripUpdate(trip.id, { status: 'Cancelled' }, `Trip ${trip.tripCode || trip.id} cancelled`)
    }
  }

  const distanceTraveled = useMemo(() => {
    if (!startOdometer || !endOdometer) return 'N/A'
    return Number(endOdometer) - Number(startOdometer)
  }, [startOdometer, endOdometer])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading trips...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Trip Management for Drivers</h1>
        <p className="text-gray-500 mt-1">Monitor live trips, update odometer readings, and keep accurate driver notes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Assigned Trips */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Assigned Trips</h2>
            <p className="text-sm text-gray-500 mt-1">Tap to view trip details</p>
          </div>
          <div className="p-4 space-y-3 max-h-[680px] overflow-y-auto custom-scroll">
            {trips.map((trip) => {
              const statusClass = statusStyles[trip.status] || 'bg-gray-100 text-gray-700 border-gray-200'
              const active = selectedTripId === trip.id
              return (
                <button
                  key={trip.id}
                  onClick={() => setActiveTrip(trip.id)}
                  className={`w-full text-left rounded-xl border px-4 py-4 transition-all ${
                    active ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{trip.tripCode || trip.id}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 gap-2 mb-1">
                    <MapPin size={16} className="text-primary-500" />
                    <span className="line-clamp-1">{trip.destination || trip.dropoffLocation || 'Destination TBD'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 gap-2">
                    <Calendar size={16} className="text-primary-500" />
                    <span>{formatDate(trip.scheduledDeparture || trip.departureTime)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {trip.status === 'Pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickAction(trip, 'start')
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 hover:bg-primary-200"
                      >
                        Start
                      </button>
                    )}
                    {trip.status === 'In Progress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickAction(trip, 'complete')
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
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
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </button>
              )
            })}

            {!trips.length && (
              <div className="text-sm text-gray-500 text-center py-8">
                No trips available yet. Create one from the admin dashboard.
              </div>
            )}
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {selectedTrip ? (
            <>
              <div className="flex flex-wrap items-center gap-3 justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedTrip.tripCode || selectedTrip.id}</h2>
                  <p className="text-gray-500">{selectedTrip.destination || selectedTrip.dropoffLocation} • {selectedTrip.driverName || selectedTrip.driverId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[selectedTrip.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {selectedTrip.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={handleStartTrip}
                  disabled={selectedTrip.status !== 'Pending' || saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start Trip
                </button>
                <button
                  onClick={handleCompleteTrip}
                  disabled={selectedTrip.status !== 'In Progress' || saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40"
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
                      className="mt-3 w-full rounded-lg bg-primary-50 text-primary-700 py-2 text-sm font-semibold hover:bg-primary-100 disabled:opacity-40"
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
                      disabled={selectedTrip.status !== 'In Progress' || saving}
                      className="mt-3 w-full rounded-lg bg-primary-500 text-white py-2 text-sm font-semibold hover:bg-primary-600 disabled:opacity-40"
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
                    <p className="font-semibold text-gray-900">{formatDate(selectedTrip.arrivalTime)}</p>
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
                  className="mt-3 px-5 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-40"
                >
                  Save Notes
                </button>
              </section>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a trip to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TripManagement








