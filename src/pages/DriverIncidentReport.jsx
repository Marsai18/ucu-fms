import React, { useEffect, useState } from 'react'
import { AlertTriangle, ShieldCheck, Car, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import FileUpload from '../components/FileUpload'

const defaultForm = {
  vehicleId: '',
  incidentType: 'Vehicle Damage',
  severity: 'Medium',
  location: '',
  description: ''
}

const DriverIncidentReport = () => {
  const [profile, setProfile] = useState(null)
  const [myIncidents, setMyIncidents] = useState([])
  const [formData, setFormData] = useState(defaultForm)
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [profileRes, incidentsRes] = await Promise.all([
          api.getDriverProfile().catch(() => null),
          api.getDriverIncidents().catch(() => [])
        ])
        setProfile(profileRes)
        setMyIncidents(Array.isArray(incidentsRes) ? incidentsRes : [])
        if (profileRes?.assignedVehicle?.id) {
          setFormData(prev => ({ ...prev, vehicleId: profileRes.assignedVehicle.id }))
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const submitIncident = async (e) => {
    e.preventDefault()
    if (!formData.vehicleId || !formData.description?.trim()) {
      toast.error('Vehicle and description are required')
      return
    }
    try {
      setSaving(true)
      let evidenceBase64 = null
      let evidenceFileName = ''
      if (evidenceFile) {
        evidenceBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result
            resolve(result?.includes(',') ? result.split(',')[1] : result)
          }
          reader.onerror = reject
          reader.readAsDataURL(evidenceFile)
        })
        evidenceFileName = evidenceFile.name || 'evidence'
      }
      await api.createDriverIncident({
        ...formData,
        reportedAt: new Date().toISOString(),
        ...(evidenceBase64 && { evidenceFile: evidenceBase64, evidenceFileName })
      })
      toast.success('Incident reported successfully. Admin has been notified.')
      setFormData({ ...defaultForm, vehicleId: profile?.assignedVehicle?.id || '' })
      setEvidenceFile(null)
      const refreshed = await api.getDriverIncidents()
      setMyIncidents(Array.isArray(refreshed) ? refreshed : [])
    } catch (err) {
      toast.error(err.message || 'Failed to report incident')
    } finally {
      setSaving(false)
    }
  }

  const severityStyles = {
    Critical: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    High: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    Low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
  }

  const statusStyles = {
    Resolved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    Investigating: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    Reported: 'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle size={28} className="text-rose-500" />
          Report Incident
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Report vehicle damage, safety issues, or mechanical failures. Admin will be notified immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-500" /> Report New Incident
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Log collisions, safety observations, or mechanical issues.</p>

          <form className="space-y-4" onSubmit={submitIncident}>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle</label>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ucu-blue-500"
              >
                <option value="">Select vehicle</option>
                {profile?.assignedVehicle && (
                  <option value={profile.assignedVehicle.id}>
                    {profile.assignedVehicle.plateNumber} • {profile.assignedVehicle.make} {profile.assignedVehicle.model}
                  </option>
                )}
              </select>
              {!profile?.assignedVehicle && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No vehicle assigned. Contact admin.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Incident Type</label>
                <select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="Vehicle Damage">Vehicle Damage</option>
                  <option value="Safety Violation">Safety Violation</option>
                  <option value="Mechanical Failure">Mechanical Failure</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="e.g., Kampala - Jinja Highway"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe what happened..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <FileUpload
              value={evidenceFile}
              onChange={setEvidenceFile}
              label="Upload evidence (optional)"
              hint="Photos, PDF, or documents — sent directly to admin"
              onError={(msg) => toast.error(msg)}
            />

            <button
              type="submit"
              disabled={saving || !profile?.assignedVehicle}
              className="w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle size={18} /> {saving ? 'Submitting...' : 'Report Incident'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" /> My Reported Incidents
            </h2>
            <span className="text-xs text-gray-400 uppercase font-semibold">{myIncidents.length} records</span>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scroll pr-2">
            {myIncidents.length === 0 && (
              <div className="text-center py-12 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-dashed border-slate-200 dark:border-slate-600">
                <ShieldCheck size={40} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No incidents reported yet.</p>
                <p className="text-xs text-gray-400 mt-1">Your reported incidents will appear here.</p>
              </div>
            )}
            {myIncidents.map((incident) => (
              <div key={incident.id} className="border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{incident.incidentType}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(incident.createdAt || Date.now()).toLocaleDateString()} • {incident.location || 'Location N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityStyles[incident.severity] || severityStyles.Medium}`}>
                    {incident.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{incident.description}</p>
                {incident.evidenceFile && (
                  <a
                    href={`data:application/octet-stream;base64,${incident.evidenceFile}`}
                    download={incident.evidenceFileName || 'evidence'}
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    <Download size={14} /> Evidence uploaded
                  </a>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[incident.status] || statusStyles.Reported}`}>
                    {incident.status}
                  </span>
                </div>
                {incident.adminResponse && (
                  <div className="mt-3 p-3 rounded-lg bg-ucu-blue-50 dark:bg-ucu-blue-900/20 border border-ucu-blue-200 dark:border-ucu-blue-700">
                    <p className="text-xs font-semibold text-ucu-blue-700 dark:text-ucu-blue-400">Admin response</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{incident.adminResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverIncidentReport
