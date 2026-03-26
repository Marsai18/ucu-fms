import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, Shield, Car, User } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
  const { login } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const isDriverPath = location.pathname === '/driver/login'
  const isHodPath = location.pathname === '/hod/login'
  const [loginAs, setLoginAs] = useState(
    roleParam === 'driver' || isDriverPath ? 'driver' : roleParam === 'client' ? 'client' : roleParam === 'hod' || isHodPath ? 'hod' : 'admin'
  )

  useEffect(() => {
    if (isDriverPath) setLoginAs('driver')
    else if (roleParam === 'client') setLoginAs('client')
    else if (roleParam === 'hod' || isHodPath) setLoginAs('hod')
    else if (roleParam !== 'driver') setLoginAs('admin')
  }, [isDriverPath, isHodPath, roleParam])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const credential = username.trim()

    try {
      const res = await login(credential, password)

      if (res.ok) {
        const user = res.user || JSON.parse(localStorage.getItem('ucu_fms_auth') || '{}')
        setLoading(false)
        if (user.role === 'admin' || user.username === 'masai') {
          toast.success('Login successful! Welcome back!')
          navigate('/admin', { replace: true })
        } else if (user.role === 'driver' || user.driverId) {
          toast.success('Login successful! Welcome to UCU Fleet Driver Portal.')
          navigate('/driver/dashboard', { replace: true })
        } else if (user.role === 'client') {
          toast.success('Login successful! Welcome to UCU Fleet Management!')
          navigate('/client/dashboard', { replace: true })
        } else if (user.role === 'hod') {
          toast.success('Login successful! Welcome to HOD Portal.')
          navigate('/hod/dashboard', { replace: true })
        } else {
          toast.success('Login successful!')
          navigate('/admin', { replace: true })
        }
      } else {
        setLoading(false)
        const errorMsg = res.error || 'Login failed'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      if (loginAs === 'admin' && username === 'masai' && password === 'masai123') {
        const mockRes = await login('masai', 'masai123').catch(() => ({ ok: true }))
        setLoading(false)
        if (mockRes?.ok) {
          toast.success('Login successful! Welcome back!')
          navigate('/admin', { replace: true })
        }
      } else if (loginAs === 'driver' && username === 'david.ssebunya@ucu.ac.ug' && password === 'driver123') {
        const demoDriver = { id: '3', username: 'david.ssebunya@ucu.ac.ug', email: 'david.ssebunya@ucu.ac.ug', role: 'driver', driverId: '1', name: 'David Ssebunya' }
        const mockRes = await login('david.ssebunya@ucu.ac.ug', 'driver123').catch(() => ({ ok: true, user: demoDriver }))
        setLoading(false)
        if (mockRes?.ok || mockRes?.user) {
          localStorage.setItem('ucu_fms_auth', JSON.stringify(demoDriver))
          toast.success('Login successful! Welcome to UCU Fleet Driver Portal.')
          navigate('/driver/dashboard', { replace: true })
        }
      } else if (loginAs === 'client' && username === 'client@ucu.ac.ug' && password === 'client123') {
        const demoClient = { id: '2', username: 'client@ucu.ac.ug', email: 'client@ucu.ac.ug', role: 'client', name: 'Client User' }
        const mockRes = await login('client@ucu.ac.ug', 'client123').catch(() => ({ ok: true, user: demoClient }))
        setLoading(false)
        if (mockRes?.ok || mockRes?.user) {
          localStorage.setItem('ucu_fms_auth', JSON.stringify(demoClient))
          toast.success('Login successful! Welcome to UCU Fleet Client Portal.')
          navigate('/client/dashboard', { replace: true })
        }
      } else if (loginAs === 'hod' && (username === 'hod@ucu.ac.ug' || username === 'hod') && password === 'hod123') {
        const demoHod = { id: '7', username: 'hod@ucu.ac.ug', email: 'hod@ucu.ac.ug', role: 'hod', name: 'Head of Department' }
        const mockRes = await login('hod@ucu.ac.ug', 'hod123').catch(() => ({ ok: true, user: demoHod }))
        setLoading(false)
        if (mockRes?.ok || mockRes?.user) {
          localStorage.setItem('ucu_fms_auth', JSON.stringify(demoHod))
          toast.success('Login successful! Welcome to HOD Portal.')
          navigate('/hod/dashboard', { replace: true })
        }
      } else {
        setLoading(false)
        setError(err.message || 'Login failed')
        toast.error(err.message || 'Login failed')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ucu-blue-50 to-ucu-blue-100 dark:from-gray-900 dark:to-gray-800 p-6 transition-colors duration-300">
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-ucu-blue-50 dark:hover:bg-gray-700"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-8 shadow-ucu-lg backdrop-blur-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-ucu-gradient mb-4 shadow-ucu ring-2 ring-white/30 dark:ring-slate-600/30">
            <span className="text-white font-display font-bold text-2xl">UCU</span>
          </div>
          <h1 className="text-2xl font-display font-bold mb-2 tracking-tight">
            <span className="text-gradient-ucu">Fleet Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Uganda Christian University</p>
        </div>

        {/* Role selector */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setLoginAs('admin'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              loginAs === 'admin'
                ? 'bg-white dark:bg-slate-700 text-ucu-blue-600 dark:text-ucu-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield size={18} />
            Admin
          </button>
          <button
            type="button"
            onClick={() => { setLoginAs('client'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              loginAs === 'client'
                ? 'bg-white dark:bg-slate-700 text-ucu-blue-600 dark:text-ucu-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <User size={18} />
            Client
          </button>
          <button
            type="button"
            onClick={() => { setLoginAs('hod'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              loginAs === 'hod'
                ? 'bg-white dark:bg-slate-700 text-ucu-blue-600 dark:text-ucu-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield size={18} />
            HOD
          </button>
          <button
            type="button"
            onClick={() => { setLoginAs('driver'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              loginAs === 'driver'
                ? 'bg-white dark:bg-slate-700 text-ucu-blue-600 dark:text-ucu-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Car size={18} />
            Driver
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {loginAs === 'driver' || loginAs === 'client' ? 'Email Address' : 'Username'}
            </label>
            <input
              type={loginAs === 'driver' || loginAs === 'client' ? 'email' : 'text'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ucu-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              placeholder={loginAs === 'driver' ? 'Enter your UCU email' : loginAs === 'client' ? 'Enter your UCU email' : 'Enter username'}
              autoComplete={loginAs === 'driver' || loginAs === 'client' ? 'email' : 'username'}
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
              placeholder="Enter password"
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
            className="w-full py-3 bg-ucu-gradient text-white rounded-xl hover:shadow-ucu-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-semibold shadow-ucu hover:-translate-y-0.5"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            {loginAs === 'admin' && 'Hint: masai / masai123'}
            {loginAs === 'client' && 'Hint: client@ucu.ac.ug / client123'}
            {loginAs === 'hod' && 'Hint: hod@ucu.ac.ug / hod123'}
            {loginAs === 'driver' && 'Hint: david.ssebunya@ucu.ac.ug / driver123'}
          </p>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-1">Direct links</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/login?role=admin" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline text-sm font-medium">Admin</Link>
            <Link to="/login?role=client" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline text-sm font-medium">Client</Link>
            <Link to="/login?role=hod" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline text-sm font-medium">HOD</Link>
            <Link to="/driver/login" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline text-sm font-medium">Driver</Link>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
            Need help? <a href="mailto:fleet@ucu.ac.ug" className="text-ucu-blue-600 dark:text-ucu-blue-400 hover:underline">Contact Fleet Admin</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
