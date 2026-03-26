import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Users, Fuel, MapPin, Send, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const ClientAvailableVehicles = () => {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ minSeats: '', routeType: '', vehicleType: '' })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const res = await api.getVehicles()
        setVehicles(Array.isArray(res) ? res : [])
      } catch (error) {
        toast.error(error.message || 'Failed to load vehicles')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const availableVehicles = useMemo(() => {
    let list = vehicles.filter(
      (v) => (v.operationalStatus || '').toLowerCase() === 'active'
    )
    if (filters.minSeats) {
      const min = Number(filters.minSeats)
      list = list.filter((v) => (v.seats ?? 0) >= min)
    }
    if (filters.routeType) {
      list = list.filter((v) => (v.routeType || '').toLowerCase() === filters.routeType.toLowerCase())
    }
    if (filters.vehicleType) {
      list = list.filter((v) => (v.vehicleType || '').toLowerCase() === filters.vehicleType.toLowerCase())
    }
    return list
  }, [vehicles, filters])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium font-client">Loading vehicles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 client-portal">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-client tracking-tight">Available Vehicles</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
          Browse fleet capacity, fuel consumption rates, and journey type (long/short distance). Submit a request when ready.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-ucu-blue-500" />
          <span className="font-semibold text-slate-900 dark:text-white font-client">Filter</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Min seats (capacity)</label>
            <input
              type="number"
              min="1"
              value={filters.minSeats}
              onChange={(e) => setFilters((f) => ({ ...f, minSeats: e.target.value }))}
              placeholder="Any"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 py-2 px-4 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Journey type</label>
            <select
              value={filters.routeType}
              onChange={(e) => setFilters((f) => ({ ...f, routeType: e.target.value }))}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 py-2 px-4 text-sm"
            >
              <option value="">Any (Short & Long)</option>
              <option value="Short">Short distance</option>
              <option value="Long">Long distance</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Vehicle type</label>
            <select
              value={filters.vehicleType}
              onChange={(e) => setFilters((f) => ({ ...f, vehicleType: e.target.value }))}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 py-2 px-4 text-sm"
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
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {availableVehicles.length} vehicle{availableVehicles.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {availableVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 card-glow group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-ucu-blue-100 dark:bg-ucu-blue-500/20 rounded-xl">
                    <Car size={24} className="text-ucu-blue-600 dark:text-ucu-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white font-client text-lg">
                      {vehicle.plateNumber}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                </div>
                {vehicle.routeType && (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    (vehicle.routeType || '').toLowerCase() === 'long'
                      ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {(vehicle.routeType || '').toLowerCase() === 'long' ? 'Long' : 'Short'} distance
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <Users size={18} className="text-ucu-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Capacity</p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {vehicle.seats ?? '—'} seats
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <Fuel size={18} className="text-ucu-gold-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fuel consumption</p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {vehicle.fuelEfficiency != null ? `${vehicle.fuelEfficiency} km/L` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-600/50 font-medium">
                  {vehicle.vehicleType || '—'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-600/50 font-medium">
                  {vehicle.fuelType || '—'}
                </span>
              </div>

              <button
                onClick={() => navigate('/client/request', { state: { preselectedVehicleId: vehicle.id } })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ucu-gradient text-white font-bold hover:shadow-lg transition-all group-hover:bg-ucu-blue-600"
              >
                <Send size={18} />
                Request this vehicle
              </button>
            </div>
          </div>
        ))}
      </div>

      {availableVehicles.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <Car size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No vehicles match your filters</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Try adjusting the filters above</p>
        </div>
      )}
    </div>
  )
}

export default ClientAvailableVehicles
