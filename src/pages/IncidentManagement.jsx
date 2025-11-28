import React, { useEffect, useState } from 'react'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const defaultIncident = {
  vehicleId: '',
  driverId: '',
  incidentType: 'Vehicle Damage',
  severity: 'Medium',
  location: '',
  description: ''
}

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [formData, setFormData] = useState(defaultIncident)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const submitIncident = async (e) => {
    e.preventDefault()
    if (!formData.vehicleId || !formData.description) {
      toast.error('Vehicle and description are required')
      return
    }
    try {
      setSaving(true)
      await api.createIncident({
        ...formData,
        reportedAt: new Date().toISOString(),
        status: 'Reported'
      })
      toast.success('Incident reported successfully')
      setFormData(defaultIncident)
      const refreshed = await api.getIncidents()
      setIncidents(Array.isArray(refreshed) ? refreshed : [])
    } catch (error) {
      toast.error(error.message || 'Failed to report incident')
    } finally {
      setSaving(false)
    }
  }

  const updateIncidentStatus = async (incidentId, status) => {
    try {
      await api.updateIncident(incidentId, { status })
      setIncidents((prev) => prev.map((incident) => (incident.id === incidentId ? { ...incident, status } : incident)))
      toast.success(`Incident ${status.toLowerCase()}`)
    } catch (error) {
      toast.error(error.message || 'Failed to update incident')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Incident Management</h1>
        <p className="text-gray-500 mt-1">
          Capture incidents in seconds, oversee investigations, and close cases with confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-500" /> Report New Incident
          </h2>
          <p className="text-sm text-gray-500 mb-4">Log collisions, safety observations, or compliance issues.</p>

          <form className="space-y-4" onSubmit={submitIncident}>
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle</label>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Select vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber || vehicle.make} • {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Driver</label>
              <select
                name="driverId"
                value={formData.driverId}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Select driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Incident Type</label>
                <select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                >
                  <option value="Vehicle Damage">Vehicle Damage</option>
                  <option value="Safety Violation">Safety Violation</option>
                  <option value="Mechanical Failure">Mechanical Failure</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                placeholder="e.g., Kampala - Jinja Highway"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe what happened..."
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-primary-500 text-white font-semibold py-3 hover:bg-primary-600 disabled:opacity-40"
            >
              {saving ? 'Submitting...' : 'Report Incident'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" /> Incident Log
            </h2>
            <span className="text-xs text-gray-400 uppercase font-semibold">{incidents.length} records</span>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scroll pr-2">
            {loading && <p className="text-sm text-gray-500">Loading incidents...</p>}
            {!loading && incidents.length === 0 && (
              <p className="text-sm text-gray-500">No incidents reported yet.</p>
            )}
            {incidents.map((incident) => (
              <div key={incident.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{incident.incidentType}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(incident.createdAt || Date.now()).toLocaleDateString()} •{' '}
                      {incident.location || 'Location N/A'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      incident.severity === 'High' || incident.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-700'
                        : incident.severity === 'Medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{incident.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Vehicle: {incident.vehicleId} • Driver: {incident.driverId || 'N/A'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      incident.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : incident.status === 'Investigating'
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {incident.status}
                  </span>
                  {incident.status !== 'Resolved' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateIncidentStatus(incident.id, 'Investigating')}
                        className="text-xs px-3 py-1 rounded-full border border-sky-200 text-sky-700 hover:bg-sky-50"
                      >
                        Investigating
                      </button>
                      <button
                        onClick={() => updateIncidentStatus(incident.id, 'Resolved')}
                        className="text-xs px-3 py-1 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentManagement
