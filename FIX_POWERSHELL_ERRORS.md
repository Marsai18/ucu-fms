# 🔧 Fix PowerShell Errors - Step by Step Guide

Complete troubleshooting guide for resolving PowerShell errors in UCU Fleet Management System.

---

## 📋 Table of Contents

1. [Script Execution Policy Error](#1-script-execution-policy-error)
2. [MySQL Connection Errors](#2-mysql-connection-errors)
3. [Port Already in Use](#3-port-already-in-use)
4. [Node Module Errors](#4-node-module-errors)
5. [Path Not Found Errors](#5-path-not-found-errors)
6. [Permission Denied Errors](#6-permission-denied-errors)
7. [Database Initialization Errors](#7-database-initialization-errors)
8. [Environment Variable Errors](#8-environment-variable-errors)

---

## 1. Script Execution Policy Error

### Error Message:
```
.\START_APP.ps1 : File cannot be loaded because running scripts is disabled on this system
```

### Solution:

**Step 1: Open PowerShell as Administrator**
- Press `Windows Key + X`
- Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

**Step 2: Check current policy**
```powershell
Get-ExecutionPolicy
```

**Step 3: Set execution policy (choose one):**

**Option A: Set for current user only (Recommended)**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Option B: Set for all users (requires Admin)**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

**Step 4: Type `Y` when prompted**

**Step 5: Verify it worked**
```powershell
Get-ExecutionPolicy
```
Should show: `RemoteSigned`

**Step 6: Navigate to project and run script**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
.\START_APP.ps1
```

---

## 2. MySQL Connection Errors

### Error Message:
```
Access denied for user 'root'@'localhost' (using password: NO)
```

### Solution:

**Step 1: Find your MySQL password**
- If you set one during MySQL installation, use that
- If you forgot it, see "Reset MySQL Password" below

**Step 2: Edit backend/.env file**
- Open `backend/.env` in Notepad or any text editor
- Find the line: `DB_PASSWORD=`
- Replace it with: `DB_PASSWORD=your_mysql_password`
- Save the file

**Step 3: Test MySQL connection**
Open Command Prompt and run:
```cmd
mysql -u root -p
```
Enter your password when prompted. If it works, your password is correct.

**Step 4: Initialize database**
```powershell
cd backend
npm run fix-db
```

**Step 5: If still failing, reset MySQL password (see below)**

---

### Reset MySQL Password

**Step 1: Stop MySQL service**
- Press `Windows + R`
- Type `services.msc` and press Enter
- Find "MySQL80" or "MySQL"
- Right-click → **Stop**

**Step 2: Create a reset file**
Create a file `reset-password.txt` with:
```
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
```

**Step 3: Start MySQL in safe mode**
Open Command Prompt as Administrator:
```cmd
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
mysqld --init-file=C:\path\to\reset-password.txt --console
```

**Step 4: Open new Command Prompt and connect**
```cmd
mysql -u root
```

**Step 5: Reset password**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;
```

**Step 6: Stop safe mode MySQL (Ctrl+C) and restart MySQL service**

**Step 7: Update backend/.env**
```
DB_PASSWORD=
```

---

## 3. Port Already in Use

### Error Message:
```
Error: listen EADDRINUSE: address already in use :::5000
```

### Solution:

**Option A: Find and Stop Process Using Port 5000**

**Step 1: Find process using port 5000**
```powershell
netstat -ano | findstr :5000
```

**Step 2: Note the PID (last number)**
Example: `TCP    0.0.0.0:5000    LISTENING    12345`

**Step 3: Kill the process**
```powershell
taskkill /PID 12345 /F
```
Replace `12345` with your actual PID.

**Option B: Use Different Port**

**Step 1: Edit backend/.env**
Change:
```
PORT=5000
```
To:
```
PORT=5001
```

**Step 2: Edit root/.env**
Change:
```
VITE_API_URL=http://localhost:5000/api
```
To:
```
VITE_API_URL=http://localhost:5001/api
```

**Step 3: Restart servers**

---

## 4. Node Module Errors

### Error Message:
```
Cannot find module 'express'
Error: Cannot find module 'mysql2'
```

### Solution:

**Step 1: Navigate to backend folder**
```powershell
cd backend
```

**Step 2: Delete node_modules and package-lock.json**
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

**Step 3: Clear npm cache**
```powershell
npm cache clean --force
```

**Step 4: Reinstall dependencies**
```powershell
npm install
```

**Step 5: If still failing, try updating npm**
```powershell
npm install -g npm@latest
```

**Step 6: Reinstall again**
```powershell
npm install
```

---

## 5. Path Not Found Errors

### Error Message:
```
Cannot find path 'C:\...\backend\backend'
cd : Cannot find path
```

### Solution:

**Step 1: Check current directory**
```powershell
pwd
```
or
```powershell
Get-Location
```

**Step 2: Navigate to correct directory**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
```

**Step 3: Verify backend folder exists**
```powershell
Test-Path backend
```
Should return: `True`

**Step 4: Use absolute paths if needed**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend\backend"
```

---

## 6. Permission Denied Errors

### Error Message:
```
Access is denied
Permission denied
```

### Solution:

**Step 1: Run PowerShell as Administrator**
- Press `Windows Key + X`
- Select "Windows PowerShell (Admin)"

**Step 2: Navigate to project**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
```

**Step 3: Grant permissions**
```powershell
icacls . /grant "$env:USERNAME:(OI)(CI)F" /T
```

**Step 4: Try running script again**

---

## 7. Database Initialization Errors

### Error Message:
```
Error initializing database
Database doesn't exist
Table doesn't exist
```

### Solution:

**Step 1: Check MySQL is running**
- Press `Windows + R`
- Type `services.msc`
- Find "MySQL80" or "MySQL"
- Make sure it's **Running** (if not, right-click → Start)

**Step 2: Verify MySQL password in .env**
- Open `backend/.env`
- Check `DB_PASSWORD=` has correct password

**Step 3: Test MySQL connection manually**
```powershell
mysql -u root -p
```
Enter password. If it connects, MySQL is working.

**Step 4: Manually create database**
```powershell
mysql -u root -p
```
Then:
```sql
CREATE DATABASE IF NOT EXISTS ucu_fleet_management;
EXIT;
```

**Step 5: Run fix script**
```powershell
cd backend
npm run fix-db
```

**Step 6: If still failing, check MySQL error logs**
- Usually in: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\`
- Or check Event Viewer → Windows Logs → Application

---

## 8. Environment Variable Errors

### Error Message:
```
Environment variable not found
Cannot read property of undefined
```

### Solution:

**Step 1: Verify .env files exist**

**Backend .env** (`backend/.env`):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ucu_fleet_management
DB_PORT=3306
PORT=5000
NODE_ENV=development
JWT_SECRET=ucu-fleet-management-secret-key-2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

**Frontend .env** (root `.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

**Step 2: Check file encoding**
- Make sure files are saved as UTF-8
- No BOM (Byte Order Mark)

**Step 3: Check for typos**
- Variable names must match exactly
- No spaces around `=`
- No quotes needed (usually)

**Step 4: Restart servers** after editing .env files

---

## 🆘 Complete Reset Procedure

If nothing works, try a complete reset:

**Step 1: Stop all running servers**
- Close all PowerShell windows
- Press `Ctrl + C` in any running terminals

**Step 2: Kill Node processes**
```powershell
Get-Process node | Stop-Process -Force
```

**Step 3: Clean backend**
```powershell
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

**Step 4: Clean frontend**
```powershell
cd ..
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

**Step 5: Verify .env files**
- Check both `backend/.env` and root `.env` exist
- Verify MySQL password is correct

**Step 6: Start fresh**
```powershell
cd backend
npm run fix-db
npm run dev
```

**In new terminal:**
```powershell
cd "C:\Users\Ax\OneDrive\Videos\Desktop\FMS_frontend"
npm run dev
```

---

## 📞 Quick Reference Commands

### Check what's running on port 5000:
```powershell
netstat -ano | findstr :5000
```

### Kill a process by PID:
```powershell
taskkill /PID <PID> /F
```

### Check MySQL service status:
```powershell
Get-Service MySQL*
```

### Start MySQL service:
```powershell
Start-Service MySQL80
```

### Stop MySQL service:
```powershell
Stop-Service MySQL80
```

### Test MySQL connection:
```powershell
mysql -u root -p
```

### Check Node.js version:
```powershell
node --version
```

### Check npm version:
```powershell
npm --version
```

### Clear npm cache:
```powershell
npm cache clean --force
```

### Check PowerShell execution policy:
```powershell
Get-ExecutionPolicy
```

### Set execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## ✅ Verification Checklist

Before reporting errors, verify:

- [ ] PowerShell execution policy is set (RemoteSigned)
- [ ] MySQL service is running
- [ ] MySQL password is correct in `backend/.env`
- [ ] Both `.env` files exist and are configured
- [ ] Node.js is installed (`node --version`)
- [ ] npm is installed (`npm --version`)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Ports 3000 and 5000 are not in use
- [ ] No other instances of the app are running
- [ ] Firewall is not blocking localhost connections

---

## 🎯 Common Error Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| Script execution disabled | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| MySQL access denied | Add password to `backend/.env`: `DB_PASSWORD=your_password` |
| Port in use | Kill process: `netstat -ano \| findstr :5000` then `taskkill /PID <PID> /F` |
| Module not found | `cd backend && npm install` |
| Path not found | Use absolute path or check current directory with `pwd` |
| Permission denied | Run PowerShell as Administrator |

---

**If you still have errors after following these steps, check the specific error message in your PowerShell window and refer to the corresponding section above!**


