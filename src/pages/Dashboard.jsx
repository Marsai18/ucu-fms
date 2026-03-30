import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Car,
  Users,
  Fuel,
  Wrench,
  Calendar,
  TrendingUp,
  Bell,
  CheckCircle2,
  Plus,
  MapPin,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
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
import GatePassAdminPanel from '../components/GatePassAdminPanel'

const accentBar = {
  blue: 'bg-blue-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500'
}

const vehicleStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s.includes('active') && !s.includes('inactive')) {
    return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35'
  }
  if (s.includes('maintenance') || s.includes('repair')) {
    return 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/35'
  }
  if (s.includes('trip') || s.includes('on-trip')) {
    return 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/35'
  }
  if (s.includes('idle') || s.includes('park') || s.includes('available')) {
    return 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35'
  }
  return 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30'
}

const Dashboard = () => {
  const { isDarkMode } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState('today')

  const chartGrid = isDarkMode ? '#334155' : '#e2e8f0'
  const chartTick = isDarkMode ? '#94a3b8' : '#64748b'
  const tooltipStyle = isDarkMode
    ? { borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9' }
    : { borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff' }

  const fetchStats = React.useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const response = await api.getDashboardStats(timeframe)
      setData(response)
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      setError(err.message || 'Failed to load data from backend')
    } finally {
      setLoading(false)
    }
  }, [timeframe])

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
      title: 'Total Fleet',
      value: stats.totalVehicles,
      icon: Car,
      change: '↑ Fleet headcount',
      trend: 'up',
      iconColor: 'text-blue-600 dark:text-blue-300 drop-shadow-[0_1px_1px_rgba(37,99,235,0.35)]',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      chip: 'Fleet',
      accent: 'blue'
    },
    {
      title: 'Active Trips',
      value: stats.activeTrips,
      icon: Calendar,
      change: '↑ Live operations',
      trend: 'up',
      iconColor: 'text-sky-600 dark:text-sky-300 drop-shadow-[0_1px_1px_rgba(2,132,199,0.35)]',
      bg: 'bg-sky-500/10 dark:bg-sky-500/20',
      chip: 'Operations',
      accent: 'sky'
    },
    {
      title: 'Drivers',
      value: stats.totalDrivers,
      icon: Users,
      change: '↑ Active pool',
      trend: 'up',
      iconColor: 'text-emerald-600 dark:text-emerald-300 drop-shadow-[0_1px_1px_rgba(5,150,105,0.35)]',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      chip: 'Personnel',
      accent: 'emerald'
    },
    {
      title: 'Fuel Spend (UGX)',
      value: `UGX ${Number(stats.totalFuelCost).toLocaleString()}`,
      icon: Fuel,
      change: 'Period total',
      trend: 'neutral',
      iconColor: 'text-amber-600 dark:text-amber-300 drop-shadow-[0_1px_1px_rgba(217,119,6,0.35)]',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      chip: 'Fuel',
      accent: 'amber'
    },
    {
      title: 'Pending Bookings',
      value: stats.pendingBookings,
      icon: Calendar,
      change: stats.pendingBookings > 0 ? '⚠ Awaiting review' : '✓ Queue clear',
      trend: stats.pendingBookings > 0 ? 'warn' : 'up',
      iconColor: 'text-violet-600 dark:text-violet-300 drop-shadow-[0_1px_1px_rgba(124,58,237,0.35)]',
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      chip: 'Approvals',
      accent: 'violet'
    },
    {
      title: 'Maintenance',
      value: upcomingMaintenanceCount ?? 0,
      icon: Wrench,
      change: (upcomingMaintenanceCount ?? 0) > 0 ? '⚠ Windows due' : '✓ On track',
      trend: (upcomingMaintenanceCount ?? 0) > 0 ? 'warn' : 'up',
      iconColor: 'text-rose-600 dark:text-rose-300 drop-shadow-[0_1px_1px_rgba(225,29,72,0.35)]',
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      chip: 'Service',
      accent: 'rose'
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

  const heroMetrics = useMemo(() => {
    const km = (performanceData || []).reduce((s, e) => s + (Number(e.mileage) || 0), 0)
    const trips = (performanceData || []).reduce((s, e) => s + (Number(e.trips) || 0), 0)
    return {
      drivers: stats.totalDrivers,
      km: Math.round(km).toLocaleString(),
      trips,
    }
  }, [performanceData, stats.totalDrivers])

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

  const tfBtn = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => setTimeframe(id)}
      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
        timeframe === id
          ? 'bg-ucu-gold-500/20 text-ucu-gold-200 border-ucu-gold-500/40 shadow-[0_0_20px_-6px_rgba(212,175,55,0.35)]'
          : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-600/50 hover:border-ucu-gold-500/30'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in-up">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {tfBtn('today', 'Today')}
            {tfBtn('week', 'This week')}
            {tfBtn('month', 'This month')}
          </div>
        </div>
        <Link
          to="/booking"
          className="fms-bench-cta inline-flex items-center justify-center gap-2 whitespace-nowrap no-underline self-start lg:self-center"
        >
          <Plus size={18} strokeWidth={2.5} />
          New booking
        </Link>
      </header>

      {/* Gate Pass (Admin) */}
      <GatePassAdminPanel />

      {/* Hero KPI row — benchmark circular icons */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="fms-shell-hero-card p-5 flex gap-4 items-start">
          <div className="fms-shell-icon-ring shrink-0 bg-amber-500/20 dark:bg-amber-500/15 ring-1 ring-amber-500/35 dark:ring-amber-400/30">
            <Users size={24} strokeWidth={2.5} className="text-amber-600 dark:text-amber-300 drop-shadow-[0_1px_2px_rgba(217,119,6,0.4)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Active drivers
            </p>
            <p className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {heroMetrics.drivers}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Registered in fleet</p>
          </div>
        </div>
        <div className="fms-shell-hero-card p-5 flex gap-4 items-start">
          <div className="fms-shell-icon-ring shrink-0 bg-rose-500/20 dark:bg-rose-500/15 ring-1 ring-rose-500/35 dark:ring-rose-400/30">
            <MapPin size={24} strokeWidth={2.5} className="text-rose-600 dark:text-rose-300 drop-shadow-[0_1px_2px_rgba(225,29,72,0.4)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              KM (chart window)
            </p>
            <p className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {heroMetrics.km}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Total mileage in series</p>
          </div>
        </div>
        <div className="fms-shell-hero-card p-5 flex gap-4 items-start">
          <div className="fms-shell-icon-ring shrink-0 bg-teal-500/20 dark:bg-teal-500/15 ring-1 ring-teal-500/35 dark:ring-teal-400/30">
            <CheckCircle2 size={24} strokeWidth={2.5} className="text-teal-600 dark:text-teal-300 drop-shadow-[0_1px_2px_rgba(13,148,136,0.45)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Trips in series
            </p>
            <p className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {heroMetrics.trips}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">From performance data</p>
          </div>
        </div>
      </section>

      {/* KPI row — colored top accent */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          const bar = accentBar[stat.accent] || accentBar.blue
          const trendClass =
            stat.trend === 'warn'
              ? 'text-amber-600 dark:text-amber-400'
              : stat.trend === 'neutral'
                ? 'text-slate-500 dark:text-slate-400'
                : 'text-emerald-600 dark:text-emerald-400'
          return (
            <div
              key={stat.title}
              className="fms-bench-kpi group flex flex-col p-5 pt-0"
              style={{ animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: `${i * 70}ms`, opacity: 0 }}
            >
              <div className={`fms-bench-kpi__accent ${bar} rounded-t-[inherit]`} />
              <div className="flex items-start justify-between gap-3 pt-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ring-1 ring-inset ring-black/[0.06] dark:ring-white/10`}
                >
                  <Icon size={24} strokeWidth={2.5} className={stat.iconColor} />
                </div>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mt-3">
                {stat.chip}
              </p>
              <p className={`text-xs font-medium mt-2 flex items-center gap-1.5 ${trendClass}`}>
                {stat.trend !== 'warn' && stat.trend !== 'neutral' && (
                  <TrendingUp size={15} strokeWidth={2.5} className="text-emerald-500 dark:text-emerald-400 shrink-0 drop-shadow-[0_1px_1px_rgba(16,185,129,0.35)]" />
                )}
                {stat.change}
              </p>
            </div>
          )
        })}
      </section>

      {/* Fleet status + alerts (benchmark middle row) */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
        <div className="xl:col-span-2 fms-bench-surface p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Fleet status</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Live
            </span>
          </div>
          <div className="space-y-2.5 max-h-[min(28rem,52vh)] overflow-y-auto custom-scroll pr-1">
            {(data.vehicleStatus || []).slice(0, 8).map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 dark:border-slate-600/40 px-4 py-3 bg-slate-50/80 dark:bg-slate-900/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-sky-500/15 dark:bg-sky-500/20 flex items-center justify-center ring-1 ring-sky-500/25 dark:ring-sky-400/25">
                    <Car size={22} strokeWidth={2.5} className="text-sky-600 dark:text-sky-300 drop-shadow-[0_1px_1px_rgba(2,132,199,0.35)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate text-sm sm:text-base">
                      {vehicle.registration}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Fleet unit</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${vehicleStatusBadgeClass(vehicle.status)}`}
                >
                  {vehicle.status}
                </span>
              </div>
            ))}
            {(!data.vehicleStatus || !data.vehicleStatus.length) && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No vehicles found.</p>
            )}
          </div>
        </div>

        <div className="fms-bench-surface p-5 lg:p-6 flex flex-col min-h-0">
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Bell size={20} strokeWidth={2.5} className="shrink-0 text-amber-600 dark:text-amber-300 drop-shadow-[0_1px_2px_rgba(217,119,6,0.45)]" />
            Alerts & notices
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Operational feed</p>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scroll pr-0.5">
            {!notifications.length && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No new alerts.</p>
            )}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`fms-bench-alert p-3.5 bg-slate-50/90 dark:bg-slate-900/45 border border-slate-200/70 dark:border-slate-600/35 ${
                  notification.severity === 'urgent'
                    ? 'fms-bench-alert--urgent'
                    : notification.severity === 'warning'
                      ? 'fms-bench-alert--warning'
                      : 'fms-bench-alert--info'
                }`}
              >
                <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">
                  {notification.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {notification.description}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                  {notification.timeAgo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
        <div className="xl:col-span-2 fms-bench-surface p-5 lg:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Fleet performance</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total mileage vs number of trips</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartTick }} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: chartTick }} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: chartTick }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: chartTick }} />
              <Bar yAxisId="left" dataKey="mileage" fill="#0066cc" radius={[8, 8, 0, 0]} name="Total Mileage (km)" />
              <Line yAxisId="right" type="monotone" dataKey="trips" stroke="#d4af37" strokeWidth={3} name="Number of Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="fms-bench-surface p-5 lg:p-6">
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Fuel consumption</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Liters vs cost trend</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={fuelTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartTick }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTick }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: chartTick }} />
              <Line type="monotone" dataKey="fuel" stroke="#0066cc" strokeWidth={3} name="Fuel (Liters)" />
              <Line type="monotone" dataKey="cost" stroke="#d4af37" strokeWidth={3} name="Fuel Cost (UGX x1000)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Maintenance + activity + summary */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
        <div className="fms-bench-surface p-5 lg:p-6">
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">Maintenance cost breakdown</h2>
          {maintenancePie.length ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={maintenancePie} dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4}>
                    {maintenancePie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                {maintenancePie.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-sm shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <p className="text-slate-600 dark:text-slate-300 truncate">{entry.name}</p>
                    <p className="font-semibold text-slate-900 dark:text-white ml-auto tabular-nums">
                      UGX {Number(entry.value).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No maintenance records yet.</p>
          )}
        </div>

        <div className="fms-bench-surface p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Recent activity</h2>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Latest</span>
          </div>
          <div className="space-y-2.5">
            {(data.activityLogs || []).slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 border border-slate-200/80 dark:border-slate-600/45 rounded-xl p-3 bg-slate-50/80 dark:bg-slate-900/35"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-500/12 dark:bg-blue-500/20 flex items-center justify-center ring-1 ring-blue-500/25 dark:ring-blue-400/30">
                  <CheckCircle2 size={22} strokeWidth={2.5} className="text-blue-600 dark:text-blue-300 drop-shadow-[0_1px_1px_rgba(37,99,235,0.4)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{log.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.description}</p>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 text-right shrink-0">
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
            {(!data.activityLogs || !data.activityLogs.length) && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No activity logged yet.</p>
            )}
          </div>
        </div>

        <div className="fms-bench-surface p-5 lg:p-6">
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">Maintenance summary</h2>
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-600/45 p-4 flex items-center gap-4 bg-ucu-gradient-soft dark:bg-ucu-blue-500/[0.07]">
              <div className="h-12 w-12 rounded-xl bg-blue-500/12 dark:bg-blue-500/20 flex items-center justify-center ring-1 ring-blue-500/30 dark:ring-blue-400/35">
                <Wrench size={24} strokeWidth={2.5} className="text-blue-600 dark:text-blue-300 drop-shadow-[0_1px_2px_rgba(37,99,235,0.4)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total maintenance cost</p>
                <p className="text-xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  UGX {Number(stats.maintenanceCost).toLocaleString()}
                </p>
              </div>
              <div className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                vs last month
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-600/45 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">Scheduled services</p>
              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-semibold text-sm">
                {upcomingMaintenanceCount} upcoming{' '}
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp size={14} strokeWidth={2.5} className="text-emerald-500 dark:text-emerald-300 drop-shadow-[0_1px_1px_rgba(16,185,129,0.35)]" /> on track
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="border border-slate-200/80 dark:border-slate-600/45 rounded-xl p-3 text-center bg-slate-50/80 dark:bg-slate-900/35">
                  <p className="text-xl font-display font-bold text-slate-900 dark:text-white">{routineCount}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wide">Routine</p>
                </div>
                <div className="border border-slate-200/80 dark:border-slate-600/45 rounded-xl p-3 text-center bg-slate-50/80 dark:bg-slate-900/35">
                  <p className="text-xl font-display font-bold text-slate-900 dark:text-white">{repairsCount}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wide">Repairs</p>
                </div>
                <div className="border border-slate-200/80 dark:border-slate-600/45 rounded-xl p-3 text-center bg-slate-50/80 dark:bg-slate-900/35">
                  <p className="text-xl font-display font-bold text-slate-900 dark:text-white">{inspectionsCount}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wide">Inspection</p>
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
