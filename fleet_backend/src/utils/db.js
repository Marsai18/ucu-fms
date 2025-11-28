import { readData, writeData, getNextId } from '../config/database.js';

const db = {
  // Users
  async findUser(where) {
    const data = await readData();
    if (where.id) {
      return data.users.find(u => u.id === String(where.id));
    }
    if (where.username) {
      return data.users.find(u => u.username === where.username);
    }
    return null;
  },

  // Vehicles
  async findAllVehicles() {
    const data = await readData();
    return data.vehicles;
  },

  async findVehicleById(id) {
    const data = await readData();
    return data.vehicles.find(v => v.id === String(id));
  },

  async createVehicle(vehicleData) {
    const data = await readData();
    const vehicle = {
      id: getNextId(data.vehicles),
      ...vehicleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.vehicles.push(vehicle);
    await writeData(data);
    return vehicle;
  },

  async updateVehicle(id, updates) {
    const data = await readData();
    const index = data.vehicles.findIndex(v => v.id === String(id));
    if (index === -1) return null;
    data.vehicles[index] = {
      ...data.vehicles[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeData(data);
    return data.vehicles[index];
  },

  async deleteVehicle(id) {
    const data = await readData();
    const index = data.vehicles.findIndex(v => v.id === String(id));
    if (index === -1) return false;
    data.vehicles.splice(index, 1);
    await writeData(data);
    return true;
  },

  // Drivers
  async findAllDrivers() {
    const data = await readData();
    return data.drivers;
  },

  async findDriverById(id) {
    const data = await readData();
    return data.drivers.find(d => d.id === String(id));
  },

  async createDriver(driverData) {
    const data = await readData();
    const driver = {
      id: getNextId(data.drivers),
      ...driverData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.drivers.push(driver);
    await writeData(data);
    return driver;
  },

  async updateDriver(id, updates) {
    const data = await readData();
    const index = data.drivers.findIndex(d => d.id === String(id));
    if (index === -1) return null;
    data.drivers[index] = {
      ...data.drivers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeData(data);
    return data.drivers[index];
  },

  async deleteDriver(id) {
    const data = await readData();
    const index = data.drivers.findIndex(d => d.id === String(id));
    if (index === -1) return false;
    data.drivers.splice(index, 1);
    await writeData(data);
    return true;
  },

  // Bookings
  async findAllBookings(filters = {}) {
    const data = await readData();
    let bookings = data.bookings;
    if (filters.status) {
      bookings = bookings.filter(b => b.status === filters.status);
    }
    return bookings;
  },

  async findBookingById(id) {
    const data = await readData();
    return data.bookings.find(b => b.id === String(id) || b.request_id === id);
  },

  async createBooking(bookingData) {
    const data = await readData();
    const booking = {
      id: getNextId(data.bookings),
      request_id: `BK${String(Date.now()).slice(-6)}`,
      ...bookingData,
      status: bookingData.status || 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.bookings.push(booking);
    await writeData(data);
    return booking;
  },

  async updateBooking(id, updates) {
    const data = await readData();
    const index = data.bookings.findIndex(b => b.id === String(id) || b.request_id === id);
    if (index === -1) return null;
    data.bookings[index] = {
      ...data.bookings[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeData(data);
    return data.bookings[index];
  },

  // Trips
  async findAllTrips() {
    const data = await readData();
    return data.trips;
  },

  async findTripById(id) {
    const data = await readData();
    return data.trips.find(t => t.id === String(id));
  },

  async createTrip(tripData) {
    const data = await readData();
    const trip = {
      id: getNextId(data.trips),
      ...tripData,
      status: tripData.status || 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.trips.push(trip);
    await writeData(data);
    return trip;
  },

  async updateTrip(id, updates) {
    const data = await readData();
    const index = data.trips.findIndex(t => t.id === String(id));
    if (index === -1) return null;
    data.trips[index] = {
      ...data.trips[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeData(data);
    return data.trips[index];
  },

  // Fuel
  async findAllFuelLogs(filters = {}) {
    const data = await readData();
    let logs = data.fuelLogs;
    if (filters.vehicleId) {
      logs = logs.filter(l => l.vehicleId === String(filters.vehicleId));
    }
    return logs;
  },

  async createFuelLog(fuelData) {
    const data = await readData();
    const log = {
      id: getNextId(data.fuelLogs),
      ...fuelData,
      createdAt: new Date().toISOString()
    };
    data.fuelLogs.push(log);
    await writeData(data);
    return log;
  },

  // Maintenance
  async findAllMaintenance(filters = {}) {
    const data = await readData();
    let records = data.maintenanceRecords;
    if (filters.vehicleId) {
      records = records.filter(r => r.vehicleId === String(filters.vehicleId));
    }
    return records;
  },

  async createMaintenance(recordData) {
    const data = await readData();
    const record = {
      id: getNextId(data.maintenanceRecords),
      ...recordData,
      createdAt: new Date().toISOString()
    };
    data.maintenanceRecords.push(record);
    await writeData(data);
    return record;
  },

  // Routes
  async findAllRoutes() {
    const data = await readData();
    return data.routes;
  },

  async createRoute(routeData) {
    const data = await readData();
    const route = {
      id: getNextId(data.routes),
      ...routeData,
      status: routeData.status || 'Scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.routes.push(route);
    await writeData(data);
    return route;
  },

  async updateRoute(id, updates) {
    const data = await readData();
    const index = data.routes.findIndex(r => r.id === String(id));
    if (index === -1) return null;
    data.routes[index] = {
      ...data.routes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeData(data);
    return data.routes[index];
  },

  // Incidents
  async findAllIncidents() {
    const data = await readData();
    return data.incidents;
  },

  async findIncidentById(id) {
    const data = await readData();
    return data.incidents.find(i => i.id === String(id));
  },

  async createIncident(incidentData) {
    const data = await readData();
    const incident = {
      id: getNextId(data.incidents),
      ...incidentData,
      status: incidentData.status || 'Reported',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.incidents.push(incident);
    await writeData(data);
    return incident;
  },

  async updateIncident(id, updates) {
    const data = await readData();
    const index = data.incidents.findIndex(i => i.id === String(id));
    if (index === -1) return null;
    data.incidents[index] = {
      ...data.incidents[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeData(data);
    return data.incidents[index];
  },

  // Activity Logs
  async createActivityLog(logData) {
    const data = await readData();
    const log = {
      id: getNextId(data.activityLogs),
      ...logData,
      createdAt: new Date().toISOString()
    };
    data.activityLogs.push(log);
    await writeData(data);
    return log;
  },

  async getActivityLogs(limit = 10) {
    const data = await readData();
    return data.activityLogs.slice(-limit).reverse();
  }
};

export default db;







