# UCU Fleet Management System - Setup Instructions

Complete setup guide for both frontend and backend.

## Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v5.7 or higher) - [Download](https://dev.mysql.com/downloads/)
- **npm** or **yarn**

## Step 1: Database Setup

1. **Install MySQL** if not already installed
2. **Start MySQL service**

### Windows:
```bash
# Start MySQL service from Services or:
net start MySQL80
```

### macOS/Linux:
```bash
sudo service mysql start
# or
brew services start mysql
```

3. **Create a database user** (optional, can use root):
```sql
CREATE USER 'fms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'fms_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 2: Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create `.env` file** in the `backend` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ucu_fleet_management
DB_PORT=3306

PORT=5000
NODE_ENV=development

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

**Important**: Replace `your_mysql_password` with your actual MySQL root password (leave empty if no password).

4. **Initialize the database**:
```bash
npm run init-db
```

This will:
- Create the `ucu_fleet_management` database
- Create all required tables
- Insert default admin user (username: `masai`, password: `masai123`)

5. **Start the backend server**:
```bash
npm run dev
```

The backend should now be running on `http://localhost:5000`

You can verify by visiting: `http://localhost:5000/health`

## Step 3: Frontend Setup

1. **Navigate to frontend directory** (root directory):
```bash
# If you're in backend directory, go back:
cd ..
```

2. **Install dependencies** (if not already done):
```bash
npm install
```

3. **Create `.env` file** in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start the frontend development server**:
```bash
npm run dev
```

The frontend should now be running on `http://localhost:3000`

## Step 4: Verify Installation

1. **Open your browser** and navigate to: `http://localhost:3000`

2. **Login with default credentials**:
   - Username: `masai`
   - Password: `masai123`

3. **You should see the admin dashboard** if everything is working correctly.

## Project Structure

```
FMS_frontend/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Database config and schema
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Auth and error handling
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utilities
│   ├── server.js           # Main server file
│   └── package.json
├── src/                     # Frontend React application
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── utils/
│   └── ...
├── package.json             # Frontend dependencies
└── vite.config.js
```

## API Endpoints

The backend API is available at: `http://localhost:5000/api`

### Main Endpoints:
- `/api/auth/login` - User authentication
- `/api/vehicles` - Vehicle management
- `/api/drivers` - Driver management
- `/api/bookings` - Booking requests
- `/api/trips` - Trip management
- `/api/fuel` - Fuel tracking
- `/api/maintenance` - Maintenance records
- `/api/routes` - Route planning
- `/api/incidents` - Incident management
- `/api/dashboard/stats` - Dashboard statistics

## Troubleshooting

### Backend Issues

1. **"Cannot connect to MySQL"**
   - Ensure MySQL service is running
   - Check database credentials in `.env`
   - Verify MySQL port (default: 3306)

2. **"Port 5000 already in use"**
   - Change PORT in `.env` to another port (e.g., 5001)
   - Update `VITE_API_URL` in frontend `.env` accordingly

3. **"Database initialization failed"**
   - Ensure MySQL user has CREATE DATABASE privileges
   - Try running the initialization command again
   - Check MySQL error logs

### Frontend Issues

1. **"Cannot connect to API"**
   - Ensure backend is running on the correct port
   - Check `VITE_API_URL` in frontend `.env`
   - Verify CORS settings in backend

2. **"Login not working"**
   - Ensure backend is running
   - Check browser console for errors
   - Verify API endpoints are accessible

3. **"Data not loading"**
   - Check browser developer tools (Network tab)
   - Verify API responses
   - Check backend logs for errors

## Default Login Credentials

- **Username**: `masai`
- **Password**: `masai123`
- **Role**: `admin`

## Development Workflow

1. **Start MySQL** service
2. **Start backend** (`cd backend && npm run dev`)
3. **Start frontend** (in root directory: `npm run dev`)
4. **Open browser** to `http://localhost:3000`

## Production Deployment

For production deployment:

1. **Backend**:
   - Set `NODE_ENV=production` in `.env`
   - Use a strong `JWT_SECRET`
   - Configure proper database credentials
   - Use a process manager like PM2

2. **Frontend**:
   - Update `VITE_API_URL` to production API URL
   - Build: `npm run build`
   - Deploy `dist/` folder to hosting service

## Support

If you encounter any issues:
1. Check the error messages in the console/terminal
2. Verify all environment variables are set correctly
3. Ensure MySQL is running and accessible
4. Check that all dependencies are installed

## Next Steps

After successful setup:
1. ✅ Login to the system
2. ✅ Explore the dashboard
3. ✅ Add vehicles, drivers, and other data
4. ✅ Test all features

Enjoy using the UCU Fleet Management System! 🚀














