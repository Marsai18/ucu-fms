/**
 * Calculate route using OSRM and Nominatim (OpenStreetMap)
 * Returns distance (km), duration (min), and best route geometry
 * Uses known locations first for reliability; falls back to external APIs
 */

const DEFAULT_ORIGIN = 'Uganda Christian University Main Campus, Mukono';
const UCU_COORDS = [0.3569, 32.7521];
const KAMPALA_COORDS = [0.3476, 32.5825];

// Known coordinates for Uganda locations - used first for reliable routing
const KNOWN_LOCATIONS = {
  'uganda christian university': UCU_COORDS,
  'ucu main campus': UCU_COORDS,
  'ucu': UCU_COORDS,
  'mukono': UCU_COORDS,
  'mukono district offices': [0.3533, 32.7550],
  'kampala': KAMPALA_COORDS,
  'kampala city centre': KAMPALA_COORDS,
  'kampala city': KAMPALA_COORDS,
  'kampala serena': KAMPALA_COORDS,
  'kampala serena hotel': KAMPALA_COORDS,
  'serena': KAMPALA_COORDS,
  'sere': KAMPALA_COORDS,
  'entebbe': [0.0564, 32.4375],
  'entebbe international airport': [0.0423, 32.4435],
  'jinja': [0.4244, 33.2042],
  'jinja campus': [0.4244, 33.2042],
  'mbarara': [-0.6047, 30.6485],
  'mbarara teaching hospital': [-0.6047, 30.6485],
  'gulu': [2.7746, 32.2990],
  'gulu university': [2.7746, 32.2990],
  'mbale': [1.0800, 34.1750],
  'mbale regional office': [1.0800, 34.1750],
  'masaka': [-0.3333, 31.7333],
  'lugazi': [0.3667, 32.9333],
  'lyantonde': [-0.4000, 31.1500],
  'lira': [2.2350, 32.9090],
  'luweero': [0.8492, 32.4731],
  'iganga': [0.6092, 33.4686],
};

function getKnownCoords(location) {
  if (!location || typeof location !== 'string') return null;
  const key = location.toLowerCase().trim().replace(/\s+/g, ' ');
  if (!key) return null;
  for (const [name, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (key.includes(name) || name.includes(key)) return coords;
  }
  return null;
}

async function geocodeWithNominatim(location) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', Uganda')}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'UCU-Fleet-Management/1.0 (contact@ucu.ac.ug)' }
    });
    const data = await response.json();
    if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
      return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
    }
  } catch (err) {
    console.warn('Nominatim failed for', location, err.message);
  }
  return null;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createFallbackGeometry(originCoords, destCoords, waypointCoords = []) {
  const points = [originCoords, ...waypointCoords, destCoords].filter(Boolean);
  const geometry = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [lat1, lng1] = points[i];
    const [lat2, lng2] = points[i + 1];
    const steps = i < points.length - 2 ? 5 : 10;
    for (let t = 0; t <= steps; t++) {
      geometry.push([
        lat1 + (lat2 - lat1) * t / steps,
        lng1 + (lng2 - lng1) * t / steps
      ]);
    }
  }
  return geometry;
}

/**
 * Resolve location to [lat, lng] - uses known locations first, then Nominatim
 * @param {string} location - place name
 * @param {number[]|null} fallbackCoords - [lat,lng] when resolution fails; null = return null
 */
async function resolveCoords(location, fallbackCoords) {
  const known = getKnownCoords(location);
  if (known) return known;
  const fromApi = await geocodeWithNominatim(location);
  if (fromApi) return [fromApi.lat, fromApi.lng];
  if (fallbackCoords) return fallbackCoords;
  return null;
}

/**
 * Calculate best route from origin to destination
 * Uses known locations first for reliability; never throws
 */
export async function calculateRoute(origin, destination, waypoints = '') {
  const originStr = origin || DEFAULT_ORIGIN;
  const destStr = destination || 'Kampala City Centre';

  const waypointList = waypoints
    ? waypoints.split(',').map(w => w.trim()).filter(Boolean)
    : [];

  const originCoords = await resolveCoords(originStr, UCU_COORDS);
  const destCoords = await resolveCoords(destStr, KAMPALA_COORDS);
  const wpCoords = await Promise.all(waypointList.map(wp => resolveCoords(wp, null)));

  const points = [originCoords, ...wpCoords.filter(Boolean), destCoords];
  const dist = haversineDistanceKm(originCoords[0], originCoords[1], destCoords[0], destCoords[1]);
  const geometry = createFallbackGeometry(originCoords, destCoords, wpCoords.filter(Boolean));

  let result = {
    distanceKm: Math.round(dist * 10) / 10,
    durationMinutes: Math.round(dist * 1.5),
    geometry,
    origin: originStr,
    destination: destStr
  };

  if (points.length >= 2) {
    try {
      const coords = points.map(p => `${p[1]},${p[0]}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
      const response = await fetch(url);
      const data = await response.json();
      if (data?.code === 'Ok' && data?.routes?.length) {
        const r = data.routes[0];
        result = {
          distanceKm: Math.round((r.distance / 1000) * 10) / 10,
          durationMinutes: Math.round(r.duration / 60),
          geometry: r.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || geometry,
          origin: originStr,
          destination: destStr
        };
      }
    } catch (err) {
      console.warn('OSRM failed, using estimated route:', err.message);
    }
  }

  return result;
}
