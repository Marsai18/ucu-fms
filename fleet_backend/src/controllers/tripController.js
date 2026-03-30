import db from '../utils/db.js';
import prisma from '../config/database.js';
import { adminRecipientFromTripBooking } from '../utils/notificationTargets.js';

// Get all trips
export const getTrips = async (req, res, next) => {
  try {
    const trips = await db.findAllTrips();
    res.json(trips);
  } catch (error) {
    next(error);
  }
};

// Get trip by ID
export const getTripById = async (req, res, next) => {
  try {
    const trip = await db.findTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    next(error);
  }
};

// Get trip history (enriched: client, vehicle, driver, fuel logs, report)
export const getTripHistory = async (req, res, next) => {
  try {
    const trip = await db.findTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const [vehicle, driver, fuelLogs] = await Promise.all([
      trip.vehicleId ? prisma.vehicle.findUnique({ where: { id: Number(trip.vehicleId) } }) : null,
      trip.driverId ? prisma.driver.findUnique({ where: { id: Number(trip.driverId) } }) : null,
      prisma.fuelLog.findMany({
        where: {
          OR: [
            { tripId: Number(trip.id) },
            { vehicleId: Number(trip.vehicleId), trip: { driverId: Number(trip.driverId) } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let client = null;
    if (trip.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: Number(trip.bookingId) },
        include: { user: { select: { id: true, name: true, email: true, username: true } } },
      });
      client = booking?.user || null;
    }

    res.json({
      ...trip,
      client,
      vehicle: vehicle ? { id: vehicle.id, plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model } : null,
      driver: driver ? { id: driver.id, name: driver.name, email: driver.email } : null,
      fuelLogs,
    });
  } catch (error) {
    next(error);
  }
};

// Create trip
export const createTrip = async (req, res, next) => {
  try {
    const trip = await db.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    next(error);
  }
};

// Update trip (start, update odometer, complete, driver accept/decline, trip report)
export const updateTrip = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    const tripId = req.params.id;
    const currentTrip = await db.findTripById(tripId);
    if (!currentTrip) return res.status(404).json({ error: 'Trip not found' });

    const driverId = req.user?.driverId;
    const isDriver = driverId && String(currentTrip.driverId) === String(driverId);

    if (updates.driverResponse && isDriver) {
      if (!['accepted', 'declined'].includes(updates.driverResponse)) {
        return res.status(400).json({ error: 'Invalid driver response' });
      }
      if (currentTrip.driverResponse && currentTrip.driverResponse !== 'pending') {
        return res.status(400).json({ error: 'Trip already responded to' });
      }
      if (updates.driverResponse === 'declined') {
        if (!updates.declineReason || !String(updates.declineReason).trim()) {
          return res.status(400).json({ error: 'Decline reason is required' });
        }
        updates.status = 'Cancelled';
        await db.createNotification({
          type: 'trip_declined',
          title: 'Driver Declined Trip',
          message: `Driver declined trip ${currentTrip.tripCode || tripId}. Reason: ${updates.declineReason}`,
          tripId,
          recipientRole: 'admin',
          driverId: currentTrip.driverId,
          ...(await adminRecipientFromTripBooking(currentTrip))
        });
      }
      if (updates.driverResponse === 'accepted' && updates.assignmentFeedback) {
        await db.createNotification({
          type: 'driver_assignment_feedback',
          title: 'Driver Feedback on Assignment',
          message: `Driver feedback for trip ${currentTrip.tripCode || tripId}: ${String(updates.assignmentFeedback).slice(0, 100)}${String(updates.assignmentFeedback).length > 100 ? '...' : ''}`,
          tripId,
          recipientRole: 'admin',
          driverId: currentTrip.driverId,
          ...(await adminRecipientFromTripBooking(currentTrip))
        });
      }
    }

    if (updates.assignmentFeedback && isDriver && !updates.driverResponse) {
      if (!currentTrip.assignmentFeedback && (currentTrip.driverResponse === 'accepted' || currentTrip.status === 'In Progress')) {
        await db.createNotification({
          type: 'driver_assignment_feedback',
          title: 'Driver Feedback on Assignment',
          message: `Driver submitted feedback for trip ${currentTrip.tripCode || tripId}`,
          tripId,
          recipientRole: 'admin',
          driverId: currentTrip.driverId,
          ...(await adminRecipientFromTripBooking(currentTrip))
        });
      }
    }

    if ((updates.tripReport || updates.tripReportFile) && isDriver && currentTrip.status === 'Completed') {
      if (updates.tripReport) updates.tripReport = updates.tripReport;
      if (updates.tripReportFile) {
        updates.tripReportFile = updates.tripReportFile;
        updates.tripReportFileName = updates.tripReportFileName || 'trip-report.pdf';
      }
      updates.tripReportSubmittedAt = new Date().toISOString();
      // Notify admin when driver submits trip report
      await db.createNotification({
        type: 'trip_report_submitted',
        title: 'Trip Report Submitted',
        message: `Driver submitted trip report for ${currentTrip.tripCode || 'trip'} ${currentTrip.id}`,
        tripId: currentTrip.id,
        recipientRole: 'admin',
        ...(await adminRecipientFromTripBooking(currentTrip))
      });
    }

    if (updates.endOdometer !== undefined && currentTrip?.startOdometer) {
      updates.distanceTraveled = updates.endOdometer - currentTrip.startOdometer;
    }

    if (updates.status === 'In Progress' && !updates.departureTime) {
      updates.departureTime = new Date().toISOString();
    }

    const trip = await db.updateTrip(tripId, updates);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (trip.status === 'Completed') {
      await db.createActivityLog({
        type: 'Trip Completed',
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        description: `Trip ${trip.id} completed`
      });
    }

    res.json(trip);
  } catch (error) {
    next(error);
  }
};
