import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Calendar, Car, MapPin, User, CheckCircle2, XCircle, Clock, Route, Loader2, Users, Save, Table2, Ban, Fuel } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import RouteMap from '../components/RouteMap'
import { calcFuelEstimate } from '../utils/fuelCalculator'

const ORIGIN = 'UCU Main Campus'

/**
 * Admin selection overrides client preference only when explicitly set (including [] if user cleared all).
 * Fixes: [] is truthy in JS, so `[] || clientIds` wrongly skipped the client fallback → "0 / N seats".
 */
function getEffectiveVehicleIds(request, vehicleIdsForApprovalState) {
  const raw = vehicleIdsForApprovalState[request.id]
  if (raw !== undefined && raw !== null) return raw.map(String)
  if (request.vehicleIds?.length) return request.vehicleIds.map(String)
  if (request.vehicleId != null && request.vehicleId !== '') return [String(request.vehicleId)]
  return []
}

function getFleetSeatHint(passengers, availableVehiclesList) {
  const p = Math.max(1, Number(passengers) || 1)
  const caps = availableVehiclesList.map((v) => v.seats ?? 0).filter((s) => s > 0)
  const maxSeats = caps.length ? Math.max(...caps) : 64
  const minCount = Math.max(1, Math.ceil(p / maxSeats))
  return { maxSeats, minCount }
}

const statusConfig = {
  Pending: { label: 'Pending', class: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700' },
  HODApproved: { label: 'HOD Approved', class: 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 border-ucu-blue-200 dark:border-ucu-blue-700' },
  Approved: { label: 'Approved', class: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700' },
  Rejected: { label: 'Rejected', class: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-700' },
}

const BookingRequests = () => {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [bookingRequests, setBookingRequests] = useState([])
  const [activeTab, setActiveTab] = useState('HODApproved')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [driverForApproval, setDriverForApproval] = useState({})
  const [vehicleIdsForApproval, setVehicleIdsForApproval] = useState({})
  const [routePreview, setRoutePreview] = useState({})
  const [savedRoutes, setSavedRoutes] = useState([])
  const [savingRoute, setSavingRoute] = useState(null)
  const [suspendModal, setSuspendModal] = useState({ open: false, routeId: null, routeLabel: '' })
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendingRoute, setSuspendingRoute] = useState(null)
  const [fuelPrice, setFuelPrice] = useState(5500)
  const [vehicleChangeModal, setVehicleChangeModal] = useState({ open: false, request: null, vehicleIds: [], driverId: null })
  const [vehicleChangeReason, setVehicleChangeReason] = useState('')
  /** Separates main approval workflow from the route library to avoid cluttered overlap */
  const [workspace, setWorkspace] = useState('queue')

  const formatDateShort = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const getRequestId = (req) => req.request_id || req.reference || `K-${String(req.id).padStart(3, '0')}`

  const loadData = React.useCallback(async () => {
    setLoadError(null)
    setLoading(true)
    try {
      const [vehicleRes, driverRes, tripRes, bookingRes] = await Promise.all([
        api.getVehicles(),
        api.getDrivers(),
        api.getTrips(),
        api.getBookingRequests()
      ])
      setVehicles(Array.isArray(vehicleRes) ? vehicleRes : [])
      setDrivers(Array.isArray(driverRes) ? driverRes : [])
      setTrips(Array.isArray(tripRes) ? tripRes : [])
      const bookings = Array.isArray(bookingRes) ? bookingRes : []
      setBookingRequests(bookings)
      const hodApproved = bookings.filter(b => b.status === 'HODApproved')
      const draftPromises = hodApproved.map(b => api.getAssignmentDraft(b.id).catch(() => ({})))
      const drafts = await Promise.all(draftPromises)
      const driverDrafts = {}
      const vehicleDrafts = {}
      const routeDrafts = {}
      hodApproved.forEach((b, i) => {
        const d = drafts[i]
        if (d && (d.driverId || d.geometry?.length)) {
          if (d.driverId) driverDrafts[b.id] = d.driverId
          if (d.vehicleIds?.length) vehicleDrafts[b.id] = d.vehicleIds
          routeDrafts[b.id] = {
            distanceKm: d.distanceKm ?? 0,
            durationMinutes: d.durationMinutes ?? 0,
            geometry: d.geometry || [],
            loading: false,
            error: null
          }
        }
      })
      if (Object.keys(driverDrafts).length) setDriverForApproval(prev => ({ ...prev, ...driverDrafts }))
      if (Object.keys(vehicleDrafts).length) setVehicleIdsForApproval(prev => ({ ...prev, ...vehicleDrafts }))
      if (Object.keys(routeDrafts).length) setRoutePreview(prev => ({ ...prev, ...routeDrafts }))
    } catch (error) {
      const msg = error.message || 'Failed to load. Ensure backend is running: npm run backend'
      setLoadError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const loadSavedRoutes = useCallback(async () => {
    try {
      const data = await api.getSavedRoutes()
      setSavedRoutes(Array.isArray(data) ? data : [])
    } catch {
      setSavedRoutes([])
    }
  }, [])

  useEffect(() => { loadSavedRoutes() }, [loadSavedRoutes])

  useEffect(() => {
    api.getLiveFuelPrice('Uganda').then(r => setFuelPrice(r?.pricePerLiter || 5500)).catch(() => {})
  }, [])

  const handleSaveRoute = useCallback(async (requestId) => {
    const request = bookingRequests.find(r => String(r.id) === String(requestId))
    const preview = routePreview[requestId]
    const vIds = request ? getEffectiveVehicleIds(request, vehicleIdsForApproval) : []
    if (!request || !preview?.geometry?.length || preview.error) {
      toast.error('Calculate route first before saving')
      return
    }
    setSavingRoute(requestId)
    try {
      await api.createRoute({
        origin: ORIGIN,
        destination: request.destination || '',
        distance: preview.distanceKm ?? 0,
        duration: preview.durationMinutes ?? 0,
        geometry: preview.geometry,
        waypoints: request.waypoints || '',
        bookingId: request.id,
        requestRef: getRequestId(request),
        preferredVehicle: vIds[0] || null,
        status: 'Saved'
      })
      toast.success('Route saved')
      loadSavedRoutes()
    } catch (err) {
      toast.error(err.message || 'Failed to save route')
    } finally {
      setSavingRoute(null)
    }
  }, [bookingRequests, routePreview, loadSavedRoutes, vehicleIdsForApproval])

  const handleSuspendRoute = useCallback(async () => {
    if (!suspendModal.routeId || !suspendReason.trim()) {
      toast.error('Please enter a reason for suspending')
      return
    }
    setSuspendingRoute(suspendModal.routeId)
    try {
      await api.updateRoute(suspendModal.routeId, { suspended: true, suspendedReason: suspendReason.trim() })
      toast.success('Route suspended')
      setSuspendModal({ open: false, routeId: null, routeLabel: '' })
      setSuspendReason('')
      loadSavedRoutes()
    } catch (err) {
      toast.error(err.message || 'Failed to suspend route')
    } finally {
      setSuspendingRoute(null)
    }
  }, [suspendModal, suspendReason, loadSavedRoutes])

  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => (v.operationalStatus || '').toLowerCase() === 'active')
  }, [vehicles])

  // Sort vehicles by capacity similarity: same or similar seats first (for a given reference capacity)
  const getVehiclesByCapacitySimilarity = useCallback((referenceSeats, excludeIds = []) => {
    const ref = referenceSeats || 8
    return [...availableVehicles]
      .filter(v => !excludeIds.includes(String(v.id)))
      .sort((a, b) => {
        const seatsA = a.seats ?? 8
        const seatsB = b.seats ?? 8
        const diffA = Math.abs(seatsA - ref)
        const diffB = Math.abs(seatsB - ref)
        if (diffA !== diffB) return diffA - diffB
        return seatsA - seatsB
      })
  }, [availableVehicles])

  const driversOnTrip = useMemo(() => {
    return trips.filter(t => (t.status || '').toLowerCase() === 'in progress').map(t => String(t.driverId))
  }, [trips])

  const availableDrivers = useMemo(() => {
    return drivers.filter(d =>
      (d.status || '').toLowerCase() === 'active' && !driversOnTrip.includes(String(d.id))
    )
  }, [drivers, driversOnTrip])

  const filteredRequests = useMemo(() => {
    return activeTab === 'All' ? bookingRequests : bookingRequests.filter(req => req.status === activeTab)
  }, [bookingRequests, activeTab])

  const getDriverName = (driverId) => {
    const d = drivers.find(x => String(x.id) === String(driverId))
    return d ? (d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || driverId) : driverId || 'N/A'
  }

  const getVehicleName = (vehicleId) => {
    const v = vehicles.find(x => String(x.id) === String(vehicleId))
    return v ? `${v.plateNumber} • ${v.make} ${v.model}` : vehicleId || 'N/A'
  }

  const getTotalSeats = (vehicleIds) => {
    if (!vehicleIds || !Array.isArray(vehicleIds)) return 0
    return vehicleIds.reduce((sum, vid) => {
      const v = vehicles.find(x => String(x.id) === String(vid))
      return sum + (v?.seats ?? 8)
    }, 0)
  }

  const saveDraftAndFetchRoute = useCallback(async (requestId, driverId, vehicleIds) => {
    setRoutePreview(prev => ({ ...prev, [requestId]: { ...prev[requestId], loading: true, error: null } }))
    try {
      const data = await api.saveAssignmentDraft(requestId, driverId, vehicleIds)
      setRoutePreview(prev => ({
        ...prev,
        [requestId]: {
          distanceKm: data.distanceKm ?? 0,
          durationMinutes: data.durationMinutes ?? 0,
          geometry: data.geometry || [],
          loading: false,
          error: null
        }
      }))
    } catch (err) {
      setRoutePreview(prev => ({
        ...prev,
        [requestId]: { loading: false, error: err.message, distanceKm: 0, durationMinutes: 0, geometry: [] }
      }))
      toast.error('Route calculation failed')
    }
  }, [])

  const restoreClientVehicleSelection = useCallback(
    (request) => {
      const ids = request.vehicleIds?.length
        ? request.vehicleIds.map(String)
        : request.vehicleId
          ? [String(request.vehicleId)]
          : []
      setVehicleIdsForApproval((prev) => ({ ...prev, [request.id]: ids }))
      const driverId = driverForApproval[request.id]
      if (driverId && ids.length) saveDraftAndFetchRoute(request.id, driverId, ids)
    },
    [driverForApproval, saveDraftAndFetchRoute]
  )

  const fetchRoutePreview = useCallback(async (requestId) => {
    setRoutePreview(prev => ({ ...prev, [requestId]: { ...prev[requestId], loading: true, error: null } }))
    try {
      const data = await api.getBookingRoutePreview(requestId)
      setRoutePreview(prev => ({
        ...prev,
        [requestId]: { distanceKm: data.distanceKm, durationMinutes: data.durationMinutes, geometry: data.geometry || [], loading: false, error: null }
      }))
    } catch (err) {
      setRoutePreview(prev => ({
        ...prev,
        [requestId]: { loading: false, error: err.message, distanceKm: 0, durationMinutes: 0, geometry: [] }
      }))
      toast.error('Route calculation failed')
    }
  }, [])

  const handleStatusUpdate = async (id, status, driverId, vehicleIds, changeReason = null) => {
    try {
      await api.updateBookingStatus(id, status, driverId, vehicleIds, null, null, changeReason)
      toast.success(`Request ${status.toLowerCase()}`)
      setDriverForApproval(prev => ({ ...prev, [id]: undefined }))
      setVehicleIdsForApproval(prev => ({ ...prev, [id]: undefined }))
      setVehicleChangeModal({ open: false, request: null, vehicleIds: [], driverId: null })
      setVehicleChangeReason('')
      const updated = await api.getBookingRequests()
      setBookingRequests(Array.isArray(updated) ? updated : [])
    } catch (error) {
      toast.error(error.message || 'Could not update request')
    }
  }

  const handleApproveClick = (request) => {
    const vIds = getEffectiveVehicleIds(request, vehicleIdsForApproval)
    const driverId = driverForApproval[request.id] || request.driverId
    const passengers = Number(request.numberOfPassengers) || 1
    const totalSeats = getTotalSeats(vIds)
    const seatsOk = totalSeats >= passengers

    if (!vIds.length) { toast.error('Select at least one vehicle'); return }
    if (!driverId) { toast.error('Select a driver'); return }
    if (!seatsOk) {
      toast.error(`Total capacity (${totalSeats} seats) is less than ${passengers} passengers.`)
      return
    }

    const clientPreferredIds = request.vehicleIds?.length ? request.vehicleIds : (request.vehicleId ? [String(request.vehicleId)] : [])
    const adminChangedVehicle = clientPreferredIds.length && (vIds[0] !== clientPreferredIds[0] || !clientPreferredIds.includes(vIds[0]))

    if (adminChangedVehicle) {
      setVehicleChangeModal({ open: true, request, vehicleIds: vIds, driverId })
      return
    }
    handleStatusUpdate(request.id, 'Approved', driverId, vIds)
  }

  const toggleVehicle = (requestId, vehicleId, currentIds, passengers) => {
    const ids = currentIds || []
    const isSelected = ids.includes(String(vehicleId))
    let newIds
    if (isSelected) {
      newIds = ids.filter(id => id !== String(vehicleId))
    } else {
      newIds = [...ids, String(vehicleId)]
    }
    setVehicleIdsForApproval(prev => ({ ...prev, [requestId]: newIds }))
    const driverId = driverForApproval[requestId]
    if (driverId) saveDraftAndFetchRoute(requestId, driverId, newIds)
  }

  const hodApprovedCount = bookingRequests.filter(r => r.status === 'HODApproved').length
  const approvedCount = bookingRequests.filter(r => r.status === 'Approved').length

  if (loading && !loadError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading booking data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold text-ucu-blue-600 dark:text-ucu-blue-400 uppercase tracking-widest">Operations</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold mt-1 tracking-tight">
          <span className="text-gradient-ucu">Vehicle Booking Requests</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          Assign vehicles and drivers to HOD-approved requests. Use <strong className="text-slate-700 dark:text-slate-300">Saved routes</strong> to review or suspend stored routes separately.
        </p>
      </div>

      {/* Primary navigation: queue vs route library */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex w-full sm:w-auto rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/80 p-1 shadow-sm"
          role="tablist"
          aria-label="Booking workspace"
        >
          <button
            type="button"
            role="tab"
            aria-selected={workspace === 'queue'}
            onClick={() => setWorkspace('queue')}
            className={`flex-1 sm:flex-none rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              workspace === 'queue'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Booking queue
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspace === 'routes'}
            onClick={() => setWorkspace('routes')}
            className={`flex-1 sm:flex-none rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              workspace === 'routes'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Saved routes
            <span className="ml-2 inline-flex min-w-[1.5rem] justify-center rounded-full bg-slate-200/80 px-1.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-600 dark:text-slate-200">
              {savedRoutes.length}
            </span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-amber-800 dark:text-amber-200 text-sm">{loadError}</p>
          <button onClick={loadData} className="px-4 py-2 rounded-lg bg-ucu-blue-500 text-white font-medium hover:bg-ucu-blue-600 shrink-0">Retry</button>
        </div>
      )}

      {workspace === 'queue' && (
      <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <Car size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{availableVehicles.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Free Vehicles</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 flex items-center justify-center">
            <User size={20} className="text-ucu-blue-600 dark:text-ucu-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{availableDrivers.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Available Drivers</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 flex items-center justify-center">
            <Clock size={20} className="text-ucu-blue-600 dark:text-ucu-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{hodApprovedCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Awaiting Action</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-600/30 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{approvedCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Approved</p>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-700/30 w-full max-w-full overflow-x-auto">
        {['HODApproved', 'Approved', 'Rejected', 'All'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-ucu-gradient text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {tab}
            {tab === 'HODApproved' && hodApprovedCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/30 text-xs">{hodApprovedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Request cards */}
      <div className="space-y-6 min-w-0">
        {filteredRequests.map(request => {
          const status = statusConfig[request.status] || statusConfig.Pending
          const vIds = getEffectiveVehicleIds(request, vehicleIdsForApproval)
          const totalSeats = getTotalSeats(vIds)
          const passengers = Number(request.numberOfPassengers) || 1
          const seatsOk = totalSeats >= passengers
          const fleetHint = getFleetSeatHint(passengers, availableVehicles)
          const rawSelection = vehicleIdsForApproval[request.id]
          const selectionClearedByUser =
            rawSelection !== undefined && rawSelection !== null && rawSelection.length === 0
          const hasClientPreference = !!(request.vehicleId || request.vehicleIds?.length)

          return (
            <div
              key={request.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-w-0"
            >
              {/* Card Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-700/25 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <span className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                    {getRequestId(request)}
                  </span>
                  {(request.clientName || request.client_name) && (
                    <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[min(100%,14rem)]" title={request.clientName || request.client_name}>
                      <User size={14} className="inline-block shrink-0 mr-1 align-text-bottom opacity-70" />
                      {request.clientName || request.client_name}
                    </span>
                  )}
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${status.class}`}>
                    {status.label}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm shrink-0">
                    <Users size={16} className="shrink-0" />
                    <strong>{passengers}</strong> passenger{passengers !== 1 ? 's' : ''}
                  </span>
                </div>
                {request.status === 'Pending' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 sm:text-right">Awaiting HOD approval</p>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-6">
                {request.status === 'HODApproved' ? (
                  <div className="flex flex-col xl:flex-row xl:items-stretch gap-6 xl:gap-0 min-w-0">
                    {/* Column 1 — Trip + vehicles */}
                    <div className="flex-1 min-w-0 space-y-4 xl:pr-6 xl:border-r xl:border-slate-200 dark:xl:border-slate-600">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/40 dark:bg-slate-700/15">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                          <MapPin size={14} className="text-ucu-blue-500" /> Trip
                        </h3>
                        <p className="text-slate-900 dark:text-white font-medium text-sm sm:text-base break-words">
                          {ORIGIN} <span className="text-slate-400">→</span> {request.destination || '—'}
                        </p>
                        {request.department && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dept: {request.department}</p>
                        )}
                        <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Calendar size={14} className="shrink-0" /> Start {formatDateShort(request.startDateTime)}
                          </span>
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Clock size={14} className="shrink-0" /> End {formatDateShort(request.endDateTime)}
                          </span>
                        </div>
                        {request.hodApprovalNote && (
                          <p className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400 mt-2 border-t border-slate-200/80 dark:border-slate-600 pt-2">
                            HOD note: {request.hodApprovalNote}
                          </p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                          <Car size={14} className="text-ucu-blue-500" /> Vehicles
                        </h3>
                        {(request.vehicleId || request.vehicleIds?.length) && (() => {
                          const clientVid = request.vehicleId || request.vehicleIds?.[0]
                          const clientVehicle = vehicles.find(x => String(x.id) === String(clientVid))
                          const clientSeats = clientVehicle?.seats ?? 8
                          return (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Client preference:</span>{' '}
                              <span className="break-words">{getVehicleName(clientVid)}</span>{' '}
                              <span className="text-ucu-blue-600 dark:text-ucu-blue-400">({clientSeats} seats)</span>
                            </p>
                          )
                        })()}
                        <div className="mb-2 space-y-1.5">
                          {vIds.length === 0 ? (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-semibold text-amber-700 dark:text-amber-300">No vehicles selected.</span>{' '}
                              {hasClientPreference
                                ? 'Tick the client’s preferred vehicle(s) below, or add more until capacity covers all passengers.'
                                : `Select vehicles below for ${passengers} passenger${passengers !== 1 ? 's' : ''}.`}
                            </p>
                          ) : (
                            <>
                              <p
                                className={`text-xs font-semibold ${seatsOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                              >
                                Assigned capacity: {totalSeats} / {passengers} seats
                                {seatsOk && ' ✓'}
                              </p>
                              {!seatsOk && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                  Need <strong>{passengers - totalSeats}</strong> more seat{passengers - totalSeats !== 1 ? 's' : ''}. With your largest
                                  available unit ({fleetHint.maxSeats} seats), plan for at least{' '}
                                  <strong>{fleetHint.minCount}</strong> vehicle{fleetHint.minCount !== 1 ? 's' : ''} total — add ticked vehicles until
                                  the sum meets or exceeds {passengers}.
                                </p>
                              )}
                            </>
                          )}
                          {selectionClearedByUser && hasClientPreference && (
                            <button
                              type="button"
                              onClick={() => restoreClientVehicleSelection(request)}
                              className="text-xs font-semibold text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline"
                            >
                              Restore client preference
                            </button>
                          )}
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/40 p-2 max-h-[220px] overflow-y-auto custom-scroll">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {getVehiclesByCapacitySimilarity(
                              (vehicles.find(x => String(x.id) === String(request.vehicleId || request.vehicleIds?.[0]))?.seats) ?? passengers
                            ).map((v) => {
                              const isSelected = vIds.includes(String(v.id))
                              return (
                                <label
                                  key={v.id}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-ucu-blue-500 bg-ucu-blue-50/80 dark:bg-ucu-blue-500/15 ring-1 ring-ucu-blue-500/30'
                                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleVehicle(request.id, v.id, vIds, passengers)}
                                    className="mt-0.5 rounded border-slate-300 text-ucu-blue-600 focus:ring-ucu-blue-500 w-4 h-4 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{v.plateNumber}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                      {v.make} {v.model}
                                    </p>
                                    <p className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400 font-medium">{v.seats ?? 8} seats</p>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                        {availableVehicles.length === 0 && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 py-3">No available vehicles</p>
                        )}
                      </div>
                    </div>

                    {/* Column 2 — Driver, route, decisions */}
                    <div className="flex-1 min-w-0 space-y-4 xl:pl-6 xl:min-w-[min(100%,380px)]">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                          <User size={14} className="text-ucu-blue-500" /> Driver
                        </h3>
                        <select
                          value={driverForApproval[request.id] || request.driverId || ''}
                          onChange={(e) => {
                            const newDriverId = e.target.value || null
                            setDriverForApproval(prev => ({ ...prev, [request.id]: newDriverId }))
                            if (newDriverId) saveDraftAndFetchRoute(request.id, newDriverId, vIds)
                          }}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2.5 px-3 text-sm focus:ring-2 focus:ring-ucu-blue-500 focus:border-ucu-blue-500"
                        >
                          <option value="">Select driver…</option>
                          {availableDrivers.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.id}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Route size={14} className="text-ucu-blue-500" /> Route & fuel
                        </h3>
                        <button
                          type="button"
                          onClick={() => (driverForApproval[request.id] ? saveDraftAndFetchRoute(request.id, driverForApproval[request.id], vIds) : fetchRoutePreview(request.id))}
                          disabled={routePreview[request.id]?.loading}
                          className="w-full py-2.5 px-4 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-800 dark:text-ucu-blue-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-ucu-blue-200/80 dark:hover:bg-ucu-blue-500/30 transition-colors disabled:opacity-60"
                        >
                          {routePreview[request.id]?.loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Calculating…</>
                          ) : (
                            <><Route size={18} /> {routePreview[request.id]?.geometry?.length ? 'Refresh route' : 'Calculate route'}</>
                          )}
                        </button>
                        {routePreview[request.id] && !routePreview[request.id].loading && (
                          <div className="space-y-3">
                            {routePreview[request.id].error ? (
                              <p className="text-sm text-rose-600 dark:text-rose-400">{routePreview[request.id].error}</p>
                            ) : (
                              <>
                                <div className="flex flex-wrap gap-2 text-sm">
                                  <span className="font-semibold text-ucu-blue-600 dark:text-ucu-blue-400">
                                    {routePreview[request.id].distanceKm ?? 0} km
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-600 dark:text-slate-400">~{routePreview[request.id].durationMinutes ?? 0} min</span>
                                </div>
                                {(() => {
                                  const vId = vIds[0]
                                  const vehicle = vId ? vehicles.find(v => String(v.id) === String(vId)) : null
                                  const fuelEst = calcFuelEstimate({
                                    distanceKm: routePreview[request.id].distanceKm ?? 0,
                                    durationMin: routePreview[request.id].durationMinutes ?? 0,
                                    vehicle,
                                    pricePerLiter: fuelPrice,
                                    reservePercent: 10
                                  })
                                  if (fuelEst.litres > 0) {
                                    return (
                                      <div className="flex gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/50">
                                        <Fuel size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                            ~{fuelEst.litres} L · UGX {fuelEst.cost.toLocaleString()}
                                          </p>
                                          <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90">Est. incl. 10% reserve</p>
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                })()}
                                {routePreview[request.id].geometry?.length > 1 && (
                                  <div className="space-y-2">
                                    <div className="w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-900">
                                      <RouteMap
                                        geometry={routePreview[request.id].geometry}
                                        origin={ORIGIN}
                                        destination={request.destination}
                                        height="220px"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRoute(request.id)}
                                      disabled={savingRoute === request.id}
                                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500/25 dark:hover:bg-emerald-500/35 text-white dark:text-emerald-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                                    >
                                      {savingRoute === request.id ? (
                                        <><Loader2 size={16} className="animate-spin" /> Saving…</>
                                      ) : (
                                        <><Save size={16} /> Save to route library</>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleApproveClick(request)}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                          <CheckCircle2 size={20} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                          className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                          <XCircle size={20} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Read-only view for non-HODApproved */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Trip</h3>
                      <p className="text-slate-900 dark:text-white font-medium">{ORIGIN} → {request.destination || '—'}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{formatDateShort(request.startDateTime)} – {formatDateShort(request.endDateTime)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Vehicle</h3>
                      <p className="text-slate-900 dark:text-white">
                        {request.vehicleIds?.length
                          ? request.vehicleIds.map(vid => {
                              const v = vehicles.find(x => String(x.id) === String(vid))
                              return v ? v.plateNumber : null
                            }).filter(Boolean).join(', ')
                          : getVehicleName(request.vehicleId) || '—'}
                      </p>
                      {request.originalVehicleId && request.vehicleChangeReason && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Vehicle changed from client request</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {getVehicleName(request.originalVehicleId)} → {getVehicleName(request.vehicleId)}
                          </p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 italic">&quot;{request.vehicleChangeReason}&quot;</p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Driver</h3>
                      <p className="text-slate-900 dark:text-white">{getDriverName(request.driverId)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {!filteredRequests.length && !loading && (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="inline-flex h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center mb-4">
              <Calendar size={28} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">No {activeTab.toLowerCase()} requests</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              {activeTab === 'HODApproved' ? 'Assign vehicle(s) and driver to approve incoming requests.' : 'All requests go through HOD first.'}
            </p>
          </div>
        )}
      </div>
      </>
      )}

      {workspace === 'routes' && (
        <div className="space-y-4 min-w-0">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800 px-4 py-4 sm:px-6">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Table2 size={22} className="text-ucu-blue-600 dark:text-ucu-blue-400 shrink-0" />
              Saved routes library
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Routes saved from the booking queue are listed here. Review distances, suspend outdated paths, and keep dispatch aligned with active roads.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Origin</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Destination</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Distance</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-[140px]">Waypoints</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Request ref</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center text-slate-500 dark:text-slate-400 px-4">
                        No saved routes yet. Open <strong className="text-slate-700 dark:text-slate-300">Booking queue</strong>, approve a route preview, then use <strong className="text-slate-700 dark:text-slate-300">Save route</strong>.
                      </td>
                    </tr>
                  ) : (
                    savedRoutes.map((r) => (
                      <tr
                        key={r.id}
                        className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 ${
                          r.suspended ? 'opacity-80 bg-rose-50/40 dark:bg-rose-900/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-slate-900 dark:text-white align-top">{r.origin || ORIGIN}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-white align-top max-w-[200px]">{r.destination || '—'}</td>
                        <td className="py-3 px-4 text-ucu-blue-600 dark:text-ucu-blue-400 font-medium whitespace-nowrap align-top">
                          {r.distance ?? 0} km
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap align-top">~{r.duration ?? 0} min</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate align-top" title={r.waypoints}>
                          {r.waypoints || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs align-top whitespace-nowrap">
                          {r.requestRef || r.bookingId || '—'}
                        </td>
                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          {r.suspended ? (
                            <span
                              className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                              title={r.suspendedReason}
                            >
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          {!r.suspended && (
                            <button
                              type="button"
                              onClick={() =>
                                setSuspendModal({
                                  open: true,
                                  routeId: r.id,
                                  routeLabel: `${r.origin || ORIGIN} → ${r.destination || '—'}`,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-medium text-xs hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
                            >
                              <Ban size={14} /> Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Change Reason Modal */}
      {vehicleChangeModal.open && vehicleChangeModal.request && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Car size={20} className="text-amber-500" /> Vehicle Changed — Reason Required
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              You are assigning a different vehicle than the one requested. Please provide a reason for the change.
            </p>
            <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Original → New</p>
              <p className="text-sm text-slate-900 dark:text-white">
                {getVehicleName(vehicleChangeModal.request.vehicleId || vehicleChangeModal.request.vehicleIds?.[0])}
                {' → '}
                {vehicleChangeModal.vehicleIds?.map(vid => getVehicleName(vid)).filter(Boolean).join(', ')}
              </p>
            </div>
            <textarea
              value={vehicleChangeReason}
              onChange={(e) => setVehicleChangeReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="e.g., Original vehicle under maintenance; assigned similar-capacity alternative. / Preferred vehicle booked; using equivalent capacity vehicle."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setVehicleChangeModal({ open: false, request: null, vehicleIds: [], driverId: null }); setVehicleChangeReason(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!vehicleChangeReason.trim()) { toast.error('Please enter a reason for changing the vehicle'); return }
                  handleStatusUpdate(vehicleChangeModal.request.id, 'Approved', vehicleChangeModal.driverId, vehicleChangeModal.vehicleIds, vehicleChangeReason)
                }}
                disabled={!vehicleChangeReason.trim()}
                className="flex-1 py-2 rounded-lg bg-emerald-500 text-white font-semibold disabled:opacity-50"
              >
                Approve with Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Route Modal */}
      {suspendModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Ban size={20} className="text-rose-500" /> Suspend Route
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{suspendModal.routeLabel}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Enter the reason for suspending this route (required):</p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="e.g., Road closure, construction, safety concerns..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setSuspendModal({ open: false, routeId: null, routeLabel: '' }); setSuspendReason(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendRoute}
                disabled={!suspendReason.trim() || suspendingRoute}
                className="flex-1 py-2 rounded-lg bg-rose-500 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {suspendingRoute ? <><Loader2 size={16} className="animate-spin" /> Suspending...</> : 'Suspend Route'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingRequests
