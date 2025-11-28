import React, { useEffect, useMemo, useState } from 'react'
import {
  Car,
  Users,
  Fuel,
  Wrench,
  Calendar,
  TrendingUp,
  Activity,
  Bell,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import api from '../utils/api'

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getDashboardStats()
        setData(response)
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
        setError('Unable to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const stats = data?.stats ?? {
    totalVehicles: 0,
    activeVehicles: 0,
    totalDrivers: 0,
    activeTrips: 0,
    pendingBookings: 0,
    totalFuelCost: 0,
    maintenanceCost: 0
  }

  const statCards = useMemo(() => ([
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: Car,
      change: '+2',
      color: 'text-indigo-500',
      chip: 'Fleet Size'
    },
    {
      title: 'Active Vehicles',
      value: stats.activeVehicles,
      icon: Activity,
      change: '+3',
      color: 'text-emerald-500',
      chip: 'Available'
    },
    {
      title: 'Total Drivers',
      value: stats.totalDrivers,
      icon: Users,
      change: '+1',
      color: 'text-purple-500',
      chip: 'Onboarding'
    },
    {
      title: 'Active Trips',
      value: stats.activeTrips,
      icon: Calendar,
      change: '+1',
      color: 'text-sky-500',
      chip: 'Live'
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: Calendar,
      change: '-2',
      color: 'text-amber-500',
      chip: 'Approval'
    },
    {
      title: 'Fuel Cost (UGX)',
      value: `UGX ${Number(stats.totalFuelCost).toLocaleString()}`,
      icon: Fuel,
      change: '+5%',
      color: 'text-rose-500',
      chip: 'This Month'
    }
  ]), [stats])

  const maintenancePie = useMemo(() => data?.maintenanceData ?? [], [data])

  const { upcomingMaintenanceCount, maintenanceCounts } = useMemo(() => {
    const counts = maintenancePie.reduce(
      (acc, entry) => {
        const name = (entry.name || '').toLowerCase()
        if (name.includes('routine')) acc.routine += entry.count || 0
        else if (name.includes('repair')) acc.repairs += entry.count || 0
        else if (name.includes('check') || name.includes('inspection')) acc.inspections += entry.count || 0
        else acc.other += entry.count || 0
        return acc
      },
      { routine: 0, repairs: 0, inspections: 0, other: 0 }
    )
    return {
      upcomingMaintenanceCount: data?.upcomingMaintenanceCount ?? counts.routine + counts.repairs + counts.inspections + counts.other,
      maintenanceCounts: counts
    }
  }, [data, maintenancePie])

  const routineCount = maintenanceCounts?.routine ?? 0
  const repairsCount = maintenanceCounts?.repairs ?? 0
  const inspectionsCount = maintenanceCounts?.inspections ?? 0

  const notifications = data?.notifications?.slice(0, 4) ?? []

  const performanceData = useMemo(() => {
    return (data?.mileageData ?? []).map((entry) => ({
      ...entry,
      trips: entry.trips ?? entry.tripCount ?? 0
    }))
  }, [data])

  const fuelTrendData = useMemo(() => {
    return (data?.fuelData ?? []).map((entry) => ({
      ...entry,
      cost: entry.cost ?? entry.fuelCost ?? 0
    }))
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-600">
        <p>{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-600">
        <p>No dashboard data available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-primary-500 uppercase tracking-wide">Dashboard & Reports</p>
        <h1 className="text-3xl font-semibold text-gray-900 mt-1">Operational Intelligence</h1>
        <p className="text-gray-500 mt-2">Live view of fleet utilization, trips, maintenance and compliance metrics.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{stat.chip}</span>
                <div className={`h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <TrendingUp size={12} /> {stat.change} this month
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Fleet Performance</h2>
              <p className="text-sm text-gray-500">Total mileage vs number of trips</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="mileage" fill="#6366F1" radius={[6, 6, 0, 0]} name="Total Mileage (km)" />
              <Line yAxisId="right" type="monotone" dataKey="trips" stroke="#F97316" strokeWidth={3} name="Number of Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Fuel Consumption</h2>
          <p className="text-sm text-gray-500 mb-4">Liters vs cost trend</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={fuelTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="fuel" stroke="#0EA5E9" strokeWidth={3} name="Fuel (Liters)" />
              <Line type="monotone" dataKey="cost" stroke="#F43F5E" strokeWidth={3} name="Fuel Cost (UGX x1000)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Cost Breakdown</h2>
          {maintenancePie.length ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={maintenancePie} dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4}>
                    {maintenancePie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {maintenancePie.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <p className="text-gray-600">{entry.name}</p>
                    <p className="font-semibold text-gray-900 ml-auto">UGX {Number(entry.value).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No maintenance records yet.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity Log</h2>
            <span className="text-xs font-semibold text-gray-400 uppercase">Latest</span>
          </div>
          <div className="space-y-4">
            {data.activityLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{log.type}</p>
                  <p className="text-xs text-gray-500">{log.description}</p>
                </div>
                <div className="text-xs text-gray-400 text-right">
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
            {!data.activityLogs.length && (
              <p className="text-sm text-gray-500">No activity logged yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Availability Status</h2>
          <div className="space-y-3">
            {data.vehicleStatus.slice(0, 6).map(vehicle => (
              <div key={vehicle.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{vehicle.registration}</p>
                  <p className="text-xs text-gray-500">Vehicle Registration</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  vehicle.status === 'Available'
                    ? 'bg-emerald-50 text-emerald-600'
                    : vehicle.status === 'In Maintenance'
                    ? 'bg-amber-50 text-amber-700'
                    : vehicle.status === 'On-Trip' || vehicle.status === 'On Trip'
                    ? 'bg-sky-50 text-sky-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {vehicle.status}
                </span>
              </div>
            ))}
            {!data.vehicleStatus.length && (
              <p className="text-sm text-gray-500">No vehicles found.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-primary-500" /> Notifications & Alerts
          </h2>
          <div className="space-y-4">
            {!notifications.length && <p className="text-sm text-gray-500">No new alerts.</p>}
            {notifications.map(notification => (
              <div key={notification.id} className="flex gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  notification.severity === 'urgent'
                    ? 'bg-rose-50 text-rose-600'
                    : notification.severity === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-primary-50 text-primary-600'
                }`}>
                  {notification.severity === 'urgent' ? <AlertTriangle size={18} /> : <Bell size={18} />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500">{notification.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{notification.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Summary</h2>
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Wrench size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Maintenance Cost</p>
                <p className="text-2xl font-semibold text-gray-900">UGX {Number(stats.maintenanceCost).toLocaleString()}</p>
              </div>
              <div className="ml-auto text-xs font-medium text-emerald-600">-12% vs last month</div>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-2">Scheduled Services</p>
              <div className="flex items-center gap-3 text-gray-900 font-semibold">
                {upcomingMaintenanceCount} upcoming <span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><TrendingUp size={12} /> on track</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-gray-600">
                <div className="border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-semibold text-gray-900">{routineCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Routine</p>
                </div>
                <div className="border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-semibold text-gray-900">{repairsCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Repairs</p>
                </div>
                <div className="border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-semibold text-gray-900">{inspectionsCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Inspection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
