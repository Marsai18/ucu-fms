import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Calendar, Car, MapPin, User, CheckCircle2, XCircle, Clock, Route, Loader2, Users, Save, Table2, Ban, Fuel } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import RouteMap from '../components/RouteMap'
import { calcFuelEstimate } from '../utils/fuelCalculator'

const ORIGIN = 'UCU Main Campus'

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
    const vIds = vehicleIdsForApproval[requestId] || request.vehicleIds || (request.vehicleId ? [request.vehicleId] : [])
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
  }, [bookingRequests, routePreview, loadSavedRoutes])

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

  const getMinVehiclesNeeded = (passengers) => {
    return Math.max(1, Math.ceil((Number(passengers) || 1) / 8))
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
    const vIds = vehicleIdsForApproval[request.id] || request.vehicleIds || (request.vehicleId ? [String(request.vehicleId)] : [])
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
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Assign vehicle(s) and driver to approve HOD-approved requests.
        </p>
      </div>

      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-amber-800 dark:text-amber-200 text-sm">{loadError}</p>
          <button onClick={loadData} className="px-4 py-2 rounded-lg bg-ucu-blue-500 text-white font-medium hover:bg-ucu-blue-600 shrink-0">Retry</button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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

      {/* Saved Routes Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex items-center gap-2">
          <Table2 size={20} className="text-ucu-blue-600 dark:text-ucu-blue-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Saved Routes</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">({savedRoutes.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Origin</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Destination</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Distance</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Duration</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Waypoints</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Request Ref</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedRoutes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No saved routes yet. Calculate a route above and click Save Route to add one.
                  </td>
                </tr>
              ) : (
                savedRoutes.map((r) => (
                  <tr key={r.id} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${r.suspended ? 'opacity-70 bg-rose-50/30 dark:bg-rose-900/10' : ''}`}>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">{r.origin || ORIGIN}</td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">{r.destination || '—'}</td>
                    <td className="py-3 px-4 text-ucu-blue-600 dark:text-ucu-blue-400 font-medium">{r.distance ?? 0} km</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">~{r.duration ?? 0} min</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={r.waypoints}>
                      {r.waypoints || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{r.requestRef || r.bookingId || '—'}</td>
                    <td className="py-3 px-4">
                      {r.suspended ? (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" title={r.suspendedReason}>
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!r.suspended && (
                        <button
                          onClick={() => setSuspendModal({ open: true, routeId: r.id, routeLabel: `${r.origin || ORIGIN} → ${r.destination || '—'}` })}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-medium text-xs flex items-center gap-1.5 hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors"
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

      {/* Tab Filter */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-700/30 w-fit">
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

      {/* Request Cards */}
      <div className="space-y-6">
        {filteredRequests.map(request => {
          const status = statusConfig[request.status] || statusConfig.Pending
          const vIds = vehicleIdsForApproval[request.id] || request.vehicleIds || (request.vehicleId ? [String(request.vehicleId)] : [])
          const totalSeats = getTotalSeats(vIds)
          const passengers = Number(request.numberOfPassengers) || 1
          const seatsOk = totalSeats >= passengers
          const minVehicles = getMinVehiclesNeeded(passengers)

          return (
            <div
              key={request.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">{getRequestId(request)}</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${status.class}`}>
                    {status.label}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm">
                    <Users size={16} />
                    <strong>{passengers}</strong> passenger{passengers !== 1 ? 's' : ''}
                  </span>
                </div>
                {request.status === 'Pending' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Awaiting HOD approval</p>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6">
                {request.status === 'HODApproved' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Trip details + Vehicle selection */}
                    <div className="space-y-5">
                      {/* Trip Details */}
                      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50/30 dark:bg-slate-700/20">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <MapPin size={16} /> Trip Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="text-slate-900 dark:text-white font-medium">
                            {ORIGIN} → {request.destination || '—'}
                          </p>
                          {request.department && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">Department: {request.department}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} /> Start: {formatDateShort(request.startDateTime)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} /> End: {formatDateShort(request.endDateTime)}
                            </span>
                          </div>
                          {request.hodApprovalNote && (
                            <p className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400 mt-1">HOD: {request.hodApprovalNote}</p>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Selection Cards */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Car size={16} /> Select Vehicles
                        </h3>
                        {(request.vehicleId || request.vehicleIds?.length) && (() => {
                          const clientVid = request.vehicleId || request.vehicleIds?.[0]
                          const clientVehicle = vehicles.find(x => String(x.id) === String(clientVid))
                          const clientSeats = clientVehicle?.seats ?? 8
                          return (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                              <span className="font-medium">Client requested:</span>
                              {getVehicleName(clientVid)}
                              <span className="text-ucu-blue-600 dark:text-ucu-blue-400">({clientSeats} seats)</span>
                            </p>
                          )
                        })()}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Similar capacity vehicles shown first. Assign same or similar capacity when changing.
                        </p>
                        <p className={`text-xs font-medium mb-3 ${seatsOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {totalSeats}/{passengers} seats selected {!seatsOk && `(need ${minVehicles}+ vehicle${minVehicles > 1 ? 's' : ''})`}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                          {getVehiclesByCapacitySimilarity(
                            (vehicles.find(x => String(x.id) === String(request.vehicleId || request.vehicleIds?.[0]))?.seats) ?? passengers
                          ).map((v) => {
                            const isSelected = vIds.includes(String(v.id))
                            return (
                              <label
                                key={v.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-ucu-blue-500 bg-ucu-blue-50 dark:bg-ucu-blue-500/20'
                                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleVehicle(request.id, v.id, vIds, passengers)}
                                  className="rounded border-slate-300 text-ucu-blue-600 focus:ring-ucu-blue-500 w-4 h-4"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">{v.plateNumber}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{v.make} {v.model}</p>
                                  <p className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400 font-medium">{v.seats ?? 8} seats</p>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                        {availableVehicles.length === 0 && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No available vehicles</p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Driver, Route, Actions */}
                    <div className="space-y-5">
                      {/* Driver Assignment */}
                      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <User size={16} /> Assign Driver
                        </h3>
                        <select
                          value={driverForApproval[request.id] || request.driverId || ''}
                          onChange={(e) => {
                            const newDriverId = e.target.value || null
                            setDriverForApproval(prev => ({ ...prev, [request.id]: newDriverId }))
                            if (newDriverId) saveDraftAndFetchRoute(request.id, newDriverId, vIds)
                          }}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-ucu-blue-500 focus:border-ucu-blue-500"
                        >
                          <option value="">Select driver...</option>
                          {availableDrivers.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.id}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Route Preview */}
                      <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Route size={16} /> Route Preview
                        </h3>
                        <button
                          type="button"
                          onClick={() => (driverForApproval[request.id] ? saveDraftAndFetchRoute(request.id, driverForApproval[request.id], vIds) : fetchRoutePreview(request.id))}
                          disabled={routePreview[request.id]?.loading}
                          className="w-full py-2.5 px-4 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-ucu-blue-200 dark:hover:bg-ucu-blue-500/30 transition-colors disabled:opacity-60"
                        >
                          {routePreview[request.id]?.loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Calculating route...</>
                          ) : (
                            <><Route size={18} /> {routePreview[request.id]?.geometry?.length ? 'Refresh Route' : 'Preview Route'}</>
                          )}
                        </button>
                        {routePreview[request.id] && !routePreview[request.id].loading && (
                          <div className="mt-3">
                            {routePreview[request.id].error ? (
                              <p className="text-sm text-rose-600 dark:text-rose-400">{routePreview[request.id].error}</p>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-ucu-blue-600 dark:text-ucu-blue-400 mb-2">
                                  {routePreview[request.id].distanceKm ?? 0} km • ~{routePreview[request.id].durationMinutes ?? 0} min
                                </p>
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
                                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 mb-3">
                                        <Fuel size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <div>
                                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                            Fuel: ~{fuelEst.litres} L • UGX {fuelEst.cost.toLocaleString()}
                                          </p>
                                          <p className="text-xs text-emerald-600 dark:text-emerald-400">Estimated for journey (10% reserve)</p>
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                })()}
                                {routePreview[request.id].geometry?.length > 1 && (
                                  <>
                                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                      <RouteMap geometry={routePreview[request.id].geometry} origin={ORIGIN} destination={request.destination} height="180px" />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRoute(request.id)}
                                      disabled={savingRoute === request.id}
                                      className="mt-3 w-full py-2 px-4 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors disabled:opacity-60"
                                    >
                                      {savingRoute === request.id ? (
                                        <><Loader2 size={16} className="animate-spin" /> Saving...</>
                                      ) : (
                                        <><Save size={16} /> Save Route</>
                                      )}
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleApproveClick(request)}
                          className="flex-1 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                          <CheckCircle2 size={20} /> Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                          className="flex-1 py-3 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                          <XCircle size={20} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Read-only view for non-HODApproved */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  handleStatusUpdate(vehicleChangeModal.request.id, 'Approved', vehicleChangeModal.driverId, vehicleChangeModal.vehicleIds, null, null, vehicleChangeReason)
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
