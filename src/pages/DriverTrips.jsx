import React, { useEffect, useState, useCallback, useMemo } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { MapPin, Calendar, Car, CheckCircle2, Route, ThumbsUp, ThumbsDown, FileText, MessageSquare, Fuel } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import RouteMap from '../components/RouteMap'
import TripResponseActions from '../components/TripResponseActions'
import { getTripLabel, getRouteLabel, tripMatchesRoute } from '../utils/tripUtils'

const DriverTrips = () => {
  const [trips, setTrips] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [declineModal, setDeclineModal] = useState({ open: false, tripId: null })
  const [declineReason, setDeclineReason] = useState('')
  const [reportModal, setReportModal] = useState({ open: false, tripId: null })
  const [tripReport, setTripReport] = useState('')
  const [reportFile, setReportFile] = useState(null)
  const [reportFileName, setReportFileName] = useState('')
  const [feedbackModal, setFeedbackModal] = useState({ open: false, tripId: null })
  const [assignmentFeedback, setAssignmentFeedback] = useState('')
  const [responseModal, setResponseModal] = useState(null) // { trip, tripName, route } when open

  const fetchTrips = useCallback(async () => {
    try {
      const [tripsData, routesData] = await Promise.all([
        api.getDriverTrips().catch(() => []),
        api.getDriverRoutes().catch(() => [])
      ])
      setTrips(Array.isArray(tripsData) ? tripsData : [])
      const routesArr = Array.isArray(routesData) ? routesData : (routesData?.routes ?? routesData?.data ?? [])
      setRoutes(routesArr)
    } catch (err) {
      setTrips([])
      setRoutes([])
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [tripsData, routesData] = await Promise.all([
          api.getDriverTrips().catch(() => []),
          api.getDriverRoutes().catch(() => [])
        ])
        setTrips(Array.isArray(tripsData) ? tripsData : [])
        const routesArr = Array.isArray(routesData) ? routesData : (routesData?.routes ?? routesData?.data ?? [])
        setRoutes(routesArr)
      } catch (err) {
        setTrips([])
        setRoutes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchTrips, 20000)
    return () => clearInterval(interval)
  }, [fetchTrips])

  const needsResponse = (trip) => trip && trip.status === 'Pending' && (trip.driverResponse === 'pending' || !trip.driverResponse)

  // Merge routes-as-trips with trips for display (routes first, then trips not matching any route)
  const displayItems = useMemo(() => {
    const items = []
    const usedTripIds = new Set()
    routes.forEach(route => {
      let trip = route.tripId ? trips.find(t => String(t.id) === String(route.tripId)) : null
      if (!trip) trip = trips.find(t => tripMatchesRoute(t, route))
      if (trip) usedTripIds.add(String(trip.id))
      const tripName = getRouteLabel(route)
      const status = trip?.status || 'Pending'
      const needsResp = trip && trip.status === 'Pending' && (trip.driverResponse === 'pending' || !trip.driverResponse)
      items.push({ route, trip, tripName, status, needsResp, isFromRoute: true })
    })
    trips.forEach(trip => {
      if (usedTripIds.has(String(trip.id))) return
      const tripName = getTripLabel(trip)
      const route = trip.route ? {
        id: trip.id,
        origin: trip.origin || trip.route.origin,
        destination: trip.destination || trip.route.destination,
        distance: trip.route.distance ?? trip.routeDistance,
        duration: trip.route.duration ?? trip.routeDuration,
        geometry: trip.route?.geometry,
        waypoints: trip.waypoints ?? trip.route?.waypoints
      } : {
        id: trip.id,
        origin: trip.origin || trip.departure,
        destination: trip.destination || trip.dropoffLocation,
        distance: trip.routeDistance ?? 0,
        duration: trip.routeDuration ?? 0,
        geometry: null,
        waypoints: trip.waypoints
      }
      const needsResp = needsResponse(trip)
      items.push({ route, trip, tripName, status: trip.status || 'Pending', needsResp, isFromRoute: false })
    })
    return items
  }, [routes, trips])

  const pendingResponseItems = displayItems.filter(item => item.needsResp && item.trip)

  const filteredItems = displayItems.filter(item => {
    const status = item.status
    if (filter === 'all') return true
    if (filter === 'completed') return status === 'Completed'
    if (filter === 'in-progress') return status === 'In Progress'
    if (filter === 'pending') return status === 'Pending'
    if (filter === 'cancelled') return status === 'Cancelled'
    return true
  })

  const handleAccept = async (tripId) => {
    try {
      await api.acceptTrip(tripId)
      toast.success('Trip accepted')
      fetchTrips()
    } catch (err) {
      toast.error(err.message || 'Failed to accept')
    }
  }

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining')
      return
    }
    try {
      await api.rejectTrip(declineModal.tripId, declineReason.trim())
      toast.success('Trip declined')
      setDeclineModal({ open: false, tripId: null })
      setDeclineReason('')
      fetchTrips()
    } catch (err) {
      toast.error(err.message || 'Failed to decline')
    }
  }

  const handleSubmitFeedback = async () => {
    if (!assignmentFeedback.trim()) {
      toast.error('Please enter your feedback')
      return
    }
    try {
      await api.submitAssignmentFeedback(feedbackModal.tripId, assignmentFeedback.trim())
      toast.success('Feedback submitted')
      setFeedbackModal({ open: false, tripId: null })
      setAssignmentFeedback('')
      fetchTrips()
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback')
    }
  }

  const handleSubmitReport = async () => {
    if (!tripReport.trim() && !reportFile) {
      toast.error('Please enter your trip report or upload a file')
      return
    }
    try {
      let fileBase64 = null
      let fileName = ''
      if (reportFile) {
        fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result
            resolve(result?.includes(',') ? result.split(',')[1] : result)
          }
          reader.onerror = reject
          reader.readAsDataURL(reportFile)
        })
        fileName = reportFile.name || 'trip-report.pdf'
      }
      await api.submitTripReport(reportModal.tripId, tripReport.trim() || null, fileBase64, fileName)
      toast.success('Trip report submitted')
      setReportModal({ open: false, tripId: null })
      setTripReport('')
      setReportFile(null)
      setReportFileName('')
      fetchTrips()
    } catch (err) {
      toast.error(err.message || 'Failed to submit report')
    }
  }

  const statusBadge = (status) => {
    const styles = {
      Completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      'In Progress': 'bg-ucu-blue-100 dark:bg-ucu-blue-900/30 text-ucu-blue-700 dark:text-ucu-blue-400',
      Cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      Pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      Scheduled: 'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400'
    }
    return styles[status] || styles.Pending
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

  const pendingResponseTrips = trips.filter(t => needsResponse(t))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trips</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View all your accomplished and upcoming trips</p>
      </div>

      {/* Accept / Reject Trips — prominent, always visible */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-ucu-blue-200 dark:border-ucu-blue-700 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <ThumbsUp size={22} className="text-emerald-500" />
          <ThumbsDown size={22} className="text-rose-500" />
          Accept / Reject Trips
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Respond to trips assigned to you. Rejecting requires a reason.</p>
        {pendingResponseItems.length > 0 ? (
          <div className="space-y-4">
            {pendingResponseItems.map(({ trip, tripName, route }) => (
              <div
                key={trip.id}
                onClick={() => setResponseModal({ trip, tripName, route })}
                className="p-4 rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/20 cursor-pointer hover:bg-amber-100/70 dark:hover:bg-amber-900/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{tripName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{(trip.tripCode || 'Trip #' + trip.id)}</p>
                    {(trip.vehicle || route?.vehicle) && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {(trip.vehicle || route.vehicle).plateNumber} • {(trip.vehicle || route.vehicle).make} {(trip.vehicle || route.vehicle).model}
                      </p>
                    )}
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">Click to accept or reject →</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <TripResponseActions
                      onAccept={() => handleAccept(trip.id)}
                      onReject={() => setDeclineModal({ open: true, tripId: trip.id })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="py-6 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600 text-center">
            <MapPin size={40} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No trips yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Routes or trips assigned to you will appear here</p>
          </div>
        ) : (
          <div className="py-6 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600 text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium">No trips awaiting your response</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">When admin assigns you a trip, Accept/Reject buttons will appear here</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'completed', 'in-progress', 'pending', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-ucu-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f === 'pending' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredItems.map(({ route, trip, tripName, status, needsResp }) => {
          const displayId = trip?.id ?? route?.id
          const vehicle = trip?.vehicle ?? route?.vehicle
          const geometry = route?.geometry ?? trip?.route?.geometry
          const distance = route?.distance ?? trip?.route?.distance ?? trip?.routeDistance
          const duration = route?.duration ?? trip?.route?.duration ?? trip?.routeDuration
          return (
          <div
            key={displayId}
            onClick={() => needsResp && trip && setResponseModal({ trip, tripName, route })}
            className={`bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-sm transition-all ${
              needsResp && trip
                ? 'border-amber-300 dark:border-amber-600 cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {trip?.tripCode || `Trip #${displayId}`}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(status)}`}>
                      {status}
                    </span>
                  </div>
                  {needsResp && trip && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">Click to respond →</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tripName}</p>
                {vehicle && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                    <Car size={14} />
                    {vehicle.plateNumber} • {vehicle.make} {vehicle.model}
                  </p>
                )}
                {(distance != null || duration != null) && (
                  <p className="text-sm text-ucu-blue-600 dark:text-ucu-blue-400 mt-2 flex items-center gap-1">
                    <Route size={14} />
                    Best route: {distance ?? 0} km • ~{duration ?? 0} min
                  </p>
                )}
                {(trip?.fuelEstimateLitres != null || trip?.fuelEstimateCost != null) && (
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <Fuel size={14} />
                    Fuel: ~{trip?.fuelEstimateLitres ?? '—'} L • UGX {(trip?.fuelEstimateCost ?? 0).toLocaleString()}
                  </p>
                )}
                {geometry && geometry.length > 1 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Route Direction Map</p>
                    <RouteMap
                      geometry={geometry}
                      origin={route?.origin ?? trip?.origin}
                      destination={route?.destination ?? trip?.destination}
                      height="220px"
                    />
                  </div>
                )}
                {(trip?.purpose || route?.waypoints) && (
                  <>
                    {trip?.purpose && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        <strong>Purpose:</strong> {trip?.purpose}
                      </p>
                    )}
                    {(route?.waypoints || trip?.waypoints) && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1"><strong>Via:</strong> {route?.waypoints || trip?.waypoints}</p>
                    )}
                  </>
                )}
                {trip?.assignmentFeedback && (
                  <div className="mt-3 p-3 rounded-lg bg-ucu-blue-50 dark:bg-ucu-blue-900/20 border border-ucu-blue-200 dark:border-ucu-blue-700">
                    <p className="text-xs font-semibold text-ucu-blue-700 dark:text-ucu-blue-400">Your feedback</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{trip?.assignmentFeedback}</p>
                  </div>
                )}
                {trip?.driverNotes && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 italic">Notes: {trip?.driverNotes}</p>
                )}
                {trip?.vehicleIds && trip.vehicleIds.length > 1 && (
                  <p className="text-sm text-ucu-blue-600 dark:text-ucu-blue-400 mt-2">
                    {trip.vehicleIds.length} vehicles assigned
                  </p>
                )}
                {needsResp && trip && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
                    <TripResponseActions
                      onAccept={() => handleAccept(trip.id)}
                      onReject={() => setDeclineModal({ open: true, tripId: trip.id })}
                    />
                  </div>
                )}
                {trip && !needsResp && (trip.driverResponse === 'accepted' || trip.status === 'In Progress') && !trip.assignmentFeedback && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFeedbackModal({ open: true, tripId: trip.id }); setAssignmentFeedback(''); }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 font-semibold text-sm flex items-center gap-1"
                  >
                    <MessageSquare size={14} /> Submit Feedback
                  </button>
                )}
                {trip?.status === 'Completed' && !trip?.tripReport && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setReportModal({ open: true, tripId: trip.id }); }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 font-semibold text-sm flex items-center gap-1"
                  >
                    <FileText size={14} /> Submit Trip Report
                  </button>
                )}
                {trip?.tripReport && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Trip Report</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{trip?.tripReport}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {trip && (trip.scheduledDeparture || trip.departureTime) && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar size={16} />
                    Depart: {new Date(trip.scheduledDeparture || trip.departureTime).toLocaleString()}
                  </p>
                )}
                {trip?.scheduledArrival && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar size={16} />
                    ETA: {new Date(trip.scheduledArrival).toLocaleString()}
                  </p>
                )}
                {trip?.arrivalTime && (
                  <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <CheckCircle2 size={16} />
                    Arrived: {new Date(trip.arrivalTime).toLocaleString()}
                  </p>
                )}
                {trip?.distanceTraveled > 0 && (
                  <p className="text-ucu-blue-600 dark:text-ucu-blue-400 font-medium">
                    {trip.distanceTraveled} km traveled
                  </p>
                )}
              </div>
            </div>
          </div>
        )})}
        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <MapPin className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400">No trips found</p>
          </div>
        )}
      </div>

      {/* Trip Response Modal - opened when driver clicks a trip needing response */}
      {responseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setResponseModal(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ThumbsUp size={20} className="text-emerald-500" />
              <ThumbsDown size={20} className="text-rose-500" />
              Accept or Reject Trip
            </h3>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{responseModal.tripName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              {responseModal.trip?.tripCode || 'Trip #' + responseModal.trip?.id}
            </p>
            {(responseModal.trip?.vehicle || responseModal.route?.vehicle) && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-1">
                <Car size={14} />
                {(responseModal.trip?.vehicle || responseModal.route?.vehicle).plateNumber} • {(responseModal.trip?.vehicle || responseModal.route?.vehicle).make}
              </p>
            )}
            {responseModal.route?.geometry && responseModal.route.geometry.length > 1 && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <RouteMap
                  geometry={responseModal.route.geometry}
                  origin={responseModal.route.origin}
                  destination={responseModal.route.destination}
                  height="180px"
                />
              </div>
            )}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
              <TripResponseActions
                onAccept={() => { handleAccept(responseModal.trip.id); setResponseModal(null); }}
                onReject={() => { setDeclineModal({ open: true, tripId: responseModal.trip.id }); setResponseModal(null); }}
              />
            </div>
            <button
              onClick={() => setResponseModal(null)}
              className="mt-4 w-full py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assignment Feedback Modal */}
      {feedbackModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <MessageSquare size={20} className="text-ucu-blue-500" /> Submit Feedback
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Share your feedback on this assignment:</p>
            <textarea
              value={assignmentFeedback}
              onChange={(e) => setAssignmentFeedback(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="e.g., Route looks good, ready to depart..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setFeedbackModal({ open: false, tripId: null }); setAssignmentFeedback(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={!assignmentFeedback.trim()}
                className="flex-1 py-2 rounded-lg bg-ucu-blue-500 text-white font-semibold disabled:opacity-50"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal - reason required */}
      {declineModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ThumbsDown size={20} className="text-rose-500" /> Reject Trip & Route
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Please provide a reason for rejecting this trip (required):</p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="e.g., Vehicle unavailable, scheduling conflict, route not feasible..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setDeclineModal({ open: false, tripId: null }); setDeclineReason(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineReason.trim()}
                className="flex-1 py-2 rounded-lg bg-rose-500 text-white font-semibold disabled:opacity-50"
              >
                Reject (reason required)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trip Report Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Submit Trip Report</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Provide a report for this completed trip. You can write a summary and/or upload a document (PDF, Word, images):</p>
            <textarea
              value={tripReport}
              onChange={(e) => setTripReport(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-3"
              placeholder="Describe the trip: any incidents, delays, observations, fuel used, mileage..."
            />
            <FileUpload
              value={reportFile}
              onChange={(f) => { setReportFile(f); setReportFileName(f?.name || ''); }}
              label="Upload report document (optional)"
              hint="PDF, DOC, DOCX, TXT, JPG, PNG — click to open Desktop or device storage"
              onError={(msg) => toast.error(msg)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setReportModal({ open: false, tripId: null }); setTripReport(''); setReportFile(null); setReportFileName(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={!tripReport.trim() && !reportFile}
                className="flex-1 py-2 rounded-lg bg-ucu-gradient text-white font-semibold disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverTrips
