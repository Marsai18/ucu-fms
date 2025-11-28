import db from '../utils/db.js';

// Get all booking requests
export const getBookingRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const bookings = await db.findAllBookings({ status });
    res.json(bookings);
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
    const booking = await db.createBooking({
      ...req.body,
      userId: req.body.userId || req.user?.id
    });
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// Update booking status (approve/reject)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['Approved', 'Rejected', 'Cancelled', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await db.updateBooking(req.params.id, { status });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
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
