import db from '../utils/db.js';

// Get all maintenance records
export const getMaintenanceRecords = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const records = await db.findAllMaintenance({ vehicleId });
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
