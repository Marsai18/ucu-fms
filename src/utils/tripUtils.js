/**
 * Trip and route display utilities - trips and routes are identified by departure + destination names
 */

export const DEFAULT_ORIGIN = 'UCU Main Campus'
export const ORIGIN_ALIASES = [
  'UCU Main Campus',
  'Uganda Christian University Main Campus',
  'UCU Main Campus, Mukono'
]

/** Normalize origin for display - use short name */
export function normalizeOrigin(name) {
  if (!name || typeof name !== 'string') return DEFAULT_ORIGIN
  const n = name.trim()
  if (n.toLowerCase().includes('uganda christian') || n.toLowerCase().includes('ucu main')) return DEFAULT_ORIGIN
  return n || DEFAULT_ORIGIN
}

/** Get trip display label: Departure → Destination */
export function getTripLabel(trip) {
  if (!trip || typeof trip !== 'object') return '— → —'
  const departure = normalizeOrigin(trip.origin || trip.departure)
  const destination = (trip.destination || trip.dropoffLocation || '—').toString().trim()
  return `${departure} → ${destination}`
}

/** Get route display label: Origin → Destination (same as trip) */
export function getRouteLabel(route) {
  if (!route || typeof route !== 'object') return '— → —'
  const origin = normalizeOrigin(route.origin)
  const destination = (route.destination || '—').toString().trim()
  return `${origin} → ${destination}`
}

/** Check if trip and route match by departure/destination names */
export function tripMatchesRoute(trip, route) {
  if (!trip || !route || typeof trip !== 'object' || typeof route !== 'object') return false
  const tOrigin = normalizeOrigin(trip.origin)
  const tDest = (trip.destination || '').toString().trim()
  const rOrigin = normalizeOrigin(route.origin)
  const rDest = (route.destination || '').toString().trim()
  return tOrigin === rOrigin && tDest === rDest
}
