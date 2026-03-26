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
  seats: '',
  vehicleType: '',
  routeType: '',
  fuelEfficiency: '',
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
    const odometer = Number(formData.currentOdometer) || 0
    if (odometer < 0) {
      toast.error('Current odometer cannot be negative')
      return
    }
    if (formData.lastServiceDate && formData.nextServiceDueDate) {
      const lastService = new Date(formData.lastServiceDate)
      const nextDue = new Date(formData.nextServiceDueDate)
      if (nextDue < lastService) {
        toast.error('Next service due date cannot be before last service date')
        return
      }
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
        seats: Number(formData.seats) || null,
        vehicleType: formData.vehicleType || null,
        routeType: formData.routeType || null,
        fuelEfficiency: Number(formData.fuelEfficiency) || null,
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


  const formatDate = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold text-ucu-blue-600 dark:text-ucu-blue-400 uppercase tracking-widest">Fleet</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mt-1 tracking-tight">Vehicle Registration</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Enter comprehensive details for new vehicles to be added to the fleet.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        {/* Registration Form */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
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
                    placeholder="e.g., UA 075 AK"
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
                  <label className="text-sm font-medium text-gray-700">Seats (capacity)</label>
                  <input
                    type="number"
                    name="seats"
                    value={formData.seats}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    min="1"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
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
                <div>
                  <label className="text-sm font-medium text-gray-700">Route Type (journey)</label>
                  <select
                    name="routeType"
                    value={formData.routeType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  >
                    <option value="">Any</option>
                    <option value="Short">Short</option>
                    <option value="Long">Long</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fuel Efficiency (km/L)</label>
                  <input
                    type="number"
                    name="fuelEfficiency"
                    value={formData.fuelEfficiency}
                    onChange={handleChange}
                    placeholder="e.g., 9"
                    step="0.1"
                    min="0"
                    className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  />
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
                className="px-5 py-3 rounded-xl border-2 border-ucu-gold-300 dark:border-ucu-gold-500 font-semibold text-ucu-gold-700 dark:text-ucu-gold-400 hover:bg-ucu-gold-50 dark:hover:bg-ucu-gold-500/20 transition-all"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-ucu-gradient text-white font-semibold hover:shadow-ucu disabled:opacity-40 transition-all"
              >
                Add Vehicle
              </button>
            </div>
          </form>
        </div>

        {/* Vehicles Table */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Vehicles</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{vehicles.length} total</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
            <table className="table-modern">
              <thead>
                <tr>
                  <th className="py-3 px-4 font-medium">Plate</th>
                  <th className="py-3 px-4 font-medium">Make / Model</th>
                  <th className="py-3 px-4 font-medium">Year</th>
                  <th className="py-3 px-4 font-medium">Seats</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Route</th>
                  <th className="py-3 px-4 font-medium">km/L</th>
                  <th className="py-3 px-4 font-medium">Fuel</th>
                  <th className="py-3 px-4 font-medium">Odometer</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Last Service</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{vehicle.plateNumber}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{vehicle.make} {vehicle.model}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{vehicle.year || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{vehicle.seats ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{vehicle.vehicleType || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{vehicle.routeType || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{vehicle.fuelEfficiency ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{vehicle.fuelType || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{(vehicle.currentOdometer || 0).toLocaleString()} km</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        vehicle.operationalStatus === 'Active'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : vehicle.operationalStatus === 'On Trip'
                          ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400'
                          : vehicle.operationalStatus === 'In Maintenance'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          : 'bg-gray-100 dark:bg-gray-600/30 text-gray-600 dark:text-gray-400'
                      }`}>
                        {vehicle.operationalStatus || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{formatDate(vehicle.lastServiceDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!vehicles.length && !loading && (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">No vehicles registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleRegistration
