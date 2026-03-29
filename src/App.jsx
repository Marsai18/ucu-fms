import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import ClientLayout from './components/ClientLayout'
import DriverLayout from './components/DriverLayout'
import HODLayout from './components/HODLayout'
import { useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'

// Eager-load entry points for fast first paint
import Login from './pages/Login'
import ClientLogin from './pages/ClientLogin'

// Lazy-load heavy pages for faster initial load
const Dashboard = lazy(() => import('./pages/Dashboard'))
const VehicleRegistration = lazy(() => import('./pages/VehicleRegistration'))
const BookingRequests = lazy(() => import('./pages/BookingRequests'))
const TripManagement = lazy(() => import('./pages/TripManagement'))
const MaintenanceTracking = lazy(() => import('./pages/MaintenanceTracking'))
const DriverManagement = lazy(() => import('./pages/DriverManagement'))
const FuelManagement = lazy(() => import('./pages/FuelManagement'))
const IncidentManagement = lazy(() => import('./pages/IncidentManagement'))
const ComplianceSafety = lazy(() => import('./pages/ComplianceSafety'))
const GPSTracking = lazy(() => import('./pages/GPSTracking'))
const PerformanceMonitoring = lazy(() => import('./pages/PerformanceMonitoring'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'))
const ClientBookingRequest = lazy(() => import('./pages/ClientBookingRequest'))
const ClientAvailableVehicles = lazy(() => import('./pages/ClientAvailableVehicles'))
const ClientHistory = lazy(() => import('./pages/ClientHistory'))
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'))
const DriverTrips = lazy(() => import('./pages/DriverTrips'))
const DriverRoutes = lazy(() => import('./pages/DriverRoutes'))
const DriverIncidentReport = lazy(() => import('./pages/DriverIncidentReport'))
const HODDashboard = lazy(() => import('./pages/HODDashboard'))
const HODRequests = lazy(() => import('./pages/HODRequests'))
const UserManagement = lazy(() => import('./pages/UserManagement'))

const PageFallback = () => (
  <div className="min-h-[320px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading...</p>
    </div>
  </div>
)

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, isInitialized } = useAuth()
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8eef4] dark:bg-[#0c1222]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (adminOnly && user?.role !== 'admin' && user?.username !== 'masai') {
    if (user?.role === 'driver' || user?.driverId) return <Navigate to="/driver/dashboard" replace />
    if (user?.role === 'hod') return <Navigate to="/hod/dashboard" replace />
    return <Navigate to="/client/dashboard" replace />
  }
  return children
}

const HODRoute = ({ children }) => {
  const { isAuthenticated, user, isInitialized } = useAuth()
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8eef4] dark:bg-[#0c1222]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login?role=hod" replace />
  if (user?.role !== 'hod') {
    if (user?.role === 'admin' || user?.username === 'masai') return <Navigate to="/admin" replace />
    if (user?.role === 'driver' || user?.driverId) return <Navigate to="/driver/dashboard" replace />
    return <Navigate to="/client/dashboard" replace />
  }
  return children
}

const DriverRoute = ({ children }) => {
  const { isAuthenticated, user, isInitialized } = useAuth()
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8eef4] dark:bg-[#0c1222]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/driver/login" replace />
  if (user?.role !== 'driver' && !user?.driverId) return <Navigate to="/driver/login" replace />
  return children
}

const ClientRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth()
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8eef4] dark:bg-[#0c1222]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ucu-blue-500/20 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/client/login" replace />
  }
  return children
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg, #fff)',
              color: 'var(--toast-color, #333)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#10b981',
                color: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#ef4444',
                color: '#fff',
              },
            },
          }}
        />
        <Router>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Login - unified for Admin and Driver */}
          <Route path="/login" element={<Login />} />
          <Route path="/driver/login" element={<Login />} />
          <Route
            path="/driver/dashboard"
            element={
              <DriverRoute>
                <DriverLayout>
                  <DriverDashboard />
                </DriverLayout>
              </DriverRoute>
            }
          />
          <Route
            path="/driver/trips"
            element={
              <DriverRoute>
                <DriverLayout>
                  <DriverTrips />
                </DriverLayout>
              </DriverRoute>
            }
          />
          <Route
            path="/driver/routes"
            element={
              <DriverRoute>
                <DriverLayout>
                  <DriverRoutes />
                </DriverLayout>
              </DriverRoute>
            }
          />
          <Route
            path="/driver/incidents"
            element={
              <DriverRoute>
                <DriverLayout>
                  <DriverIncidentReport />
                </DriverLayout>
              </DriverRoute>
            }
          />

          {/* Client Routes */}
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/hod/login" element={<Login />} />
          <Route
            path="/hod/dashboard"
            element={
              <HODRoute>
                <HODLayout>
                  <HODDashboard />
                </HODLayout>
              </HODRoute>
            }
          />
          <Route
            path="/hod/requests"
            element={
              <HODRoute>
                <HODLayout>
                  <HODRequests />
                </HODLayout>
              </HODRoute>
            }
          />
          <Route
            path="/client/dashboard"
            element={
              <ClientRoute>
                <ClientLayout>
                  <ClientDashboard />
                </ClientLayout>
              </ClientRoute>
            }
          />
          <Route
            path="/client/vehicles"
            element={
              <ClientRoute>
                <ClientLayout>
                  <ClientAvailableVehicles />
                </ClientLayout>
              </ClientRoute>
            }
          />
          <Route
            path="/client/request"
            element={
              <ClientRoute>
                <ClientLayout>
                  <ClientBookingRequest />
                </ClientLayout>
              </ClientRoute>
            }
          />
          <Route
            path="/client/history"
            element={
              <ClientRoute>
                <ClientLayout>
                  <ClientHistory />
                </ClientLayout>
              </ClientRoute>
            }
          />
          
          <Route
            path="/"
            element={
              <PrivateRoute adminOnly>
                <Navigate to="/admin" replace />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicles"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <VehicleRegistration />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <BookingRequests />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <TripManagement />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <MaintenanceTracking />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <DriverManagement />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/fuel"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <FuelManagement />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/incidents"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <IncidentManagement />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <ComplianceSafety />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/gps"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <GPSTracking />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <PerformanceMonitoring />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <UserManagement />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
        </Suspense>
      </Router>
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App

