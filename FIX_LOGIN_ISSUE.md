# 🔧 Fix Login Issue - Step by Step Guide

The "Failed to fetch" error means your frontend can't connect to the backend. Follow these steps:

## ✅ Step 1: Install Backend Dependencies

Open a terminal in the **backend** directory:

```powershell
cd backend
npm install
```

Wait for all packages to install (this may take 1-2 minutes).

## ✅ Step 2: Create Backend Environment File

Create a file named `.env` in the `backend` folder with this content:

**File location**: `backend/.env`

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ucu_fleet_management
DB_PORT=3306

PORT=5000
NODE_ENV=development

JWT_SECRET=ucu-fleet-management-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

**Important**: 
- If your MySQL has a password, replace the empty `DB_PASSWORD=` with `DB_PASSWORD=your_password`
- If MySQL is on a different port, update `DB_PORT`

## ✅ Step 3: Make Sure MySQL is Running

### Windows:
1. Press `Windows Key + R`
2. Type `services.msc` and press Enter
3. Find "MySQL80" or "MySQL" in the list
4. Right-click and select "Start" if it's not running

### Or check in Command Prompt:
```bash
mysql --version
```

If this shows a version, MySQL is installed. Start it from Services if not running.

## ✅ Step 4: Initialize Database

In the backend directory, run:

```powershell
npm run init-db
```

This will:
- Create the `ucu_fleet_management` database
- Create all tables
- Add default admin user (masai/masai123)

**Wait for "Database initialized successfully!" message**

## ✅ Step 5: Start Backend Server

Keep the terminal in the backend directory and run:

```powershell
npm run dev
```

**You should see**:
```
🚀 Server running on port 5000
📊 Health check: http://localhost:5000/health
🔗 API Base URL: http://localhost:5000/api
```

**Keep this terminal open!** The backend needs to keep running.

## ✅ Step 6: Create Frontend Environment File

Open a **NEW terminal** and go to the **root** directory (not backend):

```powershell
cd ..
```

Create a file named `.env` in the root folder:

**File location**: `.env` (in the root directory, same level as package.json)

```
VITE_API_URL=http://localhost:5000/api
```

## ✅ Step 7: Restart Frontend Development Server

If your frontend is running, **stop it** (Ctrl+C) and start again:

```powershell
npm run dev
```

**Important**: 
- Frontend should run on `http://localhost:3000`
- Backend should run on `http://localhost:5000`
- Both must be running at the same time!

## ✅ Step 8: Test the Login

1. Open browser: `http://localhost:3000`
2. Login with:
   - **Username**: `masai`
   - **Password**: `masai123`

The login should work now! ✅

## 🔍 Troubleshooting

### Still Getting "Failed to fetch"?

**Check 1: Is backend running?**
- Open browser: `http://localhost:5000/health`
- Should show: `{"status":"OK","message":"UCU Fleet Management API is running"}`
- If not, backend isn't running - go back to Step 5

**Check 2: Check backend terminal for errors**
- Look for red error messages
- Common issue: MySQL connection failed
  - Fix: Check MySQL is running and password in `.env` is correct

**Check 3: Check browser console**
- Press F12 → Console tab
- Look for error messages
- Should see API calls to `http://localhost:5000/api/auth/login`

**Check 4: Port conflicts**
- Make sure nothing else is using port 5000
- Change PORT in `backend/.env` if needed
- Update `VITE_API_URL` in frontend `.env` accordingly

### MySQL Connection Error?

If you see "Access denied" or "Can't connect to MySQL":

1. **Check MySQL password**:
   ```bash
   mysql -u root -p
   ```
   If this works, use the same password in `backend/.env`

2. **If no password works**, try:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   ```
   Then set `DB_PASSWORD=` (empty) in `.env`

3. **Reset MySQL root password** if needed (Google search for your MySQL version)

### Database Already Exists Error?

If you see "database already exists":
- This is fine! Just continue to Step 5
- Or delete and recreate:
  ```sql
  DROP DATABASE ucu_fleet_management;
  ```
  Then run `npm run init-db` again

## 📋 Quick Checklist

Before trying to login, make sure:

- [ ] Backend dependencies installed (`npm install` in backend)
- [ ] `backend/.env` file created with correct MySQL settings
- [ ] MySQL service is running
- [ ] Database initialized (`npm run init-db`)
- [ ] Backend server is running (`npm run dev` in backend) - **Port 5000**
- [ ] Frontend `.env` file created with `VITE_API_URL=http://localhost:5000/api`
- [ ] Frontend server is running (`npm run dev` in root) - **Port 3000**
- [ ] Both terminals are open and running

## 🎯 Quick Test Commands

**Test backend health** (in browser):
```
http://localhost:5000/health
```

**Test backend login** (in new terminal):
```powershell
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{\"username\":\"masai\",\"password\":\"masai123\"}'
```

If this returns a token, backend is working! ✅

## 💡 Pro Tip

Keep **two terminals open**:
1. **Terminal 1**: Backend (`cd backend && npm run dev`)
2. **Terminal 2**: Frontend (`npm run dev` in root)

Both must stay running while you use the application!

---

## ✅ Once Everything Works

You should see:
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3000
- ✅ Login works with masai/masai123
- ✅ Dashboard loads successfully

If you still have issues, check the error messages in:
- Backend terminal (for server errors)
- Browser console (F12) (for frontend errors)

Good luck! 🚀














