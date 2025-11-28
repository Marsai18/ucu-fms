import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Send, History } from 'lucide-react'
import toast from 'react-hot-toast'

const ClientDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalRequests: 5,
    pendingRequests: 2,
    approvedRequests: 3,
    rejectedRequests: 0
  })

  const recentRequests = [
    {
      id: 'BK001',
      vehicle: 'Toyota Hilux (UBL 123A)',
      destination: 'Kampala City',
      startDate: '2024-11-20 08:00',
      endDate: '2024-11-20 17:00',
      status: 'Approved',
      statusColor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    },
    {
      id: 'BK002',
      vehicle: 'Ford Ranger (UBE 789C)',
      destination: 'Entebbe Airport',
      startDate: '2024-11-21 06:00',
      endDate: '2024-11-21 10:00',
      status: 'Pending',
      statusColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    },
    {
      id: 'BK003',
      vehicle: 'Suzuki Grand Vitara (UCU 103)',
      destination: 'Gulu University',
      startDate: '2024-11-22 07:00',
      endDate: '2024-11-22 18:00',
      status: 'Pending',
      statusColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-ucu-blue-500 to-ucu-blue-600 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-ucu-blue-100">
          {user?.email || user?.name || 'Client'} • UCU Fleet Management Portal
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalRequests}</p>
            </div>
            <div className="p-3 bg-ucu-blue-100 dark:bg-ucu-blue-900/30 rounded-lg">
              <History className="text-ucu-blue-600 dark:text-ucu-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pendingRequests}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.approvedRequests}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.rejectedRequests}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/client/request')}
              className="w-full flex items-center justify-between p-4 bg-ucu-blue-50 dark:bg-ucu-blue-900/20 hover:bg-ucu-blue-100 dark:hover:bg-ucu-blue-900/30 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-ucu-blue-500 rounded-lg group-hover:bg-ucu-blue-600 transition-colors">
                  <Send className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">New Booking Request</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Submit a vehicle booking request</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/client/history')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500 rounded-lg group-hover:bg-gray-600 transition-colors">
                  <History className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">View Request History</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Check status of your requests</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Requests</h2>
            <button
              onClick={() => navigate('/client/history')}
              className="text-sm text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => navigate('/client/history')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{request.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.statusColor}`}>
                    {request.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <MapPin size={16} />
                  <span>{request.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar size={16} />
                  <span>{request.startDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-ucu-blue-50 dark:bg-ucu-blue-900/20 border border-ucu-blue-200 dark:border-ucu-blue-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How to Request a Vehicle</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Click on "New Booking Request" to fill out the booking form</li>
          <li>Select your preferred vehicle and provide trip details</li>
          <li>Submit your request for admin approval</li>
          <li>Track the status of your request in "Request History"</li>
          <li>You will be notified when your request is approved or rejected</li>
        </ol>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <strong>Need help?</strong> Contact the fleet management team at{' '}
          <a href="mailto:fleet@ucu.ac.ug" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline">
            fleet@ucu.ac.ug
          </a>
        </p>
      </div>
    </div>
  )
}

export default ClientDashboard










