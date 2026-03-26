import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, User } from 'lucide-react'
import toast from 'react-hot-toast'

const ClientLogin = () => {
  const { login } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Try login with email as username (since backend uses username field)
      const res = await login(email.trim(), password)
      
      if (res.ok) {
        const user = res.user || JSON.parse(localStorage.getItem('ucu_fms_auth') || '{}')
        // Check if it's a client login
        if (user.role === 'client' || email.includes('client') || user.email?.includes('client')) {
          setLoading(false)
          toast.success('Login successful! Welcome to UCU Fleet Management!')
          navigate('/client/dashboard', { replace: true })
        } else if (user.role === 'admin' || user.username === 'masai') {
          setLoading(false)
          toast.error('Please use the admin login page for admin access')
          setError('Please use the admin login page for admin access')
        } else {
          // Default to client dashboard for non-admin users
          setLoading(false)
          toast.success('Login successful! Welcome to UCU Fleet Management!')
          navigate('/client/dashboard', { replace: true })
        }
      } else {
        setLoading(false)
        const errorMsg = res.error || 'Login failed'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      // Fallback: allow login with hardcoded credentials for demo
      if (email === 'client@ucu.ac.ug' && password === 'client123') {
        const demoUser = {
          id: '2',
          username: 'client@ucu.ac.ug',
          email: 'client@ucu.ac.ug',
          role: 'client',
          name: 'Client User'
        }
        // Use AuthContext login to set authentication
        const mockRes = await login('client@ucu.ac.ug', 'client123').catch(() => {
          // If backend fails, use localStorage directly
          localStorage.setItem('ucu_fms_auth', JSON.stringify(demoUser))
          return { ok: true, user: demoUser }
        })
        setLoading(false)
        if (mockRes.ok || mockRes.user) {
          toast.success('Login successful! Welcome to UCU Fleet Management!')
          navigate('/client/dashboard', { replace: true })
        }
      } else {
        setLoading(false)
        const errorMsg = error.message || 'Login failed'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ucu-blue-50 to-ucu-blue-100 dark:from-gray-900 dark:to-gray-800 p-6 transition-colors duration-300">
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg hover:shadow-ucu transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-ucu-gold-50 dark:hover:bg-ucu-gold-500/20 hover:text-ucu-gold-600 dark:hover:text-ucu-gold-400"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      
      <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-ucu-gradient mb-4 shadow-lg">
            <User className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Client Login</h1>
          <p className="text-gray-600 dark:text-gray-400">Access UCU Fleet Management Portal</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Submit vehicle booking requests</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ucu-gradient text-white rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            Demo: client@ucu.ac.ug / client123
          </p>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-1">Other portals</p>
          <div className="flex justify-center gap-4">
            <Link to="/login" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline text-sm font-medium">Admin / Driver Login</Link>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            Don't have an account? <a href="mailto:fleet@ucu.ac.ug" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline">Contact Admin</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ClientLogin

