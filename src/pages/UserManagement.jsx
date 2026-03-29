import React, { useEffect, useMemo, useState } from 'react'
import {
  UserCog,
  Search,
  Mail,
  KeyRound,
  Ban,
  CheckCircle,
  UserX,
  Plus,
  Crown,
  Briefcase,
  UserCheck,
  Car,
  Users,
  UserCircle,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const ROLE_LABEL = {
  admin: 'Administrators',
  client: 'Clients',
  driver: 'Drivers',
  hod: 'Heads of department',
  fleet_manager: 'Fleet managers',
}

/** Display order: highest-privilege roles first */
const ROLE_ORDER = ['admin', 'fleet_manager', 'hod', 'driver', 'client']

const ROLE_ICONS = {
  admin: Crown,
  fleet_manager: Briefcase,
  hod: UserCheck,
  driver: Car,
  client: Users,
}

const ROLE_SECTION_RING = {
  admin: 'ring-amber-200/80 dark:ring-amber-500/30',
  fleet_manager: 'ring-violet-200/80 dark:ring-violet-500/30',
  hod: 'ring-cyan-200/80 dark:ring-cyan-500/30',
  driver: 'ring-emerald-200/80 dark:ring-emerald-500/30',
  client: 'ring-slate-200/80 dark:ring-slate-500/30',
}

const PASSWORD_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Cryptographically weak but fine for initial one-time passwords; min length 6. */
const randomPassword = (length = 10) => {
  const len = Math.max(6, length)
  let out = ''
  for (let i = 0; i < len; i++) {
    out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)]
  }
  return out
}

const defaultForm = {
  username: '',
  email: '',
  password: '',
  name: '',
  role: 'client',
  phone: '',
  driverId: '',
}

const UserManagement = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState(defaultForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pwdModalUser, setPwdModalUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const loadUsers = async () => {
    try {
      setLoading(true)
      const list = await api.getUsers()
      setUsers(Array.isArray(list) ? list : [])
    } catch (error) {
      toast.error(error.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase()
    return users.filter((u) =>
      [u.name, u.username, u.email, u.role, u.status].some((f) => String(f || '').toLowerCase().includes(q))
    )
  }, [users, searchQuery])

  const usersByRole = useMemo(() => {
    const groups = {}
    for (const u of filteredUsers) {
      const r = String(u.role || 'client').toLowerCase()
      if (!groups[r]) groups[r] = []
      groups[r].push(u)
    }
    return groups
  }, [filteredUsers])

  const orderedRoleKeys = useMemo(() => {
    const keys = Object.keys(usersByRole)
    const ordered = ROLE_ORDER.filter((k) => keys.includes(k))
    const rest = keys.filter((k) => !ROLE_ORDER.includes(k)).sort()
    return [...ordered, ...rest]
  }, [usersByRole])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!formData.username?.trim() || !formData.email?.trim() || !formData.password) {
      toast.error('Username, email, and password are required')
      return
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    try {
      setSaving(true)
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name?.trim() || formData.username.trim(),
        role: formData.role,
        phone: formData.phone?.trim() || undefined,
      }
      if (formData.role === 'driver' && formData.driverId?.trim()) {
        payload.driverId = formData.driverId.trim()
      }
      await api.createUser(payload)
      toast.success('User created')
      setFormData(defaultForm)
      loadUsers()
    } catch (error) {
      toast.error(error.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (userId, status) => {
    const labels = { active: 'restore access for', suspended: 'suspend', inactive: 'revoke access for' }
    if (!window.confirm(`Are you sure you want to ${labels[status] || 'update'} this user?`)) return
    try {
      await api.setUserStatus(userId, status)
      toast.success('User updated')
      loadUsers()
    } catch (error) {
      toast.error(error.message || 'Update failed')
    }
  }

  const submitNewPassword = async (e) => {
    e.preventDefault()
    if (!pwdModalUser || !newPassword || newPassword.length < 6) {
      toast.error('Enter a new password (min 6 characters)')
      return
    }
    try {
      await api.setUserPassword(pwdModalUser.id, newPassword)
      toast.success('Password updated')
      setPwdModalUser(null)
      setNewPassword('')
    } catch (error) {
      toast.error(error.message || 'Failed to update password')
    }
  }

  const generatePassword = () => {
    setNewPassword(randomPassword(12))
    toast.success('Generated — copy before closing')
  }

  const generateInitialPassword = () => {
    setFormData((prev) => ({ ...prev, password: randomPassword(10) }))
    toast.success('Password generated — copy before sharing')
  }

  const isSelf = (u) => String(u.id) === String(currentUser?.id)

  const statusBadge = (status) => {
    const s = (status || 'active').toLowerCase()
    if (s === 'active') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    if (s === 'suspended') return 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
    return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold text-ucu-blue-600 dark:text-ucu-blue-400 uppercase tracking-widest">Administration</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mt-1 tracking-tight flex items-center gap-3">
          <UserCog className="text-ucu-blue-500 shrink-0" size={36} />
          User management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          View all system accounts, suspend or revoke access, and set new passwords when needed. Existing passwords are not shown here for security.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-ucu p-6 card-glow">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Plus size={20} className="text-ucu-blue-500" /> Add user
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Create a login for staff, clients, drivers, or HOD.</p>

          <form className="space-y-4" onSubmit={handleCreateUser}>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white focus:border-primary-400 focus:ring-primary-100"
                placeholder="login name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white focus:border-primary-400 focus:ring-primary-100"
                placeholder="user@ucu.ac.ug"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Initial password</label>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white focus:border-primary-400 focus:ring-primary-100 font-mono text-sm px-3 py-2"
                  placeholder="Click Generate or type at least 6 characters"
                  autoComplete="new-password"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={generateInitialPassword}
                  className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors"
                >
                  <RefreshCw size={16} strokeWidth={2} />
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                Random passwords are only created when you press Generate (10+ characters, minimum 6 if you type your own). Share it once; the user should change it after login.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Display name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white focus:border-primary-400 focus:ring-primary-100"
                placeholder="optional"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white focus:border-primary-400 focus:ring-primary-100"
                >
                  <option value="client">Client</option>
                  <option value="driver">Driver</option>
                  <option value="hod">HOD</option>
                  <option value="fleet_manager">Fleet manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white focus:border-primary-400 focus:ring-primary-100"
                  placeholder="optional"
                />
              </div>
            </div>
            {formData.role === 'driver' && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Driver record ID</label>
                <input
                  type="text"
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white focus:border-primary-400 focus:ring-primary-100"
                  placeholder="matches Driver Management roster id"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-ucu-gradient text-white font-semibold py-3 hover:shadow-ucu disabled:opacity-40 transition-all"
            >
              {saving ? 'Saving...' : 'Create user'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All users</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {users.length} accounts · grouped by role
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, role..."
                className="pl-9 pr-3 py-2 rounded-full border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white focus:border-primary-400 focus:ring-primary-100 text-sm min-w-[220px]"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading users...</div>
          ) : !filteredUsers.length ? (
            <p className="text-center text-sm text-gray-500 py-8">No users match your search.</p>
          ) : (
            <div className="space-y-6 max-h-[720px] overflow-y-auto custom-scroll pr-2">
              {orderedRoleKeys.map((roleKey) => {
                const list = usersByRole[roleKey] || []
                if (!list.length) return null
                const Icon = ROLE_ICONS[roleKey] || UserCircle
                const sectionRing = ROLE_SECTION_RING[roleKey] || 'ring-slate-200/80 dark:ring-slate-600/40'
                const title = ROLE_LABEL[roleKey] || roleKey.replace(/_/g, ' ')

                return (
                  <section
                    key={roleKey}
                    className={`rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-slate-50/40 dark:bg-slate-900/40 ring-1 ${sectionRing} overflow-hidden`}
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ucu-blue-500/10 text-ucu-blue-600 dark:text-ucu-blue-400">
                          <Icon size={20} strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-slate-900 dark:text-white tracking-tight truncate">
                            {title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {list.length} {list.length === 1 ? 'user' : 'users'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {list.map((u) => (
                        <div
                          key={u.id}
                          className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 flex flex-wrap items-start gap-4 bg-white dark:bg-slate-800/60"
                        >
                          <div className="flex-1 min-w-[200px]">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{u.name || u.username}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                              <Mail size={14} /> {u.email}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">@{u.username}</p>
                          </div>
                          <div className="flex flex-col gap-1 min-w-[100px]">
                            {u.driverId && (
                              <span className="text-xs text-slate-600 dark:text-slate-300">Driver ID: {u.driverId}</span>
                            )}
                          </div>
                          <div className="min-w-[100px]">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(u.status)}`}>
                              {(u.status || 'active').toLowerCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <button
                              type="button"
                              disabled={isSelf(u)}
                              onClick={() => {
                                setPwdModalUser(u)
                                setNewPassword('')
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 bg-ucu-blue-50 text-ucu-blue-700 dark:bg-ucu-blue-500/20 dark:text-ucu-blue-300 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isSelf(u) ? 'Change your password in profile' : 'Set new password'}
                            >
                              <KeyRound size={14} /> Password
                            </button>
                            {(u.status || 'active').toLowerCase() !== 'active' && (
                              <button
                                type="button"
                                disabled={isSelf(u)}
                                onClick={() => setStatus(u.id, 'active')}
                                className="px-2.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 disabled:opacity-30"
                              >
                                <CheckCircle size={14} /> Activate
                              </button>
                            )}
                            {(u.status || 'active').toLowerCase() === 'active' && (
                              <>
                                <button
                                  type="button"
                                  disabled={isSelf(u)}
                                  onClick={() => setStatus(u.id, 'suspended')}
                                  className="px-2.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 text-amber-700 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-500/15 disabled:opacity-30"
                                >
                                  <Ban size={14} /> Suspend
                                </button>
                                <button
                                  type="button"
                                  disabled={isSelf(u)}
                                  onClick={() => setStatus(u.id, 'inactive')}
                                  className="px-2.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 disabled:opacity-30"
                                >
                                  <UserX size={14} /> Revoke
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {pwdModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Set password</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              New password for <strong>{pwdModalUser.email}</strong>
            </p>
            <form onSubmit={submitNewPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white px-3 py-2"
                  placeholder="min 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Generate
                </button>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPwdModalUser(null)
                    setNewPassword('')
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-ucu-gradient text-white"
                >
                  Save password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
