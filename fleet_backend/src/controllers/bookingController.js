import db from '../utils/db.js';
import { calculateRoute } from '../utils/routeCalculator.js';
import { calcFuelEstimate } from '../utils/fuelCalculator.js';

// Get all booking requests (clients: own only; HOD: Pending only; Admin: HODApproved/Approved/Rejected - never Pending)
export const getBookingRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status && status !== 'all') filters.status = status;
    if (req.user?.role === 'client') {
      filters.userId = String(req.user.id);
    }
    if (req.user?.role === 'hod' && (!status || status !== 'all')) {
      filters.forHod = true;
    }
    if (req.user?.role === 'admin' || req.user?.username === 'masai') {
      filters.forAdmin = true;
    }
    const bookings = await db.findAllBookings(filters);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// Save assignment draft (admin) - when driver is assigned, calculate route and save for admin to see
export const saveAssignmentDraft = async (req, res, next) => {
  try {
    const { driverId, vehicleIds } = req.body;
    const bookingId = req.params.id;
    const booking = await db.findBookingById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'HODApproved' && booking.status !== 'Pending') {
      return res.status(400).json({ error: 'Draft only for HOD-approved or pending bookings' });
    }
    const origin = 'Uganda Christian University Main Campus';
    const destination = booking.destination || 'Kampala City Centre';
    let routeData = { distanceKm: 0, durationMinutes: 0, geometry: [], origin, destination };
    try {
      const calculated = await calculateRoute(origin, destination, '');
      routeData = {
        distanceKm: calculated.distanceKm,
        durationMinutes: calculated.durationMinutes,
        geometry: calculated.geometry,
        origin: calculated.origin,
        destination: calculated.destination
      };
    } catch (routeErr) {
      console.warn('Route calculation failed for draft:', routeErr.message);
    }
    const draft = await db.saveAssignmentDraft(bookingId, {
      driverId: driverId || null,
      vehicleIds: Array.isArray(vehicleIds) ? vehicleIds : (vehicleIds ? [vehicleIds] : []),
      ...routeData
    });
    res.json(draft);
  } catch (error) {
    next(error);
  }
};

// Get assignment draft for a booking
export const getAssignmentDraft = async (req, res, next) => {
  try {
    const draft = await db.getAssignmentDraft(req.params.id);
    res.json(draft || {});
  } catch (error) {
    next(error);
  }
};

// Route preview for a booking (admin)
export const getRoutePreview = async (req, res, next) => {
  try {
    const booking = await db.findBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'HODApproved' && booking.status !== 'Pending') {
      return res.status(400).json({ error: 'Route preview only for HOD-approved or pending bookings' });
    }
    const origin = 'Uganda Christian University Main Campus';
    const destination = booking.destination || 'Kampala City Centre';
    const calculated = await calculateRoute(origin, destination, '');
    res.json({
      distanceKm: calculated.distanceKm,
      durationMinutes: calculated.durationMinutes,
      geometry: calculated.geometry || [],
      origin: calculated.origin,
      destination: calculated.destination
    });
  } catch (error) {
    next(error);
  }
};

// Get booking by ID
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await db.findBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking request not found' });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// Create booking request
export const createBookingRequest = async (req, res, next) => {
  try {
    const { startDateTime, endDateTime, purpose, destination } = req.body;
    if (!destination || !String(destination).trim()) {
      return res.status(400).json({ error: 'Destination is required' });
    }
    if (!purpose || !String(purpose).trim()) {
      return res.status(400).json({ error: 'Purpose of trip is required' });
    }
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Start and end date/time are required' });
    }
    const now = new Date();
    if (startDateTime) {
      const start = new Date(startDateTime);
      if (start < now) {
        return res.status(400).json({ error: 'Start date/time cannot be in the past' });
      }
    }
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      if (end <= start) {
        return res.status(400).json({ error: 'End date/time must be after start date/time' });
      }
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const maxStart = new Date(startOfToday);
      maxStart.setDate(maxStart.getDate() + 14);
      maxStart.setHours(23, 59, 59, 999);
      if (start > maxStart) {
        return res.status(400).json({
          error: 'Trip start must be within the next 14 days from today',
        });
      }
    }
    const userId = req.body.userId || req.user?.id;
    let clientName = null;
    if (userId) {
      const u = await db.findUser({ id: String(userId) });
      if (u) {
        const n = (u.name && String(u.name).trim()) || '';
        clientName = n || (u.email && String(u.email).trim()) || (u.username && String(u.username).trim()) || null;
      }
    }
    // Only pass schema-valid fields to createBooking
    const booking = await db.createBooking({
      userId,
      purpose: req.body.purpose,
      destination: req.body.destination,
      origin: req.body.origin,
      startDate: startDateTime,
      endDate: endDateTime,
      passengers: req.body.passengers || req.body.numberOfPassengers || 1,
      additionalNotes: req.body.additionalNotes || req.body.notes,
      status: req.body.status || 'Pending'
    });
    const fromLabel = clientName ? ` from ${clientName}` : '';
    await db.createNotification({
      type: 'new_booking',
      title: 'New Booking Request',
      message: `New vehicle booking request ${booking.requestId || booking.id}${fromLabel} submitted — awaiting HOD approval.`,
      recipientRole: 'hod'
    });
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// Update booking status (HOD approves first, then Admin approves with vehicle/driver)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, driverId, vehicleIds, hodApprovalNote, hodSignature, vehicleChangeReason, rejectionReason } = req.body;
    const userRole = req.user?.role || (req.user?.username === 'masai' ? 'admin' : null);

    if (!['Approved', 'Rejected', 'Cancelled', 'Pending', 'HODApproved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await db.findBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // HOD can only: Pending -> HODApproved or Rejected
    if (userRole === 'hod') {
      if (booking.status !== 'Pending') {
        return res.status(403).json({ error: 'Only pending requests can be processed by HOD' });
      }
      if (!['HODApproved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'HOD can only approve (forward) or reject' });
      }
    }

    // Admin can only: HODApproved -> Approved (with vehicle/driver) or Rejected
    if (userRole === 'admin' || req.user?.username === 'masai') {
      if (status === 'Approved' && booking.status !== 'HODApproved') {
        return res.status(403).json({ error: 'Only HOD-approved requests can be finally approved by Admin' });
      }
    }

    const updates = { status };
    if (status === 'Rejected' && rejectionReason != null) {
      updates.rejectionReason = String(rejectionReason || '').trim();
    }
    if (status === 'HODApproved' && userRole === 'hod') {
      // Store HOD note in additionalNotes since schema has no hodApprovalNote field
      if (hodApprovalNote || hodSignature) {
        updates.additionalNotes = `HOD Note: ${hodApprovalNote || hodSignature}`;
      }
      updates.approvedBy = req.user?.id ? Number(req.user.id) : undefined;
      updates.approvedAt = new Date().toISOString();
    }
    if (status === 'Approved') {
      if (userRole === 'admin' || req.user?.username === 'masai') {
        updates.approvedBy = req.user?.id ? Number(req.user.id) : undefined;
        updates.approvedAt = new Date().toISOString();
      }
      if (driverId) updates.driverId = driverId;

      const vIds = vehicleIds && Array.isArray(vehicleIds) ? vehicleIds : (booking.vehicleId ? [booking.vehicleId] : []);
      const existingVehicleId = booking.vehicleId;
      const adminChangedVehicle = vIds.length && existingVehicleId && String(vIds[0]) !== String(existingVehicleId);

      if (adminChangedVehicle && !(vehicleChangeReason && String(vehicleChangeReason).trim())) {
        return res.status(400).json({ error: 'Reason required when changing the vehicle from the client\'s request' });
      }
      if (vIds[0]) updates.vehicleId = Number(vIds[0]);
    }

    const updated = await db.updateBooking(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Booking not found' });

    // Notify client when booking is rejected
    if (status === 'Rejected' && booking.userId) {
      const reasonText = updates.rejectionReason ? ` Reason: ${updates.rejectionReason}` : '';
      await db.createNotification({
        type: 'booking_rejected',
        userId: booking.userId,
        title: 'Booking Request Rejected',
        message: `Your booking request ${booking.requestId || booking.id} has been rejected.${reasonText}`,
        recipientRole: 'client'
      });
    }

    // Notify client when HOD approves
    if (status === 'HODApproved' && booking.userId) {
      await db.createNotification({
        type: 'booking_hod_approved',
        userId: booking.userId,
        title: 'HOD Approved — Awaiting Admin Assignment',
        message: `Your booking ${booking.requestId || booking.id} has been approved by HOD. Admin will assign a driver and vehicle shortly.`,
        recipientRole: 'client'
      });
      await db.createNotification({
        type: 'booking_for_admin',
        title: 'New Request for Approval',
        message: `HOD has approved booking ${booking.requestId || booking.id} - awaiting your approval and vehicle/driver assignment.`,
        recipientRole: 'admin'
      });
    }

    // Auto-create trip when Admin approves
    if (status === 'Approved') {
      const finalVehicleId = updates.vehicleId || updated.vehicleId;
      const driverIdFinal = updates.driverId || updated.driverId;
      if (finalVehicleId && driverIdFinal) {
        const existingTrips = await db.findAllTrips();
        const alreadyHasTrip = existingTrips.some(
          t => String(t.bookingId) === String(updated.id) && t.status !== 'Completed' && t.status !== 'Cancelled'
        );
        let tripCreatedThisRequest = null;
        if (!alreadyHasTrip) {
          const draft = await db.getAssignmentDraft(updated.id);
          if (draft) await db.deleteAssignmentDraft(updated.id);

          tripCreatedThisRequest = await db.createTrip({
            bookingId: updated.id,
            vehicleId: finalVehicleId,
            driverId: driverIdFinal,
            origin: 'UCU Main Campus',
            destination: updated.destination || 'Kampala City Centre',
            scheduledDeparture: updated.startDate,
            scheduledArrival: updated.endDate,
            status: 'Pending',
          });

          const trip = tripCreatedThisRequest;
          let distanceKm = 0;
          let durationMinutes = 0;
          let geometry = [];

          try {
            const calculated = draft?.geometry?.length
              ? { distanceKm: draft.distanceKm || 0, durationMinutes: draft.durationMinutes || 0, geometry: draft.geometry }
              : await calculateRoute('Uganda Christian University Main Campus', updated.destination || 'Kampala City Centre', '');
            distanceKm = calculated.distanceKm;
            durationMinutes = calculated.durationMinutes;
            geometry = calculated.geometry || [];
          } catch (routeErr) {
            console.warn('Route calculation failed, using placeholder:', routeErr.message);
            distanceKm = 25;
            durationMinutes = 45;
            geometry = Array.from({ length: 11 }, (_, i) => [
              0.3569 + (0.3476 - 0.3569) * i / 10,
              32.7521 + (32.5825 - 32.7521) * i / 10
            ]);
          }

          if (!geometry || geometry.length < 2) {
            geometry = Array.from({ length: 11 }, (_, i) => [
              0.3569 + (0.3476 - 0.3569) * i / 10,
              32.7521 + (32.5825 - 32.7521) * i / 10
            ]);
          }

          // Create route using schema-valid fields only
          await db.createRoute({
            origin: 'UCU Main Campus',
            destination: updated.destination,
            vehicleId: finalVehicleId,
            driverId: driverIdFinal,
            estimatedDistance: distanceKm,
            estimatedTime: durationMinutes,
            optimizedPath: JSON.stringify(geometry),
            status: 'Scheduled'
          });

          const vehicle = await db.findVehicleById(finalVehicleId);
          const fuelEst = calcFuelEstimate({
            distanceKm,
            durationMin: durationMinutes,
            vehicle,
            pricePerLiter: 5500,
            reservePercent: 10
          });

          const fuelMsg = (fuelEst.litres != null && fuelEst.cost != null)
            ? ` Fuel: ~${fuelEst.litres} L (UGX ${Number(fuelEst.cost).toLocaleString()}).`
            : '';

          await db.createNotification({
            type: 'trip_assigned',
            driverId: driverIdFinal,
            title: 'New Trip Assigned',
            message: `Trip to ${updated.destination}. ${distanceKm} km, ~${durationMinutes} min.${fuelMsg} Vehicle & route in your dashboard.`,
            recipientRole: 'driver'
          });
        }

        if (updated.userId) {
          const driver = await db.findDriverById(driverIdFinal);
          const vehicle = await db.findVehicleById(finalVehicleId);
          const driverName = driver ? driver.name : 'Driver';
          const driverPhone = driver?.phone || '—';
          const vehiclePlate = vehicle?.plateNumber || '—';
          const existingTrip = existingTrips?.find(t => String(t.bookingId) === String(updated.id));
          await db.createNotification({
            type: 'booking_confirmed',
            userId: updated.userId,
            title: 'Driver Assigned — Booking Confirmed',
            message: `Your booking ${updated.requestId || updated.id} has been confirmed. Driver: ${driverName}. Vehicle: ${vehiclePlate}. Contact driver: ${driverPhone}`,
            recipientRole: 'client'
          });
        }
      }
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Approve booking
export const approveBooking = async (req, res, next) => {
  try {
    const booking = await db.updateBooking(req.params.id, { status: 'Approved' });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

// Reject booking
export const rejectBooking = async (req, res, next) => {
  try {
    const booking = await db.updateBooking(req.params.id, { status: 'Rejected' });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
};
