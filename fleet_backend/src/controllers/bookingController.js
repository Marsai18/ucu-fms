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
    const waypoints = booking.waypoints || '';
    let routeData = { distanceKm: 0, durationMinutes: 0, geometry: [], origin, destination };
    try {
      const calculated = await calculateRoute(origin, destination, waypoints);
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

// Route preview for a booking (admin) - calculates distance, duration, geometry from booking destination/waypoints
export const getRoutePreview = async (req, res, next) => {
  try {
    const booking = await db.findBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'HODApproved' && booking.status !== 'Pending') {
      return res.status(400).json({ error: 'Route preview only for HOD-approved or pending bookings' });
    }
    const origin = 'Uganda Christian University Main Campus';
    const destination = booking.destination || 'Kampala City Centre';
    const waypoints = booking.waypoints || '';
    const calculated = await calculateRoute(origin, destination, waypoints);
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
    if (startDateTime) {
      const start = new Date(startDateTime);
      const now = new Date();
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
    }
    const booking = await db.createBooking({
      ...req.body,
      userId: req.body.userId || req.user?.id,
      status: req.body.status || 'Pending'
    });
    await db.createNotification({
      type: 'new_booking',
      title: 'New Booking Request',
      message: `New vehicle booking request ${booking.request_id || booking.id} submitted - awaiting HOD approval.`,
      bookingId: booking.id,
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
      updates.hodApprovedBy = req.user?.name || req.user?.username || 'HOD';
      updates.hodApprovedAt = new Date().toISOString();
      if (hodApprovalNote || hodSignature) {
        updates.hodApprovalNote = hodApprovalNote || hodSignature;
      }
    }
    if (status === 'Approved') {
      if (driverId) updates.driverId = driverId;
      const vIds = vehicleIds && Array.isArray(vehicleIds) ? vehicleIds : (booking.vehicleId ? [booking.vehicleId] : []);
      const clientPreferredIds = booking.vehicleIds?.length ? booking.vehicleIds : (booking.vehicleId ? [String(booking.vehicleId)] : []);
      const adminChangedVehicle = vIds.length && clientPreferredIds.length &&
        (vIds[0] !== clientPreferredIds[0] || !clientPreferredIds.includes(vIds[0]));
      if (adminChangedVehicle && !(vehicleChangeReason && String(vehicleChangeReason).trim())) {
        return res.status(400).json({ error: 'Reason required when changing the vehicle from the client\'s request' });
      }
      if (adminChangedVehicle) {
        updates.originalVehicleId = booking.vehicleId || clientPreferredIds[0];
        updates.vehicleChangeReason = String(vehicleChangeReason || '').trim();
      }
      if (vIds.length) updates.vehicleIds = vIds;
      if (vIds[0]) updates.vehicleId = vIds[0];
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
        message: `Your booking request ${booking.request_id || booking.id} has been rejected.${reasonText}`,
        bookingId: booking.id,
        recipientRole: 'client'
      });
    }

    // Notify client when HOD approves - client-only, driver must NOT see this
    if (status === 'HODApproved' && booking.userId) {
      await db.createNotification({
        type: 'booking_hod_approved',
        userId: booking.userId,
        title: 'HOD Approved — Awaiting Admin Assignment',
        message: `Your booking ${booking.request_id || booking.id} has been approved by HOD. Admin will assign a driver and vehicle shortly.`,
        bookingId: booking.id,
        recipientRole: 'client'
      });
      await db.createNotification({
        type: 'booking_for_admin',
        title: 'New Request for Approval',
        message: `HOD has approved booking ${booking.request_id || booking.id} - awaiting your approval and vehicle/driver assignment.`,
        bookingId: booking.id,
        recipientRole: 'admin'
      });
    }

    // Auto-create trip when Admin approves - support multiple vehicles per trip
    if (status === 'Approved') {
      const vIds = updated.vehicleIds || (updated.vehicleId ? [updated.vehicleId] : []);
      const driverIdFinal = updates.driverId || updated.driverId;
      if (vIds.length && driverIdFinal) {
        const existingTrips = await db.findAllTrips();
        const alreadyHasTrip = existingTrips.some(
          t => String(t.bookingId) === String(updated.id) && t.status !== 'Completed' && t.status !== 'Cancelled'
        );
        if (!alreadyHasTrip) {
          // Use draft if available (route from when driver was assigned)
          const draft = await db.getAssignmentDraft(updated.id);
          if (draft) await db.deleteAssignmentDraft(updated.id);
          const trip = await db.createTrip({
            bookingId: updated.id,
            vehicleId: vIds[0],
            vehicleIds: vIds,
            driverId: driverIdFinal,
            origin: 'UCU Main Campus',
            destination: updated.destination || 'Kampala City Centre',
            purpose: updated.purpose || null,
            waypoints: updated.waypoints || null,
            scheduledDeparture: updated.startDateTime,
            scheduledArrival: updated.endDateTime,
            status: 'Pending',
            driverResponse: 'pending',
            tripCode: `TR${String(Date.now()).slice(-6)}`
          });
          let routeData = {
            origin: 'UCU Main Campus',
            destination: updated.destination,
            driverId: driverIdFinal,
            preferredVehicle: vIds[0],
            tripId: trip.id,
            distance: 0,
            duration: 0,
            status: 'Saved'
          };
          try {
            const calculated = draft?.geometry?.length
              ? { distanceKm: draft.distanceKm || 0, durationMinutes: draft.durationMinutes || 0, geometry: draft.geometry }
              : await calculateRoute('Uganda Christian University Main Campus', updated.destination, updated.waypoints || '');
            routeData = {
              ...routeData,
              distance: calculated.distanceKm,
              duration: calculated.durationMinutes,
              geometry: calculated.geometry,
              waypoints: updated.waypoints || ''
            };
            const vehicle = await db.findVehicleById(vIds[0]);
            const fuelEst = calcFuelEstimate({
              distanceKm: calculated.distanceKm,
              durationMin: calculated.durationMinutes,
              vehicle,
              pricePerLiter: 5500,
              reservePercent: 10
            });
            await db.updateTrip(trip.id, {
              routeDistance: calculated.distanceKm,
              routeDuration: calculated.durationMinutes,
              routeGeometry: calculated.geometry,
              fuelEstimateLitres: fuelEst.litres,
              fuelEstimateCost: fuelEst.cost
            });
          } catch (routeErr) {
            console.warn('Route calculation failed, using placeholder:', routeErr.message);
          }
          if (!routeData.geometry || routeData.geometry.length < 2) {
            const originCoords = [0.3569, 32.7521];
            const destCoords = [0.3476, 32.5825];
            routeData.geometry = Array.from({ length: 11 }, (_, i) => [
              originCoords[0] + (destCoords[0] - originCoords[0]) * i / 10,
              originCoords[1] + (destCoords[1] - originCoords[1]) * i / 10
            ]);
            const vehicle = await db.findVehicleById(vIds[0]);
            const fuelEst = calcFuelEstimate({
              distanceKm: routeData.distance || 25,
              durationMin: routeData.duration || 45,
              vehicle,
              pricePerLiter: 5500,
              reservePercent: 10
            });
            await db.updateTrip(trip.id, {
              routeGeometry: routeData.geometry,
              routeDistance: routeData.distance || 25,
              routeDuration: routeData.duration || 45,
              fuelEstimateLitres: fuelEst.litres,
              fuelEstimateCost: fuelEst.cost
            });
          }
          await db.createRoute(routeData);
          const tripUpdated = await db.findTripById(trip.id);
          const fuelLitres = tripUpdated?.fuelEstimateLitres;
          const fuelCost = tripUpdated?.fuelEstimateCost;
          const fuelMsg = (fuelLitres != null && fuelCost != null)
            ? ` Fuel: ~${fuelLitres} L (UGX ${fuelCost?.toLocaleString()}).`
            : '';
          await db.createNotification({
            type: 'trip_assigned',
            driverId: driverIdFinal,
            title: 'New Trip Assigned',
            message: `Trip to ${updated.destination}. ${routeData.distance} km, ~${routeData.duration} min.${fuelMsg} Vehicle & route in your dashboard.`,
            tripId: trip.id,
            bookingId: updated.id,
            recipientRole: 'driver'
          });
        }
        if (updated.userId) {
          const driver = await db.findDriverById(driverIdFinal);
          const vehicles = await db.findAllVehicles();
          const vehicleList = (vIds || []).map(vid => vehicles.find(v => String(v.id) === String(vid))).filter(Boolean);
          const driverName = driver ? (driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email) : 'Driver';
          const driverPhone = driver?.phone || driver?.contactNumber || '—';
          const vehiclePlates = vehicleList.map(v => v.plateNumber).filter(Boolean).join(', ') || '—';
          const vehicleDetails = vehicleList.length ? vehicleList.map(v => `${v.plateNumber} • ${v.make} ${v.model}`).join('; ') : '—';
          const existingTrip = existingTrips.find(t => String(t.bookingId) === String(updated.id));
          await db.createNotification({
            type: 'booking_confirmed',
            userId: updated.userId,
            title: 'Driver Assigned — Booking Confirmed',
            message: `Your booking ${updated.request_id || updated.id} has been confirmed. Driver: ${driverName}. Vehicle(s): ${vehiclePlates}. Contact driver: ${driverPhone}`,
            bookingId: updated.id,
            recipientRole: 'client',
            driverName,
            driverPhone,
            driverEmail: driver?.email || null,
            vehiclePlate: vehiclePlates,
            vehicleDetails,
            tripId: trip?.id || existingTrip?.id || null
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
