# 🚀 Start UCU Fleet Management System

## ⚡ Quick Start (One Command)

**Run this PowerShell script from the root directory:**

```powershell
.\START_APPLICATION.ps1
```

This will:
- ✅ Check and install all dependencies
- ✅ Create configuration files
- ✅ Test MySQL connection
- ✅ Initialize database (if MySQL is configured)
- ✅ Start backend server (port 5000)
- ✅ Start frontend server (port 3000)

---

## 📋 Manual Start (Step by Step)

If the script doesn't work, follow these steps:

### Step 1: Check MySQL is Running

Press `Windows + R`, type `services.msc`, find "MySQL80" or "MySQL", make sure it's **Running**.

### Step 2: Configure MySQL Password

**Edit `backend/.env` file** and add your MySQL password:

```
DB_PASSWORD=your_mysql_password_here
```

If you don't have a password, leave it empty: `DB_PASSWORD=`

### Step 3: Initialize Database

```powershell
cd backend
npm run fix-db
```

Wait for: `✅ Database setup complete!`

### Step 4: Start Backend (Terminal 1)

```powershell
cd backend
npm run dev
```

Should show: `🚀 Server running on port 5000`

### Step 5: Start Frontend (Terminal 2 - NEW)

```powershell
# In root directory (not backend)
npm run dev
```

Should show frontend running on port 3000.

### Step 6: Login

1. Open browser: `http://localhost:3000`
2. Login with:
   - **Username**: `masai`
   - **Password**: `masai123`

---

## ❌ Troubleshooting

### "Cannot connect to server" Error

**Problem**: Backend not running

**Fix**:
1. Make sure backend terminal shows "Server running on port 5000"
2. Test: `http://localhost:5000/health` should work
3. If not, check for errors in backend terminal

---

### "Access denied" / MySQL Errors

**Problem**: MySQL password incorrect

**Fix**:
1. Edit `backend/.env`
2. Add your MySQL password: `DB_PASSWORD=your_password`
3. Restart backend server

---

### "Failed to fetch" Error

**Problem**: Backend not running or wrong URL

**Fix**:
1. Check `backend/.env` has correct settings
2. Check root `.env` has: `VITE_API_URL=http://localhost:5000/api`
3. Restart both servers

---

## ✅ Verify Everything is Working

1. **Backend Health Check**:
   - Open: `http://localhost:5000/health`
   - Should show: `{"status":"OK","message":"..."}`

2. **Frontend**:
   - Open: `http://localhost:3000`
   - Should show login page

3. **Login**:
   - Username: `masai`
   - Password: `masai123`
   - Should redirect to dashboard

---

## 📖 Default Credentials

- **Username**: `masai`
- **Password**: `masai123`
- **Role**: `admin`

---

## 🎯 Ports

- **Frontend**: `3000` (http://localhost:3000)
- **Backend**: `5000` (http://localhost:5000)
- **MySQL**: `3306` (localhost:3306)

---

## 💡 Pro Tip

Keep **two terminals** open:
1. **Terminal 1**: Backend (`cd backend && npm run dev`)
2. **Terminal 2**: Frontend (`npm run dev` in root)

Both must stay running while you use the application!

---

**Run `.\START_APPLICATION.ps1` to get started!** 🚀


