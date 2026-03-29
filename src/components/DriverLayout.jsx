import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, MapPin, Route, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FmsPortalShell from './FmsPortalShell'

const ROUTE_TITLES = {
  '/driver/dashboard': 'Driver dashboard',
  '/driver/trips': 'My trips',
  '/driver/routes': 'Assigned routes',
  '/driver/incidents': 'Report incident',
}

const DriverLayout = ({ children }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const menuItems = useMemo(
    () => [
      { path: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/driver/trips', label: 'My trips', icon: MapPin },
      { path: '/driver/routes', label: 'Assigned routes', icon: Route },
      { path: '/driver/incidents', label: 'Report incident', icon: AlertTriangle },
    ],
    []
  )

  const handleLogout = () => {
    logout()
    navigate('/driver/login', { replace: true })
  }

  return (
    <FmsPortalShell
      menuItems={menuItems}
      routeTitles={ROUTE_TITLES}
      defaultPageTitle="Driver portal"
      notifId="driver-notif"
      notifRole="driver"
      portalTagline="Driver portal · Trips & routes"
      userRoleLabel="Driver"
      onLogout={handleLogout}
      navSectionLabel="Your portal"
    >
      {children}
    </FmsPortalShell>
  )
}

export default DriverLayout
