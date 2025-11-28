import React, { useEffect, useMemo, useState } from 'react'
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
  const [trips, setTrips] = useState([])
  const [markers, setMarkers] = useState([])
  const [center, setCenter] = useState([0.3476, 32.5825])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [vehicleRes, tripRes] = await Promise.all([api.getVehicles(), api.getTrips()])
        const vehicleList = Array.isArray(vehicleRes) ? vehicleRes : []
        const tripList = Array.isArray(tripRes) ? tripRes : []
        setVehicles(vehicleList)
        setTrips(tripList)

        const entries = await Promise.all(
          vehicleList.map(async (vehicle) => {
            const locationName =
              vehicle.lastKnownLocation ||
              tripList.find((trip) => trip.vehicleId === vehicle.id)?.destination ||
              'Uganda Christian University Main Campus'
            const coordinates = await resolveLocation(locationName)
            return {
              id: vehicle.id,
              label: vehicle.plateNumber || `${vehicle.make} ${vehicle.model}`,
              status: vehicle.operationalStatus || 'Unknown',
              location: locationName,
              coords: coordinates,
              driver: vehicle.assignedDriver || 'Unassigned'
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
  }, [])

  const activeTrips = useMemo(() => trips.filter((trip) => trip.status === 'In Progress'), [trips])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">GPS Tracking</h1>
          <p className="text-gray-500 mt-1">
            Live map showing each vehicle against its current route assignment.
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 flex items-center gap-2 text-sm hover:border-primary-200"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={16} /> Refresh map
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Navigation size={18} className="text-primary-500" />
            <p className="text-sm font-semibold text-gray-900">Live Vehicle Map</p>
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
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{marker.label}</p>
                        <p className="text-gray-600">Driver: {marker.driver}</p>
                        <p className="text-gray-500 text-xs">{marker.location}</p>
                        <span
                          className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            marker.status === 'On Trip'
                              ? 'bg-sky-50 text-sky-700'
                              : marker.status === 'In Maintenance'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {marker.status}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {activeTrips.map((trip) => (
                  <CircleMarker
                    key={`trip-${trip.id}`}
                    center={
                      locationDictionary[trip.destination] || locationDictionary['Kampala City Centre']
                    }
                    radius={6}
                    pathOptions={{ color: '#d97706', fillColor: '#fbbf24', fillOpacity: 0.8 }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">Trip {trip.tripCode || trip.id}</p>
                        <p className="text-gray-600">Destination: {trip.destination}</p>
                        <p className="text-gray-500 text-xs">Driver: {trip.driverName || trip.driverId}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Loading map data...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity size={18} className="text-primary-500" /> Active Trips
            </h2>
            <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scroll pr-2">
              {activeTrips.length === 0 && (
                <p className="text-sm text-gray-500">No active trips at the moment.</p>
              )}
              {activeTrips.map((trip) => (
                <div key={trip.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{trip.tripCode || trip.id}</p>
                    <span className="text-xs font-semibold text-sky-600">In Progress</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {trip.origin} → {trip.destination}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Driver: {trip.driverName || trip.driverId} • Vehicle: {trip.vehicleId}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Fleet Snapshot</h2>
            <div className="space-y-2 text-sm text-gray-600">
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
