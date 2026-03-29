import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Send, History, Car } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FmsPortalShell from './FmsPortalShell'

const ROUTE_TITLES = {
  '/client/dashboard': 'Dashboard',
  '/client/vehicles': 'Available vehicles',
  '/client/request': 'New request',
  '/client/history': 'Request history',
}

const ClientLayout = ({ children }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const menuItems = useMemo(
    () => [
      { path: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/client/vehicles', label: 'Available vehicles', icon: Car },
      { path: '/client/request', label: 'New request', icon: Send },
      { path: '/client/history', label: 'Request history', icon: History },
    ],
    []
  )

  const handleLogout = () => {
    logout()
    navigate('/client/login', { replace: true })
  }

  return (
    <FmsPortalShell
      menuItems={menuItems}
      routeTitles={ROUTE_TITLES}
      defaultPageTitle="Client portal"
      notifId="client-notif"
      notifRole="client"
      portalTagline="Client portal · Bookings & history"
      userRoleLabel="Client"
      onLogout={handleLogout}
      fontClassName="font-client"
      navSectionLabel="Your portal"
    >
      {children}
    </FmsPortalShell>
  )
}

export default ClientLayout
