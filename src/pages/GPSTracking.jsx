import React, { useEffect, useMemo, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import { Activity, Navigation, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const locationDictionary = {
  'Uganda Christian University Main Campus': { lat: 0.353, lng: 32.739 },
  'Kampala City Centre': { lat: 0.3476, lng: 32.5825 },
  'Entebbe International Airport': { lat: 0.0424, lng: 32.4435 },
  'Gulu University': { lat: 2.7724, lng: 32.2881 },
  'Mbarara Teaching Hospital': { lat: -0.6086, lng: 30.6583 },
  'Mukono': { lat: 0.3533, lng: 32.7553 }
}

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
})

const resolveLocation = async (location) => {
  if (locationDictionary[location]) {
    return locationDictionary[location]
  }
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
  )
  const data = await response.json()
  if (data.length) {
    const coords = { lat: Number(data[0].lat), lng: Number(data[0].lon) }
    locationDictionary[location] = coords
    return coords
  }
  return locationDictionary['Uganda Christian University Main Campus']
}

const GPSTracking = () => {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [markers, setMarkers] = useState([])
  const [center, setCenter] = useState([0.3476, 32.5825])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [vehicleRes, tripRes, driverRes] = await Promise.all([
          api.getVehicles(),
          api.getTrips(),
          api.getDrivers()
        ])
        const vehicleList = Array.isArray(vehicleRes) ? vehicleRes : []
        const tripList = Array.isArray(tripRes) ? tripRes : []
        const driverList = Array.isArray(driverRes) ? driverRes : []
        setVehicles(vehicleList)
        setDrivers(driverList)
        setTrips(tripList)

        const driverById = Object.fromEntries(
          driverList.map((d) => [String(d.id), d.name || d.username || `Driver ${d.id}`])
        )

        const entries = await Promise.all(
          vehicleList.map(async (vehicle) => {
            const locationName =
              vehicle.lastKnownLocation ||
              tripList.find((t) => String(t.vehicleId) === String(vehicle.id) || (t.vehicleIds || []).includes(vehicle.id))?.destination ||
              'Uganda Christian University Main Campus'
            const coordinates = await resolveLocation(locationName)
            const driverId = vehicle.assignedDriver
            const driverName = driverId ? (driverById[String(driverId)] || `Driver ${driverId}`) : 'Unassigned'
            return {
              id: vehicle.id,
              label: vehicle.plateNumber || `${vehicle.make} ${vehicle.model}`,
              plateNumber: vehicle.plateNumber,
              make: vehicle.make,
              model: vehicle.model,
              status: vehicle.operationalStatus || 'Unknown',
              location: locationName,
              coords: coordinates,
              driverId,
              driverName
            }
          })
        )
        setMarkers(entries)
        if (entries[0]) {
          setCenter([entries[0].coords.lat, entries[0].coords.lng])
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load GPS data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [refreshKey])

  const activeTrips = useMemo(() => trips.filter((trip) => trip.status === 'In Progress'), [trips])

  const driverById = useMemo(
    () => Object.fromEntries(drivers.map((d) => [String(d.id), d.name || d.username || `Driver ${d.id}`])),
    [drivers]
  )
  const vehicleById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [String(v.id), v])),
    [vehicles]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">GPS Tracking</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Live map showing each vehicle against its current route assignment.
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-xl border-2 border-ucu-gold-300 dark:border-ucu-gold-500 text-ucu-gold-700 dark:text-ucu-gold-400 flex items-center gap-2 text-sm font-semibold hover:bg-ucu-gold-50 dark:hover:bg-ucu-gold-500/20 transition-all disabled:opacity-60"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh map'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <Navigation size={18} className="text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Live Vehicle Map</p>
          </div>
          <div className="h-[540px]">
            {!loading && markers.length ? (
              <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((marker) => (
                  <Marker
                    key={marker.id}
                    position={[marker.coords.lat, marker.coords.lng]}
                    icon={defaultIcon}
                  >
                    <Popup>
                      <div className="text-sm min-w-[180px]">
                        <p className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mb-2">Location: {marker.location}</p>
                        <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-500 dark:text-gray-400">Driver:</span> {marker.driverName}</p>
                        <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-500 dark:text-gray-400">Vehicle:</span> {marker.plateNumber || marker.label}{marker.make && marker.model ? ` • ${marker.make} ${marker.model}` : ''}</p>
                        <span
                          className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            marker.status === 'On Trip'
                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
                              : marker.status === 'In Maintenance'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          }`}
                        >
                          {marker.status}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {activeTrips.map((trip) => {
                  const vid = trip.vehicleId || (trip.vehicleIds && trip.vehicleIds[0])
                  const did = trip.driverId
                  const v = vid ? vehicleById[String(vid)] : null
                  const vehicleLabel = v ? (v.plateNumber ? `${v.plateNumber}${v.make && v.model ? ` • ${v.make} ${v.model}` : ''}` : `${(v.make || '')} ${(v.model || '')}`.trim() || vid) : (vid || '—')
                  const driverLabel = trip.driverName || (did ? driverById[String(did)] : null) || (did ? `Driver ${did}` : '—')
                  const destCoords = locationDictionary[trip.destination] || locationDictionary['Kampala City Centre']
                  return (
                    <CircleMarker
                      key={`trip-${trip.id}`}
                      center={destCoords}
                      radius={6}
                      pathOptions={{ color: '#d97706', fillColor: '#fbbf24', fillOpacity: 0.8 }}
                    >
                      <Popup>
                        <div className="text-sm min-w-[180px]">
                          <p className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mb-2">Trip {trip.tripCode || trip.id}</p>
                          <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-500 dark:text-gray-400">Driver:</span> {driverLabel}</p>
                          <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold text-gray-500 dark:text-gray-400">Vehicle:</span> {vehicleLabel}</p>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">Destination: {trip.destination}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                Loading map data...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity size={18} className="text-primary-500" /> Active Trips
            </h2>
            <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scroll pr-2">
              {activeTrips.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No active trips at the moment.</p>
              )}
              {activeTrips.map((trip) => {
                const vid = trip.vehicleId || (trip.vehicleIds && trip.vehicleIds[0])
                const v = vid && vehicleById ? vehicleById[String(vid)] : null
                const vehicleLabel = v ? (v.plateNumber ? `${v.plateNumber}${v.make && v.model ? ` • ${v.make} ${v.model}` : ''}` : `${(v.make || '')} ${(v.model || '')}`.trim() || vid) : (vid || '—')
                const driverLabel = trip.driverName || (trip.driverId && driverById ? driverById[String(trip.driverId)] : null) || (trip.driverId ? `Driver ${trip.driverId}` : '—')
                return (
                  <div key={trip.id} className="border border-gray-100 dark:border-slate-600 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 dark:text-white">{trip.tripCode || trip.id}</p>
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">In Progress</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {trip.origin} → {trip.destination}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Driver: {driverLabel} • Vehicle: {vehicleLabel}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Fleet Snapshot</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Total vehicles tracked: {vehicles.length}</p>
              <p>Active trips: {activeTrips.length}</p>
              <p>
                Available units:{' '}
                {vehicles.filter((vehicle) => vehicle.operationalStatus === 'Active').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GPSTracking
