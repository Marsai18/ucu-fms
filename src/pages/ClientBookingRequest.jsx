import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Car, MapPin, CheckCircle2, Clock, AlertCircle, Users, Fuel, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import ClientTripScheduleFields from '../components/ClientTripScheduleFields'
import { getClientBookingWindowBounds, validateClientBookingRange } from '../utils/clientBookingDates'

const initialFormState = {
  vehicleId: '',
  numberOfPassengers: 1,
  purpose: '',
  destination: '',
  department: '',
  waypoints: '',
  startDateTime: '',
  endDateTime: ''
}

const DEPARTMENTS = [
  'Academic Affairs',
  'Administration',
  'Finance',
  'Human Resources',
  'ICT',
  'Library',
  'Maintenance',
  'Procurement',
  'Research',
  'Student Affairs',
  'Other'
]

const ClientBookingRequest = () => {
  const location = useLocation()
  const preselectedVehicleId = location.state?.preselectedVehicleId
  const [vehicles, setVehicles] = useState([])
  const [bookingRequests, setBookingRequests] = useState([])
  const [formData, setFormData] = useState(initialFormState)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bookingBoundsTick, setBookingBoundsTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setBookingBoundsTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const bookingBounds = useMemo(() => getClientBookingWindowBounds(), [bookingBoundsTick])

  const formatDateShort = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [vehicleRes, bookingRes] = await Promise.all([
          api.getVehicles(),
          api.getBookingRequests()
        ])
        setVehicles(Array.isArray(vehicleRes) ? vehicleRes : [])
        setBookingRequests(Array.isArray(bookingRes) ? bookingRes : [])
      } catch (error) {
        toast.error(error.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (preselectedVehicleId && vehicles.length) {
      setFormData(prev => ({ ...prev, vehicleId: preselectedVehicleId }))
    }
  }, [preselectedVehicleId, vehicles])

  const [filters, setFilters] = useState({ minSeats: '', routeType: '', vehicleType: '' })

  const availableVehicles = useMemo(() => {
    let list = vehicles.filter(
      (v) => {
        const status = (v.operationalStatus || '').toLowerCase()
        return status === 'available' || status === 'in_use' || status === 'on_trip'
      }
    )
    if (filters.minSeats) {
      const min = Number(filters.minSeats)
      list = list.filter((v) => (v.seats ?? 0) >= min)
    }
    if (filters.routeType) {
      list = list.filter((v) => (v.routeType || '').toLowerCase() === filters.routeType.toLowerCase())
    }
    if (filters.vehicleType) {
      list = list.filter((v) => (v.vehicleType || '').toLowerCase() === filters.vehicleType.toLowerCase())
    }
    return list
  }, [vehicles, filters])

  const getVehicleName = (vehicleId) => {
    const v = vehicles.find((x) => String(x.id) === String(vehicleId))
    return v ? `${v.plateNumber} • ${v.make} ${v.model}` : vehicleId || 'N/A'
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const applyStartDateTime = useCallback(
    (raw) => {
      let v = raw
      const { min, max } = bookingBounds
      if (v && v < min) v = min
      if (v && v > max) v = max
      setFormData((prev) => {
        let end = prev.endDateTime
        const floor = v || min
        if (end && end <= floor) end = ''
        return { ...prev, startDateTime: v, endDateTime: end }
      })
    },
    [bookingBounds]
  )

  const applyEndDateTime = useCallback(
    (raw) => {
      let v = raw
      const { min } = bookingBounds
      const startFloor = formData.startDateTime || min
      if (v && v < startFloor) v = startFloor
      setFormData((prev) => ({ ...prev, endDateTime: v }))
    },
    [bookingBounds, formData.startDateTime]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    const passengers = Number(formData.numberOfPassengers) || 1
    if (passengers < 1) {
      toast.error('Number of passengers must be at least 1')
      return
    }
    if (!formData.department) {
      toast.error('Please select your department')
      return
    }
    if (!formData.purpose?.trim()) {
      toast.error('Please describe the purpose of the trip')
      return
    }
    if (!formData.destination?.trim()) {
      toast.error('Please enter the destination')
      return
    }
    if (!formData.startDateTime || !formData.endDateTime) {
      toast.error('Please fill in start and end date/time')
      return
    }
    const range = validateClientBookingRange(formData.startDateTime, formData.endDateTime)
    if (!range.ok) {
      toast.error(range.message)
      return
    }
    try {
      setSubmitting(true)
      await api.createBookingRequest({
        vehicleId: formData.vehicleId || null,
        numberOfPassengers: passengers,
        purpose: formData.purpose,
        destination: formData.destination,
        department: formData.department || null,
        waypoints: (formData.waypoints || '').trim() || null,
        // Send both field variants so hosted Prisma and local backend stay compatible.
        startDate: formData.startDateTime,
        startDateTime: formData.startDateTime,
        endDate: formData.endDateTime,
        endDateTime: formData.endDateTime,
        status: 'Pending'
      })
      toast.success('Request submitted. Admin will review and assign a driver.')
      setFormData(initialFormState)
      const updated = await api.getBookingRequests()
      setBookingRequests(Array.isArray(updated) ? updated : [])
    } catch (error) {
      toast.error(error.message || 'Could not submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-ucu-blue-500 focus:border-ucu-blue-500 py-2.5 px-4 transition-colors font-client'
  const labelClass =
    'text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 font-client'

  const myRequests = bookingRequests

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium font-client">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 client-portal">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-client tracking-tight">New Booking Request</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
          Submit a vehicle booking request. Flow: Pending (HOD) → HOD Approved (Admin) → Approved or Rejected.
        </p>
      </div>

      {/* Available Vehicles Preview */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 font-client flex items-center gap-2">
          <Car size={20} className="text-ucu-blue-500" />
          Available Vehicles (capacity, fuel consumption, journey type)
        </h2>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="number"
            min="1"
            placeholder="Min seats"
            value={filters.minSeats}
            onChange={(e) => setFilters((f) => ({ ...f, minSeats: e.target.value }))}
            className="rounded-xl border-2 border-slate-200 dark:border-slate-600 py-2 px-4 text-sm w-28"
          />
          <select
            value={filters.routeType}
            onChange={(e) => setFilters((f) => ({ ...f, routeType: e.target.value }))}
            className="rounded-xl border-2 border-slate-200 dark:border-slate-600 py-2 px-4 text-sm"
          >
            <option value="">Any journey</option>
            <option value="Short">Short</option>
            <option value="Long">Long</option>
          </select>
          <select
            value={filters.vehicleType}
            onChange={(e) => setFilters((f) => ({ ...f, vehicleType: e.target.value }))}
            className="rounded-xl border-2 border-slate-200 dark:border-slate-600 py-2 px-4 text-sm"
          >
            <option value="">Any type</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Pickup">Pickup</option>
            <option value="Minibus">Minibus</option>
            <option value="Bus">Bus</option>
            <option value="Van">Van</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[280px] overflow-y-auto custom-scroll">
          {availableVehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => setFormData(prev => ({ ...prev, vehicleId: v.id }))}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.vehicleId === v.id
                  ? 'border-ucu-blue-500 bg-ucu-blue-50 dark:bg-ucu-blue-500/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-ucu-blue-300 dark:hover:border-ucu-blue-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-white">{v.plateNumber}</span>
                {v.routeType && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    (v.routeType || '').toLowerCase() === 'long'
                      ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700'
                  }`}>
                    {v.routeType}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{v.make} {v.model}</p>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {v.seats ?? '—'} seats
                </span>
                <span className="flex items-center gap-1">
                  <Fuel size={12} /> {v.fuelEfficiency != null ? `${v.fuelEfficiency} km/L` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
        {availableVehicles.length === 0 && (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            <AlertCircle size={24} className="mx-auto mb-2 opacity-60" />
            <p className="font-medium">No vehicles match filters. Try adjusting or browse <Link to="/client/vehicles" className="text-ucu-blue-600 dark:text-ucu-blue-400 underline font-semibold">Available Vehicles</Link>.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
        {/* Request Form */}
        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu card-glow">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 font-client">
            <Car size={20} className="text-ucu-blue-500" /> Submit Request
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
            Select a vehicle above, fill details, and submit to admin.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className={labelClass}>
                <Building2 size={16} className="text-ucu-blue-500" /> Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="">Select your department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>
                <Users size={16} className="text-ucu-blue-500" /> Number of People Going
              </label>
              <input
                type="number"
                name="numberOfPassengers"
                min="1"
                max="200"
                value={formData.numberOfPassengers}
                onChange={handleInputChange}
                placeholder="e.g., 15"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Admin will assign vehicles based on this capacity</p>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>
                <Car size={16} className="text-ucu-blue-500" /> Preferred Vehicle (optional)
              </label>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="">Admin will assign based on passenger count</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} • {vehicle.make} {vehicle.model} • {vehicle.seats ?? '—'} seats • {vehicle.fuelEfficiency ?? '—'} km/L
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Purpose</label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                rows="2"
                placeholder="Briefly describe the purpose"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <MapPin size={16} className="text-ucu-blue-500" /> Destination
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="e.g., Kampala City, Entebbe Airport"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <MapPin size={16} className="text-ucu-blue-500" /> Waypoints (optional)
              </label>
              <input
                type="text"
                name="waypoints"
                value={formData.waypoints}
                onChange={handleInputChange}
                placeholder="e.g., Mukono, Lugazi — comma-separated stops between origin and destination"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Stops along the route for route calculation</p>
            </div>

            <ClientTripScheduleFields
              bookingBounds={bookingBounds}
              startDateTime={formData.startDateTime}
              endDateTime={formData.endDateTime}
              onStartChange={applyStartDateTime}
              onEndChange={applyEndDateTime}
              fieldClassName="focus:ring-2 focus:ring-ucu-blue-500 focus:border-ucu-blue-500 transition-colors font-client"
              labelRowClassName={labelClass}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-ucu-gradient text-white font-bold py-3 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all font-client"
              >
                {submitting ? 'Submitting...' : 'Submit to Admin'}
              </button>
              <button
                type="button"
                onClick={() => setFormData(initialFormState)}
                className="sm:w-auto px-4 rounded-xl border-2 border-ucu-gold-300 dark:border-ucu-gold-500 text-ucu-gold-700 dark:text-ucu-gold-400 font-semibold hover:bg-ucu-gold-50 dark:hover:bg-ucu-gold-500/20 transition-all py-3 font-client"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* My Requests - Status */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 font-client">
            <Clock size={20} className="text-ucu-blue-500" /> Request Status
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
            Pending → HOD Approved → Approved/Rejected — synced across dashboards
          </p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scroll">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-slate-200/80 dark:border-slate-600/50 p-4 bg-slate-50/30 dark:bg-slate-700/20"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white font-client">
                      {request.request_id || request.reference || request.id}
                    </span>
                    {(request.clientName || request.client_name) && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium truncate" title={request.clientName || request.client_name}>
                        {request.clientName || request.client_name}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      request.status === 'Pending'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        : request.status === 'HODApproved'
                        ? 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400'
                        : request.status === 'Approved'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : request.status === 'Rejected'
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {request.numberOfPassengers && (
                    <p><span className="font-medium text-slate-500 dark:text-slate-400">Passengers:</span> {request.numberOfPassengers}</p>
                  )}
                  <p><span className="font-medium text-slate-500 dark:text-slate-400">Vehicle:</span> {getVehicleName(request.vehicleId)}</p>
                  <p><span className="font-medium text-slate-500 dark:text-slate-400">Destination:</span> {request.destination || '—'}</p>
                  {request.waypoints && (
                    <p><span className="font-medium text-slate-500 dark:text-slate-400">Waypoints:</span> {request.waypoints}</p>
                  )}
                  <p><span className="font-medium text-slate-500 dark:text-slate-400">Start:</span> {formatDateShort(request.startDateTime)}</p>
                  <p><span className="font-medium text-slate-500 dark:text-slate-400">End:</span> {formatDateShort(request.endDateTime)}</p>
                </div>
              </div>
            ))}
          </div>

          {!myRequests.length && (
            <div className="text-center py-12 px-4">
              <div className="inline-flex h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No requests yet.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Submit a request above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientBookingRequest
