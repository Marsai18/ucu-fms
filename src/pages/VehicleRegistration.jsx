import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Car, Fuel, Gauge, Settings } from 'lucide-react'
import api from '../utils/api'

const defaultForm = {
  plateNumber: '',
  make: '',
  model: '',
  year: '',
  chassisNumber: '',
  engineNumber: '',
  fuelType: 'Diesel',
  fuelCapacity: '',
  currentOdometer: '',
  operationalStatus: 'Active',
  lastServiceDate: '',
  nextServiceDueDate: ''
}

const VehicleRegistration = () => {
  const [formData, setFormData] = useState(defaultForm)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const response = await api.getVehicles()
      setVehicles(Array.isArray(response) ? response : [])
    } catch (error) {
      toast.error(error.message || 'Could not load vehicles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.plateNumber || !formData.make || !formData.model) {
      toast.error('Plate number, make, and model are required')
      return
    }
    try {
      setSubmitting(true)
      const payload = {
        plateNumber: formData.plateNumber.toUpperCase(),
        make: formData.make,
        model: formData.model,
        year: Number(formData.year) || null,
        chassisNumber: formData.chassisNumber,
        engineNumber: formData.engineNumber,
        fuelType: formData.fuelType,
        fuelCapacity: Number(formData.fuelCapacity) || null,
        currentOdometer: Number(formData.currentOdometer) || 0,
        operationalStatus: formData.operationalStatus,
        lastServiceDate: formData.lastServiceDate || null,
        nextServiceDueDate: formData.nextServiceDueDate || null
      }
      await api.createVehicle(payload)
      toast.success('Vehicle registered successfully')
      setFormData(defaultForm)
      loadVehicles()
    } catch (error) {
      toast.error(error.message || 'Failed to register vehicle')
    } finally {
      setSubmitting(false)
    }
  }

  const latestVehicles = useMemo(() => vehicles.slice(0, 5), [vehicles])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Vehicle Registration</h1>
        <p className="text-gray-500 mt-1">Enter comprehensive details for new vehicles to be added to the fleet.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        {/* Registration Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car size={20} className="text-primary-500" /> Vehicle Identification
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Plate Number</label>
                  <input
                    type="text"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    placeholder="e.g., UCU 123A"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100 uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Make</label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="e.g., Toyota"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g., Land Cruiser"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="e.g., 2018"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings size={20} className="text-primary-500" /> Technical Specifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Chassis Number</label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    placeholder="e.g., JTEHC5H710486"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Engine Number</label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={formData.engineNumber}
                    onChange={handleChange}
                    placeholder="e.g., 1VD-FTV"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fuel Type</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fuel Capacity (Liters)</label>
                  <input
                    type="number"
                    name="fuelCapacity"
                    value={formData.fuelCapacity}
                    onChange={handleChange}
                    placeholder="e.g., 90"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Gauge size={20} className="text-primary-500" /> Operational Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Odometer Reading (KM)</label>
                  <input
                    type="number"
                    name="currentOdometer"
                    value={formData.currentOdometer}
                    onChange={handleChange}
                    placeholder="e.g., 150000"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Operational Status</label>
                  <select
                    name="operationalStatus"
                    value={formData.operationalStatus}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  >
                    <option value="Active">Active</option>
                    <option value="In Maintenance">In Maintenance</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Fuel size={20} className="text-primary-500" /> Service & Maintenance
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Service Date</label>
                  <input
                    type="date"
                    name="lastServiceDate"
                    value={formData.lastServiceDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Next Service Due Date</label>
                  <input
                    type="date"
                    name="nextServiceDueDate"
                    value={formData.nextServiceDueDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormData(defaultForm)}
                className="px-5 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-40"
              >
                Add Vehicle
              </button>
            </div>
          </form>
        </div>

        {/* Latest Vehicles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Vehicles</h2>
            <span className="text-sm text-gray-500">{vehicles.length} total</span>
          </div>
          <div className="space-y-4">
            {latestVehicles.map(vehicle => (
              <div key={vehicle.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{vehicle.plateNumber}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    vehicle.operationalStatus === 'Active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : vehicle.operationalStatus === 'On Trip'
                      ? 'bg-sky-50 text-sky-700'
                      : vehicle.operationalStatus === 'In Maintenance'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {vehicle.operationalStatus}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{vehicle.make} {vehicle.model} • {vehicle.year}</p>
                <p className="text-xs text-gray-400 mt-2">Last serviced: {formatDate(vehicle.lastServiceDate)}</p>
              </div>
            ))}

            {!latestVehicles.length && !loading && (
              <p className="text-center text-gray-500 text-sm py-6">No vehicles registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleRegistration
