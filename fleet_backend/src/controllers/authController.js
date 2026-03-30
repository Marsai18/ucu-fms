import prisma from '../config/database.js'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt.js'

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const st = (user.status || 'active').toLowerCase()
    if (st === 'suspended' || st === 'inactive') {
      return res.status(403).json({
        error: 'This account is suspended or access has been revoked. Contact an administrator.',
      })
    }

    let passwordMatch = false
    if (user.password && String(user.password).startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password)
    } else {
      passwordMatch = user.password === password
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const tokenPayload = { id: user.id, username: user.username, role: user.role }

    // For driver users, look up their Driver record and attach driverId to JWT
    if (user.role === 'driver') {
      const driverRecord = await prisma.driver.findFirst({
        where: { email: user.email },
        select: { id: true },
      })
      if (driverRecord) tokenPayload.driverId = driverRecord.id
    }

    const token = generateToken(tokenPayload)
    const { password: _, ...userWithoutPassword } = user
    res.json({ ok: true, token, user: { ...userWithoutPassword, driverId: tokenPayload.driverId || null } })
  } catch (error) {
    next(error)
  }
}

// Demo token fallback (kept for dev convenience)
export const getDemoToken = async (req, res, next) => {
  try {
    const { username, password } = req.body || {}
    const demoUsers = [
      { username: 'masai', email: 'masai.absalom@ucu.ac.ug', password: 'masai123', id: 1, role: 'admin', name: 'Masai' },
      { username: 'client@ucu.ac.ug', password: 'client123', id: 2, role: 'client', name: 'Client User' },
      { username: 'david.ssebunya@ucu.ac.ug', password: 'driver123', id: 3, role: 'driver', driverId: 1, name: 'David Ssebunya' },
      { username: 'hod@ucu.ac.ug', password: 'hod123', id: 7, role: 'hod', name: 'Head of Department' },
      { username: 'hod', password: 'hod123', id: 7, role: 'hod', name: 'Head of Department' },
    ]
    const match = demoUsers.find(
      (u) => (u.username === username || u.email === username) && u.password === password
    )
    if (!match) return res.status(401).json({ error: 'Invalid demo credentials' })
    const tokenPayload = { id: match.id, username: match.username, role: match.role }
    if (match.driverId) tokenPayload.driverId = match.driverId
    const token = generateToken(tokenPayload)
    res.json({ token, user: { id: match.id, username: match.username, role: match.role, driverId: match.driverId, name: match.name } })
  } catch (error) {
    next(error)
  }
}

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, username: true, email: true, name: true, role: true, status: true, createdAt: true, updatedAt: true },
    })

    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (error) {
    next(error)
  }
}
