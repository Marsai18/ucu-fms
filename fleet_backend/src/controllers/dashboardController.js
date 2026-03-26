import db from '../utils/db.js';

const getLastMonthsWindow = (count = 6) => {
  const window = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    window.push({
      label: date.toLocaleString('en-US', { month: 'short' }),
      month: date.getMonth(),
      year: date.getFullYear()
    });
  }
  return window;
};

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now';
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return new Date(dateString).toLocaleDateString();
};

const distanceForTrip = (trip) => {
  if (!trip) return 0;
  const explicit = toNumber(trip.distanceTraveled);
  if (explicit > 0) return explicit;
  const start = toNumber(trip.startOdometer);
  const end = toNumber(trip.endOdometer);
  return end > start ? end - start : 0;
};

// Get dashboard statistics - admin only (operational alerts, fleet stats)
export const getDashboardStats = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin' || req.user?.username === 'masai';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required for dashboard stats' });
    }
    const vehicles = await db.findAllVehicles();
    const drivers = await db.findAllDrivers();
    const bookings = await db.findAllBookings();
    const trips = await db.findAllTrips();
    const fuelLogs = await db.findAllFuelLogs();
    const maintenanceRecords = await db.findAllMaintenance();
    const incidents = await db.findAllIncidents();
    const activityLogs = await db.getActivityLogs(10);

    const vehicleStats = {
      total: vehicles.length,
      active: vehicles.filter(v => (v.operationalStatus || '').toLowerCase().includes('active')).length,
      maintenance: vehicles.filter(v => (v.operationalStatus || '').toLowerCase().includes('maintenance')).length,
      inactive: vehicles.filter(v => (v.operationalStatus || '').toLowerCase().includes('inactive')).length
    };

    const driverStats = {
      total: drivers.length,
      active: drivers.filter(d => d.status === 'Active').length
    };

    const monthsWindow = getLastMonthsWindow(6);

    const mileageData = monthsWindow.map(bucket => {
      const monthTrips = trips.filter(trip => {
        const date = trip.departureTime || trip.createdAt;
        if (!date) return false;
        const tripDate = new Date(date);
        return tripDate.getMonth() === bucket.month && tripDate.getFullYear() === bucket.year;
      });
      const mileage = monthTrips.reduce((sum, trip) => sum + distanceForTrip(trip), 0);
      return {
        month: bucket.label,
        mileage: Math.round(mileage),
        trips: monthTrips.length
      };
    });

    const fuelData = monthsWindow.map(bucket => {
      const monthLogs = fuelLogs.filter(log => {
        const logDate = new Date(log.createdAt);
        return logDate.getMonth() === bucket.month && logDate.getFullYear() === bucket.year;
      });
      const totalFuel = monthLogs.reduce((sum, log) => sum + toNumber(log.quantity), 0);
      const totalCost = monthLogs.reduce((sum, log) => sum + toNumber(log.cost), 0);
      return {
        month: bucket.label,
        fuel: Number(totalFuel.toFixed(1)),
        cost: Number((totalCost / 1000).toFixed(1)) // show in thousands for readability
      };
    });

  const maintenanceData = maintenanceRecords.reduce((acc, record) => {
      const type = record.serviceType || 'Other';
      if (!acc[type]) {
      acc[type] = { name: type, value: 0, count: 0, color: undefined };
      }
      acc[type].value += toNumber(record.cost);
    acc[type].count += 1;
      return acc;
    }, {});

    const maintenanceColorPalette = ['#6366F1', '#F97316', '#10B981', '#F43F5E', '#0EA5E9', '#14B8A6'];
    const maintenanceDataArray = Object.values(maintenanceData).map((entry, index) => ({
      ...entry,
      color: maintenanceColorPalette[index % maintenanceColorPalette.length]
    }));

    const pendingBookingsCount = bookings.filter(b => b.status === 'Pending').length;
    const totalFuelCost = fuelLogs.reduce((sum, log) => sum + toNumber(log.cost), 0);
    const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + toNumber(record.cost), 0);

    const stats = {
      totalVehicles: vehicles.length,
      activeVehicles: vehicleStats.active,
      totalDrivers: drivers.length,
      activeTrips: trips.filter(trip => trip.status === 'In Progress').length,
      pendingBookings: pendingBookingsCount,
      totalFuelCost,
      maintenanceCost: totalMaintenanceCost
    };

    const notifications = [];
    const upcomingMaintenance = maintenanceRecords.filter(record => {
      if (!record.nextServiceDueDate) return false;
      const dueDate = new Date(record.nextServiceDueDate);
      const diffDays = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).slice(0, 3);

    upcomingMaintenance.forEach(record => {
      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      notifications.push({
        id: `maintenance-${record.id}`,
        title: `Service due: ${vehicle?.plateNumber || 'Vehicle'}`,
        description: `Next service on ${record.nextServiceDueDate}`,
        severity: 'warning',
        timeAgo: formatTimeAgo(record.serviceDate || record.createdAt)
      });
    });

    incidents
      .filter(incident => incident.status !== 'Resolved')
      .slice(0, 3)
      .forEach(incident => {
        notifications.push({
          id: `incident-${incident.id}`,
          title: `Incident: ${incident.incidentType}`,
          description: incident.description,
          severity: incident.severity === 'High' || incident.severity === 'Critical' ? 'urgent' : 'info',
          timeAgo: formatTimeAgo(incident.createdAt)
        });
      });

    if (pendingBookingsCount > 0) {
      notifications.push({
        id: 'bookings-pending',
        title: 'Booking approvals required',
        description: `${pendingBookingsCount} request(s) waiting for review`,
        severity: 'warning',
        timeAgo: 'Today'
      });
    }

    res.json({
      stats,
      vehicleStats,
      driverStats,
      mileageData,
      fuelData,
      maintenanceData: maintenanceDataArray,
      activityLogs,
      vehicleStatus: vehicles.slice(0, 6).map(v => ({
        registration: `${v.make || ''} ${v.model || ''} ${v.plateNumber || ''}`.trim(),
        status: v.operationalStatus || 'Unknown',
        id: v.id
      })),
      notifications,
      pendingBookings: pendingBookingsCount,
      upcomingMaintenanceCount: upcomingMaintenance.length
    });
  } catch (error) {
    next(error);
  }
};
