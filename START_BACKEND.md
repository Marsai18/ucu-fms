# 🚀 Start Backend Server - Quick Guide

## Step-by-Step Instructions

### 1. Open Terminal/Command Prompt

### 2. Navigate to Backend Directory

```powershell
cd backend
```

### 3. Check if MySQL is Running

**Windows:**
- Press `Windows + R`
- Type `services.msc` and press Enter
- Look for "MySQL80" or "MySQL" 
- If it's not running, right-click and select "Start"

### 4. Initialize Database (First Time Only)

```powershell
npm run init-db
```

**Wait for**: "Database initialized successfully!" and "Default admin user created"

### 5. Start Backend Server

```powershell
npm run dev
```

**You should see**:
```
🚀 Server running on port 5000
📊 Health check: http://localhost:5000/health
🔗 API Base URL: http://localhost:5000/api
```

### 6. Keep This Terminal Open!

**Important**: The backend must keep running. Don't close this terminal.

### 7. Test Backend (Optional)

Open a browser and go to: `http://localhost:5000/health`

Should show: `{"status":"OK","message":"UCU Fleet Management API is running"}`

---

## ✅ Once Backend is Running

1. **Open a NEW terminal** for the frontend
2. Go to the **root directory** (not backend):
   ```powershell
   cd ..
   ```
3. Start frontend:
   ```powershell
   npm run dev
   ```
4. **Login should work now!**

---

## ❌ Troubleshooting

### "Cannot connect to MySQL"

**Fix**: 
1. Make sure MySQL service is running (check Services)
2. Edit `backend/.env` and add your MySQL password:
   ```
   DB_PASSWORD=your_password
   ```

### "Port 5000 already in use"

**Fix**:
1. Change PORT in `backend/.env` to another port (e.g., 5001)
2. Update `VITE_API_URL` in root `.env` to match:
   ```
   VITE_API_URL=http://localhost:5001/api
   ```

### "Database doesn't exist"

**Fix**:
```powershell
npm run init-db
```

---

## 🎯 Quick Commands

```powershell
# Go to backend
cd backend

# Initialize database (first time only)
npm run init-db

# Start backend server
npm run dev

# In a NEW terminal, start frontend
cd ..
npm run dev
```

---

## 📋 Checklist

- [ ] MySQL service is running
- [ ] Backend dependencies installed (`npm install` done)
- [ ] Database initialized (`npm run init-db` done)
- [ ] Backend server running (`npm run dev` shows success message)
- [ ] Frontend .env file has `VITE_API_URL=http://localhost:5000/api`
- [ ] Frontend server running on port 3000

---

**Your backend should now be running on http://localhost:5000** ✅


