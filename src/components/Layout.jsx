import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Car, 
  Calendar, 
  User, 
  Wrench, 
  LayoutDashboard,
  UserCircle,
  Users,
  Fuel,
  Route,
  AlertTriangle,
  Shield,
  Navigation,
  Activity,
  LogOut,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const Layout = ({ children }) => {
  const location = useLocation()
  const { logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  const menuItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, section: 'Main' },
    { path: '/dashboard', label: 'Dashboard & Reports', icon: LayoutDashboard, section: 'Main' },
    { path: '/vehicles', label: 'Vehicle Management', icon: Car, section: 'Fleet' },
    { path: '/drivers', label: 'Driver Management', icon: Users, section: 'Fleet' },
    { path: '/booking', label: 'Booking Requests', icon: Calendar, section: 'Operations' },
    { path: '/trips', label: 'Trip Management', icon: User, section: 'Operations' },
    { path: '/routes', label: 'Route Planning', icon: Route, section: 'Operations' },
    { path: '/maintenance', label: 'Maintenance Tracking', icon: Wrench, section: 'Operations' },
    { path: '/fuel', label: 'Fuel Management', icon: Fuel, section: 'Operations' },
    { path: '/gps', label: 'GPS Tracking', icon: Navigation, section: 'Monitoring' },
    { path: '/performance', label: 'Performance Monitoring', icon: Activity, section: 'Monitoring' },
    { path: '/incidents', label: 'Incident Management', icon: AlertTriangle, section: 'Safety' },
    { path: '/compliance', label: 'Compliance & Safety', icon: Shield, section: 'Safety' },
  ]

  const menuSections = [
    { name: 'Main', items: menuItems.filter(item => item.section === 'Main') },
    { name: 'Fleet', items: menuItems.filter(item => item.section === 'Fleet') },
    { name: 'Operations', items: menuItems.filter(item => item.section === 'Operations') },
    { name: 'Monitoring', items: menuItems.filter(item => item.section === 'Monitoring') },
    { name: 'Safety', items: menuItems.filter(item => item.section === 'Safety') },
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-ucu-gradient">
          <h2 className="text-lg font-bold text-white">Fleet Management</h2>
          <p className="text-xs text-ucu-gold-200 mt-1 font-medium">UCU System</p>
        </div>
        <nav className="flex-1 p-4">
          {menuSections.map((section) => (
            <div key={section.name} className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-2">
                {section.name}
              </h3>
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 mb-1 rounded-lg transition-all duration-200 text-sm ${
                      active
                        ? 'bg-ucu-blue-500 text-white shadow-md transform scale-105'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-ucu-blue-50 dark:hover:bg-gray-700 hover:text-ucu-blue-600 dark:hover:text-ucu-blue-400'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium border border-gray-200 dark:border-gray-700"
          >
            {isDarkMode ? (
              <>
                <Sun size={18} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={18} />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-ucu-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">UCU</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">Fleet Management System</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Uganda Christian University</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-10 w-10 rounded-full bg-ucu-blue-500 flex items-center justify-center cursor-pointer hover:bg-ucu-blue-600 transition-colors">
              <UserCircle size={24} className="text-white" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            {children}
          </div>
          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center mt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2025 UCU Fleet Management System. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-ucu-blue-500"></div>
              <div className="h-2 w-2 rounded-full bg-ucu-gold-500"></div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default Layout

