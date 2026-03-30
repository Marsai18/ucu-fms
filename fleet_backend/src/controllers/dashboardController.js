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

const tripTime = (trip) => {
  const raw = trip?.actualDeparture || trip?.scheduledDeparture || trip?.createdAt;
  if (!raw) return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

function parseStatsWindow(query) {
  const w = String(query?.window || query?.range || '').toLowerCase();
  if (w === 'today' || w === 'week' || w === 'month') return w;
  return null;
}

function windowBounds(mode) {
  const now = new Date();
  if (mode === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { start, end: now };
  }
  if (mode === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return { start, end: now };
  }
  if (mode === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { start, end: now };
  }
  return null;
}

function inBounds(dt, start, end) {
  if (!dt || Number.isNaN(dt.getTime())) return false;
  const t = dt.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function recordInWindow(record, start, end) {
  const dt = new Date(record.serviceDate || record.createdAt);
  return inBounds(dt, start, end);
}

function buildWindowSeries(trips, fuelLogs, mode, start, end) {
  const mileageData = [];
  const fuelData = [];

  const pushBucket = (label, bStart, bEndExcl) => {
    const monthTrips = trips.filter((trip) => {
      const dt = tripTime(trip);
      if (!dt) return false;
      if (dt < bStart || dt >= bEndExcl) return false;
      return dt <= end;
    });
    const mileage = monthTrips.reduce((sum, trip) => sum + distanceForTrip(trip), 0);
    mileageData.push({ month: label, mileage: Math.round(mileage), trips: monthTrips.length });

    const monthLogs = fuelLogs.filter((log) => {
      const dt = new Date(log.createdAt);
      if (Number.isNaN(dt.getTime())) return false;
      if (dt < bStart || dt >= bEndExcl) return false;
      return dt <= end;
    });
    const totalFuel = monthLogs.reduce((s, log) => s + toNumber(log.quantity), 0);
    const totalCost = monthLogs.reduce((s, log) => s + toNumber(log.cost), 0);
    fuelData.push({
      month: label,
      fuel: Number(totalFuel.toFixed(1)),
      cost: Number((totalCost / 1000).toFixed(1))
    });
  };

  if (mode === 'today') {
    for (let h0 = 0; h0 < 24; h0 += 3) {
      const bStart = new Date(start);
      bStart.setHours(h0, 0, 0, 0);
      const bEndExcl =
        h0 + 3 >= 24
          ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0, 0)
          : (() => {
              const x = new Date(start);
              x.setHours(h0 + 3, 0, 0, 0);
              return x;
            })();
      const h1 = h0 + 3 >= 24 ? 24 : h0 + 3;
      const label = `${String(h0).padStart(2, '0')}-${String(h1).padStart(2, '0')}h`;
      pushBucket(label, bStart, bEndExcl);
    }
    return { mileageData, fuelData };
  }

  if (mode === 'week' || mode === 'month') {
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    let guard = 0;
    while (d <= end && guard < 40) {
      guard += 1;
      const bStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const bEndExcl = new Date(bStart);
      bEndExcl.setDate(bEndExcl.getDate() + 1);
      const label =
        mode === 'week'
          ? bStart.toLocaleDateString('en-US', { weekday: 'short' })
          : String(bStart.getDate());
      pushBucket(label, bStart, bEndExcl);
      d.setDate(d.getDate() + 1);
    }
    return { mileageData, fuelData };
  }

  return { mileageData: [], fuelData: [] };
}

// Get dashboard statistics - admin only (operational alerts, fleet stats)
// Optional ?window=today|week|month filters chart series, fuel/maintenance totals, pie, activity, incident alerts.
// Omit window for legacy layout/sidebar: last 6 calendar months + all-time-style cost fields where applicable.
export const getDashboardStats = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin' || req.user?.username === 'masai';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required for dashboard stats' });
    }

    const statsWindow = parseStatsWindow(req.query);
    const bounds = statsWindow ? windowBounds(statsWindow) : null;
    const wStart = bounds?.start;
    const wEnd = bounds?.end;

    const vehicles = await db.findAllVehicles();
    const drivers = await db.findAllDrivers();
    const bookings = await db.findAllBookings();
    const trips = await db.findAllTrips();
    const fuelLogs = await db.findAllFuelLogs();
    const maintenanceRecords = await db.findAllMaintenance();
    const incidents = await db.findAllIncidents();

    let mileageData;
    let fuelData;

    if (!statsWindow) {
      const monthsWindow = getLastMonthsWindow(6);

      mileageData = monthsWindow.map((bucket) => {
        const monthTrips = trips.filter((trip) => {
          const date = trip.actualDeparture || trip.scheduledDeparture || trip.createdAt;
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

      fuelData = monthsWindow.map((bucket) => {
        const monthLogs = fuelLogs.filter((log) => {
          const logDate = new Date(log.createdAt);
          return logDate.getMonth() === bucket.month && logDate.getFullYear() === bucket.year;
        });
        const totalFuel = monthLogs.reduce((sum, log) => sum + toNumber(log.quantity), 0);
        const totalCost = monthLogs.reduce((sum, log) => sum + toNumber(log.cost), 0);
        return {
          month: bucket.label,
          fuel: Number(totalFuel.toFixed(1)),
          cost: Number((totalCost / 1000).toFixed(1))
        };
      });
    } else {
      const built = buildWindowSeries(trips, fuelLogs, statsWindow, wStart, wEnd);
      mileageData = built.mileageData;
      fuelData = built.fuelData;
    }

    const maintRecordsForPie = statsWindow
      ? maintenanceRecords.filter((r) => recordInWindow(r, wStart, wEnd))
      : maintenanceRecords;

    const maintenanceData = maintRecordsForPie.reduce((acc, record) => {
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

    const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending').length;

    const fuelLogsForCost = statsWindow
      ? fuelLogs.filter((log) => inBounds(new Date(log.createdAt), wStart, wEnd))
      : fuelLogs;
    const totalFuelCost = fuelLogsForCost.reduce((sum, log) => sum + toNumber(log.cost), 0);

    const maintForCost = statsWindow
      ? maintenanceRecords.filter((r) => recordInWindow(r, wStart, wEnd))
      : maintenanceRecords;
    const totalMaintenanceCost = maintForCost.reduce((sum, record) => sum + toNumber(record.cost), 0);

    const stats = {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v) => v.operationalStatus === 'Available' || v.operationalStatus === 'In_Use' || v.operationalStatus === 'On_Trip').length,
      totalDrivers: drivers.length,
      activeTrips: trips.filter((trip) => trip.status === 'In_Progress').length,
      pendingBookings: pendingBookingsCount,
      totalFuelCost,
      maintenanceCost: totalMaintenanceCost
    };

    const vehicleStats = {
      total: vehicles.length,
      active: vehicles.filter((v) => v.operationalStatus === 'Available' || v.operationalStatus === 'In_Use' || v.operationalStatus === 'On_Trip').length,
      maintenance: vehicles.filter((v) => v.operationalStatus === 'Maintenance').length,
      inactive: vehicles.filter((v) => v.operationalStatus === 'Retired').length
    };

    const driverStats = {
      total: drivers.length,
      active: drivers.filter((d) => d.status === 'Active').length
    };

    const activityLogs = statsWindow
      ? (await db.getActivityLogs(300)).filter((log) => inBounds(new Date(log.createdAt), wStart, wEnd)).slice(0, 10)
      : await db.getActivityLogs(10);

    const notifications = [];
    const upcomingMaintenance = maintenanceRecords
      .filter((record) => {
        if (!record.nextServiceDueDate) return false;
        const dueDate = new Date(record.nextServiceDueDate);
        const diffDays = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 30;
      })
      .slice(0, 3);

    upcomingMaintenance.forEach((record) => {
      const vehicle = vehicles.find((v) => v.id === record.vehicleId);
      notifications.push({
        id: `maintenance-${record.id}`,
        title: `Service due: ${vehicle?.plateNumber || 'Vehicle'}`,
        description: `Next service on ${record.nextServiceDueDate}`,
        severity: 'warning',
        timeAgo: formatTimeAgo(record.serviceDate || record.createdAt)
      });
    });

    incidents
      .filter((incident) => {
        if (incident.status === 'Resolved') return false;
        if (!statsWindow) return true;
        return inBounds(new Date(incident.createdAt), wStart, wEnd);
      })
      .slice(0, 3)
      .forEach((incident) => {
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
      vehicleStatus: vehicles.slice(0, 6).map((v) => ({
        registration: `${v.make || ''} ${v.model || ''} ${v.plateNumber || ''}`.trim(),
        status: v.operationalStatus || 'Unknown',
        id: v.id
      })),
      notifications,
      pendingBookings: pendingBookingsCount,
      upcomingMaintenanceCount: upcomingMaintenance.length,
      ...(statsWindow ? { window: statsWindow } : {})
    });
  } catch (error) {
    next(error);
  }
};
