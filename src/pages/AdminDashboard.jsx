import React from 'react'
import Dashboard from './Dashboard'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, <span className="font-semibold text-ucu-blue-600 dark:text-ucu-blue-400">{user?.username}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-ucu-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">{user?.username?.charAt(0).toUpperCase()}</span>
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


