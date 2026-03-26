import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Send, History, Car, ChevronRight, Users, Building2, Bell } from 'lucide-react'
import NotificationItem from '../components/NotificationItem'
import toast from 'react-hot-toast'
import api from '../utils/api'

const initialFormState = {
  vehicleId: '',
  numberOfPassengers: 1,
  purpose: '',
  destination: '',
  department: '',
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

const ClientDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications, markAsRead } = useNotifications()
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [formData, setFormData] = useState(initialFormState)
  const [vehicleFilters, setVehicleFilters] = useState({ minSeats: '', routeType: '', vehicleType: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [bookingRes, vehicleRes] = await Promise.all([
        api.getBookingRequests(),
        api.getVehicles()
      ])
      const requests = Array.isArray(bookingRes) ? bookingRes : []
      setRecentRequests(requests.slice(0, 5))
        setStats({
          totalRequests: requests.length,
          pendingRequests: requests.filter(r => ['pending', 'hodapproved'].includes((r.status || '').toLowerCase())).length,
          approvedRequests: requests.filter(r => (r.status || '').toLowerCase() === 'approved').length,
          rejectedRequests: requests.filter(r => (r.status || '').toLowerCase() === 'rejected').length
        })
      setVehicles(Array.isArray(vehicleRes) ? vehicleRes : [])
    } catch (error) {
      toast.error(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const interval = setInterval(loadData, 20000)
    return () => clearInterval(interval)
  }, [])

  const availableVehicles = useMemo(() => {
    let list = vehicles.filter((v) => (v.operationalStatus || '').toLowerCase() === 'active')
    if (vehicleFilters.minSeats) {
      const min = Number(vehicleFilters.minSeats)
      list = list.filter((v) => (v.seats ?? 0) >= min)
    }
    if (vehicleFilters.routeType) {
      list = list.filter((v) => (v.routeType || '').toLowerCase() === vehicleFilters.routeType.toLowerCase())
    }
    if (vehicleFilters.vehicleType) {
      list = list.filter((v) => (v.vehicleType || '').toLowerCase() === vehicleFilters.vehicleType.toLowerCase())
    }
    return list
  }, [vehicles, vehicleFilters])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getMinDateTime = () => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  }

  const handleSubmitRequest = async (e) => {
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
    const start = new Date(formData.startDateTime)
    const end = new Date(formData.endDateTime)
    const now = new Date()
    if (start < now) {
      toast.error('Start date/time cannot be in the past')
      return
    }
    if (end <= start) {
      toast.error('End date/time must be after start date/time')
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
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        status: 'Pending'
      })
      toast.success('Request submitted. HOD will review, then Admin will assign a driver.')
      setFormData(initialFormState)
      loadData()
    } catch (error) {
      toast.error(error.message || 'Could not submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateShort = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'approved') return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
    if (s === 'hodapproved') return 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400'
    if (s === 'rejected') return 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
    return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium font-client">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 client-portal">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ucu-blue-600 via-ucu-blue-700 to-slate-800 text-white p-8 shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold font-client tracking-tight">Welcome back!</h1>
          <p className="mt-2 text-ucu-blue-100 text-lg font-medium">
            {user?.name || user?.email || 'Client'} • UCU Fleet Management Portal
          </p>
        </div>
      </div>

      {/* Create New Booking Request - Client sends requests */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 font-client">
          <Car size={20} className="text-ucu-blue-500" /> Create New Booking Request
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-client">
          Only free vehicles are listed. Your request goes directly to HOD first. After HOD approves (with signature), it is forwarded to Admin for vehicle/driver assignment.
        </p>

        {/* Filter vehicles */}
        <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30 space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-client">Filter vehicles (seats, journey type)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400">Min seats</label>
              <input
                type="number"
                min="1"
                value={vehicleFilters.minSeats}
                onChange={(e) => setVehicleFilters((f) => ({ ...f, minSeats: e.target.value }))}
                placeholder="Any"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 py-2 px-3 text-sm bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400">Journey type</label>
              <select
                value={vehicleFilters.routeType}
                onChange={(e) => setVehicleFilters((f) => ({ ...f, routeType: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 py-2 px-3 text-sm bg-white dark:bg-slate-700"
              >
                <option value="">Any</option>
                <option value="Short">Short</option>
                <option value="Long">Long</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400">Vehicle type</label>
              <select
                value={vehicleFilters.vehicleType}
                onChange={(e) => setVehicleFilters((f) => ({ ...f, vehicleType: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 py-2 px-3 text-sm bg-white dark:bg-slate-700"
              >
                <option value="">Any</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Pickup">Pickup</option>
                <option value="Minibus">Minibus</option>
                <option value="Bus">Bus</option>
                <option value="Van">Van</option>
              </select>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmitRequest}>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 font-client">
              <Building2 size={16} className="text-ucu-blue-500" /> Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleFormChange}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-ucu-blue-500 py-2.5 px-4 mt-1"
            >
              <option value="">Select your department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 font-client">
              <Users size={16} className="text-ucu-blue-500" /> Number of People Going
            </label>
            <input
              type="number"
              name="numberOfPassengers"
              min="1"
              max="200"
              value={formData.numberOfPassengers}
              onChange={handleFormChange}
              placeholder="e.g., 15"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-ucu-blue-500 py-2.5 px-4 mt-1"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Admin will assign vehicles based on this capacity</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 font-client">
              <Car size={16} className="text-ucu-blue-500" /> Preferred Vehicle (optional)
            </label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleFormChange}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-ucu-blue-500 py-2.5 px-4 mt-1"
            >
              <option value="">Admin will assign based on passenger count</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} • {v.make} {v.model} ({v.seats ?? '?'} seats)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-client">Purpose of Trip</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleFormChange}
              rows="2"
              placeholder="Briefly describe the purpose"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2.5 px-4 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 font-client">
              <MapPin size={16} className="text-ucu-blue-500" /> Destination
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleFormChange}
              placeholder="e.g., Kampala City, Entebbe Airport"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2.5 px-4 mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 font-client">
                <Calendar size={16} className="text-ucu-blue-500" /> Start
              </label>
              <input
                type="datetime-local"
                name="startDateTime"
                value={formData.startDateTime}
                onChange={handleFormChange}
                min={getMinDateTime()}
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2.5 px-4 mt-1"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cannot select past dates</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 font-client">
                <Calendar size={16} className="text-ucu-blue-500" /> End
              </label>
              <input
                type="datetime-local"
                name="endDateTime"
                value={formData.endDateTime}
                onChange={handleFormChange}
                min={formData.startDateTime || getMinDateTime()}
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-2.5 px-4 mt-1"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-ucu-gradient text-white font-semibold py-3 hover:shadow-ucu disabled:opacity-40 disabled:cursor-not-allowed transition-all font-client"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: stats.totalRequests, icon: History, color: 'ucu-blue', bg: 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20', text: 'text-ucu-blue-600 dark:text-ucu-blue-400' },
          { label: 'Pending', value: stats.pendingRequests, icon: Clock, color: 'amber', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
          { label: 'Approved', value: stats.approvedRequests, icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Rejected', value: stats.rejectedRequests, icon: XCircle, color: 'rose', bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' }
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-lg transition-all duration-300 card-glow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 font-client">{label}</p>
                <p className={`text-3xl font-bold mt-1 font-client ${text}`}>{value}</p>
              </div>
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={text} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications - clickable, navigate to relevant page */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-client flex items-center gap-2">
            <Bell size={22} className="text-ucu-blue-500" /> Notifications
          </h2>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {notifications.filter(n => !n.read).length} unread
          </span>
        </div>
        <div className="p-4 max-h-[360px] overflow-y-auto custom-scroll space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Bell size={40} className="mx-auto mb-2 opacity-50" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1">You will see HOD approvals and driver assignments here. Click any notification to view details.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={markAsRead}
                role="client"
                variant="card"
              />
            ))
          )}
        </div>
      </div>

      {/* Quick Actions & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 font-client">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/client/vehicles')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-ucu-blue-50 dark:hover:bg-ucu-blue-500/10 rounded-xl transition-all group border border-slate-200/80 dark:border-slate-600/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-ucu-blue-500 rounded-xl group-hover:bg-ucu-blue-600 transition-colors">
                  <Car className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white font-client">Browse Available Vehicles</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">View capacity, fuel consumption & journey type</p>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-ucu-blue-500" size={20} />
            </button>
            <button
              onClick={() => navigate('/client/request')}
              className="w-full flex items-center justify-between p-4 bg-ucu-blue-50 dark:bg-ucu-blue-500/10 hover:bg-ucu-blue-100 dark:hover:bg-ucu-blue-500/20 rounded-xl transition-all group border border-ucu-blue-200/50 dark:border-ucu-blue-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-ucu-blue-500 rounded-xl group-hover:bg-ucu-blue-600 transition-colors">
                  <Send className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white font-client">New Booking Request</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Submit a vehicle booking request</p>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-ucu-blue-500" size={20} />
            </button>
            <button
              onClick={() => navigate('/client/history')}
              className="w-full flex items-center justify-between p-4 bg-ucu-gold-50 dark:bg-ucu-gold-500/10 hover:bg-ucu-gold-100 dark:hover:bg-ucu-gold-500/20 rounded-xl transition-all group border border-ucu-gold-200/50 dark:border-ucu-gold-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-ucu-gold-500 rounded-xl group-hover:bg-ucu-gold-600 transition-colors">
                  <History className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white font-client">Request History</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Check status: Pending, Approved, Rejected</p>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-ucu-gold-500" size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-client">Recent Requests</h2>
            <button
              onClick={() => navigate('/client/history')}
              className="text-sm font-semibold text-ucu-blue-600 dark:text-ucu-blue-400 hover:text-ucu-blue-700 dark:hover:text-ucu-blue-300 transition-colors font-client"
            >
              View All
            </button>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scroll">
            {recentRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <History size={40} className="mx-auto mb-2 opacity-50" />
                <p className="font-medium">No requests yet</p>
                <p className="text-sm mt-1">Submit your first booking request</p>
                <button
                  onClick={() => navigate('/client/request')}
                  className="mt-3 px-4 py-2 rounded-xl bg-ucu-blue-500 text-white font-semibold hover:bg-ucu-blue-600 transition-colors"
                >
                  New Request
                </button>
              </div>
            ) : (
              recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border border-slate-200/80 dark:border-slate-600/50 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/client/history')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white font-client">
                      {request.request_id || request.reference || request.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin size={14} className="text-ucu-blue-500 shrink-0" />
                    <span className="truncate">{request.destination || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 mt-1">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span>{formatDateShort(request.startDateTime)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* How to Request */}
      <div className="bg-gradient-to-r from-slate-50 to-ucu-blue-50/50 dark:from-slate-800/80 dark:to-ucu-blue-900/20 border border-slate-200/80 dark:border-slate-600/50 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 font-client">How to Request a Vehicle</h3>
        <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 font-medium">
          <li>Use the form above to submit a booking request (filter vehicles by seats, journey type)</li>
          <li>HOD reviews and forwards to Admin; Admin assigns driver and approves</li>
          <li>Track status in Request History: <span className="text-amber-600 dark:text-amber-400">Pending</span>, <span className="text-ucu-blue-600 dark:text-ucu-blue-400">HOD Approved</span>, <span className="text-emerald-600 dark:text-emerald-400">Approved</span>, <span className="text-rose-600 dark:text-rose-400">Rejected</span></li>
        </ol>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          <strong>Need help?</strong> Contact{' '}
          <a href="mailto:fleet@ucu.ac.ug" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline font-semibold">
            fleet@ucu.ac.ug
          </a>
        </p>
      </div>
    </div>
  )
}

export default ClientDashboard
