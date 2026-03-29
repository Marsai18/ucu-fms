import pool from '../config/database.js';
import {
  sortBookingsByRecencyDesc,
  sortTripsByRecencyDesc,
  sortNotificationsByRecencyDesc,
  sortRoutesByRecencyDesc,
} from './recencySort.js';

const C = {
  vehicles: 'vehicles',
  drivers: 'drivers',
  bookings: 'bookings',
  trips: 'trips',
  fuelLogs: 'fuel_logs',
  maintenanceRecords: 'maintenance_records',
  routes: 'routes',
  incidents: 'incidents',
  notifications: 'notifications',
  activityLogs: 'activity_logs',
  assignmentDrafts: 'assignment_drafts',
  trainingSessions: 'training_sessions',
};

function parsePayload(row) {
  const p = row.payload;
  const obj = typeof p === 'string' ? JSON.parse(p) : p;
  return { ...obj, id: String(obj.id ?? row.doc_id) };
}

async function loadAll(collection) {
  const [rows] = await pool.query(
    'SELECT doc_id, payload FROM app_documents WHERE collection = ? ORDER BY doc_id',
    [collection]
  );
  return rows.map(parsePayload);
}

async function upsert(collection, docId, obj) {
  const payload = { ...obj, id: String(obj.id ?? docId) };
  await pool.query(
    `INSERT INTO app_documents (collection, doc_id, payload) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`,
    [collection, String(docId), JSON.stringify(payload)]
  );
  return payload;
}

async function remove(collection, docId) {
  await pool.query('DELETE FROM app_documents WHERE collection = ? AND doc_id = ?', [collection, String(docId)]);
}

function nextIdFromItems(items) {
  if (!items.length) return '1';
  const maxId = Math.max(...items.map((item) => parseInt(item.id, 10) || 0));
  return String(maxId + 1);
}

function mapUserRow(row) {
  if (!row) return null;
  const u = {
    id: String(row.id),
    username: row.username,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    phone: row.phone || '',
    status: (row.status || 'active').toLowerCase(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.driver_id != null) u.driverId = String(row.driver_id);
  return u;
}

async function loadRootObject(collection, docId = '_root') {
  const [rows] = await pool.query(
    'SELECT payload FROM app_documents WHERE collection = ? AND doc_id = ? LIMIT 1',
    [collection, docId]
  );
  if (!rows.length) return null;
  const p = rows[0].payload;
  return typeof p === 'string' ? JSON.parse(p) : p;
}

async function loadTrainingArray() {
  const raw = await loadRootObject(C.trainingSessions, '_root');
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.sessions)) return raw.sessions;
  return [];
}

async function saveTrainingArray(arr) {
  await pool.query(
    `INSERT INTO app_documents (collection, doc_id, payload) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`,
    [C.trainingSessions, '_root', JSON.stringify(arr)]
  );
}

const mysqlDb = {
  async findUser(where) {
    if (where.id) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [where.id]);
      return rows[0] ? mapUserRow(rows[0]) : null;
    }
    if (where.username) {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [
        where.username,
        where.username,
      ]);
      return rows[0] ? mapUserRow(rows[0]) : null;
    }
    return null;
  },

  async findAllVehicles() {
    return loadAll(C.vehicles);
  },

  async findVehicleById(id) {
    const [rows] = await pool.query(
      'SELECT doc_id, payload FROM app_documents WHERE collection = ? AND doc_id = ? LIMIT 1',
      [C.vehicles, String(id)]
    );
    return rows.length ? parsePayload(rows[0]) : null;
  },

  async createVehicle(vehicleData) {
    const items = await loadAll(C.vehicles);
    const id = nextIdFromItems(items);
    const vehicle = {
      id,
      ...vehicleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return upsert(C.vehicles, id, vehicle);
  },

  async updateVehicle(id, updates) {
    const cur = await this.findVehicleById(id);
    if (!cur) return null;
    const vehicle = { ...cur, ...updates, updatedAt: new Date().toISOString() };
    return upsert(C.vehicles, String(id), vehicle);
  },

  async deleteVehicle(id) {
    const cur = await this.findVehicleById(id);
    if (!cur) return false;
    await remove(C.vehicles, String(id));
    return true;
  },

  async findAllDrivers() {
    return loadAll(C.drivers);
  },

  async findDriverById(id) {
    const [rows] = await pool.query(
      'SELECT doc_id, payload FROM app_documents WHERE collection = ? AND doc_id = ? LIMIT 1',
      [C.drivers, String(id)]
    );
    return rows.length ? parsePayload(rows[0]) : null;
  },

  async createDriver(driverData) {
    const items = await loadAll(C.drivers);
    const id = nextIdFromItems(items);
    const driver = {
      id,
      ...driverData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return upsert(C.drivers, id, driver);
  },

  async updateDriver(id, updates) {
    const cur = await this.findDriverById(id);
    if (!cur) return null;
    const driver = { ...cur, ...updates, updatedAt: new Date().toISOString() };
    return upsert(C.drivers, String(id), driver);
  },

  async deleteDriver(id) {
    const cur = await this.findDriverById(id);
    if (!cur) return false;
    await remove(C.drivers, String(id));
    return true;
  },

  async findAllBookings(filters = {}) {
    let bookings = await loadAll(C.bookings);
    if (filters.status) bookings = bookings.filter((b) => b.status === filters.status);
    if (filters.userId) bookings = bookings.filter((b) => String(b.userId) === String(filters.userId));
    if (filters.forHod && !filters.status) bookings = bookings.filter((b) => b.status === 'Pending');
    if (filters.forAdmin) bookings = bookings.filter((b) => b.status !== 'Pending');
    return sortBookingsByRecencyDesc(bookings);
  },

  async findBookingById(id) {
    const bookings = await loadAll(C.bookings);
    return bookings.find((b) => b.id === String(id) || b.request_id === id) || null;
  },

  async createBooking(bookingData) {
    const items = await loadAll(C.bookings);
    const id = nextIdFromItems(items);
    const booking = {
      id,
      request_id: `BK${String(Date.now()).slice(-6)}`,
      ...bookingData,
      status: bookingData.status || 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return upsert(C.bookings, id, booking);
  },

  async updateBooking(id, updates) {
    const cur = await this.findBookingById(id);
    if (!cur) return null;
    const booking = { ...cur, ...updates, updatedAt: new Date().toISOString() };
    return upsert(C.bookings, String(booking.id), booking);
  },

  async findAllTrips() {
    const trips = await loadAll(C.trips);
    return sortTripsByRecencyDesc(trips);
  },

  async findTripById(id) {
    const [rows] = await pool.query(
      'SELECT doc_id, payload FROM app_documents WHERE collection = ? AND doc_id = ? LIMIT 1',
      [C.trips, String(id)]
    );
    return rows.length ? parsePayload(rows[0]) : null;
  },

  async createTrip(tripData) {
    const items = await loadAll(C.trips);
    const id = nextIdFromItems(items);
    const trip = {
      id,
      ...tripData,
      status: tripData.status || 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return upsert(C.trips, id, trip);
  },

  async updateTrip(id, updates) {
    const cur = await this.findTripById(id);
    if (!cur) return null;
    const trip = { ...cur, ...updates, updatedAt: new Date().toISOString() };
    return upsert(C.trips, String(trip.id), trip);
  },

  async findAllFuelLogs(filters = {}) {
    let logs = await loadAll(C.fuelLogs);
    if (filters.vehicleId) logs = logs.filter((l) => String(l.vehicleId) === String(filters.vehicleId));
    if (filters.driverId) logs = logs.filter((l) => l.driverId && String(l.driverId) === String(filters.driverId));
    if (filters.tripId) logs = logs.filter((l) => l.tripId && String(l.tripId) === String(filters.tripId));
    return logs;
  },

  async createFuelLog(fuelData) {
    const items = await loadAll(C.fuelLogs);
    const id = nextIdFromItems(items);
    const log = { id, ...fuelData, createdAt: new Date().toISOString() };
    return upsert(C.fuelLogs, id, log);
  },

  async findAllMaintenance(filters = {}) {
    let records = await loadAll(C.maintenanceRecords);
    if (filters.vehicleId) records = records.filter((r) => String(r.vehicleId) === String(filters.vehicleId));
    return records;
  },

  async createMaintenance(recordData) {
    const items = await loadAll(C.maintenanceRecords);
    const id = nextIdFromItems(items);
    const record = { id, ...recordData, createdAt: new Date().toISOString() };
    return upsert(C.maintenanceRecords, id, record);
  },

  async findAllRoutes() {
    const routes = await loadAll(C.routes);
    return sortRoutesByRecencyDesc(routes);
  },

  async createRoute(routeData) {
    const items = await loadAll(C.routes);
    const id = nextIdFromItems(items);
    const route = {
      id,
      ...routeData,
      status: routeData.status || 'Saved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return upsert(C.routes, id, route);
  },

  async updateRoute(id, updates) {
    const items = await loadAll(C.routes);
    const cur = items.find((r) => String(r.id) === String(id));
    if (!cur) return null;
    const route = { ...cur, ...updates, updatedAt: new Date().toISOString() };
    return upsert(C.routes, String(id), route);
  },

  async findAllIncidents() {
    return loadAll(C.incidents);
  },

  async findIncidentById(id) {
    const [rows] = await pool.query(
      'SELECT doc_id, payload FROM app_documents WHERE collection = ? AND doc_id = ? LIMIT 1',
      [C.incidents, String(id)]
    );
    return rows.length ? parsePayload(rows[0]) : null;
  },

  async createIncident(incidentData) {
    const items = await loadAll(C.incidents);
    const id = nextIdFromItems(items);
    const incident = {
      id,
      ...incidentData,
      status: incidentData.status || 'Reported',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return upsert(C.incidents, id, incident);
  },

  async updateIncident(id, updates) {
    const cur = await this.findIncidentById(id);
    if (!cur) return null;
    const incident = { ...cur, ...updates, updatedAt: new Date().toISOString() };
    return upsert(C.incidents, String(id), incident);
  },

  async createActivityLog(logData) {
    const items = await loadAll(C.activityLogs);
    const id = nextIdFromItems(items);
    const log = { id, ...logData, createdAt: new Date().toISOString() };
    return upsert(C.activityLogs, id, log);
  },

  async getActivityLogs(limit = 10) {
    const logs = await loadAll(C.activityLogs);
    return logs.slice(-limit).reverse();
  },

  async findNotificationById(id) {
    const [rows] = await pool.query(
      'SELECT doc_id, payload FROM app_documents WHERE collection = ? AND doc_id = ? LIMIT 1',
      [C.notifications, String(id)]
    );
    return rows.length ? parsePayload(rows[0]) : null;
  },

  async findAllNotifications(filters = {}) {
    let notifications = await loadAll(C.notifications);
    if (filters.userId) {
      notifications = notifications.filter((n) => String(n.userId) === String(filters.userId));
    }
    if (filters.recipientRole) {
      notifications = notifications.filter((n) => String(n.recipientRole) === String(filters.recipientRole));
    }
    if (filters.driverId) {
      notifications = notifications.filter((n) => String(n.driverId) === String(filters.driverId));
    }
    if (filters.excludeRecipientRole) {
      notifications = notifications.filter((n) => String(n.recipientRole) !== String(filters.excludeRecipientRole));
    }
    if (filters.read !== undefined) {
      notifications = notifications.filter((n) => !!n.read === !!filters.read);
    }
    if (
      filters.currentUserId != null &&
      filters.recipientRole &&
      (filters.recipientRole === 'admin' || filters.recipientRole === 'hod')
    ) {
      notifications = notifications.filter((n) => {
        const rid = n.recipientUserId;
        if (rid == null || String(rid).trim() === '') return true;
        return String(rid) === String(filters.currentUserId);
      });
    }
    return sortNotificationsByRecencyDesc(notifications);
  },

  async createNotification(notificationData) {
    const items = await loadAll(C.notifications);
    const id = nextIdFromItems(items);
    const notification = {
      id,
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString(),
    };
    return upsert(C.notifications, id, notification);
  },

  async updateNotification(id, updates) {
    const cur = await this.findNotificationById(id);
    if (!cur) return null;
    const notification = { ...cur, ...updates };
    return upsert(C.notifications, String(id), notification);
  },

  async saveAssignmentDraft(bookingId, draft) {
    const root = (await loadRootObject(C.assignmentDrafts, '_root')) || {};
    root[String(bookingId)] = { ...draft, updatedAt: new Date().toISOString() };
    await pool.query(
      `INSERT INTO app_documents (collection, doc_id, payload) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`,
      [C.assignmentDrafts, '_root', JSON.stringify(root)]
    );
    return root[String(bookingId)];
  },

  async getAssignmentDraft(bookingId) {
    const root = (await loadRootObject(C.assignmentDrafts, '_root')) || {};
    return root[String(bookingId)] || null;
  },

  async getAssignmentDraftsForAdmin() {
    return (await loadRootObject(C.assignmentDrafts, '_root')) || {};
  },

  async deleteAssignmentDraft(bookingId) {
    const root = (await loadRootObject(C.assignmentDrafts, '_root')) || {};
    delete root[String(bookingId)];
    await pool.query(
      `INSERT INTO app_documents (collection, doc_id, payload) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`,
      [C.assignmentDrafts, '_root', JSON.stringify(root)]
    );
  },

  async markNotificationsRead(userId, recipientRole, driverId, scopeUserId = null) {
    const notifications = await loadAll(C.notifications);
    const roleScoped = (n) => {
      if (scopeUserId == null) return true;
      const rid = n.recipientUserId;
      if (rid == null || String(rid).trim() === '') return true;
      return String(rid) === String(scopeUserId);
    };
    for (let i = 0; i < notifications.length; i++) {
      const n = notifications[i];
      let match = false;
      if (userId && recipientRole) {
        match = String(n.userId) === String(userId) && String(n.recipientRole) === String(recipientRole);
      } else if (driverId && recipientRole) {
        match = String(n.driverId) === String(driverId) && String(n.recipientRole) === String(recipientRole);
      } else if (userId) {
        match = String(n.userId) === String(userId);
      } else if (recipientRole === 'admin' || recipientRole === 'hod') {
        match = String(n.recipientRole) === String(recipientRole) && roleScoped(n);
      } else if (recipientRole) {
        match = String(n.recipientRole) === String(recipientRole);
      } else if (driverId) {
        match = String(n.driverId) === String(driverId);
      }
      if (match) notifications[i] = { ...n, read: true };
    }
    for (const n of notifications) {
      await upsert(C.notifications, String(n.id), n);
    }
  },

  async getLegacyDataset() {
    const [userRows] = await pool.query('SELECT * FROM users ORDER BY id ASC');
    const users = userRows.map(mapUserRow);
    const vehicles = await loadAll(C.vehicles);
    const drivers = await loadAll(C.drivers);
    const bookings = await loadAll(C.bookings);
    const trips = await loadAll(C.trips);
    const fuelLogs = await loadAll(C.fuelLogs);
    const maintenanceRecords = await loadAll(C.maintenanceRecords);
    const routes = await loadAll(C.routes);
    const incidents = await loadAll(C.incidents);
    const notifications = await loadAll(C.notifications);
    const activityLogs = await loadAll(C.activityLogs);
    const assignmentDrafts = (await loadRootObject(C.assignmentDrafts, '_root')) || {};
    const trainingSessions = await loadTrainingArray();
    return {
      users,
      vehicles,
      drivers,
      bookings,
      trips,
      fuelLogs,
      maintenanceRecords,
      routes,
      incidents,
      notifications,
      activityLogs,
      assignmentDrafts,
      trainingSessions,
    };
  },

  async getTrainingSessions() {
    return loadTrainingArray();
  },

  async createTrainingSession(body) {
    const sessions = await loadTrainingArray();
    const newSession = {
      id: String(sessions.length + 1),
      ...body,
      createdAt: new Date().toISOString(),
    };
    sessions.push(newSession);
    await saveTrainingArray(sessions);
    return newSession;
  },
};

export default mysqlDb;
