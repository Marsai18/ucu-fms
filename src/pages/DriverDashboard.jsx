import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { calcFuelEstimate } from '../utils/fuelCalculator'
import { Car, MapPin, Route, CheckCircle2, Clock, Calendar, AlertCircle, ThumbsUp, ThumbsDown, FileText, MessageSquare, Fuel } from 'lucide-react'
import RouteMap from '../components/RouteMap'
import TripResponseActions from '../components/TripResponseActions'
import FileUpload from '../components/FileUpload'
import { getTripLabel, getRouteLabel, tripMatchesRoute } from '../utils/tripUtils'
import GatePassCard from '../components/GatePassCard'

const DriverDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [trips, setTrips] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [declineModal, setDeclineModal] = useState({ open: false, tripId: null })
  const [declineReason, setDeclineReason] = useState('')
  const [acceptModal, setAcceptModal] = useState({ open: false, tripId: null })
  const [acceptanceFeedback, setAcceptanceFeedback] = useState('')
  const [feedbackModal, setFeedbackModal] = useState({ open: false, tripId: null })
  const [assignmentFeedback, setAssignmentFeedback] = useState('')
  const [reportModal, setReportModal] = useState({ open: false, tripId: null })
  const [tripReport, setTripReport] = useState('')
  const [reportFile, setReportFile] = useState(null)
  const [fuelLogs, setFuelLogs] = useState([])
  const [gatePasses, setGatePasses] = useState([])
  const [fuelLogForm, setFuelLogForm] = useState({ selectedKey: '', tripId: '', vehicleId: '', routeId: '', quantity: '', distanceCovered: '', cost: '', notes: '' })
  const [savingFuelLog, setSavingFuelLog] = useState(false)
  const [expandedRouteId, setExpandedRouteId] = useState(null)
  const [expandedMyTripId, setExpandedMyTripId] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [profileRes, tripsRes, routesRes, logsRes, gatePassesRes] = await Promise.all([
        api.getDriverProfile(),
        api.getDriverTrips(),
        api.getDriverRoutes(),
        api.getDriverFuelLogs().catch(() => []),
        api.getDriverGatePasses().catch(() => []),
      ])
      setProfile(profileRes)
      setTrips(Array.isArray(tripsRes) ? tripsRes : [])
      const routesArr = Array.isArray(routesRes) ? routesRes : (routesRes?.routes ?? routesRes?.data ?? [])
      setRoutes(routesArr)
      setFuelLogs(Array.isArray(logsRes) ? logsRes : [])
      setGatePasses(Array.isArray(gatePassesRes) ? gatePassesRes : [])
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data')
      setProfile({ name: user?.name, email: user?.email })
      setTrips([])
      setRoutes([])
      setFuelLogs([])
      setGatePasses([])
    } finally {
      setLoading(false)
    }
  }, [user?.name, user?.email])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const interval = setInterval(fetchData, 25000)
    return () => clearInterval(interval)
  }, [fetchData])

  const needsResponse = (trip) => trip.status === 'Pending'

  const handleAcceptClick = (e, tripId) => {
    e.stopPropagation()
    setAcceptModal({ open: true, tripId })
    setAcceptanceFeedback('')
  }

  const handleAccept = async () => {
    try {
      await api.acceptTrip(acceptModal.tripId, acceptanceFeedback.trim() || '')
      toast.success('Trip accepted')
      setAcceptModal({ open: false, tripId: null })
      setAcceptanceFeedback('')
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to accept')
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
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback')
    }
  }

  const handleDeclineClick = (e, tripId) => {
    e.stopPropagation()
    setDeclineModal({ open: true, tripId })
  }

  const fuelLogOptions = useMemo(() => {
    const opts = []
    routes.forEach((r) => {
      const vId = r.vehicleId
      if (!vId) return
      const trip = r.tripId ? trips.find(t => String(t.id) === String(r.tripId)) : null
      const dist = r.distance ?? r.distanceKm ?? trip?.routeDistance ?? 0
      const dur = r.duration ?? r.durationMinutes ?? trip?.routeDuration ?? 0
      const cost = 0
      const vehicle = r.vehicle ? { ...r.vehicle, vehicleType: r.vehicle.vehicleType } : null
      opts.push({
        key: `route-${r.id}`,
        type: 'route',
        routeId: r.id,
        vehicleId: vId,
        vehicle,
        tripId: r.tripId || null,
        label: `${r.vehicle?.plateNumber || 'Vehicle'} • ${getRouteLabel(r)} (${dist} km)`,
        distanceCovered: dist,
        durationMin: dur,
        cost
      })
    })
    if (profile?.assignedVehicle && !opts.some(o => String(o.vehicleId) === String(profile.assignedVehicle.id))) {
      opts.push({
        key: 'vehicle-only',
        type: 'vehicle',
        vehicleId: profile.assignedVehicle.id,
        vehicle: profile.assignedVehicle,
        routeId: null,
        tripId: null,
        label: `${profile.assignedVehicle.plateNumber} • ${profile.assignedVehicle.make} (no route)`,
        distanceCovered: '',
        durationMin: 0,
        cost: ''
      })
    }
    return opts
  }, [routes, trips, profile?.assignedVehicle])

  const handleFuelLogOptionSelect = (key) => {
    const opt = fuelLogOptions.find(o => o.key === key)
    if (opt) {
      const dist = Number(opt.distanceCovered) || 0
      const dur = Number(opt.durationMin) || 0
      let quantity = ''
      let cost = opt.cost ? String(opt.cost) : ''
      if (dist > 0 && opt.vehicle) {
        const est = calcFuelEstimate({
          distanceKm: dist,
          durationMin: dur,
          vehicle: opt.vehicle,
          reservePercent: 5
        })
        quantity = String(est.litres)
        if (!cost && est.cost > 0) cost = String(est.cost)
      }
      setFuelLogForm(prev => ({
        ...prev,
        selectedKey: key,
        vehicleId: opt.vehicleId,
        tripId: opt.tripId || '',
        routeId: opt.routeId || '',
        quantity,
        distanceCovered: opt.distanceCovered ? String(opt.distanceCovered) : '',
        cost
      }))
    }
  }

  const handleSubmitFuelLog = async (e) => {
    e.preventDefault()
    const vehicleId = fuelLogForm.vehicleId || profile?.assignedVehicle?.id
    if (!vehicleId || !fuelLogForm.quantity || !fuelLogForm.cost) {
      toast.error('Vehicle, quantity and cost are required')
      return
    }
    try {
      setSavingFuelLog(true)
      const routeId = fuelLogForm.routeId || (fuelLogForm.tripId ? routes.find(r => String(r.tripId) === String(fuelLogForm.tripId))?.id : null)
      await api.createDriverFuelLog({
        vehicleId,
        routeId: routeId || null,
        tripId: fuelLogForm.tripId || null,
        quantity: Number(fuelLogForm.quantity),
        distanceCovered: fuelLogForm.distanceCovered ? Number(fuelLogForm.distanceCovered) : null,
        cost: Number(fuelLogForm.cost),
        notes: fuelLogForm.notes || ''
      })
      toast.success('Fuel log recorded')
      setFuelLogForm({ selectedKey: '', tripId: '', vehicleId: '', routeId: '', quantity: '', distanceCovered: '', cost: '', notes: '' })
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to save fuel log')
    } finally {
      setSavingFuelLog(false)
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
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to decline')
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
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to submit report')
    }
  }

  const completedTrips = trips.filter(t => t.status === 'Completed')
  const tripsNeedingReport = completedTrips
  const inProgressTrips = trips.filter(t => t.status === 'In_Progress')
  const pendingResponseTrips = trips.filter(t => needsResponse(t))

  const unusedGatePasses = useMemo(() => {
    return (gatePasses || [])
      .filter((g) => g && !g.usedAt)
      .sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0))
  }, [gatePasses])

  const usedGatePasses = useMemo(() => {
    return (gatePasses || [])
      .filter((g) => g && g.usedAt)
      .sort((a, b) => new Date(b.usedAt || 0) - new Date(a.usedAt || 0))
  }, [gatePasses])

  // My Trips: routes as trips (trip name = departure → destination). Fallback to trips when no routes.
  const myTripsFromRoutes = useMemo(() => {
    if (routes.length > 0) {
      return routes.map(route => {
        let trip = route.tripId ? trips.find(t => String(t.id) === String(route.tripId)) : null
        if (!trip) trip = trips.find(t => tripMatchesRoute(t, route))
        const tripName = getRouteLabel(route)
        const status = trip?.status || 'Pending'
        const needsResp = trip && trip.status === 'Pending'
        return { route, trip, tripName, status, needsResp }
      })
    }
    // Fallback: show trips when no routes (e.g. trips from bookings)
    return trips.map(trip => {
      const route = trip.route ? {
        id: trip.id,
        origin: trip.origin || trip.route.origin,
        destination: trip.destination || trip.route.destination,
        distance: trip.route.distance ?? trip.routeDistance,
        duration: trip.route.duration ?? trip.routeDuration,
        geometry: trip.route?.geometry,
        waypoints: trip.waypoints ?? trip.route?.waypoints,
        vehicle: trip.vehicle,
        preferredVehicle: trip.vehicleId
      } : {
        id: trip.id,
        origin: trip.origin || trip.departure,
        destination: trip.destination || trip.dropoffLocation,
        distance: trip.routeDistance ?? 0,
        duration: trip.routeDuration ?? 0,
        geometry: null,
        waypoints: trip.waypoints,
        vehicle: trip.vehicle,
        preferredVehicle: trip.vehicleId
      }
      const tripName = getTripLabel(trip)
      const needsResp = needsResponse(trip)
      return { route, trip, tripName, status: trip.status || 'Pending', needsResp }
    })
  }, [routes, trips])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-ucu-blue-500 to-ucu-blue-600 text-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name || user?.name || 'Driver'}!</h1>
        <p className="text-ucu-blue-100">{profile?.email || user?.email} • UCU Fleet Driver Portal</p>
        {profile?.assignedVehicle && (
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 inline-flex">
            <Car size={20} />
            <span className="font-medium">
              Assigned: {profile.assignedVehicle.plateNumber} • {profile.assignedVehicle.make} {profile.assignedVehicle.model}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0" size={24} />
            <p className="text-amber-800 dark:text-amber-200">{error}</p>
          </div>
          <button onClick={() => { setError(null); fetchData(); }} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Trips</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{completedTrips.length}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold text-ucu-blue-600 dark:text-ucu-blue-400 mt-1">{inProgressTrips.length}</p>
            </div>
            <div className="p-3 bg-ucu-blue-100 dark:bg-ucu-blue-900/30 rounded-lg">
              <Clock className="text-ucu-blue-600 dark:text-ucu-blue-400" size={24} />
            </div>
          </div>
        </div>
        {pendingResponseTrips.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Awaiting Your Response</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingResponseTrips.length}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <ThumbsUp className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
            </div>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Routes</p>
              <p className="text-3xl font-bold text-ucu-gold-600 dark:text-ucu-gold-400 mt-1">{routes.length}</p>
            </div>
            <div className="p-3 bg-ucu-gold-100 dark:bg-ucu-gold-900/30 rounded-lg">
              <Route className="text-ucu-gold-600 dark:text-ucu-gold-400" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Trips</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{trips.length}</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
              <MapPin className="text-slate-600 dark:text-slate-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Accept / Reject Trips — prominent, always visible */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-ucu-blue-200 dark:border-ucu-blue-700 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <ThumbsUp size={22} className="text-emerald-500" />
          <ThumbsDown size={22} className="text-rose-500" />
          Accept / Reject Trips
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Respond to trips assigned to you. Rejecting requires a reason.</p>
        {pendingResponseTrips.length > 0 ? (
          <div className="space-y-4">
            {pendingResponseTrips.map((trip) => (
              <div key={trip.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{getTripLabel(trip)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{(trip.tripCode || 'Trip #' + trip.id)}</p>
                    {trip.vehicle && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {trip.vehicle.plateNumber} • {trip.vehicle.make} {trip.vehicle.model}
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 shrink-0">
                    <TripResponseActions
                      onAccept={(e) => handleAcceptClick(e, trip.id)}
                      onReject={(e) => handleDeclineClick(e, trip.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600 text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium">No trips awaiting your response</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">When admin assigns you a trip, Accept/Reject buttons will appear here</p>
            <button onClick={() => navigate('/driver/trips')} className="mt-3 px-4 py-2 rounded-lg bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white font-semibold text-sm">
              View My Trips
            </button>
          </div>
        )}
      </div>

      {/* Gate Pass */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-ucu-blue-200 dark:border-ucu-blue-700 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Calendar size={22} className="text-ucu-blue-500" /> Gate Pass
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Show this QR for access control. It becomes invalid after the first scan.
        </p>

        {gatePasses.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700/20">
            No gate passes received yet.
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">When admin assigns a trip, the gate pass appears here.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {unusedGatePasses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {unusedGatePasses.slice(0, 2).map((g) => (
                  <GatePassCard key={g.token} gatePass={g} />
                ))}
                {unusedGatePasses.length > 2 && (
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    +{unusedGatePasses.length - 2} more unused gate pass(es)
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-4">
                No unused gate passes right now.
              </div>
            )}

            {usedGatePasses.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Previously scanned</p>
                <div className="mt-2 space-y-2">
                  {usedGatePasses.slice(0, 3).map((g) => (
                    <div key={g.token} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-600 dark:text-slate-300 truncate">
                        {g.trip?.tripCode || g.trip?.label || `Trip ${g.tripId}`}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {g.usedAt ? new Date(g.usedAt).toLocaleString() : '—'}
                      </span>
                    </div>
                  ))}
                  {usedGatePasses.length > 3 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      +{usedGatePasses.length - 3} more used gate pass(es)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions — always visible */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/driver/trips')}
          className="px-5 py-3 rounded-xl bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <MapPin size={20} /> My Trips
        </button>
        <button
          onClick={() => navigate('/driver/routes')}
          className="px-5 py-3 rounded-xl bg-ucu-gold-500 hover:bg-ucu-gold-600 text-white font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Route size={20} /> Assigned Routes
        </button>
        <button
          onClick={() => document.getElementById('trip-report-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <FileText size={20} /> Upload Trip Report{tripsNeedingReport.length > 0 ? ` (${tripsNeedingReport.length})` : ''}
        </button>
      </div>

      {/* Assigned Trip Details — full details from admin (always visible) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-ucu-blue-200 dark:border-ucu-blue-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <MapPin size={22} className="text-ucu-blue-500" /> Trip Details from Admin
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Full trip and route details assigned to you. Accept or reject each trip with a reason if declining.</p>
        {(pendingResponseTrips.length > 0 || trips.filter(t => t.status === 'In_Progress').length > 0) ? (
          <div className="space-y-4">
            {[...pendingResponseTrips, ...trips.filter(t => t.status === 'In_Progress')]
              .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)
              .map((trip) => (
              <div key={trip.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30">
                <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">{trip.tripCode || 'Trip #' + trip.id}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        needsResponse(trip) ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200' :
                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {needsResponse(trip) ? 'Awaiting Response' : 'Accepted'}
                      </span>
                    </div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">{getTripLabel(trip)}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {trip.vehicle && (
                        <p className="flex items-center gap-1.5"><Car size={14} /> {trip.vehicle.plateNumber} • {trip.vehicle.make} {trip.vehicle.model}</p>
                      )}
                      {(trip.route?.distance || trip.routeDistance) && (
                        <p className="flex items-center gap-1.5"><Route size={14} /> {trip.route?.distance ?? trip.routeDistance} km • ~{trip.route?.duration ?? trip.routeDuration} min</p>
                      )}
                      {(trip.scheduledDeparture || trip.departureTime) && (
                        <p className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(trip.scheduledDeparture || trip.departureTime).toLocaleString()}</p>
                      )}
                      {trip.scheduledArrival && (
                        <p className="flex items-center gap-1.5"><Clock size={14} /> ETA: {new Date(trip.scheduledArrival).toLocaleString()}</p>
                      )}
                    </div>
                    {trip?.purpose && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2"><strong>Purpose:</strong> {trip?.purpose}</p>}
                    {trip?.waypoints && <p className="text-sm text-slate-500 dark:text-slate-400"><strong>Via:</strong> {trip?.waypoints}</p>}
                    {trip.route?.geometry && trip.route.geometry.length > 1 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Route Map</p>
                        <RouteMap geometry={trip.route.geometry} origin={trip.origin} destination={trip.destination} height="180px" />
                      </div>
                    )}
                    {trip?.driverNotes && (
                      <div className="mt-3 p-3 rounded-lg bg-ucu-blue-50 dark:bg-ucu-blue-900/20 border border-ucu-blue-200 dark:border-ucu-blue-700">
                        <p className="text-xs font-semibold text-ucu-blue-700 dark:text-ucu-blue-400">Driver notes</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{trip?.driverNotes}</p>
                      </div>
                    )}
                    {needsResponse(trip) && (
                      <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
                        <TripResponseActions
                          onAccept={(e) => handleAcceptClick(e, trip.id)}
                          onReject={(e) => handleDeclineClick(e, trip.id)}
                        />
                      </div>
                    )}
                    {!needsResponse(trip) && (
                      <button
                        onClick={() => { setFeedbackModal({ open: true, tripId: trip.id }); setAssignmentFeedback(''); }}
                        className="mt-4 px-4 py-2 rounded-lg bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white font-semibold flex items-center gap-2"
                      >
                        <MessageSquare size={16} /> Submit Feedback
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600">
            <MapPin size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No trips assigned yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">When admin assigns you a trip, it will appear here with Accept/Reject options</p>
            <button onClick={() => navigate('/driver/trips')} className="mt-4 px-4 py-2 rounded-lg bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white font-semibold text-sm">
              View My Trips
            </button>
          </div>
        )}
      </div>

      {/* Trip Report Submission — upload PDF, DOC, images for completed trips */}
      <div id="trip-report-section" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <FileText size={22} className="text-ucu-blue-500" /> Upload Trip Report
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Submit reports for completed trips. Write a summary and/or upload documents (PDF, DOC, DOCX, TXT, JPG, PNG).</p>
        {tripsNeedingReport.length > 0 ? (
          <>
            <div className="space-y-2">
              {tripsNeedingReport.slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{trip.tripCode || 'Trip #' + trip.id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getTripLabel(trip)}</p>
                  </div>
                  <button
                    onClick={() => setReportModal({ open: true, tripId: trip.id })}
                    className="px-3 py-1.5 rounded-lg bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white font-semibold text-sm flex items-center gap-1.5"
                  >
                    <FileText size={14} /> Submit Report
                  </button>
                </div>
              ))}
            </div>
            {tripsNeedingReport.length > 5 && (
              <button onClick={() => navigate('/driver/trips')} className="mt-3 text-sm font-medium text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline">
                View all {tripsNeedingReport.length} trips needing reports →
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-8 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600">
            <FileText size={40} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">No reports pending</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Submit reports here when you complete trips</p>
            <button onClick={() => navigate('/driver/trips')} className="mt-3 px-4 py-2 rounded-lg bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white font-semibold text-sm">
              View My Trips
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Trips</h2>
            <button onClick={() => navigate('/driver/trips')} className="text-sm font-medium text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline">View All</button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Routes as trips (departure → destination). Click to view map and accept/reject.</p>
          <div className="space-y-3">
            {myTripsFromRoutes.slice(0, 8).map(({ route, trip, tripName, status, needsResp }) => (
              <div
                key={route.id}
                className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedMyTripId(expandedMyTripId === route.id ? null : route.id)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-white">{tripName}</p>
                    <span className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400 font-medium">
                      {expandedMyTripId === route.id ? '▲ Hide' : needsResp ? '▼ Click to accept or reject' : '▼ Click for details'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      needsResp ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200' :
                      status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                      (status === 'In_Progress' || status === 'In Progress') ? 'bg-ucu-blue-100 dark:bg-ucu-blue-900/30 text-ucu-blue-700 dark:text-ucu-blue-400' :
                      'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400'
                    }`}>
                      {needsResp ? 'Awaiting Response' : status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {route.distance ?? 0} km • ~{route.duration ?? 0} min
                    </span>
                  </div>
                  {route.vehicle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                      <Car size={12} /> {route.vehicle.plateNumber} • {route.vehicle.make}
                    </p>
                  )}
                </div>
                {expandedMyTripId === route.id && (
                  <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Route Map — {tripName}</p>
                    <RouteMap geometry={route.geometry} origin={route.origin} destination={route.destination} height="200px" />
                    {route.waypoints && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2"><strong>Via:</strong> {route.waypoints}</p>}
                    {trip?.purpose && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1"><strong>Purpose:</strong> {trip?.purpose}</p>}
                    {(trip?.scheduledDeparture || trip?.departureTime) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(trip.scheduledDeparture || trip.departureTime).toLocaleString()}
                      </p>
                    )}
                    {needsResp && trip && (
                      <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
                        <TripResponseActions
                          onAccept={(e) => handleAcceptClick(e, trip.id)}
                          onReject={(e) => handleDeclineClick(e, trip.id)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {myTripsFromRoutes.length === 0 && (
              <div className="py-8 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600 text-center">
                <MapPin size={40} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No trips yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Routes assigned to you will appear here as trips</p>
                <button onClick={() => navigate('/driver/routes')} className="mt-3 px-4 py-2 rounded-lg bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white font-semibold text-sm">
                  View Assigned Routes
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assigned Routes</h2>
            <button onClick={() => navigate('/driver/routes')} className="text-sm font-medium text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {routes.slice(0, 5).map((route) => (
              <div
                key={route.id}
                className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-white">{getRouteLabel(route)}</p>
                    <span className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400">
                      {expandedRouteId === route.id ? 'Hide details' : 'Show details & map'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {route.distance ?? 0} km • ~{route.duration ?? 0} min {route.tripId && <span className="text-ucu-blue-600 dark:text-ucu-blue-400">(Best route)</span>}
                  </p>
                  {route.vehicle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                      <Car size={12} /> {route.vehicle.plateNumber} • {route.vehicle.make} {route.vehicle.model}
                    </p>
                  )}
                  {route.waypoints && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Via: {route.waypoints}</p>}
                </div>
                {expandedRouteId === route.id && (
                  <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <RouteMap geometry={route.geometry} origin={route.origin} destination={route.destination} height="220px" />
                {(() => {
                  let linkedTrip = route.tripId ? trips.find(t => String(t.id) === String(route.tripId)) : null
                  if (!linkedTrip) linkedTrip = trips.find(t => tripMatchesRoute(t, route))
                  const needsResp = linkedTrip && needsResponse(linkedTrip)
                  if (!needsResp) return null
                  return (
                    <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
                      <TripResponseActions
                        onAccept={(e) => handleAcceptClick(e, linkedTrip.id)}
                        onReject={(e) => handleDeclineClick(e, linkedTrip.id)}
                      />
                    </div>
                  )
                })()}
                  </div>
                )}
              </div>
            ))}
            {routes.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No routes assigned yet</p>}
          </div>
        </div>
      </div>

      {/* Fuel Log — driver can record fuel purchases */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Fuel size={22} className="text-emerald-500" /> Fuel Log
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select your vehicle and route — quantity, distance and cost auto-fill from consumption rate. Adjust if needed.</p>
        <form onSubmit={handleSubmitFuelLog} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle & Route *</label>
            <select
              value={fuelLogForm.selectedKey}
              onChange={(e) => handleFuelLogOptionSelect(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3 text-sm"
            >
              <option value="">Select vehicle and route</option>
              {fuelLogOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity (L) *</label>
            <input
              type="number"
              step="0.01"
              value={fuelLogForm.quantity}
              onChange={(e) => setFuelLogForm(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="e.g. 45"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distance (km)</label>
            <input
              type="number"
              step="0.1"
              value={fuelLogForm.distanceCovered}
              onChange={(e) => setFuelLogForm(prev => ({ ...prev, distanceCovered: e.target.value }))}
              placeholder="e.g. 120"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost (UGX) *</label>
            <input
              type="number"
              value={fuelLogForm.cost}
              onChange={(e) => setFuelLogForm(prev => ({ ...prev, cost: e.target.value }))}
              placeholder="e.g. 250000"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3 text-sm"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <input
              type="text"
              value={fuelLogForm.notes}
              onChange={(e) => setFuelLogForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Station name, receipt no..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2 px-3 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingFuelLog || (!fuelLogForm.vehicleId && !profile?.assignedVehicle)}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingFuelLog ? 'Saving...' : 'Record Fuel Log'}
            </button>
          </div>
        </form>
        {profile?.assignedVehicle && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Logging for: <strong>{profile.assignedVehicle.plateNumber}</strong> • {profile.assignedVehicle.make} {profile.assignedVehicle.model}
          </p>
        )}
        {!profile?.assignedVehicle && !trips.some(t => t.vehicleId || t.vehicleIds?.length) && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">No vehicle assigned. Contact admin to get a vehicle assigned before logging fuel.</p>
        )}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Your fuel logs</h3>
          {fuelLogs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No fuel logs yet. Record a purchase above.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fuelLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{log.quantity} L</span>
                    <span className="text-gray-500 dark:text-gray-400 mx-2">•</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">UGX {Number(log.cost).toLocaleString()}</span>
                    {log.distanceCovered != null && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">({log.distanceCovered} km)</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accept Modal - optional feedback */}
      {acceptModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ThumbsUp size={20} className="text-emerald-500" /> Accept Trip
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Add optional feedback on the assignment (e.g., route looks good, ready to go):</p>
            <textarea
              value={acceptanceFeedback}
              onChange={(e) => setAcceptanceFeedback(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="Optional: e.g., Details received, route looks good, I'll be ready..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setAcceptModal({ open: false, tripId: null }); setAcceptanceFeedback(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
              >
                Accept Trip
              </button>
            </div>
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
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Share your feedback on this assignment (e.g., route clarity, concerns, readiness):</p>
            <textarea
              value={assignmentFeedback}
              onChange={(e) => setAssignmentFeedback(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="e.g., Route looks good, ready to depart. Or: I have a question about the pickup location..."
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
                className="flex-1 py-2 rounded-lg bg-ucu-blue-500 text-white font-semibold disabled:opacity-50 hover:bg-ucu-blue-600"
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
              placeholder="e.g., Vehicle unavailable, scheduling conflict, personal emergency, route not feasible..."
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText size={20} /> Submit Trip Report
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Provide feedback for this completed trip. You can write a summary and/or upload a document:</p>
            <textarea
              value={tripReport}
              onChange={(e) => setTripReport(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-3"
              placeholder="Describe the trip: any incidents, delays, observations, fuel used, mileage..."
            />
            <FileUpload
              value={reportFile}
              onChange={setReportFile}
              label="Upload report document (optional)"
              hint="PDF, DOC, DOCX, TXT, JPG, PNG — click to open Desktop or device storage"
              onError={(msg) => toast.error(msg)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setReportModal({ open: false, tripId: null }); setTripReport(''); setReportFile(null); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={!tripReport.trim() && !reportFile}
                className="flex-1 py-2 rounded-lg bg-ucu-blue-500 text-white font-semibold disabled:opacity-50"
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

export default DriverDashboard
