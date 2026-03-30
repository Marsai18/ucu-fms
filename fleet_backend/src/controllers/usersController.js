import prisma from '../config/database.js'

const ALLOWED_ROLES = new Set(['admin', 'client', 'driver', 'hod', 'fleet_manager'])
const ALLOWED_STATUS = new Set(['active', 'inactive', 'suspended'])

const normalizeStatus = (s) => (s || 'active').toLowerCase()

const stripPassword = (u) => {
  if (!u) return null
  const { password, ...rest } = u
  return { ...rest, id: String(rest.id), passwordStorage: password && String(password).startsWith('$2') ? 'hashed' : 'plaintext' }
}

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } })
    res.json(users.map(stripPassword))
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(stripPassword(user))
  } catch (error) {
    next(error)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, name, role, phone } = req.body || {}
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' })
    }
    const r = role || 'client'
    if (!ALLOWED_ROLES.has(r)) {
      return res.status(400).json({ error: `Invalid role. Allowed: ${[...ALLOWED_ROLES].join(', ')}` })
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: username.trim() }, { email: email.trim() }] },
    })
    if (existing) return res.status(409).json({ error: 'Username or email already exists' })

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        password: String(password),
        name: (name || username).trim(),
        role: r,
        phone: phone?.trim() || null,
        status: 'active',
      },
    })
    res.status(201).json(stripPassword(user))
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { username, email, name, role, phone } = req.body || {}

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'User not found' })

    if (username) {
      const clash = await prisma.user.findFirst({ where: { username: username.trim(), NOT: { id } } })
      if (clash) return res.status(409).json({ error: 'Username already in use' })
    }
    if (email) {
      const clash = await prisma.user.findFirst({ where: { email: email.trim(), NOT: { id } } })
      if (clash) return res.status(409).json({ error: 'Email already in use' })
    }

    const data = {}
    if (username != null) data.username = username.trim()
    if (email != null) data.email = email.trim()
    if (name != null) data.name = name.trim()
    if (role != null) {
      if (!ALLOWED_ROLES.has(role)) return res.status(400).json({ error: `Invalid role` })
      data.role = role
    }
    if (phone !== undefined) data.phone = phone?.trim() || null

    const user = await prisma.user.update({ where: { id }, data })
    res.json(stripPassword(user))
  } catch (error) {
    next(error)
  }
}

export const setUserPassword = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { password } = req.body || {}
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password is required (min 6 characters)' })
    }
    if (id === Number(req.user.id)) {
      return res.status(400).json({ error: 'Use account settings to change your own password' })
    }

    const result = await prisma.user.updateMany({
      where: { id },
      data: { password: String(password) },
    })
    if (result.count === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ ok: true, message: 'Password updated' })
  } catch (error) {
    next(error)
  }
}

export const setUserStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const st = normalizeStatus(req.body?.status)
    if (!ALLOWED_STATUS.has(st)) {
      return res.status(400).json({ error: 'Invalid status. Use active, inactive, or suspended' })
    }
    if (id === Number(req.user.id)) {
      return res.status(400).json({ error: 'You cannot change your own account status' })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (st !== 'active' && user.role === 'admin') {
      const otherAdmins = await prisma.user.count({
        where: { role: 'admin', status: 'active', NOT: { id } },
      })
      if (otherAdmins === 0) {
        return res.status(400).json({ error: 'Cannot suspend the last active admin' })
      }
    }

    await prisma.user.update({ where: { id }, data: { status: st } })
    res.json({ ok: true, status: st, message: st === 'active' ? 'Access restored' : 'Account updated' })
  } catch (error) {
    next(error)
  }
}

export const getPasswordInfo = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const raw = user.password
    if (raw && String(raw).startsWith('$2')) {
      return res.json({
        viewable: false,
        passwordStorage: 'hashed',
        message: 'This account still has an old bcrypt hash. Use "Set password" once to replace it.',
      })
    }
    res.json({
      viewable: true,
      passwordStorage: 'plaintext',
      password: raw == null ? '' : String(raw),
      message: 'Password as stored in the database (plain text).',
    })
  } catch (error) {
    next(error)
  }
}
