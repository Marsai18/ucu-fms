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

  const fetchStats = React.useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const response = await api.getDashboardStats()
      setData(response)
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      setError(err.message || 'Failed to load data from backend')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const stats = data?.stats ?? {
    totalVehicles: 0,
    activeVehicles: 0,
    totalDrivers: 0,
    activeTrips: 0,
    pendingBookings: 0,
    totalFuelCost: 0,
    maintenanceCost: 0
  }

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

  const statCards = useMemo(() => ([
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: Car,
      change: '+2',
      color: 'text-[#2563EB] dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      chip: 'Fleet Size'
    },
    {
      title: 'Active Trips',
      value: stats.activeTrips,
      icon: Calendar,
      change: '+1',
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10 dark:bg-sky-500/20',
      chip: 'Live'
    },
    {
      title: 'Drivers Available',
      value: stats.totalDrivers,
      icon: Users,
      change: '+1',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      chip: 'Onboarding'
    },
    {
      title: 'Fuel Usage (UGX)',
      value: `UGX ${Number(stats.totalFuelCost).toLocaleString()}`,
      icon: Fuel,
      change: '+5%',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      chip: 'This Month'
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: Calendar,
      change: '-2',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      chip: 'Approval'
    },
    {
      title: 'Maintenance Alerts',
      value: upcomingMaintenanceCount ?? 0,
      icon: Wrench,
      change: 'Scheduled',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      chip: 'Upcoming'
    }
  ]), [stats, upcomingMaintenanceCount])

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
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-ucu p-8 text-center">
        <p className="text-slate-600 dark:text-slate-300 mb-4">{error}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ensure the backend is running: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">cd fleet_backend && npm start</code></p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-lg bg-ucu-blue-500 text-white font-medium hover:bg-ucu-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-ucu p-8 text-center">
        <p className="text-slate-600 dark:text-slate-300">No dashboard data available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="animate-fade-in-up">
        <p className="text-xs font-bold text-ucu-blue-600 dark:text-ucu-blue-400 uppercase tracking-widest">Dashboard & Reports</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold mt-2 tracking-tight">
          <span className="text-gradient-ucu">Operational Intelligence</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">Live view of fleet utilization, trips, maintenance and compliance metrics.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="group bg-[var(--bg-surface)] dark:bg-slate-800/90 rounded-2xl border border-[var(--border-default)] p-6 flex flex-col gap-4 card-glow overflow-hidden relative"
              style={{ animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: `${i * 80}ms`, opacity: 0 }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between relative">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{stat.chip}</span>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={22} strokeWidth={2} />
                </div>
              </div>
              <div className="relative">
                <p className="text-[var(--text-secondary)] text-sm font-medium">{stat.title}</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-[var(--text-primary)] mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp size={14} /> {stat.change}
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white/95 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Fleet Performance</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total mileage vs number of trips</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-600" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="mileage" fill="#0066cc" radius={[8, 8, 0, 0]} name="Total Mileage (km)" />
              <Line yAxisId="right" type="monotone" dataKey="trips" stroke="#d4af37" strokeWidth={3} name="Number of Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/95 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow backdrop-blur-sm">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-1">Fuel Consumption</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Liters vs cost trend</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={fuelTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend />
              <Line type="monotone" dataKey="fuel" stroke="#0066cc" strokeWidth={3} name="Fuel (Liters)" />
              <Line type="monotone" dataKey="cost" stroke="#d4af37" strokeWidth={3} name="Fuel Cost (UGX x1000)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-4">Maintenance Cost Breakdown</h2>
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
                    <span className="h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-sm" style={{ backgroundColor: entry.color }}></span>
                    <p className="text-slate-600 dark:text-slate-300">{entry.name}</p>
                    <p className="font-semibold text-slate-900 dark:text-white ml-auto">UGX {Number(entry.value).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No maintenance records yet.</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Recent Activity Log</h2>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Latest</span>
          </div>
          <div className="space-y-3">
            {(data.activityLogs || []).slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center gap-3 border border-slate-200/80 dark:border-slate-600/50 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-700/30">
                <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/10 dark:bg-ucu-blue-500/20 flex items-center justify-center text-ucu-blue-600 dark:text-ucu-blue-400">
                  <CheckCircle2 size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">{log.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.description}</p>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 text-right shrink-0">
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
            {(!data.activityLogs || !data.activityLogs.length) && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No activity logged yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-4">Vehicle Availability Status</h2>
          <div className="space-y-3">
            {(data.vehicleStatus || []).slice(0, 6).map(vehicle => (
              <div key={vehicle.id} className="flex items-center justify-between border border-slate-200/80 dark:border-slate-600/50 rounded-xl px-4 py-3 bg-slate-50/50 dark:bg-slate-700/30">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{vehicle.registration}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vehicle Registration</p>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  vehicle.status === 'Available'
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : vehicle.status === 'In Maintenance'
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    : vehicle.status === 'On-Trip' || vehicle.status === 'On Trip'
                    ? 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-700 dark:text-ucu-blue-400'
                    : 'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-400'
                }`}>
                  {vehicle.status}
                </span>
              </div>
            ))}
            {(!data.vehicleStatus || !data.vehicleStatus.length) && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No vehicles found.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell size={20} className="text-ucu-blue-500" /> Notifications & Alerts
          </h2>
          <div className="space-y-4">
            {!notifications.length && <p className="text-sm text-slate-500 dark:text-slate-400">No new alerts.</p>}
            {notifications.map(notification => (
              <div key={notification.id} className="flex gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 border border-slate-200/60 dark:border-slate-600/40">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notification.severity === 'urgent'
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    : notification.severity === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-ucu-blue-100 dark:bg-ucu-blue-500/20 text-ucu-blue-600 dark:text-ucu-blue-400'
                }`}>
                  {notification.severity === 'urgent' ? <AlertTriangle size={18} strokeWidth={2} /> : <Bell size={18} strokeWidth={2} />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{notification.description}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{notification.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-4">Maintenance Summary</h2>
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-600/50 p-4 flex items-center gap-4 bg-ucu-gradient-soft dark:bg-ucu-blue-500/5">
              <div className="h-12 w-12 rounded-xl bg-ucu-blue-500/10 dark:bg-ucu-blue-500/20 flex items-center justify-center text-ucu-blue-600 dark:text-ucu-blue-400">
                <Wrench size={22} strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Maintenance Cost</p>
                <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">UGX {Number(stats.maintenanceCost).toLocaleString()}</p>
              </div>
              <div className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400">-12% vs last month</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-600/50 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">Scheduled Services</p>
              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold">
                {upcomingMaintenanceCount} upcoming <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> on track</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="border border-slate-200/80 dark:border-slate-600/50 rounded-xl p-3 text-center bg-slate-50/50 dark:bg-slate-700/30">
                  <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{routineCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Routine</p>
                </div>
                <div className="border border-slate-200/80 dark:border-slate-600/50 rounded-xl p-3 text-center bg-slate-50/50 dark:bg-slate-700/30">
                  <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{repairsCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Repairs</p>
                </div>
                <div className="border border-slate-200/80 dark:border-slate-600/50 rounded-xl p-3 text-center bg-slate-50/50 dark:bg-slate-700/30">
                  <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{inspectionsCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Inspection</p>
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
