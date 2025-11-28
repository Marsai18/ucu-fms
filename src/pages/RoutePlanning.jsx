import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Route as RouteIcon, Save, Compass } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const defaultForm = {
  origin: 'Uganda Christian University Main Campus',
  destination: 'Kampala City Centre',
  waypoints: '',
  preferredVehicle: ''
}

const locationHints = [
  'Uganda Christian University Main Campus',
  'Kampala City Centre',
  'Entebbe International Airport',
  'Mukono',
  'Gulu University',
  'Mbarara Teaching Hospital'
]

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
})

const RoutePlanning = () => {
  const [formData, setFormData] = useState(defaultForm)
  const [vehicles, setVehicles] = useState([])
  const [routeOptions, setRouteOptions] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [fetchingRoute, setFetchingRoute] = useState(false)
  const [savingRoute, setSavingRoute] = useState(false)

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoadingVehicles(true)
        const response = await api.getVehicles()
        setVehicles(Array.isArray(response) ? response : [])
      } catch (error) {
        toast.error(error.message || 'Failed to load vehicles')
      } finally {
        setLoadingVehicles(false)
      }
    }
    loadVehicles()
  }, [])

  const selectedRoute = useMemo(
    () => routeOptions.find((route) => route.id === selectedRouteId) || routeOptions[0],
    [routeOptions, selectedRouteId]
  )

  const geocodeLocation = async (location) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
    )
    const data = await response.json()
    if (!data.length) {
      throw new Error(`Unable to locate ${location}`)
    }
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) }
  }

  const fetchRoutes = async (e) => {
    e.preventDefault()
    try {
      setFetchingRoute(true)
      const waypoints = formData.waypoints
        ? formData.waypoints.split(',').map((wp) => wp.trim()).filter(Boolean)
        : []

      const coordinatePoints = [
        await geocodeLocation(formData.origin),
        ...await Promise.all(waypoints.map((wp) => geocodeLocation(wp))),
        await geocodeLocation(formData.destination)
      ]

      const coords = coordinatePoints.map((point) => `${point.lng},${point.lat}`).join(';')
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`
      )
      const data = await response.json()
      if (!data.routes?.length) {
        throw new Error('No route options returned')
      }

      const options = data.routes.map((route, index) => ({
        id: `route-${index}`,
        distanceKm: route.distance / 1000,
        durationMinutes: route.duration / 60,
        geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        nodes: coordinatePoints
      }))

      setRouteOptions(options)
      setSelectedRouteId(options[0]?.id || null)
      toast.success('Calculated fresh route options')
    } catch (error) {
      toast.error(error.message || 'Unable to calculate routes')
    } finally {
      setFetchingRoute(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveRoute = async () => {
    if (!selectedRoute) {
      toast.error('Generate a route first')
      return
    }
    try {
      setSavingRoute(true)
      await api.createRoute({
        origin: formData.origin,
        destination: formData.destination,
        waypoints: formData.waypoints,
        preferredVehicle: formData.preferredVehicle,
        distance: selectedRoute.distanceKm,
        duration: selectedRoute.durationMinutes,
        geometry: selectedRoute.geometry
      })
      toast.success('Route saved successfully')
    } catch (error) {
      toast.error(error.message || 'Could not save route')
    } finally {
      setSavingRoute(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Route Planning</h1>
        <p className="text-gray-500 mt-1">
          Calculate live routes, compare alternatives, and dispatch the best option to the field.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <RouteIcon size={18} className="text-primary-500" /> Build Route
          </h2>
          <p className="text-sm text-gray-500 mb-4">Use preset campus destinations or type any address.</p>

          <form className="space-y-4" onSubmit={fetchRoutes}>
            <div>
              <label className="text-sm font-medium text-gray-700">Origin</label>
              <input
                name="origin"
                list="route-locations"
                value={formData.origin}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Destination</label>
              <input
                name="destination"
                list="route-locations"
                value={formData.destination}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Waypoints (comma separated)</label>
              <input
                name="waypoints"
                value={formData.waypoints}
                onChange={handleInputChange}
                placeholder="Optional intermediate stops"
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Preferred Vehicle</label>
              <select
                name="preferredVehicle"
                value={formData.preferredVehicle}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-primary-100"
              >
                <option value="">Let system recommend</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber || vehicle.make} • {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={fetchingRoute}
              className="w-full rounded-xl bg-primary-500 text-white font-semibold py-3 hover:bg-primary-600 disabled:opacity-40"
            >
              {fetchingRoute ? 'Calculating...' : 'Calculate Route'}
            </button>
            {loadingVehicles && <p className="text-xs text-gray-400">Loading fleet inventory…</p>}
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Route Recommendations</h2>
                <p className="text-sm text-gray-500">Pick the optimal route based on distance and travel time.</p>
              </div>
              {selectedRoute && (
                <button
                  onClick={handleSaveRoute}
                  disabled={savingRoute}
                  className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-40 flex items-center gap-2"
                >
                  <Save size={16} /> Save Route
                </button>
              )}
            </div>

            {routeOptions.length === 0 ? (
              <p className="text-sm text-gray-500">Generate a route to see options.</p>
            ) : (
              <div className="space-y-3">
                {routeOptions.map((route, index) => (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                      selectedRouteId === route.id
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <p className="text-sm text-gray-500">Option {index + 1}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {route.distanceKm.toFixed(1)} km • {Math.round(route.durationMinutes)} mins
                    </p>
                    {index === 0 && (
                      <span className="text-xs font-semibold text-emerald-600">Recommended</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <Compass size={18} className="text-primary-500" />
              <p className="text-sm font-semibold text-gray-900">Route Map</p>
            </div>
            <div className="h-[380px]">
              {selectedRoute ? (
                <MapContainer
                  center={selectedRoute.geometry[Math.floor(selectedRoute.geometry.length / 2)]}
                  zoom={9}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Polyline positions={selectedRoute.geometry} color="#0066cc" weight={5} />
                  {selectedRoute.nodes.map((point, index) => (
                    <Marker key={`${point.lat}-${point.lng}-${index}`} position={[point.lat, point.lng]} icon={markerIcon}>
                      <Popup>
                        {index === 0
                          ? 'Origin'
                          : index === selectedRoute.nodes.length - 1
                          ? 'Destination'
                          : `Waypoint ${index}`}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Map preview will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <datalist id="route-locations">
        {locationHints.map((hint) => (
          <option key={hint} value={hint} />
        ))}
      </datalist>
    </div>
  )
}

export default RoutePlanning
