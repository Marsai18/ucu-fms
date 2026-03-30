import React, { useEffect, useState, useCallback, useMemo } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { calcFuelEstimate } from '../utils/fuelCalculator'
import { Route, MapPin, Car, Table2, Fuel, ThumbsUp, ThumbsDown } from 'lucide-react'
import RouteMap from '../components/RouteMap'
import TripResponseActions from '../components/TripResponseActions'
import { getTripLabel, getRouteLabel, tripMatchesRoute, normalizeOrigin, DEFAULT_ORIGIN } from '../utils/tripUtils'

const ORIGIN = DEFAULT_ORIGIN

const DriverRoutes = () => {
  const [routes, setRoutes] = useState([])
  const [savedRoutes, setSavedRoutes] = useState([])
  const [trips, setTrips] = useState([])
  const [profile, setProfile] = useState(null)
  const [fuelLogs, setFuelLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [savedLoading, setSavedLoading] = useState(true)
  const [expandedMapId, setExpandedMapId] = useState(null)
  const [expandedRouteId, setExpandedRouteId] = useState(null)
  const [fuelLogForm, setFuelLogForm] = useState({ selectedKey: '', tripId: '', vehicleId: '', routeId: '', quantity: '', distanceCovered: '', cost: '', notes: '' })
  const [savingFuelLog, setSavingFuelLog] = useState(false)
  const [declineModal, setDeclineModal] = useState({ open: false, tripId: null })
  const [declineReason, setDeclineReason] = useState('')

  const fetchRoutes = useCallback(async () => {
    try {
      const [routesData, tripsData, logsData] = await Promise.all([
        api.getDriverRoutes(),
        api.getDriverTrips().catch(() => []),
        api.getDriverFuelLogs().catch(() => [])
      ])
      setRoutes(Array.isArray(routesData) ? routesData : [])
      setTrips(Array.isArray(tripsData) ? tripsData : [])
      setFuelLogs(Array.isArray(logsData) ? logsData : [])
    } catch (err) {
      console.error('Failed to fetch routes:', err)
      setRoutes([])
    }
  }, [])

  const needsResponse = (trip) => trip.status === 'Pending'

  const handleAccept = async (e, tripId) => {
    e?.stopPropagation?.()
    try {
      await api.acceptTrip(tripId)
      toast.success('Trip accepted')
      fetchRoutes()
      setExpandedRouteId(null)
    } catch (err) {
      toast.error(err.message || 'Failed to accept')
    }
  }

  const handleDeclineClick = (e, tripId) => {
    e?.stopPropagation?.()
    setDeclineModal({ open: true, tripId })
    setDeclineReason('')
  }

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for turning down')
      return
    }
    try {
      await api.rejectTrip(declineModal.tripId, declineReason.trim())
      toast.success('Trip turned down')
      setDeclineModal({ open: false, tripId: null })
      setDeclineReason('')
      fetchRoutes()
      setExpandedRouteId(null)
    } catch (err) {
      toast.error(err.message || 'Failed to decline')
    }
  }

  const fetchSavedRoutes = useCallback(async () => {
    try {
      const data = await api.getSavedRoutes(true)
      setSavedRoutes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch saved routes:', err)
      setSavedRoutes([])
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [routesData, tripsData, profileData, logsData] = await Promise.all([
          api.getDriverRoutes(),
          api.getDriverTrips().catch(() => []),
          api.getDriverProfile().catch(() => null),
          api.getDriverFuelLogs().catch(() => [])
        ])
        setRoutes(Array.isArray(routesData) ? routesData : [])
        setTrips(Array.isArray(tripsData) ? tripsData : [])
        setProfile(profileData)
        setFuelLogs(Array.isArray(logsData) ? logsData : [])
      } catch (err) {
        console.error('Failed to fetch routes:', err)
        setRoutes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getSavedRoutes(true)
        setSavedRoutes(Array.isArray(data) ? data : [])
      } catch {
        setSavedRoutes([])
      } finally {
        setSavedLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const refreshAll = () => {
      fetchRoutes()
      fetchSavedRoutes()
    }
    const interval = setInterval(refreshAll, 20000)
    return () => clearInterval(interval)
  }, [fetchRoutes, fetchSavedRoutes])

  // Fuel log options from saved routes + assigned routes
  const fuelLogOptions = useMemo(() => {
    const opts = []
    const seen = new Set()
    const addOpt = (o) => {
      if (o.vehicleId && !seen.has(o.key)) {
        seen.add(o.key)
        opts.push(o)
      }
    }
    savedRoutes.forEach((r) => {
      const vId = r.preferredVehicle || (r.vehicle?.id)
      if (!vId) return
      const dist = r.distance ?? r.distanceKm ?? 0
      const dur = r.duration ?? r.durationMinutes ?? 0
      addOpt({
        key: `saved-${r.id}`,
        routeId: r.id,
        vehicleId: vId,
        vehicle: r.vehicle,
        tripId: null,
        label: `${r.vehicle?.plateNumber || 'Vehicle'} • ${getRouteLabel(r)} (${dist} km)`,
        distanceCovered: dist,
        durationMin: dur,
        cost: ''
      })
    })
    routes.forEach((r) => {
      const vId = r.preferredVehicle || (r.vehicle?.id)
      if (!vId) return
      const dist = r.distance ?? r.distanceKm ?? 0
      const dur = r.duration ?? r.durationMinutes ?? 0
      addOpt({
        key: `route-${r.id}`,
        routeId: r.id,
        vehicleId: vId,
        vehicle: r.vehicle,
        tripId: r.tripId || null,
        label: `${r.vehicle?.plateNumber || 'Vehicle'} • ${getRouteLabel(r)} (${dist} km)`,
        distanceCovered: dist,
        durationMin: dur,
        cost: ''
      })
    })
    if (profile?.assignedVehicle && !opts.some(o => String(o.vehicleId) === String(profile.assignedVehicle.id))) {
      opts.push({
        key: 'vehicle-only',
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
  }, [savedRoutes, routes, profile?.assignedVehicle])

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
      await api.createDriverFuelLog({
        vehicleId,
        routeId: fuelLogForm.routeId || null,
        tripId: fuelLogForm.tripId || null,
        quantity: Number(fuelLogForm.quantity),
        distanceCovered: fuelLogForm.distanceCovered ? Number(fuelLogForm.distanceCovered) : null,
        cost: Number(fuelLogForm.cost),
        notes: fuelLogForm.notes || ''
      })
      toast.success('Fuel log recorded')
      setFuelLogForm({ selectedKey: '', tripId: '', vehicleId: '', routeId: '', quantity: '', distanceCovered: '', cost: '', notes: '' })
      fetchRoutes()
    } catch (err) {
      toast.error(err.message || 'Failed to save fuel log')
    } finally {
      setSavingFuelLog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading routes...</p>
        </div>
      </div>
    )
  }

  const pendingResponseTrips = trips.filter(t => needsResponse(t))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assigned Routes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Routes planned by admin and assigned to you</p>
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
                      onAccept={(e) => handleAccept(e, trip.id)}
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
          </div>
        )}
      </div>

      {/* Saved Routes Table - for driver to view */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-700/30 flex items-center gap-2">
          <Table2 size={20} className="text-ucu-blue-600 dark:text-ucu-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Saved Routes</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">({savedRoutes.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Origin</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Destination</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Vehicle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Distance</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Duration</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Waypoints</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Request Ref</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Map</th>
              </tr>
            </thead>
            <tbody>
              {savedLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading saved routes...
                  </td>
                </tr>
              ) : savedRoutes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    No saved routes available. Admin saves routes from Booking Requests.
                  </td>
                </tr>
              ) : (
                savedRoutes.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`border-b border-gray-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${expandedMapId === r.id ? 'bg-slate-50 dark:bg-slate-700/30' : ''}`}
                      onClick={() => setExpandedMapId(expandedMapId === r.id ? null : r.id)}
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{normalizeOrigin(r.origin)}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{r.destination || '—'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {r.vehicle ? `${r.vehicle.plateNumber} • ${r.vehicle.make}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-ucu-blue-600 dark:text-ucu-blue-400 font-medium">{r.distance ?? 0} km</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">~{r.duration ?? 0} min</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={r.waypoints}>
                        {r.waypoints || '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{r.requestRef || r.bookingId || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="text-ucu-blue-600 dark:text-ucu-blue-400 font-medium text-xs">
                          {expandedMapId === r.id ? '▲ Hide map' : '▼ View map'}
                        </span>
                      </td>
                    </tr>
                    {expandedMapId === r.id && (
                      <tr>
                        <td colSpan={8} className="py-4 px-4 bg-slate-50 dark:bg-slate-800/50">
                          <div className="max-w-2xl">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Route Map — {getRouteLabel(r)}</p>
                            <RouteMap geometry={r.geometry} origin={r.origin || ORIGIN} destination={r.destination} height="240px" />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
          >
            <div
              className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              onClick={() => setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="text-ucu-blue-600 dark:text-ucu-blue-400" size={20} />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {getRouteLabel(route)}
                    </span>
                    <span className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400">
                      {expandedRouteId === route.id ? '▲ Hide map' : '▼ Click for details & map'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Distance:</strong> {route.distance ?? 0} km</p>
                    <p><strong>Duration:</strong> ~{route.duration ?? 0} min</p>
                  </div>
                  {route.tripId && (
                    <p className="text-xs text-ucu-blue-600 dark:text-ucu-blue-400 mt-1">Best route (auto-calculated)</p>
                  )}
                  {route.waypoints && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 flex items-start gap-2">
                      <MapPin size={14} className="shrink-0 mt-0.5" />
                      Waypoints: {route.waypoints}
                    </p>
                  )}
                  {route.vehicle && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                      <Car size={14} />
                      {route.vehicle.plateNumber} • {route.vehicle.make} {route.vehicle.model}
                    </p>
                  )}
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    route.status === 'Saved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                    route.status === 'Draft' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400'
                  }`}>
                    {route.status}
                  </span>
                </div>
              </div>
            </div>
            {expandedRouteId === route.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Route Map — {getRouteLabel(route)}</p>
                <RouteMap
                  geometry={route.geometry}
                  origin={route.origin}
                  destination={route.destination}
                  height="280px"
                />
                {(() => {
                  let linkedTrip = route.tripId ? trips.find(t => String(t.id) === String(route.tripId)) : null
                  if (!linkedTrip) linkedTrip = trips.find(t => tripMatchesRoute(t, route))
                  const needsResp = linkedTrip && needsResponse(linkedTrip)
                  if (!needsResp) return null
                  return (
                    <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600" onClick={(e) => e.stopPropagation()}>
                      <TripResponseActions
                        onAccept={(e) => handleAccept(e, linkedTrip.id)}
                        onReject={(e) => handleDeclineClick(e, linkedTrip.id)}
                      />
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        ))}
        {routes.length === 0 && (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <Route className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400">No routes assigned yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Routes will appear here when admin assigns them to you</p>
          </div>
        )}
      </div>

      {/* Fuel Log — for all drivers with routes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Fuel size={22} className="text-emerald-500" /> Fuel Log
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select your vehicle and route — quantity, distance and cost auto-fill from consumption rate. Available for all drivers with assigned routes.</p>
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
        {fuelLogOptions.length === 0 && !profile?.assignedVehicle && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">No routes or vehicle assigned. Contact admin to get routes assigned before logging fuel.</p>
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

      {/* Reject modal — reason required */}
      {declineModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ThumbsDown size={20} className="text-rose-500" /> Reject Trip
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
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverRoutes
