import React, { useState } from 'react'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, Hourglass, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const ClientHistory = () => {
  const [filter, setFilter] = useState('all')

  const requests = [
    {
      id: 'BK001',
      vehicle: 'Toyota Hilux (UBL 123A)',
      destination: 'Kampala City',
      purpose: 'Official meeting with ministry officials',
      startDate: '2024-11-20',
      startTime: '08:00',
      endDate: '2024-11-20',
      endTime: '17:00',
      status: 'Approved',
      statusColor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      submittedDate: '2024-11-18',
      approvedDate: '2024-11-19',
      passengers: 3
    },
    {
      id: 'BK002',
      vehicle: 'Ford Ranger (UBE 789C)',
      destination: 'Entebbe Airport',
      purpose: 'Pick up visiting faculty',
      startDate: '2024-11-21',
      startTime: '06:00',
      endDate: '2024-11-21',
      endTime: '10:00',
      status: 'Pending',
      statusColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      submittedDate: '2024-11-19',
      passengers: 4
    },
    {
      id: 'BK003',
      vehicle: 'Suzuki Grand Vitara (UCU 103)',
      destination: 'Gulu University',
      purpose: 'Field trip with students',
      startDate: '2024-11-22',
      startTime: '07:00',
      endDate: '2024-11-22',
      endTime: '18:00',
      status: 'Pending',
      statusColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      submittedDate: '2024-11-20',
      passengers: 7
    },
    {
      id: 'BK004',
      vehicle: 'Toyota Corolla (UCU 104)',
      destination: 'Jinja Town',
      purpose: 'Site visit for research project',
      startDate: '2024-11-15',
      startTime: '09:00',
      endDate: '2024-11-15',
      endTime: '16:00',
      status: 'Rejected',
      statusColor: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      submittedDate: '2024-11-13',
      rejectedDate: '2024-11-14',
      rejectionReason: 'Vehicle not available on requested date',
      passengers: 2
    },
    {
      id: 'BK005',
      vehicle: 'Nissan Navara (UCU 105)',
      destination: 'Mukono Town',
      purpose: 'Staff training session',
      startDate: '2024-11-12',
      startTime: '08:00',
      endDate: '2024-11-12',
      endTime: '14:00',
      status: 'Approved',
      statusColor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      submittedDate: '2024-11-10',
      approvedDate: '2024-11-11',
      passengers: 5
    },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
      case 'Rejected':
        return <XCircle className="text-red-600 dark:text-red-400" size={20} />
      case 'Pending':
        return <Hourglass className="text-yellow-600 dark:text-yellow-400" size={20} />
      default:
        return null
    }
  }

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status.toLowerCase() === filter.toLowerCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Request History</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View the status of all your vehicle booking requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
              filter === status
                ? 'text-ucu-blue-600 dark:text-ucu-blue-400 border-b-2 border-ucu-blue-600 dark:border-ucu-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {status} ({status === 'all' ? requests.length : requests.filter(r => r.status.toLowerCase() === status).length})
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{request.id}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Submitted on {new Date(request.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.statusColor}`}>
                  {request.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle</p>
                  <p className="text-gray-900 dark:text-white">{request.vehicle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</p>
                  <p className="text-gray-900 dark:text-white">{request.purpose}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <MapPin size={16} />
                    Destination
                  </p>
                  <p className="text-gray-900 dark:text-white">{request.destination}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passengers</p>
                  <p className="text-gray-900 dark:text-white">{request.passengers} person(s)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Calendar size={16} />
                    Start Date & Time
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(request.startDate).toLocaleDateString()} at {request.startTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Calendar size={16} />
                    End Date & Time
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(request.endDate).toLocaleDateString()} at {request.endTime}
                  </p>
                </div>
              </div>

              {request.approvedDate && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    <strong>Approved on:</strong> {new Date(request.approvedDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {request.rejectedDate && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    <strong>Rejected on:</strong> {new Date(request.rejectedDate).toLocaleDateString()}
                  </p>
                  {request.rejectionReason && (
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      <strong>Reason:</strong> {request.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ClientHistory










