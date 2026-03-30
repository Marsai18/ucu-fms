import prisma from '../config/database.js'

const db = {
  // ─── Users ────────────────────────────────────────────────────────────
  async findUser(where) {
    if (where.id) return prisma.user.findUnique({ where: { id: Number(where.id) } })
    if (where.username) return prisma.user.findUnique({ where: { username: where.username } })
    return null
  },

  // ─── Vehicles ─────────────────────────────────────────────────────────
  async findAllVehicles() {
    return prisma.vehicle.findMany({ orderBy: { id: 'asc' } })
  },

  async findVehicleById(id) {
    return prisma.vehicle.findUnique({ where: { id: Number(id) } })
  },

  async createVehicle(vehicleData) {
    const { createdAt, updatedAt, id, ...data } = vehicleData
    return prisma.vehicle.create({ data: _mapVehicleIn(data) })
  },

  async updateVehicle(id, updates) {
    try {
      return await prisma.vehicle.update({ where: { id: Number(id) }, data: _mapVehicleIn(updates) })
    } catch { return null }
  },

  async deleteVehicle(id) {
    try { await prisma.vehicle.delete({ where: { id: Number(id) } }); return true }
    catch { return false }
  },

  // ─── Drivers ──────────────────────────────────────────────────────────
  async findAllDrivers() {
    return prisma.driver.findMany({ orderBy: { id: 'asc' } })
  },

  async findDriverById(id) {
    return prisma.driver.findUnique({ where: { id: Number(id) } })
  },

  async createDriver(driverData) {
    const { createdAt, updatedAt, id, ...data } = driverData
    return prisma.driver.create({ data: _mapDriverIn(data) })
  },

  async updateDriver(id, updates) {
    try {
      return await prisma.driver.update({ where: { id: Number(id) }, data: _mapDriverIn(updates) })
    } catch { return null }
  },

  async deleteDriver(id) {
    try { await prisma.driver.delete({ where: { id: Number(id) } }); return true }
    catch { return false }
  },

  // ─── Bookings ─────────────────────────────────────────────────────────
  async findAllBookings(filters = {}) {
    const where = {}
    if (filters.status) where.status = filters.status
    if (filters.userId) where.userId = Number(filters.userId)
    if (filters.forHod && !filters.status) where.status = 'Pending'
    if (filters.forAdmin) where.NOT = { status: 'Pending' }
    return prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  },

  async findBookingById(id) {
    return prisma.booking.findFirst({
      where: { OR: [{ id: isNaN(Number(id)) ? -1 : Number(id) }, { requestId: String(id) }] },
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: true,
        driver: true,
      },
    })
  },

  async createBooking(bookingData) {
    const { createdAt, updatedAt, id, ...data } = bookingData
    if (!data.requestId) data.requestId = `BK${String(Date.now()).slice(-6)}`
    return prisma.booking.create({ data: _mapBookingIn(data) })
  },

  async updateBooking(id, updates) {
    const record = await prisma.booking.findFirst({
      where: { OR: [{ id: isNaN(Number(id)) ? -1 : Number(id) }, { requestId: String(id) }] },
    })
    if (!record) return null
    return prisma.booking.update({ where: { id: record.id }, data: _mapBookingIn(updates) })
  },

  // ─── Trips ────────────────────────────────────────────────────────────
  async findAllTrips() {
    return prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { id: true, plateNumber: true, make: true, model: true } },
        driver: { select: { id: true, name: true } },
        booking: true,
      },
    })
  },

  async findTripById(id) {
    return prisma.trip.findUnique({
      where: { id: Number(id) },
      include: { vehicle: true, driver: true, booking: true },
    })
  },

  async createTrip(tripData) {
    const { createdAt, updatedAt, id, ...data } = tripData
    return prisma.trip.create({ data: _mapTripIn(data) })
  },

  async updateTrip(id, updates) {
    try {
      return await prisma.trip.update({ where: { id: Number(id) }, data: _mapTripIn(updates) })
    } catch { return null }
  },

  // ─── Fuel ─────────────────────────────────────────────────────────────
  async findAllFuelLogs(filters = {}) {
    const where = {}
    if (filters.vehicleId) where.vehicleId = Number(filters.vehicleId)
    if (filters.tripId) where.tripId = Number(filters.tripId)
    if (filters.driverId) where.trip = { driverId: Number(filters.driverId) }
    return prisma.fuelLog.findMany({ where, orderBy: { refuelDate: 'desc' } })
  },

  async createFuelLog(fuelData) {
    const { createdAt, id, driverId, distanceCovered, notes, recordedBy, routeId, ...data } = fuelData
    return prisma.fuelLog.create({ data: _mapFuelIn(data) })
  },

  // ─── Maintenance ──────────────────────────────────────────────────────
  async findAllMaintenance(filters = {}) {
    const where = {}
    if (filters.vehicleId) where.vehicleId = Number(filters.vehicleId)
    return prisma.maintenanceRecord.findMany({ where, orderBy: { serviceDate: 'desc' } })
  },

  async createMaintenance(recordData) {
    const { createdAt, updatedAt, id, ...data } = recordData
    return prisma.maintenanceRecord.create({ data: _mapMaintenanceIn(data) })
  },

  // ─── Routes ───────────────────────────────────────────────────────────
  async findAllRoutes() {
    return prisma.route.findMany({ orderBy: { createdAt: 'desc' } })
  },

  async createRoute(routeData) {
    const { createdAt, updatedAt, id, ...data } = routeData
    return prisma.route.create({ data: _mapRouteIn(data) })
  },

  async updateRoute(id, updates) {
    try {
      return await prisma.route.update({ where: { id: Number(id) }, data: _mapRouteIn(updates) })
    } catch { return null }
  },

  // ─── Incidents ────────────────────────────────────────────────────────
  async findAllIncidents() {
    return prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { id: true, plateNumber: true } },
        driver: { select: { id: true, name: true } },
      },
    })
  },

  async findIncidentById(id) {
    return prisma.incident.findUnique({ where: { id: Number(id) } })
  },

  async createIncident(incidentData) {
    const { createdAt, updatedAt, id, reportedByDriver, evidenceFile, evidenceFileName, adminResponse, ...data } = incidentData
    return prisma.incident.create({ data: _mapIncidentIn(data) })
  },

  async updateIncident(id, updates) {
    try {
      const { reportedByDriver, evidenceFile, evidenceFileName, adminResponse, ...data } = updates
      return await prisma.incident.update({ where: { id: Number(id) }, data: _mapIncidentIn(data) })
    } catch { return null }
  },

  // ─── Activity Logs ────────────────────────────────────────────────────
  async createActivityLog(logData) {
    return prisma.activityLog.create({
      data: {
        activityType: logData.type || logData.activityType || 'Unknown',
        description: logData.description || null,
        userId: logData.userId ? Number(logData.userId) : null,
        vehicleId: logData.vehicleId ? Number(logData.vehicleId) : null,
        driverId: logData.driverId ? Number(logData.driverId) : null,
        bookingId: logData.bookingId ? Number(logData.bookingId) : null,
      },
    })
  },

  async getActivityLogs(limit = 10) {
    return prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
  },

  // ─── Notifications ────────────────────────────────────────────────────
  async findNotificationById(id) {
    return prisma.notification.findUnique({ where: { id: Number(id) } })
  },

  async findAllNotifications(filters = {}) {
    const where = {}
    if (filters.userId) where.userId = Number(filters.userId)
    if (filters.recipientRole) where.recipientRole = filters.recipientRole
    if (filters.driverId) where.driverId = Number(filters.driverId)
    if (filters.excludeRecipientRole) where.NOT = { recipientRole: filters.excludeRecipientRole }
    if (filters.read !== undefined) where.read = !!filters.read

    const rows = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' } })

    if (filters.currentUserId != null && filters.recipientRole &&
      (filters.recipientRole === 'admin' || filters.recipientRole === 'hod')) {
      return rows.filter((n) => n.recipientUserId == null || String(n.recipientUserId) === String(filters.currentUserId))
    }
    return rows
  },

  async createNotification(notificationData) {
    // Strip fields that are not in the Prisma Notification schema
    const { createdAt, id, bookingId, tripId, incidentId, maintenanceRecordId,
      severity, driverName, driverPhone, driverEmail, vehiclePlate, vehicleDetails, ...data } = notificationData
    return prisma.notification.create({
      data: {
        userId: data.userId ? Number(data.userId) : null,
        driverId: data.driverId ? Number(data.driverId) : null,
        recipientRole: data.recipientRole || null,
        recipientUserId: data.recipientUserId ? Number(data.recipientUserId) : null,
        title: data.title || null,
        message: data.message || null,
        type: data.type || null,
        read: false,
      },
    })
  },

  async updateNotification(id, updates) {
    try {
      return await prisma.notification.update({ where: { id: Number(id) }, data: updates })
    } catch { return null }
  },

  async markNotificationsRead(userId, recipientRole, driverId, scopeUserId = null) {
    const where = {}
    if (userId && recipientRole) { where.userId = Number(userId); where.recipientRole = recipientRole }
    else if (driverId && recipientRole) { where.driverId = Number(driverId); where.recipientRole = recipientRole }
    else if (userId) { where.userId = Number(userId) }
    else if (recipientRole) { where.recipientRole = recipientRole }
    else if (driverId) { where.driverId = Number(driverId) }

    if (scopeUserId != null && (recipientRole === 'admin' || recipientRole === 'hod')) {
      const notifications = await prisma.notification.findMany({ where })
      const ids = notifications
        .filter((n) => n.recipientUserId == null || String(n.recipientUserId) === String(scopeUserId))
        .map((n) => n.id)
      if (ids.length) await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { read: true } })
    } else {
      await prisma.notification.updateMany({ where, data: { read: true } })
    }
  },

  // ─── Assignment Drafts ────────────────────────────────────────────────
  async saveAssignmentDraft(bookingId, draft) {
    return prisma.assignmentDraft.upsert({
      where: { bookingId: Number(bookingId) },
      create: { bookingId: Number(bookingId), data: draft },
      update: { data: draft },
    })
  },

  async getAssignmentDraft(bookingId) {
    const record = await prisma.assignmentDraft.findUnique({ where: { bookingId: Number(bookingId) } })
    return record ? record.data : null
  },

  async getAssignmentDraftsForAdmin() {
    const records = await prisma.assignmentDraft.findMany()
    return Object.fromEntries(records.map((r) => [String(r.bookingId), r.data]))
  },

  async deleteAssignmentDraft(bookingId) {
    try { await prisma.assignmentDraft.delete({ where: { bookingId: Number(bookingId) } }) }
    catch { /* noop */ }
  },

  // ─── Gate Passes ──────────────────────────────────────────────────────
  async createGatePass(gatePassData) {
    const { token, tripId, bookingId, driverId, usedAt, ...rest } = gatePassData
    return prisma.gatePass.create({
      data: {
        token,
        tripId: String(tripId),
        bookingId: bookingId ? String(bookingId) : null,
        driverId: String(driverId),
        data: rest,
        usedAt: usedAt ? new Date(usedAt) : null,
      },
    })
  },

  async findAllGatePasses() {
    const rows = await prisma.gatePass.findMany({ orderBy: { issuedAt: 'desc' } })
    return rows.map(_expandGatePass)
  },

  async findUnusedGatePassForTrip(tripId) {
    const row = await prisma.gatePass.findFirst({
      where: { tripId: String(tripId), usedAt: null },
    })
    return row ? _expandGatePass(row) : null
  },

  async scanGatePass(token) {
    const row = await prisma.gatePass.findUnique({ where: { token } })
    if (!row) return null
    if (!row.usedAt) {
      await prisma.gatePass.update({ where: { token }, data: { usedAt: new Date() } })
    }
    return _expandGatePass(row)
  },
}

export default db

// ─── Helper: expand stored gate pass JSON ─────────────────────────────────────
function _expandGatePass(row) {
  const extra = (row.data && typeof row.data === 'object') ? row.data : {}
  return {
    ...extra,
    id: row.id,
    token: row.token,
    tripId: row.tripId,
    bookingId: row.bookingId,
    driverId: row.driverId,
    issuedAt: row.issuedAt,
    usedAt: row.usedAt,
  }
}

// ─── Field mappers ────────────────────────────────────────────────────────────

function _mapVehicleIn(data) {
  const out = {}
  const map = {
    plateNumber: 'plateNumber', plate_number: 'plateNumber',
    make: 'make', model: 'model', year: 'year', color: 'color',
    chassisNumber: 'chassisNumber', chassis_number: 'chassisNumber',
    engineNumber: 'engineNumber', engine_number: 'engineNumber',
    fuelType: 'fuelType', fuel_type: 'fuelType',
    fuelCapacity: 'fuelCapacity', fuel_capacity: 'fuelCapacity',
    odometerReading: 'odometerReading', odometer_reading: 'odometerReading',
    currentOdometer: 'odometerReading',
    operationalStatus: 'operationalStatus', operational_status: 'operationalStatus',
    purchaseDate: 'purchaseDate', purchase_date: 'purchaseDate',
    purchaseCost: 'purchaseCost', purchase_cost: 'purchaseCost',
    supplier: 'supplier',
    lastServiceDate: 'lastServiceDate', last_service_date: 'lastServiceDate',
    nextServiceDueDate: 'nextServiceDueDate', next_service_due_date: 'nextServiceDueDate',
    registrationExpiry: 'registrationExpiry', registration_expiry_date: 'registrationExpiry',
    insuranceExpiry: 'insuranceExpiry', insurance_expiry_date: 'insuranceExpiry',
  }
  for (const [src, dest] of Object.entries(map)) {
    if (data[src] !== undefined) out[dest] = data[src]
  }
  // Normalize status enum
  const statusMap = { 'Active': 'Available', 'In Use': 'In_Use', 'On Trip': 'On_Trip', 'In Maintenance': 'Maintenance', 'Inactive': 'Retired' }
  if (out.operationalStatus && statusMap[out.operationalStatus]) out.operationalStatus = statusMap[out.operationalStatus]
  // Convert date strings
  for (const f of ['purchaseDate', 'lastServiceDate', 'nextServiceDueDate', 'registrationExpiry', 'insuranceExpiry']) {
    if (out[f] && typeof out[f] === 'string') out[f] = new Date(out[f])
  }
  return out
}

function _mapDriverIn(data) {
  const out = {}
  const map = {
    name: 'name',
    licenseNumber: 'licenseNumber', license_number: 'licenseNumber',
    licenseExpiryDate: 'licenseExpiryDate', license_expiry_date: 'licenseExpiryDate',
    phone: 'phone', email: 'email', address: 'address',
    emergencyContactName: 'emergencyContactName', emergency_contact_name: 'emergencyContactName',
    emergencyContactPhone: 'emergencyContactPhone', emergency_contact_phone: 'emergencyContactPhone',
    status: 'status', hireDate: 'hireDate', hire_date: 'hireDate',
    performanceRating: 'performanceRating', performance_rating: 'performanceRating',
  }
  for (const [src, dest] of Object.entries(map)) {
    if (data[src] !== undefined) out[dest] = data[src]
  }
  if (out.status === 'On Leave') out.status = 'On_Leave'
  if (out.hireDate && typeof out.hireDate === 'string') out.hireDate = new Date(out.hireDate)
  if (out.licenseExpiryDate && typeof out.licenseExpiryDate === 'string') out.licenseExpiryDate = new Date(out.licenseExpiryDate)
  return out
}

function _mapBookingIn(data) {
  const out = {}
  const map = {
    requestId: 'requestId', request_id: 'requestId',
    userId: 'userId', user_id: 'userId',
    vehicleId: 'vehicleId', vehicle_id: 'vehicleId',
    driverId: 'driverId', driver_id: 'driverId',
    purpose: 'purpose', destination: 'destination', origin: 'origin',
    startDate: 'startDate', start_date: 'startDate', startDateTime: 'startDate',
    endDate: 'endDate', end_date: 'endDate', endDateTime: 'endDate',
    passengers: 'passengers', numberOfPassengers: 'passengers',
    additionalNotes: 'additionalNotes', additional_notes: 'additionalNotes', notes: 'additionalNotes',
    status: 'status',
    approvedBy: 'approvedBy', approved_by: 'approvedBy',
    approvedAt: 'approvedAt', approved_at: 'approvedAt',
    rejectionReason: 'rejectionReason', rejection_reason: 'rejectionReason',
  }
  for (const [src, dest] of Object.entries(map)) {
    if (data[src] !== undefined) out[dest] = data[src]
  }
  if (out.userId != null) out.userId = Number(out.userId)
  if (out.vehicleId != null) out.vehicleId = Number(out.vehicleId)
  if (out.driverId != null) out.driverId = Number(out.driverId)
  if (out.approvedBy != null) out.approvedBy = Number(out.approvedBy)
  if (out.passengers != null) out.passengers = Number(out.passengers)
  if (out.startDate && typeof out.startDate === 'string') out.startDate = new Date(out.startDate)
  if (out.endDate && typeof out.endDate === 'string') out.endDate = new Date(out.endDate)
  if (out.approvedAt && typeof out.approvedAt === 'string') out.approvedAt = new Date(out.approvedAt)
  return out
}

function _mapTripIn(data) {
  const out = {}
  const map = {
    bookingId: 'bookingId', booking_id: 'bookingId',
    vehicleId: 'vehicleId', vehicle_id: 'vehicleId',
    driverId: 'driverId', driver_id: 'driverId',
    origin: 'origin', destination: 'destination',
    scheduledDeparture: 'scheduledDeparture', scheduled_departure: 'scheduledDeparture',
    scheduledArrival: 'scheduledArrival', scheduled_arrival: 'scheduledArrival',
    actualDeparture: 'actualDeparture', actual_departure: 'actualDeparture',
    departureTime: 'actualDeparture',
    actualArrival: 'actualArrival', actual_arrival: 'actualArrival',
    arrivalTime: 'actualArrival',
    startOdometer: 'startOdometer', start_odometer: 'startOdometer',
    endOdometer: 'endOdometer', end_odometer: 'endOdometer',
    distanceTraveled: 'distanceTraveled', distance_traveled: 'distanceTraveled',
    status: 'status', driverNotes: 'driverNotes', driver_notes: 'driverNotes',
  }
  for (const [src, dest] of Object.entries(map)) {
    if (data[src] !== undefined) out[dest] = data[src]
  }
  if (out.vehicleId != null) out.vehicleId = Number(out.vehicleId)
  if (out.driverId != null) out.driverId = Number(out.driverId)
  if (out.bookingId != null) out.bookingId = Number(out.bookingId)
  if (out.status === 'In Progress') out.status = 'In_Progress'
  for (const f of ['scheduledDeparture', 'scheduledArrival', 'actualDeparture', 'actualArrival']) {
    if (out[f] && typeof out[f] === 'string') out[f] = new Date(out[f])
  }
  return out
}

function _mapFuelIn(data) {
  const out = {}
  const map = {
    vehicleId: 'vehicleId', vehicle_id: 'vehicleId',
    tripId: 'tripId', trip_id: 'tripId',
    fuelType: 'fuelType', fuel_type: 'fuelType',
    quantity: 'quantity', cost: 'cost',
    odometerReading: 'odometerReading', odometer_reading: 'odometerReading',
    fuelStation: 'fuelStation', fuel_station: 'fuelStation',
    receiptNumber: 'receiptNumber', receipt_number: 'receiptNumber',
    refuelDate: 'refuelDate', refuel_date: 'refuelDate', date: 'refuelDate',
    efficiency: 'efficiency',
  }
  for (const [src, dest] of Object.entries(map)) {
    if (data[src] !== undefined) out[dest] = data[src]
  }
  if (out.vehicleId != null) out.vehicleId = Number(out.vehicleId)
  if (out.tripId != null) out.tripId = Number(out.tripId)
  // refuelDate is required — default to today if missing
  if (!out.refuelDate) out.refuelDate = new Date()
  else if (typeof out.refuelDate === 'string') out.refuelDate = new Date(out.refuelDate)
  // odometerReading is required — default to 0 if missing
  if (out.odometerReading == null) out.odometerReading = 0
  return out
}

function _mapMaintenanceIn(data) {
  const out = {}
  const map = {
    vehicleId: 'vehicleId', vehicle_id: 'vehicleId',
    serviceType: 'serviceType', service_type: 'serviceType',
    serviceDate: 'serviceDate', service_date: 'serviceDate', date: 'serviceDate',
    odometerReading: 'odometerReading', odometer_reading: 'odometerReading',
    cost: 'cost',
    mechanicName: 'mechanicName', mechanic_name: 'mechanicName',
    serviceProvider: 'mechanicName',
    mechanicDetails: 'mechanicDetails', mechanic_details: 'mechanicDetails',
    description: 'description', notes: 'description',
    nextServiceDate: 'nextServiceDate', next_service_due_date: 'nextServiceDate',
    nextServiceDueDate: 'nextServiceDate', nextServiceDue: 'nextServiceDate',
  }
  for (const [src, dest] of Object.entries(map)) {
    if (data[src] !== undefined) out[dest] = data[src]
  }
  if (out.vehicleId != null) out.vehicleId = Number(out.vehicleId)
  if (!out.serviceDate) out.serviceDate = new Date()
  else if (typeof out.serviceDate === 'string') out.serviceDate = new Date(out.serviceDate)
  if (out.nextServiceDate && typeof out.nextServiceDate === 'string') out.nextServiceDate = new Date(out.nextServiceDate)
  return out
}

function _mapRouteIn(data) {
  const out = {}
  const map = {
    name: 'name', origin: 'origin', destination: 'destination',
    vehicleId: 'vehicleId', vehicle_id: 'vehicleId', preferredVehicle: 'vehicleId',
    driverId: 'driverId', driver_id: 'driverId',
    estimatedDistance: 'estimatedDistance', estimated_distance: 'estimatedDistance',
    distance: 'estimatedDistance', distanceKm: 'estimatedDistance',
    estimatedTime: 'estimatedTime', estimated_time: 'estimatedTime',
    duration: 'estimatedTime', durationMinutes: 'estimatedTime',
    optimizedPath: 'optimizedPath', optimized_path: 'optimizedPath',
    status: 'status',
  }
  for (const [src, dest] of Object.entries(map)) {
    if (data[src] !== undefined) out[dest] = data[src]
  }
  if (out.vehicleId != null) out.vehicleId = Number(out.vehicleId)
  if (out.driverId != null) out.driverId = Number(out.driverId)
  // Convert estimatedTime number (minutes) to string for Prisma
  if (out.estimatedTime != null && typeof out.estimatedTime === 'number') {
    out.estimatedTime = String(out.estimatedTime)
  }
  // Normalize status enum — "Saved" is not valid, default to Scheduled
  const statusMap = { 'In Progress': 'In_Progress', 'Saved': 'Scheduled' }
  if (out.status && statusMap[out.status]) out.status = statusMap[out.status]
  return out
}

function _mapIncidentIn(data) {
  const out = {}
  const map = {
    incidentType: 'incidentType', incident_type: 'incidentType', type: 'incidentType',
    vehicleId: 'vehicleId', vehicle_id: 'vehicleId',
    driverId: 'driverId', driver_id: 'driverId',
    reportedBy: 'reportedBy', reported_by: 'reportedBy',
    incidentDate: 'incidentDate', incident_date: 'incidentDate', date: 'incidentDate',
    location: 'location', description: 'description',
    severity: 'severity', status: 'status',
    damageDescription: 'damageDescription', damage_description: 'damageDescription',
    estimatedRepairCost: 'estimatedRepairCost', estimated_repair_cost: 'estimatedRepairCost',
    resolutionNotes: 'resolutionNotes', resolution_notes: 'resolutionNotes',
  }
  for (const [src, dest] of Object.entries(map)) {
    if (data[src] !== undefined) out[dest] = data[src]
  }
  if (out.vehicleId != null) out.vehicleId = Number(out.vehicleId)
  if (out.driverId != null) out.driverId = Number(out.driverId)
  if (out.reportedBy != null) out.reportedBy = Number(out.reportedBy)
  if (!out.incidentDate) out.incidentDate = new Date()
  else if (typeof out.incidentDate === 'string') out.incidentDate = new Date(out.incidentDate)
  // Enum normalizations
  if (out.incidentType === 'Minor Damage') out.incidentType = 'Minor_Damage'
  if (out.status === 'Under Investigation') out.status = 'Under_Investigation'
  if (out.status === 'Repair Scheduled') out.status = 'Repair_Scheduled'
  return out
}
