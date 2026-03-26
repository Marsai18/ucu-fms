import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckCircle2, Clock, XCircle, ArrowRight, MapPin, Users, FileText, Car } from 'lucide-react'
import api from '../utils/api'

const HODDashboard = () => {
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewBooking, setPreviewBooking] = useState(null)
  const [approvalModal, setApprovalModal] = useState({ open: false, bookingId: null })
  const [approvalNote, setApprovalNote] = useState('')
  const [rejectModal, setRejectModal] = useState({ open: false, bookingId: null })
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [bookRes, vehRes] = await Promise.all([
          api.getBookingRequests(),
          api.getVehicles()
        ])
        setBookings(Array.isArray(bookRes) ? bookRes : [])
        setVehicles(Array.isArray(vehRes) ? vehRes : [])
      } catch (err) {
        setBookings([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pending = bookings.filter(b => b.status === 'Pending')
  const hodApproved = bookings.filter(b => b.status === 'HODApproved')
  const approved = bookings.filter(b => b.status === 'Approved')
  const rejected = bookings.filter(b => b.status === 'Rejected')

  const getVehicleName = (vid) => {
    const v = vehicles.find(x => String(x.id) === String(vid))
    return v ? `${v.plateNumber} • ${v.make} ${v.model}` : vid || 'N/A'
  }
  const getVehicleDisplay = (b) => {
    const ids = b.vehicleIds?.length ? b.vehicleIds : (b.vehicleId ? [b.vehicleId] : [])
    if (!ids.length) return 'Any available'
    return ids.map(vid => getVehicleName(vid)).filter(Boolean).join(', ')
  }

  const handleReject = async (id, reason = '') => {
    setRejectModal({ open: false, bookingId: null })
    setRejectReason('')
    try {
      await api.updateBookingStatus(id, 'Rejected', null, null, null, null, null, reason)
      const data = await api.getBookingRequests()
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setRejectModal({ open: true, bookingId: id })
      setRejectReason(reason)
    }
  }

  const submitReject = () => {
    const id = rejectModal.bookingId
    if (!id) return
    handleReject(id, rejectReason.trim())
  }

  const handleApprove = async () => {
    const id = approvalModal.bookingId
    if (!id) return
    setApprovalModal({ open: false, bookingId: null })
    try {
      await api.updateBookingStatus(id, 'HODApproved', null, null, approvalNote, approvalNote)
      setApprovalNote('')
      const data = await api.getBookingRequests()
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setApprovalModal({ open: true, bookingId: id })
    }
  }

  const formatDate = (d) => {
    if (!d) return 'N/A'
    const parsed = new Date(d)
    return Number.isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">HOD Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Client requests come here first. Add your approval/signature, then forward to Admin. Admin only sees requests after you approve.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{pending.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 flex items-center justify-center">
              <ArrowRight size={20} className="text-ucu-blue-600 dark:text-ucu-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{hodApproved.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Forwarded to Admin</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{approved.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{rejected.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pending Requests (Awaiting Your Approval)</h2>
          <Link to="/hod/requests" className="text-sm font-medium text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {pending.slice(0, 5).map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">{b.request_id || b.id}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{b.destination || '—'} • {formatDate(b.startDateTime)}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {b.department && <span>Dept: {b.department}</span>}
                  <span>{b.numberOfPassengers ?? 1} passengers</span>
                  <span>Vehicle: {getVehicleDisplay(b)}</span>
                </div>
                {b.purpose && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{b.purpose}</p>}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => setPreviewBooking(b)}
                  className="px-4 py-2 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 font-semibold text-sm hover:bg-ucu-blue-200 dark:hover:bg-ucu-blue-500/30 flex items-center gap-1.5"
                >
                  <FileText size={16} /> Preview
                </button>
                <button
                  onClick={() => setApprovalModal({ open: true, bookingId: b.id })}
                  className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-sm hover:bg-emerald-200 dark:hover:bg-emerald-500/30"
                >
                  Approve & Forward
                </button>
                <button
                  onClick={() => setRejectModal({ open: true, bookingId: b.id })}
                  className="px-4 py-2 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold text-sm hover:bg-rose-200 dark:hover:bg-rose-500/30"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pending.length === 0 && (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No pending requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewBooking(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Booking Request Preview</h3>
              <button
                onClick={() => setPreviewBooking(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Request ID</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white">{previewBooking.request_id || previewBooking.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1"><MapPin size={12} /> Destination</p>
                <p className="text-slate-900 dark:text-white">{previewBooking.destination || '—'}</p>
              </div>
              {previewBooking.purpose && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1"><FileText size={12} /> Purpose</p>
                  <p className="text-slate-900 dark:text-white">{previewBooking.purpose}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1"><Users size={12} /> Passengers</p>
                <p className="text-slate-900 dark:text-white">{previewBooking.numberOfPassengers || 1}</p>
              </div>
              {previewBooking.department && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Department</p>
                  <p className="text-slate-900 dark:text-white">{previewBooking.department}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1"><Car size={12} /> Vehicle</p>
                <p className="text-slate-900 dark:text-white">{getVehicleDisplay(previewBooking)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1"><Calendar size={12} /> Schedule</p>
                <p className="text-slate-900 dark:text-white">Start: {formatDate(previewBooking.startDateTime)}</p>
                <p className="text-slate-900 dark:text-white">End: {formatDate(previewBooking.endDateTime)}</p>
              </div>
              {previewBooking.waypoints && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Waypoints</p>
                  <p className="text-slate-900 dark:text-white">{previewBooking.waypoints}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
              <button
                onClick={() => { setPreviewBooking(null); setApprovalModal({ open: true, bookingId: previewBooking.id }); }}
                className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                Approve & Forward
              </button>
              <button
                onClick={() => { setPreviewBooking(null); setRejectModal({ open: true, bookingId: previewBooking.id }); }}
                className="flex-1 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold"
              >
                Reject
              </button>
              <button
                onClick={() => setPreviewBooking(null)}
                className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOD Rejection Modal - reason required */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reject Request</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Please provide a reason for rejecting this booking request. The requester will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="e.g., Budget constraints, conflicting schedule, insufficient justification..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectModal({ open: false, bookingId: null }); setRejectReason(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                className="flex-1 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOD Approval Modal - add signature/approval note */}
      {approvalModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Approve & Forward to Admin</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Add your approval or signature (e.g. &quot;Approved by [Your Name], [Date]&quot;). This will be recorded and the request forwarded to System Admin.
            </p>
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="e.g., Approved by John Doe, Head of Department, 16/03/2026"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setApprovalModal({ open: false, bookingId: null }); setApprovalNote(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2 rounded-lg bg-ucu-gradient text-white font-semibold"
              >
                Approve & Forward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HODDashboard
