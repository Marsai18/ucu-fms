import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FmsPortalShell from './FmsPortalShell'

const ROUTE_TITLES = {
  '/hod/dashboard': 'Dashboard',
  '/hod/requests': 'Booking requests',
}

const HODLayout = ({ children }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const menuItems = useMemo(
    () => [
      { path: '/hod/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/hod/requests', label: 'Booking requests', icon: Calendar },
    ],
    []
  )

  const handleLogout = () => {
    logout()
    navigate('/login?role=hod', { replace: true })
  }

  return (
    <FmsPortalShell
      menuItems={menuItems}
      routeTitles={ROUTE_TITLES}
      defaultPageTitle="HOD portal"
      notifId="hod-notif"
      notifRole="hod"
      portalTagline="HOD · Approvals"
      userRoleLabel="Head of department"
      onLogout={handleLogout}
      navSectionLabel="Overview"
    >
      {children}
    </FmsPortalShell>
  )
}

export default HODLayout
