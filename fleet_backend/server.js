import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

// Routes
import authRoutes from './src/routes/auth.js';
import vehicleRoutes from './src/routes/vehicles.js';
import driverRoutes from './src/routes/drivers.js';
import bookingRoutes from './src/routes/bookings.js';
import tripRoutes from './src/routes/trips.js';
import fuelRoutes from './src/routes/fuel.js';
import maintenanceRoutes from './src/routes/maintenance.js';
import routeRoutes from './src/routes/routes.js';
import incidentRoutes from './src/routes/incidents.js';
import dashboardRoutes from './src/routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'UCU Fleet Management API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});


