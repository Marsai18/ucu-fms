import React, { useEffect, useState } from 'react'
import { AlertTriangle, ShieldCheck, User, Car, MessageSquare, Download, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const getEvidenceMimeType = (fileName) => {
  const ext = (fileName || '').toLowerCase().split('.').pop()
  const mimes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }
  return mimes[ext] || 'image/jpeg'
}

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [responseModal, setResponseModal] = useState(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [incidentRes, vehicleRes, driverRes] = await Promise.all([
          api.getIncidents(),
          api.getVehicles(),
          api.getDrivers()
        ])
        setIncidents(Array.isArray(incidentRes) ? incidentRes : [])
        setVehicles(Array.isArray(vehicleRes) ? vehicleRes : [])
        setDrivers(Array.isArray(driverRes) ? driverRes : [])
      } catch (error) {
        toast.error(error.message || 'Failed to load incidents')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const updateIncidentStatus = async (incidentId, status, adminResp = null) => {
    try {
      const updates = { status }
      if (adminResp && adminResp.trim()) updates.adminResponse = adminResp.trim()
      await api.updateIncident(incidentId, updates)
      setIncidents((prev) => prev.map((inc) => (inc.id === incidentId ? { ...inc, status, adminResponse: updates.adminResponse || inc.adminResponse } : inc)))
      toast.success(adminResp ? 'Response sent. Driver will be notified.' : `Incident ${status.toLowerCase()}`)
      setResponseModal(null)
      setAdminResponse('')
    } catch (error) {
      toast.error(error.message || 'Failed to update incident')
    }
  }

  const handleRespond = async () => {
    if (!responseModal) return
    if (!adminResponse.trim()) {
      toast.error('Please enter your response')
      return
    }
    setSaving(true)
    try {
      await updateIncidentStatus(responseModal.id, responseModal.status || 'Investigating', adminResponse)
    } finally {
      setSaving(false)
    }
  }

  const getVehicleInfo = (vehicleId) => vehicles.find((v) => v.id === String(vehicleId))
  const getDriverInfo = (driverId) => drivers.find((d) => d.id === String(driverId))

  const pendingCount = incidents.filter((i) => i.status === 'Reported' && !i.adminResponse).length
  const criticalCount = incidents.filter((i) => (i.severity === 'Critical' || i.severity === 'High') && i.status !== 'Resolved').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Incident Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Incidents reported by drivers. Respond to each incident and update status.
        </p>
      </div>

      {(pendingCount > 0 || criticalCount > 0) && (
        <div className={`rounded-2xl border-2 p-4 flex items-center justify-between gap-4 ${
          criticalCount > 0
            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={32} className={criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'} />
            <div>
              <p className={`font-bold ${criticalCount > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800 dark:text-amber-300'}`}>
                {criticalCount > 0 ? '⚠️ Critical/High severity incidents require attention' : 'New incidents awaiting your response'}
              </p>
              <p className="text-sm opacity-90">
                {pendingCount} pending • {criticalCount} critical/high severity
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" /> Incidents Reported by Drivers
          </h2>
          <span className="text-xs text-gray-400 uppercase font-semibold">{incidents.length} records</span>
        </div>
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scroll pr-2">
          {loading && <p className="text-sm text-gray-500">Loading incidents...</p>}
          {!loading && incidents.length === 0 && (
            <div className="text-center py-12 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600">
              <ShieldCheck size={48} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No incidents reported yet.</p>
              <p className="text-xs text-gray-400 mt-1">Drivers report incidents from their dashboard.</p>
            </div>
          )}
          {incidents.map((incident) => {
            const vehicle = getVehicleInfo(incident.vehicleId)
            const driver = getDriverInfo(incident.driverId)
            const needsResponse = incident.status === 'Reported' && !incident.adminResponse
            return (
              <div
                key={incident.id}
                className={`border rounded-xl p-4 ${
                  needsResponse || (incident.severity === 'Critical' || incident.severity === 'High')
                    ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-900/10'
                    : 'border-gray-100 dark:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{incident.incidentType}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(incident.createdAt || Date.now()).toLocaleDateString()} • {incident.location || 'Location N/A'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      incident.severity === 'High' || incident.severity === 'Critical'
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                        : incident.severity === 'Medium'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{incident.description}</p>
                {incident.evidenceFile && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <Image size={14} /> Evidence from driver
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {/\.(jpg|jpeg|png|gif|webp)$/i.test(incident.evidenceFileName || '') ? (
                        <>
                          <img
                            src={`data:${getEvidenceMimeType(incident.evidenceFileName)};base64,${incident.evidenceFile}`}
                            alt="Incident evidence"
                            className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-600 object-cover"
                          />
                          <a
                            href={`data:application/octet-stream;base64,${incident.evidenceFile}`}
                            download={incident.evidenceFileName || 'evidence'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 font-semibold text-sm hover:bg-ucu-blue-200 dark:hover:bg-ucu-blue-500/30"
                          >
                            <Download size={14} /> Download
                          </a>
                        </>
                      ) : (
                        <a
                          href={`data:application/octet-stream;base64,${incident.evidenceFile}`}
                          download={incident.evidenceFileName || 'evidence'}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400 font-semibold text-sm hover:bg-ucu-blue-200 dark:hover:bg-ucu-blue-500/30"
                        >
                          <Download size={16} /> Download {incident.evidenceFileName || 'evidence'}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Car size={14} /> Vehicle: {vehicle ? `${vehicle.plateNumber} • ${vehicle.make} ${vehicle.model}` : incident.vehicleId}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <User size={14} /> Driver: {driver ? driver.name : incident.driverId || 'N/A'}
                  </span>
                </div>
                {incident.adminResponse && (
                  <div className="mt-3 p-3 rounded-lg bg-ucu-blue-50 dark:bg-ucu-blue-900/20 border border-ucu-blue-200 dark:border-ucu-blue-700">
                    <p className="text-xs font-semibold text-ucu-blue-700 dark:text-ucu-blue-400">Your response (sent to driver)</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{incident.adminResponse}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      incident.status === 'Resolved'
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : incident.status === 'Investigating'
                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
                        : 'bg-gray-100 dark:bg-slate-600/30 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    {incident.status}
                  </span>
                  {incident.status !== 'Resolved' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResponseModal({ id: incident.id, status: 'Investigating' })}
                        className="text-xs px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 font-semibold flex items-center gap-1"
                      >
                        <MessageSquare size={12} /> Respond
                      </button>
                      <button
                        onClick={() => updateIncidentStatus(incident.id, 'Investigating')}
                        className="text-xs px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                      >
                        Investigating
                      </button>
                      <button
                        onClick={() => updateIncidentStatus(incident.id, 'Resolved')}
                        className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Admin Response Modal */}
      {responseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setResponseModal(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <MessageSquare size={20} className="text-ucu-blue-500" /> Respond to Driver
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Your response will be sent to the driver as a notification.</p>
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 mb-4"
              placeholder="e.g., We have logged this. Vehicle will be inspected tomorrow. Please avoid using until cleared."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setResponseModal(null); setAdminResponse(''); }}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={saving || !adminResponse.trim()}
                className="flex-1 py-2 rounded-lg bg-ucu-blue-500 text-white font-semibold disabled:opacity-50"
              >
                {saving ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IncidentManagement
