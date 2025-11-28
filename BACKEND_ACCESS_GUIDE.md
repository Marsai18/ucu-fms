# Backend API Access Guide

## 🌐 Backend Base URL
```
http://localhost:5000
```

## 📍 Available Endpoints

### Health Check (No Authentication Required)
```
GET http://localhost:5000/health
```

### Authentication Endpoints
```
POST http://localhost:5000/api/auth/login
GET  http://localhost:5000/api/auth/me (Requires Token)
```

### Vehicle Endpoints (Requires Token)
```
GET    http://localhost:5000/api/vehicles
GET    http://localhost:5000/api/vehicles/:id
POST   http://localhost:5000/api/vehicles
POST   http://localhost:5000/api/vehicles/acquisition
PUT    http://localhost:5000/api/vehicles/:id
DELETE http://localhost:5000/api/vehicles/:id
```

### Driver Endpoints (Requires Token)
```
GET    http://localhost:5000/api/drivers
GET    http://localhost:5000/api/drivers/:id
POST   http://localhost:5000/api/drivers
PUT    http://localhost:5000/api/drivers/:id
GET    http://localhost:5000/api/drivers/training/sessions
POST   http://localhost:5000/api/drivers/training/sessions
```

### Booking Endpoints (Requires Token)
```
GET    http://localhost:5000/api/bookings
GET    http://localhost:5000/api/bookings/:id
POST   http://localhost:5000/api/bookings
PUT    http://localhost:5000/api/bookings/:id/status
POST   http://localhost:5000/api/bookings/:id/approve
POST   http://localhost:5000/api/bookings/:id/reject
```

### Trip Endpoints (Requires Token)
```
GET    http://localhost:5000/api/trips
GET    http://localhost:5000/api/trips/:id
PUT    http://localhost:5000/api/trips/:id
```

### Fuel Endpoints (Requires Token)
```
GET    http://localhost:5000/api/fuel
POST   http://localhost:5000/api/fuel
GET    http://localhost:5000/api/fuel/statistics
```

### Maintenance Endpoints (Requires Token)
```
GET    http://localhost:5000/api/maintenance
POST   http://localhost:5000/api/maintenance
GET    http://localhost:5000/api/maintenance/statistics
```

### Route Endpoints (Requires Token)
```
GET    http://localhost:5000/api/routes
POST   http://localhost:5000/api/routes
PUT    http://localhost:5000/api/routes/:id
```

### Incident Endpoints (Requires Token)
```
GET    http://localhost:5000/api/incidents
GET    http://localhost:5000/api/incidents/:id
POST   http://localhost:5000/api/incidents
PUT    http://localhost:5000/api/incidents/:id
```

### Dashboard Endpoints (Requires Token)
```
GET    http://localhost:5000/api/dashboard/stats
```

---

## 🔐 How to Access the Backend

### Option 1: Using Web Browser
1. Open your browser
2. Go to: `http://localhost:5000/health`
3. You should see: `{"status":"OK","message":"UCU Fleet Management API is running"}`

### Option 2: Using PowerShell (Windows)
```powershell
# Health Check
Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing

# Login
$body = @{username='masai';password='masai123'} | ConvertTo-Json
$response = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$response.Content

# Get Token from Response
$token = ($response.Content | ConvertFrom-Json).token

# Use Token for Authenticated Request
$headers = @{Authorization="Bearer $token"}
$vehicles = Invoke-WebRequest -Uri http://localhost:5000/api/vehicles -Headers $headers -UseBasicParsing
$vehicles.Content
```

### Option 3: Using Postman or Insomnia
1. Install Postman (https://www.postman.com/downloads/)
2. Create a new request
3. Set method to `POST`
4. URL: `http://localhost:5000/api/auth/login`
5. Headers: `Content-Type: application/json`
6. Body (raw JSON):
```json
{
  "username": "masai",
  "password": "masai123"
}
```
7. Click Send
8. Copy the token from response
9. For authenticated requests, add header: `Authorization: Bearer YOUR_TOKEN_HERE`

### Option 4: Using cURL (if installed)
```bash
# Health Check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"masai\",\"password\":\"masai123\"}"

# Get Vehicles (with token)
curl http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Example Authentication Flow

### Step 1: Login and Get Token
```powershell
$loginData = @{
    username = "masai"
    password = "masai123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
    -Method POST `
    -Body $loginData `
    -ContentType "application/json" `
    -UseBasicParsing

$result = $response.Content | ConvertFrom-Json
$token = $result.token
Write-Host "Token: $token"
```

### Step 2: Use Token for Authenticated Requests
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

# Get all vehicles
$vehicles = Invoke-WebRequest -Uri http://localhost:5000/api/vehicles `
    -Headers $headers `
    -UseBasicParsing

Write-Host $vehicles.Content
```

---

## 🔍 Quick Test Commands

### Test Health Endpoint
```powershell
Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Test Login
```powershell
$body = @{username='masai';password='masai123'} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Test Get Vehicles (with token)
```powershell
# First, get token from login
$loginBody = @{username='masai';password='masai123'} | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri http://localhost:5000/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).token

# Then use token to get vehicles
$headers = @{Authorization="Bearer $token"}
Invoke-WebRequest -Uri http://localhost:5000/api/vehicles -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## 📊 Default Login Credentials
- **Username:** `masai`
- **Password:** `masai123`

---

## 🚀 Starting the Backend Server

If the backend is not running:

```powershell
cd fleet_backend
npm start
```

Or in development mode with auto-reload:
```powershell
cd fleet_backend
npm run dev
```

---

## ✅ Verify Backend is Running

1. Open browser: `http://localhost:5000/health`
2. Should see: `{"status":"OK","message":"UCU Fleet Management API is running"}`
3. If you see this, the backend is running correctly!

---

## 📌 Important Notes

- All endpoints except `/health` and `/api/auth/login` require authentication
- Include the token in the `Authorization` header as: `Bearer YOUR_TOKEN_HERE`
- The backend runs on port `5000` by default
- CORS is enabled for `http://localhost:3000` (frontend)
- All data is stored in `fleet_backend/data.json` (JSON file storage, no MySQL needed)










