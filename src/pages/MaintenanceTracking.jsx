import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ClipboardList, Wrench } from 'lucide-react'
import api from '../utils/api'

const defaultForm = {
  vehicleId: '',
  serviceDate: '',
  serviceType: '',
  description: '',
  odometerReading: '',
  cost: '',
  mechanic: '',
  nextServiceDue: ''
}

const MaintenanceTracking = () => {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [formData, setFormData] = useState(defaultForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadRecords = async () => {
    try {
      setLoading(true)
      const [recordsResponse, vehiclesResponse] = await Promise.all([
        api.getMaintenanceRecords(),
        api.getVehicles()
      ])
      setRecords(Array.isArray(recordsResponse) ? recordsResponse : [])
      setVehicles(Array.isArray(vehiclesResponse) ? vehiclesResponse : [])
    } catch (error) {
      toast.error(error.message || 'Failed to load maintenance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.vehicleId || !formData.serviceDate || !formData.serviceType) {
      toast.error('Vehicle, service date, and service type are required')
      return
    }
    try {
      setSubmitting(true)
      await api.createMaintenanceRecord({
        vehicleId: formData.vehicleId,
        serviceDate: formData.serviceDate,
        serviceType: formData.serviceType,
        description: formData.description,
        odometerReading: Number(formData.odometerReading) || null,
        cost: Number(formData.cost) || 0,
        mechanicDetails: formData.mechanic,
        nextServiceDueDate: formData.nextServiceDue || null
      })
      toast.success('Maintenance record added')
      setFormData(defaultForm)
      loadRecords()
    } catch (error) {
      toast.error(error.message || 'Could not add maintenance record')
    } finally {
      setSubmitting(false)
    }
  }

  const recentRecords = useMemo(() => records.slice(0, 7), [records])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Maintenance Tracking</h1>
        <p className="text-gray-500 mt-1">Overview of all recorded vehicle maintenance activities and scheduled services.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        {/* Maintenance Records */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList size={20} className="text-primary-500" /> Maintenance Records
              </h2>
              <p className="text-sm text-gray-500 mt-1">Detailed log of completed maintenance work.</p>
            </div>
            <span className="text-sm text-gray-400">{records.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-3 px-6">Vehicle</th>
                  <th className="py-3 px-6">Service Date</th>
                  <th className="py-3 px-6">Service Type</th>
                  <th className="py-3 px-6">Odometer</th>
                  <th className="py-3 px-6">Cost (UGX)</th>
                  <th className="py-3 px-6">Mechanic</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map(record => (
                  <tr key={record.id} className="border-t border-gray-50">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {record.vehiclePlate || vehicles.find(v => v.id === record.vehicleId)?.plateNumber || record.vehicleId}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{formatDate(record.serviceDate)}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                        {record.serviceType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{record.odometerReading ? `${record.odometerReading.toLocaleString()} km` : 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-900 font-semibold">
                      UGX {record.cost ? Number(record.cost).toLocaleString() : '0'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{record.mechanicDetails || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!recentRecords.length && !loading && (
              <div className="text-center text-gray-500 text-sm py-8">
                No maintenance records yet.
              </div>
            )}
          </div>
        </div>

        {/* Add Maintenance Record */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Wrench size={20} className="text-primary-500" /> Add New Maintenance Record
          </h2>
          <p className="text-sm text-gray-500 mb-4">Enter details for a new service activity.</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle Plate Number</label>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Select vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} • {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Service Date</label>
              <input
                type="date"
                name="serviceDate"
                value={formData.serviceDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Type of Service</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Choose service</option>
                <option value="Routine Service">Routine Service</option>
                <option value="Brake System Check">Brake System Check</option>
                <option value="Engine Repair">Engine Repair</option>
                <option value="Suspension Check">Suspension Check</option>
                <option value="Battery Replacement">Battery Replacement</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Detailed description of the service performed..."
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Odometer Reading (km)</label>
                <input
                  type="number"
                  name="odometerReading"
                  value={formData.odometerReading}
                  onChange={handleChange}
                  placeholder="e.g., 130000"
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cost (UGX)</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="e.g., 250000"
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Mechanic Details</label>
              <input
                type="text"
                name="mechanic"
                value={formData.mechanic}
                onChange={handleChange}
                placeholder="e.g., QuickFix Garage"
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Next Service Due Date</label>
              <input
                type="date"
                name="nextServiceDue"
                value={formData.nextServiceDue}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormData(defaultForm)}
                className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-primary-500 text-white font-semibold py-3 hover:bg-primary-600 disabled:opacity-40"
              >
                Add Maintenance Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceTracking
