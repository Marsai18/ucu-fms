import React, { useState } from 'react'
import { Shield, FileCheck, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ComplianceSafety = () => {
  const [activeTab, setActiveTab] = useState('compliance')
  const [formData, setFormData] = useState({
    regulationType: '',
    vehicle: '',
    inspectionDate: '',
    inspector: '',
    findings: '',
    complianceStatus: 'Compliant',
    nextInspectionDate: '',
  })

  const complianceRecords = [
    {
      id: 1,
      vehicle: 'UA 001 AK',
      regulationType: 'Roadworthiness Certificate',
      inspectionDate: '2024-06-15',
      expiryDate: '2025-06-15',
      status: 'Compliant',
      statusColor: 'bg-green-100 text-green-800',
      inspector: 'Ministry of Works',
      nextInspection: '2025-05-15'
    },
    {
      id: 2,
      vehicle: 'UA 002 AK',
      regulationType: 'Insurance',
      inspectionDate: '2024-07-01',
      expiryDate: '2025-07-01',
      status: 'Compliant',
      statusColor: 'bg-green-100 text-green-800',
      inspector: 'Insurance Company',
      nextInspection: '2025-06-01'
    },
    {
      id: 3,
      vehicle: 'UA 003 AK',
      regulationType: 'Roadworthiness Certificate',
      inspectionDate: '2024-05-20',
      expiryDate: '2025-05-20',
      status: 'Expiring Soon',
      statusColor: 'bg-yellow-100 text-yellow-800',
      inspector: 'Ministry of Works',
      nextInspection: '2025-04-20'
    },
    {
      id: 4,
      vehicle: 'UA 004 AK',
      regulationType: 'Driver License',
      inspectionDate: '2024-07-10',
      expiryDate: '2025-07-10',
      status: 'Compliant',
      statusColor: 'bg-green-100 text-green-800',
      inspector: 'Traffic Police',
      nextInspection: '2025-06-10'
    },
  ]

  const safetyChecks = [
    {
      id: 1,
      vehicle: 'UA 001 AK',
      checkType: 'Daily Safety Check',
      date: '2024-07-28',
      status: 'Passed',
      statusColor: 'bg-green-100 text-green-800',
      checkedBy: 'David Ssebunya',
      notes: 'All systems operational'
    },
    {
      id: 2,
      vehicle: 'UA 002 AK',
      checkType: 'Weekly Inspection',
      date: '2024-07-27',
      status: 'Passed',
      statusColor: 'bg-green-100 text-green-800',
      checkedBy: 'Grace Nalubega',
      notes: 'Minor tire wear noted'
    },
    {
      id: 3,
      vehicle: 'UA 003 AK',
      checkType: 'Daily Safety Check',
      date: '2024-07-28',
      status: 'Failed',
      statusColor: 'bg-red-100 text-red-800',
      checkedBy: 'Joseph Kato',
      notes: 'Brake fluid low - requires attention'
    },
  ]

  const regulations = [
    {
      id: 1,
      name: 'Roadworthiness Certificate',
      frequency: 'Annual',
      description: 'Annual vehicle inspection for roadworthiness',
      lastUpdated: '2024-01-15'
    },
    {
      id: 2,
      name: 'Insurance Coverage',
      frequency: 'Annual',
      description: 'Third-party insurance coverage required',
      lastUpdated: '2024-01-15'
    },
    {
      id: 3,
      name: 'Driver License',
      frequency: 'As per license expiry',
      description: 'Valid driver license for all drivers',
      lastUpdated: '2024-01-15'
    },
    {
      id: 4,
      name: 'Vehicle Registration',
      frequency: 'One-time',
      description: 'Vehicle must be registered with URA',
      lastUpdated: '2024-01-15'
    },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.regulationType || !formData.vehicle || !formData.inspectionDate || !formData.inspector) {
      toast.error('Please fill in all required fields')
      return
    }

    setTimeout(() => {
      toast.success('Compliance record added successfully!')
      setFormData({
        regulationType: '',
        vehicle: '',
        inspectionDate: '',
        inspector: '',
        findings: '',
        complianceStatus: 'Compliant',
        nextInspectionDate: '',
      })
    }, 500)
  }

  const handleRecordSafetyCheck = () => {
    toast.success('Safety check recorded successfully!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance & Safety</h1>
        <p className="text-gray-600 mt-1">Monitor regulations, ensure compliance, and manage safety checks</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'compliance'
              ? 'text-ucu-blue-600 border-b-2 border-ucu-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Compliance
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'safety'
              ? 'text-ucu-blue-600 border-b-2 border-ucu-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Safety Checks
        </button>
        <button
          onClick={() => setActiveTab('regulations')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'regulations'
              ? 'text-ucu-blue-600 border-b-2 border-ucu-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Regulations
        </button>
      </div>

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Compliance Records</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-700 font-medium">Vehicle</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium">Regulation Type</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium">Inspection Date</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium">Expiry Date</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-medium">Next Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-800 font-medium">{record.vehicle}</td>
                      <td className="py-2 px-3 text-gray-800">{record.regulationType}</td>
                      <td className="py-2 px-3 text-gray-800">{record.inspectionDate}</td>
                      <td className="py-2 px-3 text-gray-800">{record.expiryDate}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.statusColor}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-800">{record.nextInspection}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Record Compliance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Regulation Type</label>
                <select
                  name="regulationType"
                  value={formData.regulationType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select regulation</option>
                  <option value="Roadworthiness Certificate">Roadworthiness Certificate</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Driver License">Driver License</option>
                  <option value="Vehicle Registration">Vehicle Registration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle</label>
                <select
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select vehicle</option>
                  <option value="UA 001 AK">UA 001 AK</option>
                  <option value="UA 002 AK">UA 002 AK</option>
                  <option value="UA 003 AK">UA 003 AK</option>
                  <option value="UA 004 AK">UA 004 AK</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inspection Date</label>
                <input
                  type="date"
                  name="inspectionDate"
                  value={formData.inspectionDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inspector</label>
                <input
                  type="text"
                  name="inspector"
                  value={formData.inspector}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compliance Status</label>
                <select
                  name="complianceStatus"
                  value={formData.complianceStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Next Inspection Date</label>
                <input
                  type="date"
                  name="nextInspectionDate"
                  value={formData.nextInspectionDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-ucu-blue-500 text-white py-2 px-4 rounded-lg hover:bg-ucu-blue-600 transition-colors"
              >
                Record Compliance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Safety Checks Tab */}
      {activeTab === 'safety' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Safety Checks</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Vehicle</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Check Type</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Checked By</th>
                  <th className="text-left py-2 px-3 text-gray-700 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {safetyChecks.map((check) => (
                  <tr key={check.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-800 font-medium">{check.vehicle}</td>
                    <td className="py-2 px-3 text-gray-800">{check.checkType}</td>
                    <td className="py-2 px-3 text-gray-800">{check.date}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${check.statusColor}`}>
                        {check.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-800">{check.checkedBy}</td>
                    <td className="py-2 px-3 text-gray-800">{check.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regulations Tab */}
      {activeTab === 'regulations' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Regulations & Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regulations.map((regulation) => (
              <div key={regulation.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="text-ucu-blue-600" size={20} />
                  <h3 className="font-semibold text-gray-800">{regulation.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{regulation.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Frequency: {regulation.frequency}</span>
                  <span>Updated: {regulation.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplianceSafety








