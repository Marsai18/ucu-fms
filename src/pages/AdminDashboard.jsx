import React from 'react'
import Dashboard from './Dashboard'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <div className="bg-[var(--bg-surface)] dark:bg-slate-800/90 p-6 rounded-2xl border border-[var(--border-default)] card-glow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ucu-blue-600 dark:text-ucu-blue-400 uppercase tracking-widest">Admin</p>
            <h1 className="text-3xl md:text-4xl font-display font-bold mt-1 tracking-tight">
              <span className="text-gradient-ucu">Admin Dashboard</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back, <span className="font-semibold text-ucu-blue-600 dark:text-ucu-blue-400">{user?.username}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-ucu-gradient flex items-center justify-center shadow-ucu ring-2 ring-white/30 dark:ring-slate-600/30">
              <span className="text-white font-display font-bold text-xl">{user?.username?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Reuse the main dashboard analytics for admin view */}
      <Dashboard />
    </div>
  )
}

export default AdminDashboard


