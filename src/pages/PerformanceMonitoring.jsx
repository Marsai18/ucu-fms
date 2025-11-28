import React, { useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Activity, Zap } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'
import api from '../utils/api'

const PerformanceMonitoring = () => {
  const [activeTab, setActiveTab] = useState('fleet')
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [vehicleRes, tripRes, fuelRes, maintenanceRes] = await Promise.all([
          api.getVehicles(),
          api.getTrips(),
          api.getFuelLogs(),
          api.getMaintenanceRecords()
        ])
        setVehicles(Array.isArray(vehicleRes) ? vehicleRes : [])
        setTrips(Array.isArray(tripRes) ? tripRes : [])
        setFuelLogs(Array.isArray(fuelRes) ? fuelRes : [])
        setMaintenance(Array.isArray(maintenanceRes) ? maintenanceRes : [])
      } catch (error) {
        toast.error(error.message || 'Failed to load performance data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const totalVehicles = vehicles.length || 1
  const activeVehicles = vehicles.filter((vehicle) => vehicle.operationalStatus === 'Active').length
  const maintenanceVehicles = vehicles.filter((vehicle) => vehicle.operationalStatus === 'In Maintenance').length
  const inactiveVehicles = Math.max(totalVehicles - activeVehicles - maintenanceVehicles, 0)
  const inProgressTrips = trips.filter((trip) => trip.status === 'In Progress').length
  const completedTrips = trips.filter((trip) => trip.status === 'Completed').length
  const totalFuel = fuelLogs.reduce((sum, log) => sum + (parseFloat(log.quantity) || 0), 0)
  const totalDistance = trips.reduce((sum, trip) => sum + (parseFloat(trip.distanceTraveled) || 0), 0)

  const fleetHealthScore = Math.round((activeVehicles / totalVehicles) * 100)
  const avgUtilization = Math.min(100, Math.round((inProgressTrips / totalVehicles) * 100))
  const fuelEfficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(1) : '—'
  const onTimePerformance = trips.length ? Math.round((completedTrips / trips.length) * 100) : 0

  const monthlyStats = useMemo(() => {
    const map = {}
    trips.forEach((trip) => {
      const date = new Date(trip.departureTime || trip.createdAt || Date.now())
      const key = date.toLocaleString('en-US', { month: 'short' })
      if (!map[key]) {
        map[key] = { mileage: 0, trips: 0 }
      }
      map[key].mileage += parseFloat(trip.distanceTraveled) || 0
      map[key].trips += 1
    })
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((month) => ({
      month,
      health: fleetHealthScore,
      utilization: map[month]?.trips ? Math.min(100, Math.round((map[month].trips / totalVehicles) * 100)) : Math.max(fleetHealthScore - 5, 0),
      efficiency: fuelEfficiency === '—' ? 0 : Number(fuelEfficiency)
    }))
  }, [trips, fleetHealthScore, totalVehicles, fuelEfficiency])

  const vehiclePerformance = useMemo(() => {
    return vehicles
      .map((vehicle) => {
        const vehicleTrips = trips.filter((trip) => trip.vehicleId === vehicle.id)
        const mileage = vehicleTrips.reduce((sum, trip) => sum + (parseFloat(trip.distanceTraveled) || 0), 0)
        return {
          vehicle: vehicle.plateNumber || `${vehicle.make} ${vehicle.model}`,
          health: vehicle.operationalStatus === 'Active' ? 95 : vehicle.operationalStatus === 'In Maintenance' ? 65 : 50,
          utilization: Math.min(100, Math.round((vehicleTrips.length / Math.max(trips.length, 1)) * 100)),
          efficiency: fuelEfficiency === '—' ? 0 : Number(fuelEfficiency),
          trips: vehicleTrips.length,
          mileage,
          status:
            vehicle.operationalStatus === 'Active'
              ? 'Excellent'
              : vehicle.operationalStatus === 'In Maintenance'
              ? 'Maintenance'
              : 'Idle',
          statusColor:
            vehicle.operationalStatus === 'Active'
              ? 'bg-green-100 text-green-800'
              : vehicle.operationalStatus === 'In Maintenance'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-700'
        }
      })
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5)
  }, [vehicles, trips, fuelEfficiency])

  const utilizationData = [
    { name: 'Available', value: activeVehicles, color: '#10b981' },
    { name: 'In Maintenance', value: maintenanceVehicles, color: '#f59e0b' },
    { name: 'Idle', value: inactiveVehicles, color: '#6b7280' }
  ]

  const kpiCards = [
    {
      title: 'Fleet Health Score',
      value: `${fleetHealthScore}%`,
      change: '+2%',
      trend: 'up',
      icon: Activity,
      color: 'text-green-500'
    },
    {
      title: 'Average Utilization',
      value: `${avgUtilization}%`,
      change: '+3%',
      trend: 'up',
      icon: BarChart3,
      color: 'text-blue-500'
    },
    {
      title: 'Fuel Efficiency',
      value: fuelEfficiency === '—' ? '—' : `${fuelEfficiency} km/L`,
      change: '+0.3',
      trend: 'up',
      icon: Zap,
      color: 'text-purple-500'
    },
    {
      title: 'On-Time Performance',
      value: `${onTimePerformance}%`,
      change: onTimePerformance >= 90 ? '+1%' : '-1%',
      trend: onTimePerformance >= 90 ? 'up' : 'down',
      icon: TrendingUp,
      color: 'text-orange-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading performance metrics...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring</h1>
        <p className="text-gray-600 mt-1">Monitor fleet health, utilization, and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Icon className={kpi.color} size={24} />
                {kpi.trend === 'up' ? (
                  <TrendingUp className="text-green-500" size={20} />
                ) : (
                  <TrendingDown className="text-red-500" size={20} />
                )}
              </div>
              <p className="text-sm text-gray-600">{kpi.title}</p>
              <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
              <p className={`text-xs mt-1 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change} from last month
              </p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'fleet'
              ? 'text-ucu-blue-600 border-b-2 border-ucu-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Fleet Health
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'vehicles'
              ? 'text-ucu-blue-600 border-b-2 border-ucu-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Vehicle Performance
        </button>
        <button
          onClick={() => setActiveTab('utilization')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'utilization'
              ? 'text-ucu-blue-600 border-b-2 border-ucu-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Utilization
        </button>
      </div>

      {/* Fleet Health Tab */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Fleet Health Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="health" stroke="#10b981" name="Health Score (%)" strokeWidth={2} />
                <Line type="monotone" dataKey="utilization" stroke="#3b82f6" name="Utilization (%)" strokeWidth={2} />
                <Line type="monotone" dataKey="efficiency" stroke="#a855f7" name="Efficiency (%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vehicle Performance Tab */}
      {activeTab === 'vehicles' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Vehicle Performance Metrics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Vehicle</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Health Score</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Utilization</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Efficiency</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Trips</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Mileage</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehiclePerformance.map((vehicle, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-800 font-medium">{vehicle.vehicle}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${vehicle.health}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{vehicle.health}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-800">{vehicle.utilization}%</td>
                    <td className="py-2 px-3 text-gray-800">
                      {vehicle.efficiency ? `${vehicle.efficiency} km/L` : '—'}
                    </td>
                    <td className="py-2 px-3 text-gray-800">{vehicle.trips}</td>
                    <td className="py-2 px-3 text-gray-800">{vehicle.mileage?.toLocaleString() ?? '0'} km</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.statusColor}`}>
                        {vehicle.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Utilization Tab */}
      {activeTab === 'utilization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Fleet Utilization</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Utilization Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fleetHealthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilization" fill="#3b82f6" name="Utilization (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitoring












