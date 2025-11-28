# 🔧 Resolve "Failed to Fetch" Login Error

## ✅ Quick Fix - Do These Steps:

### Step 1: Make Sure Backend is Running

**Open a terminal in the `backend` folder** and run:

```powershell
cd backend
npm run dev
```

**Keep this terminal open!** You should see:
```
🚀 Server running on port 5000
```

### Step 2: Verify Backend is Working

Open your browser and go to: `http://localhost:5000/health`

**Should show**: `{"status":"OK","message":"UCU Fleet Management API is running"}`

If this doesn't work → **Backend is not running!** Go back to Step 1.

### Step 3: Check Frontend Configuration

Make sure you have a `.env` file in the **root directory** (same folder as `package.json`) with:

```
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Restart Frontend

If frontend is running, **stop it** (Ctrl+C) and **restart**:

```powershell
# Make sure you're in root directory (not backend)
npm run dev
```

### Step 5: Try Login Again

1. Open: `http://localhost:3000`
2. Username: `masai`
3. Password: `masai123`

---

## 🔍 Common Issues & Solutions

### Issue 1: Backend Not Running

**Symptom**: "Failed to fetch" error

**Solution**:
```powershell
cd backend
npm run dev
```

**Keep the terminal open!** The backend must keep running.

---

### Issue 2: MySQL Not Running

**Symptom**: Backend crashes or shows database connection errors

**Solution**:
1. Press `Windows + R`
2. Type `services.msc` and press Enter
3. Find "MySQL80" or "MySQL"
4. Right-click → **Start** if not running

---

### Issue 3: Database Not Initialized

**Symptom**: Backend shows "Table doesn't exist" errors

**Solution**:
```powershell
cd backend
npm run init-db
```

This creates the database and default admin user (masai/masai123).

---

### Issue 4: Wrong Port Configuration

**Symptom**: Backend won't start or frontend can't connect

**Check**:
1. `backend/.env` should have: `PORT=5000`
2. Root `.env` should have: `VITE_API_URL=http://localhost:5000/api`

---

### Issue 5: MySQL Password Issue

**Symptom**: Backend shows "Access denied" or can't connect to MySQL

**Solution**:
1. Edit `backend/.env`
2. Add your MySQL password:
   ```
   DB_PASSWORD=your_password
   ```
3. If no password, leave it empty: `DB_PASSWORD=`
4. Restart backend server

---

## 🎯 Complete Setup Checklist

Before trying to login, ensure:

- [ ] **MySQL service is running** (check Windows Services)
- [ ] **Backend dependencies installed**: `cd backend && npm install`
- [ ] **Database initialized**: `cd backend && npm run init-db`
- [ ] **Backend `.env` file exists** in `backend/` folder
- [ ] **Frontend `.env` file exists** in root folder with `VITE_API_URL=http://localhost:5000/api`
- [ ] **Backend server is running**: `cd backend && npm run dev` (Terminal 1)
- [ ] **Frontend server is running**: `npm run dev` in root (Terminal 2)
- [ ] **Backend health check works**: `http://localhost:5000/health` shows OK

---

## 📋 Quick Test Commands

### Test Backend Connection:
```powershell
# In browser or PowerShell:
# Browser: http://localhost:5000/health
# Should return: {"status":"OK","message":"..."}

# Or in PowerShell:
curl http://localhost:5000/health
```

### Test Login API:
```powershell
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{\"username\":\"masai\",\"password\":\"masai123\"}'
```

If this returns a token, backend is working! ✅

---

## 🚀 Easy Startup Script

### Option 1: Use PowerShell Script

In `backend` folder, run:
```powershell
.\start-server.ps1
```

### Option 2: Manual Steps

**Terminal 1 (Backend)**:
```powershell
cd backend
npm run dev
```

**Terminal 2 (Frontend)**:
```powershell
# In root directory
npm run dev
```

---

## ✅ Once Everything Works

You should see:
- ✅ Backend terminal shows "Server running on port 5000"
- ✅ `http://localhost:5000/health` returns OK
- ✅ Frontend runs on `http://localhost:3000`
- ✅ Login works with masai/masai123
- ✅ No "Failed to fetch" error

---

## 💡 Pro Tips

1. **Keep two terminals open**: One for backend, one for frontend
2. **Check browser console** (F12) for detailed error messages
3. **Check backend terminal** for server errors
4. **Verify both servers are running** before trying to login

---

## 🆘 Still Having Issues?

1. **Check browser console** (F12 → Console tab)
2. **Check backend terminal** for error messages
3. **Verify MySQL is running**
4. **Restart both servers**
5. **Check `.env` files** are correct

**The most common issue**: Backend server is not running! Make sure `npm run dev` is running in the backend folder.

---

**Follow these steps and your login should work!** 🎉


