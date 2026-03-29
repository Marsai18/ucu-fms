import './src/config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

// Prevent process crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Routes
import { checkAndCreateMaintenanceNotifications } from './src/controllers/maintenanceController.js';
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
import driverPortalRoutes from './src/routes/driver.js';
import notificationRoutes from './src/routes/notifications.js';
import userRoutes from './src/routes/users.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = new Set(
  [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean)
);

/** Vite may use 3001+ when the default port is taken; allow any local HTTP origin in non-production. */
function isLocalHttpOrigin(origin) {
  try {
    const u = new URL(origin);
    return (
      u.protocol === 'http:' &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
}

const isProd = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowedOrigins.has(origin)) {
        cb(null, origin);
        return;
      }
      if (!isProd && isLocalHttpOrigin(origin)) {
        cb(null, origin);
        return;
      }
      cb(null, false);
    },
    credentials: true,
  })
);
app.use(compression());
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
app.use('/api/driver', driverPortalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);

  // Run maintenance alert check on startup
  checkAndCreateMaintenanceNotifications().catch(() => {});

  // Timely reminders: check maintenance due dates every 6 hours
  const MAINTENANCE_CHECK_MS = 6 * 60 * 60 * 1000;
  setInterval(() => {
    checkAndCreateMaintenanceNotifications().catch(() => {});
  }, MAINTENANCE_CHECK_MS);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n❌ Port ${PORT} is already in use (another API instance or app is running).\n` +
        `   Stop the other process, or set PORT=5001 in fleet_backend/.env (and VITE_API_URL=http://localhost:5001/api in root .env).\n`
    );
    process.exit(1);
  }
  throw err;
});


