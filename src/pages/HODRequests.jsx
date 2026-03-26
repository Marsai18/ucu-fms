import React, { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, XCircle, MapPin, Car, FileText, Users } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const HODRequests = () => {
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Pending')
  const [approvalModal, setApprovalModal] = useState({ open: false, bookingId: null })
  const [rejectModal, setRejectModal] = useState({ open: false, bookingId: null })
  const [previewBooking, setPreviewBooking] = useState(null)
  const [approvalNote, setApprovalNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const statusParam = activeTab === 'All' ? 'all' : activeTab
        const [bookRes, vehRes] = await Promise.all([
          api.getBookingRequests(statusParam),
          api.getVehicles()
        ])
        setBookings(Array.isArray(bookRes) ? bookRes : [])
        setVehicles(Array.isArray(vehRes) ? vehRes : [])
      } catch (err) {
        toast.error(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeTab])

  const filtered = bookings
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
      toast.success('Request rejected')
      const data = await api.getBookingRequests(activeTab === 'All' ? 'all' : activeTab)
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Failed to update')
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
      toast.success('Approved and forwarded to Admin. Your signature has been recorded.')
      setApprovalNote('')
      const data = await api.getBookingRequests(activeTab === 'All' ? 'all' : undefined)
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Failed to approve')
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
        <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Booking Requests</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Approve requests to forward to System Admin, or reject them.</p>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
        {['Pending', 'HODApproved', 'Approved', 'Rejected', 'All'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-ucu-gradient text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
                {tab}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Flow:</strong> Client requests come here first. Add your approval/signature, then forward to Admin. Admin never sees Pending requests.
          </p>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Request</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Destination</th>
                <th className="py-3 px-4 font-semibold">Passengers</th>
                <th className="py-3 px-4 font-semibold">Start / End</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 dark:text-white">{b.request_id || b.id}</span>
                    {b.purpose && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.purpose}</p>}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{b.department || '—'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate" title={getVehicleDisplay(b)}>{getVehicleDisplay(b)}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{b.destination || '—'}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{b.numberOfPassengers ?? 1}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatDate(b.startDateTime)} / {formatDate(b.endDateTime)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      b.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                      b.status === 'HODApproved' ? 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400' :
                      b.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                      'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {b.status === 'Pending' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setPreviewBooking(b)}
                          className="px-3 py-1.5 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 font-semibold text-xs flex items-center gap-1"
                        >
                          <FileText size={14} /> Preview
                        </button>
                        <button
                          onClick={() => setApprovalModal({ open: true, bookingId: b.id })}
                          className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 size={14} /> Approve & Forward
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, bookingId: b.id })}
                          className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold text-xs flex items-center gap-1"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No {activeTab.toLowerCase()} requests</p>
          </div>
        )}
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

      {/* HOD Rejection Modal - reason */}
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
              Add your approval or signature (e.g. "Approved by [Your Name], [Date]"). This will be recorded and the request forwarded to System Admin.
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

export default HODRequests
