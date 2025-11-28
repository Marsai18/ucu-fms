import db from '../utils/db.js';

// Get all incidents
export const getIncidents = async (req, res, next) => {
  try {
    const incidents = await db.findAllIncidents();
    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

// Get incident by ID
export const getIncidentById = async (req, res, next) => {
  try {
    const incident = await db.findIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    next(error);
  }
};

// Create incident
export const createIncident = async (req, res, next) => {
  try {
    const incident = await db.createIncident({
      ...req.body,
      reportedBy: req.user?.id
    });
    await db.createActivityLog({
      type: 'Incident Reported',
      vehicleId: req.body.vehicleId,
      driverId: req.body.driverId,
      description: `Incident: ${req.body.incidentType || 'Reported'}`
    });
    res.status(201).json(incident);
  } catch (error) {
    next(error);
  }
};

// Update incident
export const updateIncident = async (req, res, next) => {
  try {
    const incident = await db.updateIncident(req.params.id, req.body);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    next(error);
  }
};
