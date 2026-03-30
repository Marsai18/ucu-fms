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

// Get trip history (enriched: client, vehicle, driver, fuel logs)
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

// Update trip (start, update odometer, complete, driver accept/decline, notes)
export const updateTrip = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    const tripId = req.params.id;
    const currentTrip = await db.findTripById(tripId);
    if (!currentTrip) return res.status(404).json({ error: 'Trip not found' });

    const driverId = req.user?.driverId;
    const isDriver = driverId && String(currentTrip.driverId) === String(driverId);

    // Driver decline — stored in driverNotes, status set to Cancelled
    if (updates.driverResponse === 'declined' && isDriver) {
      if (!updates.declineReason || !String(updates.declineReason).trim()) {
        return res.status(400).json({ error: 'Decline reason is required' });
      }
      updates.status = 'Cancelled';
      updates.driverNotes = `Declined: ${String(updates.declineReason).trim()}`;
      await db.createNotification({
        type: 'trip_declined',
        title: 'Driver Declined Trip',
        message: `Driver declined trip ${tripId}. Reason: ${updates.declineReason}`,
        recipientRole: 'admin',
        driverId: currentTrip.driverId,
        ...(await adminRecipientFromTripBooking(currentTrip))
      });
    }

    // Driver accept — store feedback in driverNotes
    if (updates.driverResponse === 'accepted' && isDriver) {
      if (updates.assignmentFeedback) {
        updates.driverNotes = String(updates.assignmentFeedback).trim();
        await db.createNotification({
          type: 'driver_assignment_feedback',
          title: 'Driver Feedback on Assignment',
          message: `Driver feedback for trip ${tripId}: ${String(updates.assignmentFeedback).slice(0, 100)}`,
          recipientRole: 'admin',
          driverId: currentTrip.driverId,
          ...(await adminRecipientFromTripBooking(currentTrip))
        });
      }
    }

    // Store trip report in driverNotes if provided
    if ((updates.tripReport || updates.tripReportFile) && isDriver && currentTrip.status === 'Completed') {
      const reportText = updates.tripReport || `Report file: ${updates.tripReportFileName || 'trip-report.pdf'}`;
      updates.driverNotes = `Report: ${reportText}`;
      await db.createNotification({
        type: 'trip_report_submitted',
        title: 'Trip Report Submitted',
        message: `Driver submitted trip report for trip ${currentTrip.id}`,
        recipientRole: 'admin',
        ...(await adminRecipientFromTripBooking(currentTrip))
      });
    }

    if (updates.endOdometer !== undefined && currentTrip?.startOdometer) {
      updates.distanceTraveled = updates.endOdometer - currentTrip.startOdometer;
    }

    // When starting trip, set actualDeparture
    if (updates.status === 'In Progress' || updates.status === 'In_Progress') {
      if (!updates.actualDeparture && !updates.departureTime) {
        updates.actualDeparture = new Date().toISOString();
      }
      updates.status = 'In_Progress';
    }

    // Strip non-schema fields before update
    delete updates.driverResponse;
    delete updates.declineReason;
    delete updates.assignmentFeedback;
    delete updates.tripReport;
    delete updates.tripReportFile;
    delete updates.tripReportFileName;
    delete updates.tripReportSubmittedAt;
    delete updates.vehicleIds;
    delete updates.tripCode;

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
