# 🔧 Fix "Access Denied" Login Error

## Quick Fix Steps

### Step 1: Fix MySQL Access

The backend can't connect to MySQL. Run this command to diagnose and fix:

```powershell
cd backend
npm run fix-db
```

This will:
- ✅ Test MySQL connection
- ✅ Initialize the database
- ✅ Create the admin user (masai/masai123)

### Step 2: If MySQL Password is Required

If the script shows that MySQL needs a password:

**Option A: Add Password to .env**

1. Edit `backend/.env` file
2. Add your MySQL password:
   ```
   DB_PASSWORD=your_mysql_password_here
   ```
3. Save the file
4. Run `npm run fix-db` again

**Option B: Reset MySQL Password**

Open MySQL command line:
```bash
mysql -u root -p
# Enter your current password when prompted
```

Then run:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;
```

This sets an empty password (if you prefer).

**Option C: Create New MySQL User**

```sql
CREATE USER 'fms_user'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'fms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Then update `backend/.env`:
```
DB_USER=fms_user
DB_PASSWORD=
```

### Step 3: Start Backend Server

After fixing MySQL access:

```powershell
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 5000
```

### Step 4: Test Login

1. Make sure frontend is running: `npm run dev` (in root directory)
2. Open: `http://localhost:3000`
3. Login with:
   - **Username**: `masai`
   - **Password**: `masai123`

---

## Complete Fix Script

Run this in the backend directory:

```powershell
# Step 1: Fix database access
npm run fix-db

# Step 2: Start backend (in the same directory)
npm run dev
```

---

## Common Errors & Solutions

### Error: "Access denied for user 'root'@'localhost'"

**Solution**: MySQL requires a password
- Edit `backend/.env` and add `DB_PASSWORD=your_password`
- Or reset MySQL password to empty (see Option B above)

### Error: "Cannot connect to MySQL"

**Solution**: MySQL service not running
- Press `Windows + R`
- Type `services.msc` and press Enter
- Find "MySQL80" or "MySQL"
- Right-click → **Start**

### Error: "Database doesn't exist"

**Solution**: Run the fix script
```powershell
npm run fix-db
```

### Error: "Invalid credentials" on login

**Solution**: Admin user not created
```powershell
npm run fix-db
```

This will create the default admin user (masai/masai123).

---

## Verification Steps

1. ✅ **MySQL is running** (check Services)
2. ✅ **Backend/.env has correct MySQL settings**
3. ✅ **Database initialized** (`npm run fix-db` completed)
4. ✅ **Backend server running** (`npm run dev` shows success)
5. ✅ **Frontend .env has** `VITE_API_URL=http://localhost:5000/api`
6. ✅ **Frontend server running** on port 3000

---

## Quick Commands

```powershell
# Fix database and create admin user
cd backend
npm run fix-db

# Start backend
npm run dev

# In a NEW terminal, start frontend
cd ..
npm run dev
```

---

## Default Login Credentials

After running `npm run fix-db`:
- **Username**: `masai`
- **Password**: `masai123`
- **Role**: `admin`

---

**Follow these steps and the access denied error will be resolved!** ✅


