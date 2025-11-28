# 📋 Step-by-Step: Fix PowerShell Errors

Follow these steps exactly to fix any PowerShell errors.

---

## 🎯 Step 1: Fix Script Execution Policy (Most Common)

### If you see: "Script execution is disabled" or "cannot be loaded"

**Step 1.1: Open PowerShell as Administrator**
- Press `Windows Key + X`
- Click "Windows PowerShell (Admin)" or "Terminal (Admin)"
- Click "Yes" if prompted

**Step 1.2: Check current policy**
Type this command and press Enter:
```powershell
Get-ExecutionPolicy
```

**Step 1.3: Set the policy**
Type this command and press Enter:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Step 1.4: Confirm**
- When prompted, type `Y` and press Enter
- Should see: "Execution policy change was successful"

**Step 1.5: Verify**
Type this and press Enter:
```powershell
Get-ExecutionPolicy
```
Should now show: `RemoteSigned`

**Step 1.6: Close PowerShell and open a new one**
- Close the Admin PowerShell window
- Open a regular PowerShell window
- Navigate to your project:
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
```

**Step 1.7: Try running script again**
```powershell
.\START_APP.ps1
```

---

## 🗄️ Step 2: Fix MySQL Connection Errors

### If you see: "Access denied" or "Cannot connect to MySQL"

**Step 2.1: Check if MySQL is running**
- Press `Windows Key + R`
- Type: `services.msc`
- Press Enter
- Look for "MySQL80" or "MySQL" in the list
- Check if status says "Running"
  - If it says "Stopped", right-click it → Click "Start"
  - Wait for status to change to "Running"

**Step 2.2: Find your MySQL password**
Try these methods:

**Method A: Try to connect**
Open Command Prompt and type:
```cmd
mysql -u root -p
```
- If it asks for password: Enter your password
- If it connects: Your password is correct! Note it down.
- If it says "Access denied": Go to Method B

**Method B: Check if empty password works**
```cmd
mysql -u root
```
- If it connects: Your password is empty (no password needed)
- If it fails: You need to reset password (see Step 2.3)

**Step 2.3: Reset MySQL password (if needed)**

**Sub-step 2.3.1: Stop MySQL service**
- In Services window (from Step 2.1)
- Find "MySQL80" or "MySQL"
- Right-click → "Stop"

**Sub-step 2.3.2: Open Command Prompt as Admin**
- Press `Windows Key + X`
- Click "Command Prompt (Admin)" or "Terminal (Admin)"

**Sub-step 2.3.3: Navigate to MySQL bin folder**
```cmd
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
```
(Adjust path if MySQL is installed elsewhere)

**Sub-step 2.3.4: Start MySQL in safe mode**
```cmd
mysqld --console --skip-grant-tables --skip-external-locking
```
Leave this window open!

**Sub-step 2.3.5: Open NEW Command Prompt**
- Don't close the safe mode window
- Open a NEW Command Prompt (as Admin)

**Sub-step 2.3.6: Connect without password**
```cmd
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
mysql -u root
```

**Sub-step 2.3.7: Reset password**
Type these commands one by one (press Enter after each):
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;
```

**Sub-step 2.3.8: Close safe mode MySQL**
- Go back to the safe mode window (from Step 2.3.4)
- Press `Ctrl + C` to stop it

**Sub-step 2.3.9: Start MySQL service normally**
- Go back to Services window
- Right-click "MySQL80" or "MySQL"
- Click "Start"

**Sub-step 2.3.10: Test connection**
```cmd
mysql -u root
```
Should connect without password.

**Step 2.4: Update backend/.env file**
1. Open File Explorer
2. Navigate to: `C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend\backend`
3. Find file named `.env` (might be hidden - enable "Show hidden files")
4. Right-click → Open with Notepad
5. Find the line: `DB_PASSWORD=`
6. If your MySQL has NO password, leave it as: `DB_PASSWORD=`
7. If your MySQL HAS a password, change it to: `DB_PASSWORD=your_password`
8. Save the file (Ctrl+S)
9. Close Notepad

**Step 2.5: Initialize database**
Open PowerShell and run:
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend\backend"
npm run fix-db
```

**Step 2.6: Check if it worked**
- Should see: "✅ Database setup complete!"
- If you see errors, check Step 2.1 and 2.4 again

---

## 🔌 Step 3: Fix Port Already in Use

### If you see: "Port 5000 already in use" or "EADDRINUSE"

**Step 3.1: Find what's using port 5000**
Open PowerShell and run:
```powershell
netstat -ano | findstr :5000
```

**Step 3.2: Note the PID (last number)**
Example output:
```
TCP    0.0.0.0:5000    LISTENING    12345
```
In this example, `12345` is the PID.

**Step 3.3: Kill the process**
Replace `12345` with your actual PID:
```powershell
taskkill /PID 12345 /F
```

**Step 3.4: Verify port is free**
```powershell
netstat -ano | findstr :5000
```
Should show nothing (empty output).

**Step 3.5: Try starting server again**

---

## 📦 Step 4: Fix Module/Node Errors

### If you see: "Cannot find module" or "npm is not recognized"

**Step 4.1: Check if Node.js is installed**
```powershell
node --version
```
- If it shows a version (like `v18.0.0`): Node.js is installed ✅
- If it says "not recognized": Install Node.js first from nodejs.org

**Step 4.2: Check if npm is installed**
```powershell
npm --version
```
- Should show a version number
- If not, reinstall Node.js (npm comes with it)

**Step 4.3: Clean and reinstall backend dependencies**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend\backend"
```

Delete old files:
```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

Clear npm cache:
```powershell
npm cache clean --force
```

Reinstall:
```powershell
npm install
```

Wait for it to finish (may take 1-2 minutes).

**Step 4.4: Clean and reinstall frontend dependencies**
```powershell
cd ..
```

Delete old files:
```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

Reinstall:
```powershell
npm install
```

Wait for it to finish.

**Step 4.5: Verify installation**
```powershell
cd backend
Test-Path node_modules
```
Should show: `True`

---

## 🛤️ Step 5: Fix Path Errors

### If you see: "Cannot find path" or "Path doesn't exist"

**Step 5.1: Check your current location**
```powershell
Get-Location
```
or
```powershell
pwd
```

**Step 5.2: Navigate to project root**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
```

**Step 5.3: Verify folders exist**
```powershell
Test-Path backend
```
Should show: `True`

```powershell
Test-Path src
```
Should show: `True`

**Step 5.4: If still errors, use absolute paths**
Always use full path:
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend\backend"
```

---

## 🔑 Step 6: Fix Permission Errors

### If you see: "Access denied" or "Permission denied"

**Step 6.1: Close current PowerShell**
Close all PowerShell windows.

**Step 6.2: Open PowerShell as Administrator**
- Press `Windows Key + X`
- Click "Windows PowerShell (Admin)"
- Click "Yes" when prompted

**Step 6.3: Navigate to project**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
```

**Step 6.4: Grant full permissions**
```powershell
icacls . /grant "$env:USERNAME:(OI)(CI)F" /T
```

**Step 6.5: Try running script again**

---

## ✅ Complete Verification Checklist

After fixing errors, verify everything:

**Check 1: PowerShell execution policy**
```powershell
Get-ExecutionPolicy
```
Should show: `RemoteSigned` or `Unrestricted`

**Check 2: MySQL is running**
- Services → MySQL80/MySQL → Status should be "Running"

**Check 3: MySQL password in .env**
- Open `backend\.env`
- Check `DB_PASSWORD=` line has correct password (or empty if no password)

**Check 4: Node.js installed**
```powershell
node --version
```
Should show version number

**Check 5: Dependencies installed**
```powershell
cd backend
Test-Path node_modules
```
Should show: `True`

**Check 6: .env files exist**
```powershell
Test-Path backend\.env
Test-Path .env
```
Both should show: `True`

**Check 7: Ports are free**
```powershell
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```
Should show nothing (or only the processes you started)

---

## 🚀 After Fixing All Errors: Start Application

**Step 1: Navigate to project**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
```

**Step 2: Run startup script**
```powershell
.\START_APP.ps1
```

**Step 3: Wait for both servers to start**
- Backend window should show: "Server running on port 5000"
- Frontend window should show: "Local: http://localhost:3000"

**Step 4: Test in browser**
- Open: `http://localhost:5000/health` (should show OK)
- Open: `http://localhost:3000` (should show login page)
- Login with: `masai` / `masai123`

---

## 📞 Quick Commands Reference

Copy and paste these commands as needed:

```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Check MySQL service
Get-Service MySQL*

# Start MySQL service
Start-Service MySQL80

# Stop MySQL service
Stop-Service MySQL80

# Find process on port 5000
netstat -ano | findstr :5000

# Kill process by PID
taskkill /PID <number> /F

# Kill all Node processes
Get-Process node | Stop-Process -Force

# Check Node version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Navigate to project
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"

# Navigate to backend
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend\backend"
```

---

**Follow these steps in order, and your errors should be resolved!** ✅


