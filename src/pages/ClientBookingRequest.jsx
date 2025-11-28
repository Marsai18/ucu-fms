import React from 'react'

const ClientBookingRequest = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Booking Request</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Submit a vehicle booking request</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">Booking request form will be displayed here.</p>
      </div>
    </div>
  )
}

export default ClientBookingRequest
