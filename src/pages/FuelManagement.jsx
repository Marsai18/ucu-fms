import React, { useEffect, useMemo, useState } from 'react'
import { Fuel, Calculator, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const defaultPlan = {
  vehicleId: '',
  distance: '',
  avgConsumption: '9',
  reservePercentage: '10'
}

const defaultLog = {
  vehicleId: '',
  quantity: '',
  cost: '',
  notes: ''
}

const FuelManagement = () => {
  const [vehicles, setVehicles] = useState([])
  const [routes, setRoutes] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [livePrice, setLivePrice] = useState(null)
  const [priceLoading, setPriceLoading] = useState(true)
  const [plannerForm, setPlannerForm] = useState(defaultPlan)
  const [logForm, setLogForm] = useState(defaultLog)
  const [savingLog, setSavingLog] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehicleRes, routeRes, logsRes] = await Promise.all([
          api.getVehicles(),
          api.getRoutes(),
          api.getFuelLogs()
        ])
        setVehicles(Array.isArray(vehicleRes) ? vehicleRes : [])
        setRoutes(Array.isArray(routeRes) ? routeRes : [])
        setFuelLogs(Array.isArray(logsRes) ? logsRes : [])
      } catch (error) {
        toast.error(error.message || 'Failed to load fuel data')
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const loadPrice = async () => {
      try {
        setPriceLoading(true)
        const response = await api.getLiveFuelPrice('Uganda')
        setLivePrice(response)
      } catch (error) {
        toast.error('Unable to fetch Google fuel price')
      } finally {
        setPriceLoading(false)
      }
    }
    loadPrice()
  }, [])

  const plannerResult = useMemo(() => {
    const distance = Number(plannerForm.distance) || 0
    const efficiency = Number(plannerForm.avgConsumption) || 1
    const reserve = Number(plannerForm.reservePercentage) || 0
    const baseLiters = distance / efficiency
    const totalLiters = baseLiters * (1 + reserve / 100)
    const pricePerLiter = livePrice?.pricePerLiter || 5500
    const estimatedCost = totalLiters * pricePerLiter
    return {
      baseLiters,
      totalLiters,
      estimatedCost,
      pricePerLiter
    }
  }, [plannerForm, livePrice])

  const handlePlannerChange = (e) => {
    const { name, value } = e.target
    setPlannerForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRouteSelect = (routeId) => {
    const route = routes.find((r) => r.id === routeId)
    if (route?.distance) {
      setPlannerForm((prev) => ({ ...prev, distance: Number(route.distance).toFixed(1) }))
    }
  }

  const handleLogChange = (e) => {
    const { name, value } = e.target
    setLogForm((prev) => ({ ...prev, [name]: value }))
  }

  const submitFuelLog = async (e) => {
    e.preventDefault()
    if (!logForm.vehicleId || !logForm.quantity || !logForm.cost) {
      toast.error('Vehicle, quantity and cost are required')
      return
    }
    try {
      setSavingLog(true)
      await api.createFuelLog({
        vehicleId: logForm.vehicleId,
        quantity: Number(logForm.quantity),
        cost: Number(logForm.cost),
        notes: logForm.notes,
        recordedBy: 'Admin'
      })
      toast.success('Fuel log recorded')
      setLogForm(defaultLog)
      const updatedLogs = await api.getFuelLogs()
      setFuelLogs(Array.isArray(updatedLogs) ? updatedLogs : [])
    } catch (error) {
      toast.error(error.message || 'Failed to save fuel log')
    } finally {
      setSavingLog(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Fuel Management</h1>
        <p className="text-gray-500 mt-1">
          Estimate fuel needs, capture live pump prices from Google, and log every shilling spent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <Fuel className="text-primary-500" size={28} />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Fuel Price</p>
              <p className="text-2xl font-semibold text-gray-900">
                {priceLoading
                  ? '—'
                  : `${(livePrice?.pricePerLiter || 5500).toLocaleString()} ${livePrice?.currency || 'UGX'}/L`}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Source: Google search {livePrice?.fetchedAt && `• ${new Date(livePrice.fetchedAt).toLocaleTimeString()}`}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <Calculator className="text-emerald-500" size={28} />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Required Litres</p>
              <p className="text-2xl font-semibold text-gray-900">{plannerResult.totalLiters.toFixed(2)} L</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Includes {plannerForm.reservePercentage}% safety reserve</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <DollarSign className="text-rose-500" size={28} />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimated Cost</p>
              <p className="text-2xl font-semibold text-gray-900">
                UGX {Math.round(plannerResult.estimatedCost).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">For the planned distance & efficiency</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Fuel Requirement Planner</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select a vehicle, choose a saved route or enter distance, and the system will project litres and cost.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle</label>
              <select
                name="vehicleId"
                value={plannerForm.vehicleId}
                onChange={handlePlannerChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Choose vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber || vehicle.make} • {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Use saved route</label>
              <select
                onChange={(e) => handleRouteSelect(e.target.value)}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Select route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.origin} → {route.destination} ({route.distance?.toFixed ? route.distance.toFixed(1) : route.distance} km)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Distance (km)</label>
              <input
                name="distance"
                value={plannerForm.distance}
                onChange={handlePlannerChange}
                placeholder="e.g., 150"
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Average Consumption (km/L)</label>
              <input
                name="avgConsumption"
                value={plannerForm.avgConsumption}
                onChange={handlePlannerChange}
                placeholder="e.g., 9"
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reserve (%)</label>
              <input
                name="reservePercentage"
                value={plannerForm.reservePercentage}
                onChange={handlePlannerChange}
                placeholder="10"
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="border border-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold">Base Litres</p>
              <p className="text-2xl font-semibold text-gray-900">{plannerResult.baseLiters.toFixed(2)}</p>
            </div>
            <div className="border border-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold">Total Litres</p>
              <p className="text-2xl font-semibold text-gray-900">{plannerResult.totalLiters.toFixed(2)}</p>
            </div>
            <div className="border border-gray-100 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase font-semibold">Cost Estimate</p>
              <p className="text-2xl font-semibold text-gray-900">
                UGX {Math.round(plannerResult.estimatedCost).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Log Fuel Purchase</h2>
          <p className="text-sm text-gray-500 mb-4">Capture receipts for real-time reconciliation.</p>

          <form className="space-y-4" onSubmit={submitFuelLog}>
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle</label>
              <select
                name="vehicleId"
                value={logForm.vehicleId}
                onChange={handleLogChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Choose vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber || vehicle.make} • {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Quantity (L)</label>
                <input
                  name="quantity"
                  value={logForm.quantity}
                  onChange={handleLogChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cost (UGX)</label>
                <input
                  name="cost"
                  value={logForm.cost}
                  onChange={handleLogChange}
                  className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={logForm.notes}
                onChange={handleLogChange}
                rows="2"
                placeholder="Station name, receipt no..."
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>
            <button
              type="submit"
              disabled={savingLog}
              className="w-full rounded-xl bg-primary-500 text-white font-semibold py-3 hover:bg-primary-600 disabled:opacity-40"
            >
              {savingLog ? 'Saving...' : 'Record Fuel Log'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Fuel Transactions</h2>
          <span className="text-xs text-gray-400 uppercase font-semibold">{fuelLogs.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-100">
                <th className="text-left py-2">Vehicle</th>
                <th className="text-left py-2">Quantity (L)</th>
                <th className="text-left py-2">Cost</th>
                <th className="text-left py-2">Recorded</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.slice(0, 8).map((log) => (
                <tr key={log.id} className="border-b border-gray-50">
                  <td className="py-3 text-gray-900">{log.vehicleId}</td>
                  <td className="py-3 text-gray-600">{log.quantity} L</td>
                  <td className="py-3 text-gray-900 font-semibold">UGX {Number(log.cost).toLocaleString()}</td>
                  <td className="py-3 text-gray-500">
                    {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 text-gray-500">{log.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {fuelLogs.length === 0 && (
            <p className="text-sm text-gray-500 py-8 text-center">No fuel logs captured yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FuelManagement
