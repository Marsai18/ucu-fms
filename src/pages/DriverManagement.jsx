import React, { useEffect, useMemo, useState } from 'react'
import { UserPlus, Search, Phone, Mail, BadgeInfo, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const defaultDriver = {
  name: '',
  licenseNumber: '',
  phone: '',
  email: '',
  status: 'Active',
  yearsOfExperience: '',
  emergencyContact: '',
  assignedVehicle: ''
}

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([])
  const [formData, setFormData] = useState(defaultDriver)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadDrivers = async () => {
    try {
      setLoading(true)
      const response = await api.getDrivers()
      setDrivers(Array.isArray(response) ? response : [])
    } catch (error) {
      toast.error(error.message || 'Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers
    return drivers.filter((driver) =>
      [driver.name, driver.licenseNumber, driver.phone, driver.email].some((field) =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [drivers, searchQuery])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddDriver = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.licenseNumber) {
      toast.error('Name and License Number are required')
      return
    }
    try {
      setSaving(true)
      await api.createDriver(formData)
      toast.success('Driver added successfully')
      setFormData(defaultDriver)
      loadDrivers()
    } catch (error) {
      toast.error(error.message || 'Failed to add driver')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('Remove this driver from the roster?')) return
    try {
      await api.deleteDriver(driverId)
      toast.success('Driver removed')
      setDrivers((prev) => prev.filter((driver) => driver.id !== driverId))
    } catch (error) {
      toast.error(error.message || 'Failed to delete driver')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold text-ucu-blue-600 dark:text-ucu-blue-400 uppercase tracking-widest">Fleet</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mt-1 tracking-tight">Driver Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Add, track, and manage all UCU drivers from a single workspace.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        {/* Create Driver */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <UserPlus size={20} className="text-ucu-blue-500" /> Add New Driver
          </h2>
          <p className="text-sm text-gray-500 mb-4">Capture personal and operational details.</p>

          <form className="space-y-4" onSubmit={handleAddDriver}>
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                placeholder="e.g., David Ssebunya"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  placeholder="e.g., DL-001"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Years of Experience</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  placeholder="e.g., 8"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone size={14} /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  placeholder="+256 700 000 001"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail size={14} /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  placeholder="driver@ucu.ac.ug"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Assigned Vehicle</label>
              <input
                type="text"
                name="assignedVehicle"
                value={formData.assignedVehicle}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                placeholder="e.g., Toyota Hilux UA 075 AK"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Emergency Contact</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                placeholder="Name & phone number"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-ucu-gradient text-white font-semibold py-3 hover:shadow-ucu disabled:opacity-40 transition-all"
            >
              {saving ? 'Saving...' : 'Add Driver'}
            </button>
          </form>
        </div>

        {/* Driver roster */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Registered Drivers</h2>
              <p className="text-sm text-gray-500">{drivers.length} total drivers</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drivers..."
                className="pl-9 pr-3 py-2 rounded-full border border-gray-200 focus:border-primary-400 focus:ring-primary-100 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading drivers...</div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-y-auto custom-scroll pr-2">
              {filteredDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="border border-gray-100 rounded-2xl p-4 flex flex-wrap items-center gap-4"
                >
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-lg font-semibold text-gray-900">{driver.name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <BadgeInfo size={14} className="text-primary-500" /> {driver.licenseNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Added on {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 min-w-[160px]">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" /> {driver.phone || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" /> {driver.email || 'N/A'}
                    </p>
                  </div>
                  <div className="min-w-[160px]">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        driver.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600'
                          : driver.status === 'On Leave'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {driver.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {driver.yearsOfExperience ? `${driver.yearsOfExperience} yrs experience` : 'Experience N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDriver(driver.id)}
                    className="px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center gap-1 text-sm font-semibold transition-all"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              ))}

              {!filteredDrivers.length && (
                <p className="text-center text-sm text-gray-500 py-8">No drivers match your filters.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DriverManagement
