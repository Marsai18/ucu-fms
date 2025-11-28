import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import VehicleRegistration from './pages/VehicleRegistration'
import BookingRequests from './pages/BookingRequests'
import TripManagement from './pages/TripManagement'
import MaintenanceTracking from './pages/MaintenanceTracking'
import DriverManagement from './pages/DriverManagement'
import FuelManagement from './pages/FuelManagement'
import RoutePlanning from './pages/RoutePlanning'
import IncidentManagement from './pages/IncidentManagement'
import ComplianceSafety from './pages/ComplianceSafety'
import GPSTracking from './pages/GPSTracking'
import PerformanceMonitoring from './pages/PerformanceMonitoring'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ClientLogin from './pages/ClientLogin'
import ClientDashboard from './pages/ClientDashboard'
import ClientBookingRequest from './pages/ClientBookingRequest'
import ClientHistory from './pages/ClientHistory'
import ClientLayout from './components/ClientLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (adminOnly && user?.role !== 'admin' && user?.username !== 'masai') {
    return <Navigate to="/client/dashboard" replace />
  }
  return children
}

const ClientRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/client/login" replace />
  }
  return children
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
        <Routes>
          {/* Admin Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Client Routes */}
          <Route path="/client/login" element={<ClientLogin />} />
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
          
          {/* Admin Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <Navigate to="/admin" replace />
                </Layout>
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
            path="/routes"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <RoutePlanning />
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
        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

