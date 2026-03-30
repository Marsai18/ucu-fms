/**
 * migrate-data.js
 * Migrates all data from data.json into the Neon PostgreSQL database via Prisma.
 * Run with: node prisma/migrate-data.js
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'

// Load .env before imports that read process.env at init time
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
} catch { console.warn('Could not read .env file') }

import prismaPkg from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import { WebSocket } from 'ws'

const { PrismaClient } = prismaPkg
neonConfig.webSocketConstructor = WebSocket

// ─── Enum normalizers ────────────────────────────────────────────────────────

function normalizeVehicleStatus(s) {
  const map = {
    'Active': 'Available', 'Available': 'Available',
    'On Trip': 'On_Trip', 'On_Trip': 'On_Trip',
    'In Use': 'In_Use', 'In_Use': 'In_Use',
    'In Maintenance': 'Maintenance', 'Maintenance': 'Maintenance',
    'Inactive': 'Retired', 'Retired': 'Retired',
  }
  return map[s] || 'Available'
}

function normalizeTripStatus(s) {
  const map = {
    'Pending': 'Pending', 'In Progress': 'In_Progress', 'In_Progress': 'In_Progress',
    'Completed': 'Completed', 'Cancelled': 'Cancelled',
  }
  return map[s] || 'Pending'
}

function normalizeRouteStatus(s) {
  const map = {
    'Saved': 'Scheduled', 'Scheduled': 'Scheduled',
    'In Progress': 'In_Progress', 'In_Progress': 'In_Progress',
    'Completed': 'Completed', 'Cancelled': 'Cancelled',
  }
  return map[s] || 'Scheduled'
}

function normalizeIncidentType(s) {
  const map = {
    'Minor Damage': 'Minor_Damage', 'Minor_Damage': 'Minor_Damage',
    'Minor Scratch': 'Minor_Damage',
    'Accident': 'Accident', 'Breakdown': 'Breakdown',
    'Theft': 'Theft', 'Vandalism': 'Vandalism',
    'Speeding Alert': 'Other', 'Engine Overheating': 'Breakdown',
    'Near Miss': 'Other', 'Other': 'Other',
  }
  return map[s] || 'Other'
}

function normalizeIncidentStatus(s) {
  const map = {
    'Reported': 'Reported',
    'Under Investigation': 'Under_Investigation', 'Under_Investigation': 'Under_Investigation',
    'Investigating': 'Under_Investigation',
    'Repair Scheduled': 'Repair_Scheduled', 'Repair_Scheduled': 'Repair_Scheduled',
    'Resolved': 'Resolved', 'Closed': 'Closed',
  }
  return map[s] || 'Reported'
}

function normalizeFuelType(s) {
  const map = { 'Petrol': 'Petrol', 'Diesel': 'Diesel', 'Electric': 'Electric', 'Hybrid': 'Hybrid' }
  return map[s] || 'Diesel'
}

function normalizeDriverStatus(s) {
  const map = { 'Active': 'Active', 'Inactive': 'Inactive', 'Suspended': 'Suspended', 'On Leave': 'On_Leave', 'On_Leave': 'On_Leave' }
  return map[s] || 'Active'
}

function normalizeBookingStatus(s) {
  const map = {
    'Pending': 'Pending', 'HODApproved': 'HODApproved',
    'Approved': 'Approved', 'Rejected': 'Rejected',
    'Cancelled': 'Cancelled', 'Completed': 'Completed',
  }
  return map[s] || 'Pending'
}

function toDate(v) {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function toDecimal(v) {
  if (v == null) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

// ─── Main migration ──────────────────────────────────────────────────────────

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const dataPath = resolve(__dir, '..', 'data.json')
  const raw = readFileSync(dataPath, 'utf-8')
  const data = JSON.parse(raw)

  console.log('🚀 Starting data migration from data.json...\n')

  // Track ID mappings (old string ID -> new int ID)
  const userIdMap = {}
  const vehicleIdMap = {}
  const driverIdMap = {}
  const bookingIdMap = {}
  const tripIdMap = {}

  // ─── 1. Users ──────────────────────────────────────────────────────────────
  console.log('👤 Migrating users...')
  for (const u of (data.users || [])) {
    const hashed = await bcrypt.hash(u.password || 'password123', 10)
    const roleMap = { admin: 'admin', client: 'client', driver: 'driver', hod: 'hod', fleet_manager: 'fleet_manager' }
    const role = roleMap[u.role] || 'client'
    try {
      const created = await prisma.user.upsert({
        where: { username: u.username },
        update: { name: u.name, email: u.email, role, phone: u.phone || null },
        create: {
          username: u.username,
          email: u.email,
          password: hashed,
          name: u.name || u.username,
          role,
          phone: u.phone || null,
          status: 'active',
        },
      })
      userIdMap[String(u.id)] = created.id
      console.log(`  ✅ User: ${created.username} (${created.role}) id=${created.id}`)
    } catch (e) {
      console.warn(`  ⚠️  User ${u.username} skipped: ${e.message}`)
    }
  }

  // ─── 2. Vehicles ───────────────────────────────────────────────────────────
  console.log('\n🚗 Migrating vehicles...')
  for (const v of (data.vehicles || [])) {
    try {
      const created = await prisma.vehicle.upsert({
        where: { plateNumber: v.plateNumber },
        update: {
          make: v.make, model: v.model, year: v.year || null,
          color: v.color || null,
          fuelType: normalizeFuelType(v.fuelType),
          fuelCapacity: toDecimal(v.fuelCapacity),
          odometerReading: toDecimal(v.currentOdometer || v.odometerReading) || 0,
          operationalStatus: normalizeVehicleStatus(v.operationalStatus),
          lastServiceDate: toDate(v.lastServiceDate),
          nextServiceDueDate: toDate(v.nextServiceDueDate),
          registrationExpiry: toDate(v.registrationExpiry || v.registrationExpiryDate),
          insuranceExpiry: toDate(v.insuranceExpiry || v.insuranceExpiryDate),
        },
        create: {
          plateNumber: v.plateNumber,
          make: v.make,
          model: v.model,
          year: v.year || null,
          color: v.color || null,
          chassisNumber: v.chassisNumber || null,
          engineNumber: v.engineNumber || null,
          fuelType: normalizeFuelType(v.fuelType),
          fuelCapacity: toDecimal(v.fuelCapacity),
          odometerReading: toDecimal(v.currentOdometer || v.odometerReading) || 0,
          operationalStatus: normalizeVehicleStatus(v.operationalStatus),
          purchaseDate: toDate(v.purchaseDate),
          purchaseCost: toDecimal(v.purchaseCost),
          supplier: v.supplier || null,
          lastServiceDate: toDate(v.lastServiceDate),
          nextServiceDueDate: toDate(v.nextServiceDueDate),
          registrationExpiry: toDate(v.registrationExpiry || v.registrationExpiryDate),
          insuranceExpiry: toDate(v.insuranceExpiry || v.insuranceExpiryDate),
        },
      })
      vehicleIdMap[String(v.id)] = created.id
      console.log(`  ✅ Vehicle: ${created.plateNumber} (${created.make} ${created.model}) id=${created.id}`)
    } catch (e) {
      console.warn(`  ⚠️  Vehicle ${v.plateNumber} skipped: ${e.message}`)
    }
  }

  // ─── 3. Drivers ────────────────────────────────────────────────────────────
  console.log('\n🧑‍✈️  Migrating drivers...')
  for (const d of (data.drivers || [])) {
    try {
      const created = await prisma.driver.upsert({
        where: { licenseNumber: d.licenseNumber },
        update: {
          name: d.name, phone: d.phone || '', email: d.email || null,
          status: normalizeDriverStatus(d.status),
        },
        create: {
          name: d.name,
          licenseNumber: d.licenseNumber,
          licenseExpiryDate: toDate(d.licenseExpiryDate),
          phone: d.phone || '',
          email: d.email || null,
          address: d.address || null,
          emergencyContactName: d.emergencyContactName || null,
          emergencyContactPhone: d.emergencyContactPhone || null,
          status: normalizeDriverStatus(d.status),
          hireDate: toDate(d.hireDate),
          performanceRating: toDecimal(d.performanceRating) || 0,
        },
      })
      driverIdMap[String(d.id)] = created.id
      console.log(`  ✅ Driver: ${created.name} (${created.licenseNumber}) id=${created.id}`)
    } catch (e) {
      console.warn(`  ⚠️  Driver ${d.name} skipped: ${e.message}`)
    }
  }

  // ─── 4. Bookings ───────────────────────────────────────────────────────────
  console.log('\n📋 Migrating bookings...')
  for (const b of (data.bookings || [])) {
    const userId = userIdMap[String(b.userId)]
    if (!userId) { console.warn(`  ⚠️  Booking ${b.id} skipped: userId ${b.userId} not found`); continue }
    const vehicleId = b.vehicleId ? vehicleIdMap[String(b.vehicleId)] || null : null
    const driverId = b.driverId ? driverIdMap[String(b.driverId)] || null : null
    const requestId = b.request_id || b.requestId || `BK${String(b.id).padStart(4, '0')}`
    try {
      const created = await prisma.booking.upsert({
        where: { requestId },
        update: {},
        create: {
          requestId,
          userId,
          vehicleId,
          driverId,
          purpose: b.purpose || 'Trip',
          destination: b.destination || 'Unknown',
          origin: b.origin || 'Uganda Christian University Main Campus',
          startDate: toDate(b.startDateTime || b.startDate) || new Date(),
          endDate: toDate(b.endDateTime || b.endDate) || new Date(),
          passengers: Number(b.numberOfPassengers || b.passengers || 1),
          additionalNotes: b.additionalNotes || b.notes || null,
          status: normalizeBookingStatus(b.status),
          approvedBy: null,
          approvedAt: toDate(b.hodApprovedAt || b.approvedAt),
          rejectionReason: b.rejectionReason || null,
        },
      })
      bookingIdMap[String(b.id)] = created.id
      console.log(`  ✅ Booking: ${created.requestId} (${created.status}) id=${created.id}`)
    } catch (e) {
      console.warn(`  ⚠️  Booking ${b.id} skipped: ${e.message}`)
    }
  }

  // ─── 5. Trips ──────────────────────────────────────────────────────────────
  console.log('\n🗺️  Migrating trips...')
  for (const t of (data.trips || [])) {
    const vehicleId = vehicleIdMap[String(t.vehicleId)]
    const driverId = driverIdMap[String(t.driverId)]
    if (!vehicleId || !driverId) {
      console.warn(`  ⚠️  Trip ${t.id} skipped: vehicleId or driverId not found`)
      continue
    }
    const bookingId = t.bookingId ? bookingIdMap[String(t.bookingId)] || null : null
    try {
      const created = await prisma.trip.create({
        data: {
          bookingId,
          vehicleId,
          driverId,
          origin: t.origin || 'Uganda Christian University Main Campus',
          destination: t.destination || 'Unknown',
          scheduledDeparture: toDate(t.scheduledDeparture),
          scheduledArrival: toDate(t.scheduledArrival),
          actualDeparture: toDate(t.departureTime || t.actualDeparture),
          actualArrival: toDate(t.arrivalTime || t.actualArrival),
          startOdometer: toDecimal(t.startOdometer),
          endOdometer: toDecimal(t.endOdometer),
          distanceTraveled: toDecimal(t.distanceTraveled),
          status: normalizeTripStatus(t.status),
          driverNotes: t.driverNotes || null,
        },
      })
      tripIdMap[String(t.id)] = created.id
      console.log(`  ✅ Trip: ${created.id} → ${created.destination} (${created.status})`)
    } catch (e) {
      console.warn(`  ⚠️  Trip ${t.id} skipped: ${e.message}`)
    }
  }

  // ─── 6. Fuel Logs ──────────────────────────────────────────────────────────
  console.log('\n⛽ Migrating fuel logs...')
  for (const f of (data.fuelLogs || [])) {
    const vehicleId = vehicleIdMap[String(f.vehicleId)]
    if (!vehicleId) { console.warn(`  ⚠️  FuelLog ${f.id} skipped: vehicleId not found`); continue }
    const tripId = f.tripId ? tripIdMap[String(f.tripId)] || null : null
    try {
      await prisma.fuelLog.create({
        data: {
          vehicleId,
          tripId,
          fuelType: normalizeFuelType(f.fuelType || 'Diesel'),
          quantity: toDecimal(f.quantity) || 0,
          cost: toDecimal(f.cost) || 0,
          odometerReading: toDecimal(f.odometerReading) || 0,
          fuelStation: f.fuelStation || f.station || null,
          receiptNumber: f.receiptNumber || null,
          refuelDate: toDate(f.refuelDate || f.date || f.createdAt) || new Date(),
          efficiency: toDecimal(f.efficiency),
        },
      })
      console.log(`  ✅ FuelLog: vehicle=${vehicleId} qty=${f.quantity}L`)
    } catch (e) {
      console.warn(`  ⚠️  FuelLog ${f.id} skipped: ${e.message}`)
    }
  }

  // ─── 7. Maintenance Records ────────────────────────────────────────────────
  console.log('\n🔧 Migrating maintenance records...')
  for (const m of (data.maintenanceRecords || [])) {
    const vehicleId = vehicleIdMap[String(m.vehicleId)]
    if (!vehicleId) { console.warn(`  ⚠️  Maintenance ${m.id} skipped: vehicleId not found`); continue }
    try {
      await prisma.maintenanceRecord.create({
        data: {
          vehicleId,
          serviceType: m.serviceType || 'Service',
          serviceDate: toDate(m.serviceDate || m.date) || new Date(),
          odometerReading: toDecimal(m.odometerReading),
          cost: toDecimal(m.cost),
          mechanicName: m.mechanicName || m.serviceProvider || null,
          mechanicDetails: m.mechanicDetails || null,
          description: m.description || m.notes || null,
          nextServiceDueDate: toDate(m.nextServiceDueDate || m.nextServiceDate),
        },
      })
      console.log(`  ✅ Maintenance: vehicle=${vehicleId} type=${m.serviceType}`)
    } catch (e) {
      console.warn(`  ⚠️  Maintenance ${m.id} skipped: ${e.message}`)
    }
  }

  // ─── 8. Routes ─────────────────────────────────────────────────────────────
  console.log('\n📍 Migrating routes...')
  for (const r of (data.routes || [])) {
    const vehicleId = r.preferredVehicle ? vehicleIdMap[String(r.preferredVehicle)] || null : null
    const driverId = r.driverId ? driverIdMap[String(r.driverId)] || null : null
    try {
      await prisma.route.create({
        data: {
          name: r.name || null,
          origin: r.origin || 'Uganda Christian University Main Campus',
          destination: r.destination || 'Unknown',
          vehicleId,
          driverId,
          estimatedDistance: toDecimal(r.distance || r.distanceKm || r.estimatedDistance),
          estimatedTime: r.duration || r.durationMinutes ? String(r.duration || r.durationMinutes) : null,
          optimizedPath: r.geometry ? JSON.stringify(r.geometry) : null,
          status: normalizeRouteStatus(r.status),
        },
      })
      console.log(`  ✅ Route: ${r.origin} → ${r.destination}`)
    } catch (e) {
      console.warn(`  ⚠️  Route ${r.id} skipped: ${e.message}`)
    }
  }

  // ─── 9. Incidents ──────────────────────────────────────────────────────────
  console.log('\n🚨 Migrating incidents...')
  for (const inc of (data.incidents || [])) {
    const vehicleId = inc.vehicleId ? vehicleIdMap[String(inc.vehicleId)] || null : null
    const driverId = inc.driverId ? driverIdMap[String(inc.driverId)] || null : null
    const reportedBy = inc.reportedBy
      ? userIdMap[String(inc.reportedBy)] || userIdMap['1']
      : userIdMap['1']
    if (!reportedBy) { console.warn(`  ⚠️  Incident ${inc.id} skipped: reportedBy not found`); continue }
    try {
      await prisma.incident.create({
        data: {
          vehicleId,
          driverId,
          reportedBy,
          incidentType: normalizeIncidentType(inc.incidentType),
          incidentDate: toDate(inc.incidentDate || inc.date || inc.createdAt) || new Date(),
          location: inc.location || 'Unknown',
          description: inc.description || null,
          severity: ['Low','Medium','High','Critical'].includes(inc.severity) ? inc.severity : 'Low',
          status: normalizeIncidentStatus(inc.status),
          damageDescription: inc.damageDescription || null,
          estimatedRepairCost: toDecimal(inc.estimatedRepairCost),
          resolutionNotes: inc.resolutionNotes || null,
        },
      })
      console.log(`  ✅ Incident: ${inc.incidentType} (${inc.status})`)
    } catch (e) {
      console.warn(`  ⚠️  Incident ${inc.id} skipped: ${e.message}`)
    }
  }

  // ─── 10. Notifications ─────────────────────────────────────────────────────
  console.log('\n🔔 Migrating notifications...')
  let notifCount = 0
  for (const n of (data.notifications || [])) {
    const userId = n.userId ? userIdMap[String(n.userId)] || null : null
    const driverId = n.driverId ? driverIdMap[String(n.driverId)] || null : null
    try {
      await prisma.notification.create({
        data: {
          userId,
          driverId,
          recipientRole: n.recipientRole || null,
          title: n.title || null,
          message: n.message || null,
          type: n.type || null,
          read: n.read === true || n.read === 'true' || false,
        },
      })
      notifCount++
    } catch (e) {
      console.warn(`  ⚠️  Notification ${n.id} skipped: ${e.message}`)
    }
  }
  console.log(`  ✅ ${notifCount} notifications migrated`)

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅ Migration complete!')
  console.log(`  Users:         ${Object.keys(userIdMap).length}`)
  console.log(`  Vehicles:      ${Object.keys(vehicleIdMap).length}`)
  console.log(`  Drivers:       ${Object.keys(driverIdMap).length}`)
  console.log(`  Bookings:      ${Object.keys(bookingIdMap).length}`)
  console.log(`  Trips:         ${Object.keys(tripIdMap).length}`)
  console.log(`  Notifications: ${notifCount}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Migration error:', e)
  process.exit(1)
})
