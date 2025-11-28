# ⚡ Quick Fix - Common PowerShell Errors

## 🔴 Error 1: "Script execution is disabled"

**Quick Fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Type `Y` when prompted.

---

## 🔴 Error 2: "Access denied for user 'root'@'localhost'"

**Quick Fix:**

1. Edit `backend\.env` file
2. Find: `DB_PASSWORD=`
3. Add your password: `DB_PASSWORD=your_mysql_password`
4. Save file
5. Run: `cd backend && npm run fix-db`

---

## 🔴 Error 3: "Port 5000 already in use"

**Quick Fix:**

Find and kill the process:
```powershell
netstat -ano | findstr :5000
taskkill /PID <number> /F
```

Or use different port:
- Edit `backend\.env`: Change `PORT=5000` to `PORT=5001`
- Edit root `.env`: Change URL to `http://localhost:5001/api`

---

## 🔴 Error 4: "Cannot find module"

**Quick Fix:**

```powershell
cd backend
npm install
cd ..
npm install
```

---

## 🔴 Error 5: "Cannot find path"

**Quick Fix:**

Make sure you're in the right directory:
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
```

Then try again.

---

## 🔴 Error 6: "Permission denied"

**Quick Fix:**

1. Close PowerShell
2. Right-click PowerShell → "Run as Administrator"
3. Navigate to project and try again

---

## 🔴 Error 7: MySQL not running

**Quick Fix:**

1. Press `Windows + R`
2. Type `services.msc`
3. Find "MySQL80" or "MySQL"
4. Right-click → **Start**

---

## 🔴 Error 8: "Failed to fetch" in browser

**Quick Fix:**

1. Make sure backend is running on port 5000
2. Check: `http://localhost:5000/health`
3. If not working, check backend terminal for errors
4. Verify `root\.env` has: `VITE_API_URL=http://localhost:5000/api`

---

## 🆘 Still Not Working?

1. **Close all PowerShell windows**
2. **Kill all Node processes:**
   ```powershell
   Get-Process node | Stop-Process -Force
   ```
3. **Start fresh:**
   ```powershell
   cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
   .\START_APP.ps1
   ```

---

**For detailed instructions, see: FIX_POWERSHELL_ERRORS.md**


