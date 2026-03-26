import React from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icons in webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

// Approximate coordinates for common Uganda locations (fallback when geometry is missing)
const UGANDA_LOCATIONS = {
  'ucu': [0.3476, 32.5825],
  'kampala': [0.3476, 32.5825],
  'mukono': [0.3536, 32.7528],
  'entebbe': [-0.0564, 32.4435],
  'main campus': [0.3476, 32.5825],
  'city centre': [0.3476, 32.5825],
  'airport': [-0.0564, 32.4435],
  'district': [0.3536, 32.7528],
  'default': [0.3476, 32.5825],
}

function getApproxCoords(addr) {
  if (!addr || typeof addr !== 'string') return UGANDA_LOCATIONS.default
  const lower = addr.toLowerCase()
  for (const [key, coords] of Object.entries(UGANDA_LOCATIONS)) {
    if (key !== 'default' && lower.includes(key)) return coords
  }
  return UGANDA_LOCATIONS.default
}

/**
 * Displays a route on a map using geometry coordinates [[lat, lng], ...]
 * Falls back to approximate origin/destination markers when geometry is missing
 */
const RouteMap = ({ geometry = [], origin, destination, height = '280px', className = '' }) => {
  let positions = Array.isArray(geometry) && geometry.length > 0
    ? geometry.filter(p => Array.isArray(p) && p.length >= 2).map(p => [p[0], p[1]])
    : []

  // Fallback: create two-point geometry from origin/destination when no geometry
  if (positions.length < 2 && (origin || destination)) {
    const originCoords = getApproxCoords(origin)
    const destCoords = getApproxCoords(destination)
    positions = [originCoords, destCoords]
  }

  const center = positions.length > 0
    ? positions[Math.floor(positions.length / 2)]
    : [0.3476, 32.5825] // Kampala default

  if (positions.length < 2) {
    return (
      <div className={`bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Route map will appear after admin assigns trip</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#0066cc" weight={5} opacity={0.8} />
        {positions[0] && (
          <Marker position={positions[0]}>
            <Popup>Origin{origin ? `: ${origin}` : ''}</Popup>
          </Marker>
        )}
        {positions.length > 1 && positions[positions.length - 1] && (
          <Marker position={positions[positions.length - 1]}>
            <Popup>Destination{destination ? `: ${destination}` : ''}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

export default RouteMap
