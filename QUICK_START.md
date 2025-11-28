# Quick Start Guide - UCU Fleet Management System

Get up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js installed (v16+)
- [ ] MySQL installed and running
- [ ] npm installed

## Quick Setup (5 Steps)

### 1. Database Setup (1 minute)

Make sure MySQL is running, then navigate to backend:
```bash
cd backend
```

### 2. Backend Setup (2 minutes)

**Install dependencies:**
```bash
npm install
```

**Create `.env` file** in `backend/` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ucu_fleet_management
DB_PORT=3306
PORT=5000
NODE_ENV=development
JWT_SECRET=ucu-fleet-management-secret-key-2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

**Initialize database:**
```bash
npm run init-db
```

**Start backend:**
```bash
npm run dev
```

✅ Backend should be running on `http://localhost:5000`

### 3. Frontend Setup (1 minute)

**Open a new terminal** and go to project root:
```bash
cd ..
```

**Create `.env` file** in root directory:
```env
VITE_API_URL=http://localhost:5000/api
```

**Start frontend:**
```bash
npm run dev
```

✅ Frontend should be running on `http://localhost:3000`

### 4. Login (30 seconds)

1. Open browser: `http://localhost:3000`
2. Login with:
   - Username: `masai`
   - Password: `masai123`

### 5. Verify Everything Works

- [ ] Login successful
- [ ] Dashboard loads
- [ ] Can navigate between pages
- [ ] No errors in browser console

## That's It! 🎉

You're all set! The system is ready to use.

## Need Help?

See `SETUP_INSTRUCTIONS.md` for detailed troubleshooting.

## Default Credentials

- **Username**: `masai`
- **Password**: `masai123`
- **Role**: `admin`

## Ports Used

- **Frontend**: `3000` (http://localhost:3000)
- **Backend**: `5000` (http://localhost:5000)
- **MySQL**: `3306` (localhost:3306)

## Common Commands

**Backend:**
```bash
cd backend
npm run dev          # Start development server
npm run init-db      # Initialize/reset database
npm start            # Start production server
```

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Next Steps

1. ✅ Explore the dashboard
2. ✅ Add your first vehicle
3. ✅ Register drivers
4. ✅ Create booking requests
5. ✅ Start managing your fleet!

Happy Fleet Managing! 🚗💨














