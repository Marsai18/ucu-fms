import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Hourglass } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const ClientHistory = () => {
  const [filter, setFilter] = useState('all')
  const [requests, setRequests] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const [bookingRes, vehicleRes] = await Promise.all([
        api.getBookingRequests(),
        api.getVehicles()
      ])
      setRequests(Array.isArray(bookingRes) ? bookingRes : [])
      setVehicles(Array.isArray(vehicleRes) ? vehicleRes : [])
    } catch (error) {
      toast.error(error.message || 'Failed to load request history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const interval = setInterval(loadData, 25000)
    return () => clearInterval(interval)
  }, [])

  const getVehicleName = (vehicleId) => {
    const v = vehicles.find((x) => String(x.id) === String(vehicleId))
    return v ? `${v.plateNumber} • ${v.make} ${v.model}` : vehicleId || 'N/A'
  }

  const getVehiclesDisplay = (request) => {
    const ids = request.vehicleIds || (request.vehicleId ? [request.vehicleId] : [])
    if (ids.length === 0) return 'Admin will assign'
    if (ids.length === 1) return getVehicleName(ids[0])
    return ids.map((id) => getVehicleName(id)).join(', ')
  }

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'approved') return <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
    if (s === 'rejected') return <XCircle className="text-rose-600 dark:text-rose-400" size={20} />
    if (s === 'hodapproved') return <CheckCircle className="text-ucu-blue-600 dark:text-ucu-blue-400" size={20} />
    return <Hourglass className="text-amber-600 dark:text-amber-400" size={20} />
  }

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'approved') return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
    if (s === 'rejected') return 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
    if (s === 'hodapproved') return 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400'
    return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(req => (req.status || '').toLowerCase() === (filter === 'hodapproved' ? 'hodapproved' : filter.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium font-client">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 client-portal">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-client tracking-tight">Request History</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
          View the status of all your vehicle booking requests: Pending, Approved, Rejected
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600/50">
        {['all', 'pending', 'hodapproved', 'approved', 'rejected'].map((status) => {
          const count = status === 'all' ? requests.length : requests.filter(r => (r.status || '').toLowerCase() === status.toLowerCase()).length
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm capitalize transition-all font-client ${
                filter === status
                  ? 'bg-white dark:bg-slate-700 text-ucu-blue-600 dark:text-ucu-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600/50'
              }`}
            >
              {status === 'hodapproved' ? 'HOD Approved' : status} ({count})
            </button>
          )
        })}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/90 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center">
            <Clock size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No requests found</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              {filter === 'all' ? 'Submit a booking request to get started.' : `No ${filter} requests.`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-lg transition-all card-glow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-client">
                      {request.request_id || request.reference || request.id}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Submitted {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Vehicle</p>
                  {request.numberOfPassengers && (
                    <p className="text-ucu-blue-600 dark:text-ucu-blue-400 text-sm font-medium">{request.numberOfPassengers} passengers</p>
                  )}
                  <p className="text-slate-900 dark:text-white font-semibold">{getVehiclesDisplay(request)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Purpose</p>
                  <p className="text-slate-900 dark:text-white">{request.purpose || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin size={16} />
                    Destination
                  </p>
                  <p className="text-slate-900 dark:text-white">{request.destination || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Driver</p>
                  <p className="text-slate-900 dark:text-white">{request.driverId ? 'Assigned' : 'To be assigned'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar size={16} />
                    Start
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">{formatDate(request.startDateTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar size={16} />
                    End
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">{formatDate(request.endDateTime)}</p>
                </div>
              </div>

              {request.status === 'HODApproved' && (
                <div className="mt-4 p-3 bg-ucu-blue-50 dark:bg-ucu-blue-500/10 rounded-xl border border-ucu-blue-200/50 dark:border-ucu-blue-500/30">
                  <p className="text-sm text-ucu-blue-800 dark:text-ucu-blue-300 font-medium">
                    ✓ Approved by HOD — Forwarded to System Admin. Awaiting vehicle and driver assignment.
                  </p>
                </div>
              )}

              {request.status === 'Approved' && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200/50 dark:border-emerald-500/30">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                    ✓ Approved — Admin has assigned a driver. Your trip is confirmed.
                  </p>
                </div>
              )}

              {request.status === 'Rejected' && (
                <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200/50 dark:border-rose-500/30">
                  <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">
                    ✗ Rejected — Please submit a new request or contact fleet management.
                    {request.rejectionReason && (
                      <span className="block mt-2 text-rose-700 dark:text-rose-400">
                        Reason: {request.rejectionReason}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ClientHistory
