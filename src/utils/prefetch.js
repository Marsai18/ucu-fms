const prefetchMap = {
  '/admin': () => import('../pages/AdminDashboard'),
  '/dashboard': () => import('../pages/Dashboard'),
  '/vehicles': () => import('../pages/VehicleRegistration'),
  '/booking': () => import('../pages/BookingRequests'),
  '/trips': () => import('../pages/TripManagement'),
  '/maintenance': () => import('../pages/MaintenanceTracking'),
  '/fuel': () => import('../pages/FuelManagement'),
  '/incidents': () => import('../pages/IncidentManagement'),
  '/gps': () => import('../pages/GPSTracking'),
  '/drivers': () => import('../pages/DriverManagement'),
}

export const prefetchRoute = (path) => {
  const fn = prefetchMap[path]
  if (fn) fn().catch(() => {})
}
