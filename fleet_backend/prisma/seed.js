import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env before any module that reads process.env at init time
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '..', '.env')
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
} catch {
  console.warn('Could not read .env file')
}

import prismaPkg from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import { WebSocket } from 'ws'

const { PrismaClient } = prismaPkg

neonConfig.webSocketConstructor = WebSocket

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  console.log('🌱 Seeding database...')

  // ─── Admin user ───────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { username: 'masai' },
    update: {},
    create: {
      username: 'masai',
      email: 'masai.absalom@ucu.ac.ug',
      password: 'masai123',
      name: 'Masai Absalom',
      role: 'admin',
      status: 'active',
    },
  })
  console.log(`✅ Admin user: ${admin.username} (id=${admin.id})`)

  // ─── Client user ──────────────────────────────────────────────────────
  const client = await prisma.user.upsert({
    where: { username: 'client@ucu.ac.ug' },
    update: {},
    create: {
      username: 'client@ucu.ac.ug',
      email: 'client@ucu.ac.ug',
      password: 'client123',
      name: 'Client User',
      role: 'client',
      status: 'active',
    },
  })
  console.log(`✅ Client user: ${client.username} (id=${client.id})`)

  // ─── HOD user ─────────────────────────────────────────────────────────
  const hod = await prisma.user.upsert({
    where: { username: 'hod@ucu.ac.ug' },
    update: {},
    create: {
      username: 'hod@ucu.ac.ug',
      email: 'hod@ucu.ac.ug',
      password: 'hod123',
      name: 'Head of Department',
      role: 'hod',
      status: 'active',
    },
  })
  console.log(`✅ HOD user: ${hod.username} (id=${hod.id})`)

  // ─── Driver user ──────────────────────────────────────────────────────
  const driverUser = await prisma.user.upsert({
    where: { username: 'david.ssebunya@ucu.ac.ug' },
    update: {},
    create: {
      username: 'david.ssebunya@ucu.ac.ug',
      email: 'david.ssebunya@ucu.ac.ug',
      password: 'driver123',
      name: 'David Ssebunya',
      role: 'driver',
      status: 'active',
    },
  })
  console.log(`✅ Driver user: ${driverUser.username} (id=${driverUser.id})`)

  // ─── Sample drivers ───────────────────────────────────────────────────
  const drivers = [
    { name: 'Masai Absalom', licenseNumber: 'DL-001', phone: '+256700000001', email: 'masai.absalom@ucu.ac.ug' },
    { name: 'Patrick Okello', licenseNumber: 'DL-002', phone: '+256700000002', email: 'patrick@ucu.ac.ug' },
    { name: 'Kasimu Ibrahim', licenseNumber: 'DL-003', phone: '+256700000003', email: 'kasimu@ucu.ac.ug' },
  ]

  for (const d of drivers) {
    const driver = await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: {},
      create: { ...d, status: 'Active' },
    })
    console.log(`✅ Driver: ${driver.name} (id=${driver.id})`)
  }

  // ─── Fleet vehicles (about 10, including 2 buses) ─────────────────────
  const vehicles = [
    { plateNumber: 'UBA 214A', make: 'Toyota', model: 'Hiace', year: 2019, color: 'White', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 126500 },
    { plateNumber: 'UBB 387C', make: 'Toyota', model: 'Hilux', year: 2020, color: 'Silver', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 98420 },
    { plateNumber: 'UBD 541F', make: 'Nissan', model: 'Navara', year: 2018, color: 'Gray', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 143100 },
    { plateNumber: 'UBE 906H', make: 'Isuzu', model: 'D-Max', year: 2021, color: 'White', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 75420 },
    { plateNumber: 'UBF 772K', make: 'Mitsubishi', model: 'Pajero', year: 2017, color: 'Black', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 167300 },
    { plateNumber: 'UBG 635M', make: 'Toyota', model: 'Prado', year: 2019, color: 'Navy', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 118200 },
    { plateNumber: 'UBH 448Q', make: 'Hyundai', model: 'H-1', year: 2018, color: 'White', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 132700 },
    { plateNumber: 'UBJ 159S', make: 'Suzuki', model: 'Ertiga', year: 2022, color: 'Red', fuelType: 'Petrol', operationalStatus: 'Available', odometerReading: 41200 },
    { plateNumber: 'UBL 903X', make: 'Isuzu', model: 'NQR Bus', year: 2016, color: 'Blue', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 224600 },
    { plateNumber: 'UBM 284Z', make: 'Mercedes-Benz', model: 'Sprinter Bus', year: 2020, color: 'White', fuelType: 'Diesel', operationalStatus: 'Available', odometerReading: 96300 },
  ]

  for (const v of vehicles) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: {
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        fuelType: v.fuelType,
        operationalStatus: v.operationalStatus,
        odometerReading: v.odometerReading,
      },
      create: v,
    })
    console.log(`✅ Vehicle: ${vehicle.plateNumber} (${vehicle.make} ${vehicle.model})`)
  }

  console.log('\n🎉 Seed complete!')
  console.log('\nLogin credentials:')
  console.log('  Admin:  masai / masai123')
  console.log('  Client: client@ucu.ac.ug / client123')
  console.log('  HOD:    hod@ucu.ac.ug / hod123')
  console.log('  Driver: david.ssebunya@ucu.ac.ug / driver123')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Seed error:', e)
  process.exit(1)
})
