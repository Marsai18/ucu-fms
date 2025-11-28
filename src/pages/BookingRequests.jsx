import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Car, MapPin, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const initialFormState = {
  vehicleId: '',
  driverId: '',
  purpose: '',
  destination: '',
  startDateTime: '',
  endDateTime: '',
}

const BookingRequests = () => {
  const formatDate = (date) => {
    if (!date) return 'N/A'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [bookingRequests, setBookingRequests] = useState([])
  const [activeTab, setActiveTab] = useState('Pending')
  const [formData, setFormData] = useState(initialFormState)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [vehicleRes, driverRes, bookingRes] = await Promise.all([
          api.getVehicles(),
          api.getDrivers(),
          api.getBookingRequests()
        ])
        setVehicles(Array.isArray(vehicleRes) ? vehicleRes : [])
        setDrivers(Array.isArray(driverRes) ? driverRes : [])
        setBookingRequests(Array.isArray(bookingRes) ? bookingRes : [])
      } catch (error) {
        toast.error(error.message || 'Failed to load booking data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredRequests = useMemo(() => {
    if (activeTab === 'All') return bookingRequests
    return bookingRequests.filter(req => req.status === activeTab)
  }, [bookingRequests, activeTab])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.vehicleId || !formData.driverId || !formData.startDateTime || !formData.endDateTime) {
      toast.error('Please fill in the required fields')
      return
    }
    try {
      setSubmitting(true)
      await api.createBookingRequest({
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        purpose: formData.purpose,
        destination: formData.destination,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        status: 'Pending'
      })
      toast.success('Booking request submitted')
      setFormData(initialFormState)
      const updated = await api.getBookingRequests()
      setBookingRequests(Array.isArray(updated) ? updated : [])
    } catch (error) {
      toast.error(error.message || 'Could not submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.updateBookingStatus(id, status)
      toast.success(`Request ${status.toLowerCase()}`)
      const updated = await api.getBookingRequests()
      setBookingRequests(Array.isArray(updated) ? updated : [])
    } catch (error) {
      toast.error(error.message || 'Could not update request')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Vehicle Booking Requests</h1>
        <p className="text-gray-500 mt-1">Submit new trip requests and approve pending bookings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        {/* Create Request */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Create New Booking Request</h2>
          <p className="text-sm text-gray-500 mb-4">Fill out the form to request a vehicle.</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Car size={16} className="text-primary-500" /> Select Vehicle
              </label>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Choose a vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} • {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={16} className="text-primary-500" /> Assign Driver
              </label>
              <select
                name="driverId"
                value={formData.driverId}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Choose a driver</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name || `${driver.firstName} ${driver.lastName}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Purpose of Trip</label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                rows="2"
                placeholder="Briefly describe the purpose"
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin size={16} className="text-primary-500" /> Destination
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="e.g., Kampala City, Entebbe Airport"
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-500" /> Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={formData.startDateTime}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-500" /> End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={formData.endDateTime}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-primary-500 text-white font-semibold py-3 hover:bg-primary-600 disabled:opacity-40"
              >
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => setFormData(initialFormState)}
                className="px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Booking Approval Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Booking Approval Panel</h2>
              <p className="text-sm text-gray-500">Review and manage incoming requests.</p>
            </div>
            <div className="flex gap-2 rounded-full border border-gray-200 p-1">
              {['Pending', 'Approved', 'All'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold ${activeTab === tab ? 'bg-primary-500 text-white' : 'text-gray-500'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="py-2">Request ID</th>
                  <th className="py-2">Vehicle</th>
                  <th className="py-2">Driver</th>
                  <th className="py-2">Destination</th>
                  <th className="py-2">Start</th>
                  <th className="py-2">End</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-50">
                    <td className="py-3 font-semibold text-gray-900">{request.reference || request.id}</td>
                    <td className="py-3 text-gray-600">{request.vehicleName || request.vehicle?.plateNumber || request.vehicleId}</td>
                    <td className="py-3 text-gray-600">{request.driverName || request.driver?.name || request.driverId}</td>
                    <td className="py-3 text-gray-600">{request.destination}</td>
                    <td className="py-3 text-gray-600">{formatDate(request.startDateTime)}</td>
                    <td className="py-3 text-gray-600">{formatDate(request.endDateTime)}</td>
                    <td className="py-3 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        request.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : request.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : request.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {request.status}
                      </span>
                      {request.status === 'Pending' && (
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'Approved')}
                            className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                            className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredRequests.length && !loading && (
              <div className="text-center text-gray-500 text-sm py-8">
                No {activeTab.toLowerCase()} booking requests yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingRequests
