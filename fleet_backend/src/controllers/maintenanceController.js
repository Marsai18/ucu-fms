import db from '../utils/db.js';

const DUE_SOON_DAYS = 7;   // Alert when due within 7 days
const REMINDER_DAYS = 30;  // First reminder when due within 30 days

function getDaysUntilDue(nextServiceDueDate) {
  if (!nextServiceDueDate) return null;
  const due = new Date(nextServiceDueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Create maintenance_alert notifications for admin when service is due soon or overdue.
 * Avoids duplicates: only creates if no notification for this record in last 24h.
 */
export async function checkAndCreateMaintenanceNotifications() {
  try {
    const records = await db.findAllMaintenance();
    const vehicles = await db.findAllVehicles();
    const existingNotifs = (await db.findAllNotifications({ recipientRole: 'admin' }))
      .filter(n => n.type === 'maintenance_alert' && n.maintenanceRecordId);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    for (const record of records) {
      if (!record.nextServiceDueDate) continue;
      const daysUntil = getDaysUntilDue(record.nextServiceDueDate);
      if (daysUntil === null) continue;

      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      const vehicleLabel = vehicle ? `${vehicle.plateNumber} (${vehicle.make} ${vehicle.model})` : `Vehicle ${record.vehicleId}`;
      const dueDateStr = new Date(record.nextServiceDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      const recentlyNotified = existingNotifs.some(
        n => String(n.maintenanceRecordId) === String(record.id) && new Date(n.createdAt).getTime() > oneDayAgo
      );
      if (recentlyNotified) continue;

      if (daysUntil < 0) {
        await db.createNotification({
          type: 'maintenance_alert',
          title: '⚠️ Maintenance Overdue',
          message: `${vehicleLabel} — ${record.serviceType || 'Service'} was due ${Math.abs(daysUntil)} day(s) ago (${dueDateStr})`,
          recipientRole: 'admin',
          maintenanceRecordId: record.id,
          vehicleId: record.vehicleId,
          severity: 'critical'
        });
        existingNotifs.push({ maintenanceRecordId: record.id, createdAt: new Date().toISOString() });
      } else if (daysUntil <= DUE_SOON_DAYS) {
        await db.createNotification({
          type: 'maintenance_alert',
          title: '🔧 Service Due Soon',
          message: `${vehicleLabel} — ${record.serviceType || 'Service'} due in ${daysUntil} day(s) (${dueDateStr})`,
          recipientRole: 'admin',
          maintenanceRecordId: record.id,
          vehicleId: record.vehicleId,
          severity: 'warning'
        });
        existingNotifs.push({ maintenanceRecordId: record.id, createdAt: new Date().toISOString() });
      } else if (daysUntil <= REMINDER_DAYS) {
        await db.createNotification({
          type: 'maintenance_alert',
          title: '📅 Maintenance Reminder',
          message: `${vehicleLabel} — ${record.serviceType || 'Service'} due in ${daysUntil} days (${dueDateStr})`,
          recipientRole: 'admin',
          maintenanceRecordId: record.id,
          vehicleId: record.vehicleId,
          severity: 'info'
        });
        existingNotifs.push({ maintenanceRecordId: record.id, createdAt: new Date().toISOString() });
      }
    }
  } catch (err) {
    console.error('Maintenance notification check failed:', err);
  }
}

// Get maintenance alerts (due soon + overdue) for display
export const getMaintenanceAlerts = async (req, res, next) => {
  try {
    const records = await db.findAllMaintenance();
    const vehicles = await db.findAllVehicles();
    const dueSoon = [];
    const overdue = [];

    for (const record of records) {
      if (!record.nextServiceDueDate) continue;
      const daysUntil = getDaysUntilDue(record.nextServiceDueDate);
      if (daysUntil === null) continue;

      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      const item = {
        ...record,
        vehicle: vehicle ? { plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model } : null,
        daysUntil,
        dueDateFormatted: new Date(record.nextServiceDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      if (daysUntil < 0) overdue.push(item);
      else if (daysUntil <= DUE_SOON_DAYS) dueSoon.push(item);
    }

    overdue.sort((a, b) => a.daysUntil - b.daysUntil);
    dueSoon.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({ overdue, dueSoon });
  } catch (error) {
    next(error);
  }
};

// Get all maintenance records
export const getMaintenanceRecords = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const records = await db.findAllMaintenance({ vehicleId });
    await checkAndCreateMaintenanceNotifications();
    res.json(records);
  } catch (error) {
    next(error);
  }
};

// Create maintenance record
export const createMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await db.createMaintenance(req.body);
    await db.createActivityLog({
      type: 'Maintenance Scheduled',
      vehicleId: req.body.vehicleId,
      description: `Maintenance: ${req.body.serviceType || 'Service'}`
    });
    if (record.nextServiceDueDate) {
      const daysUntil = getDaysUntilDue(record.nextServiceDueDate);
      const vehicles = await db.findAllVehicles();
      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      const vehicleLabel = vehicle ? `${vehicle.plateNumber} (${vehicle.make} ${vehicle.model})` : `Vehicle ${record.vehicleId}`;
      const dueDateStr = new Date(record.nextServiceDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      if (daysUntil !== null && daysUntil <= REMINDER_DAYS) {
        await db.createNotification({
          type: 'maintenance_alert',
          title: daysUntil < 0 ? '⚠️ Maintenance Overdue' : daysUntil <= DUE_SOON_DAYS ? '🔧 Service Due Soon' : '📅 Maintenance Reminder',
          message: `${vehicleLabel} — ${record.serviceType || 'Service'} ${daysUntil < 0 ? `was due ${Math.abs(daysUntil)} day(s) ago` : `due in ${daysUntil} days`} (${dueDateStr})`,
          recipientRole: 'admin',
          maintenanceRecordId: record.id,
          vehicleId: record.vehicleId,
          severity: daysUntil < 0 ? 'critical' : daysUntil <= DUE_SOON_DAYS ? 'warning' : 'info'
        });
      }
    }
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

// Get maintenance statistics
export const getMaintenanceStatistics = async (req, res, next) => {
  try {
    const records = await db.findAllMaintenance();
    const costByType = {};
    
    records.forEach(record => {
      const type = record.serviceType || 'Other';
      if (!costByType[type]) {
        costByType[type] = { service_type: type, total_cost: 0, count: 0 };
      }
      costByType[type].total_cost += parseFloat(record.cost) || 0;
      costByType[type].count += 1;
    });

    res.json({
      costByType: Object.values(costByType),
      upcomingMaintenance: []
    });
  } catch (error) {
    next(error);
  }
};
