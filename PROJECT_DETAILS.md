# UCU Fleet Management System – Complete Project Details

This document records every feature, change, and configuration added to the UCU Fleet Management System.

---

## 1. Project Overview

**Name:** UCU Fleet Management System  
**Purpose:** Fleet management for Uganda Christian University (UCU)  
**Stack:** React 18 + Vite (frontend) | Express + JSON/MySQL (backend)

---

## 2. Vehicle Number Plates (Uganda Format)

### Format: **UA DDD LL**

- **UA** – Uganda prefix (ITMS digital plates)
- **DDD** – 3-digit registration number (e.g. 001, 075, 345)
- **LL** – 2-letter suffix (e.g. AK)

**Examples:** UA 001 AK, UA 075 AK, UA 345 AK

### Implementation

- **Source:** Uganda ITMS digital plates (white plates with flag and QR code)
- **Updated in:**
  - `fleet_backend/data.json` – all 10 vehicles
  - `src/pages/VehicleRegistration.jsx` – placeholder: `e.g., UA 075 AK`
  - `src/pages/DriverManagement.jsx` – placeholder: `e.g., Toyota Hilux UA 075 AK`
  - `src/pages/ComplianceSafety.jsx` – mock incidents, vehicle dropdown
  - `src/pages/ClientDashboard.jsx` – recent requests
  - `src/pages/ClientHistory.jsx` – trip history

### Current Vehicle Plates (data.json)

| ID | Plate Number |
|----|--------------|
| 1  | UA 001 AK    |
| 2  | UA 002 AK    |
| 3  | UA 003 AK    |
| 4  | UA 004 AK    |
| 5  | UA 005 AK    |
| 6  | UA 006 AK    |
| 7  | UA 007 AK    |
| 8  | UA 008 AK    |
| 9  | UA 345 AK    |
| 10 | UA 400 AK    |

---

## 3. Authentication & Users

### Login Credentials

| Role   | Username         | Password   |
|--------|------------------|------------|
| Admin  | masai            | masai123   |
| Client | client@ucu.ac.ug | client123  |
| HOD    | hod@ucu.ac.ug    | hod123     |

### Auth Flow

- **Admin:** JWT token from `/api/auth/login`, stored in `localStorage` (`ucu_fms_token`)
- **Client:** Same API or fallback for `client@ucu.ac.ug` when backend is down
- **Protected routes:** `PrivateRoute` (admin), `ClientRoute` (client)
- **AuthContext:** `isInitialized` used to avoid redirect before auth check

---

## 4. Routes & Pages

### Admin Routes (require admin login)

| Path         | Page                 | Description                          |
|--------------|----------------------|--------------------------------------|
| /login       | Login                | Admin login                          |
| /            | Redirect to /admin   | Root redirect                        |
| /admin       | AdminDashboard       | Admin home with Dashboard embed      |
| /dashboard   | Dashboard            | Analytics, charts, stats             |
| /vehicles    | VehicleRegistration  | Vehicle registration & acquisition   |
| /booking     | BookingRequests      | Booking approval workflow            |
| /trips       | TripManagement       | Trip management                      |
| /maintenance | MaintenanceTracking  | Maintenance records                  |
| /drivers     | DriverManagement     | Drivers & training                   |
| /fuel        | FuelManagement       | Fuel logs & stats                    |
| /routes      | RoutePlanning        | Route planning                       |
| /incidents   | IncidentManagement   | Incidents & accidents                |
| /compliance  | ComplianceSafety     | Compliance & safety                  |
| /gps         | GPSTracking          | GPS tracking                         |
| /performance | PerformanceMonitoring| Performance metrics                  |

### Client Routes (require client login)

| Path              | Page               | Description              |
|-------------------|--------------------|--------------------------|
| /client/login     | ClientLogin        | Client login             |
| /client/dashboard  | ClientDashboard    | Client home             |
| /client/request   | ClientBookingRequest | New booking request   |
| /client/history   | ClientHistory      | Booking history          |

### HOD Routes (require HOD login)

| Path              | Page               | Description                              |
|-------------------|--------------------|------------------------------------------|
| /hod/login        | Login              | HOD login                                |
| /hod/dashboard    | HODDashboard       | HOD home, pending requests overview      |
| /hod/requests     | HODRequests        | Approve/reject client requests, forward to Admin |

### Driver Routes (require driver login)

| Path              | Page               | Description              |
|-------------------|--------------------|--------------------------|
| /driver/login     | DriverLogin        | Driver login             |
| /driver/dashboard | DriverDashboard    | Driver home, stats, recent trips/routes |
| /driver/trips     | DriverTrips        | All trips (completed, in progress, cancelled) |
| /driver/routes    | DriverRoutes       | Assigned routes from admin |

**Driver login credentials:**
- david.ssebunya@ucu.ac.ug / driver123
- grace.nalubega@ucu.ac.ug / driver123
- james.mukasa@ucu.ac.ug / driver123
- peter.mutesa@ucu.ac.ug / driver123

---

## 5. Dashboard

### Data Source

- **API:** `GET /api/dashboard/stats` (requires auth)
- **Fallback:** Mock data when API fails (backend down, network error, etc.)

### Fallback Data (when API fails)

- Stats: 10 vehicles, 6 active, 8 drivers, 2 active trips, 3 pending bookings
- Charts: mileage, fuel, maintenance
- Activity logs, vehicle status, notifications
- Uses UA plate format in fallback

### Defensive Checks

- `(data.activityLogs || []).slice(0, 5)`
- `(data.vehicleStatus || []).slice(0, 6)`

---

## 6. Booking Requests

### Approval Flow

- **Client** submits request → status: `Pending`
- **HOD** approves → status: `HODApproved` (forwarded to System Admin)
- **Admin** approves with vehicle(s) and driver → status: `Approved`
- **Admin** can assign 2+ vehicles per trip

### Logic

- **Vehicles:** Only `operationalStatus === 'Active'`
- **Drivers:** Only `status === 'Active'` and not on an active trip
- **Tabs:** HODApproved, Pending, Approved, Rejected
- **Validation:** End date/time must be after start

---

## 7. Design System

### Typography

- **Display:** Outfit, DM Sans
- **Sans:** DM Sans, Outfit

### UCU Brand Colors

| Name       | Hex       | Tailwind          |
|------------|-----------|-------------------|
| UCU Blue   | #0066cc   | ucu-blue-500      |
| UCU Gold   | #d4af37   | ucu-gold-500      |
| Navy       | #003366   | ucu.navy          |
| Royal Blue | #004080   | ucu.royal         |

### Button Colors

- **Primary:** UCU blue gradient
- **Secondary:** UCU gold
- **Destructive:** Rose/red
- **Theme toggle:** Gold hover

### Visual Effects

- Gradient headings (`text-gradient-ucu`)
- Mesh backgrounds (`mesh-gradient`, `mesh-dark`)
- Glass-style cards (`backdrop-blur-sm`)
- Card hover effects
- Shadows: `shadow-ucu`, `shadow-gold`, `shadow-ucu-glow`
- Animations: `fade-in`, `fade-in-up`

### Dark Mode

- `class`-based dark mode
- Theme persistence in `localStorage`
- System preference detection
- Toggle in header and sidebar

### Form Controls

- 2px borders, rounded corners
- UCU blue/gold focus states
- Custom select arrow and checkbox checkmark

---

## 8. Backend API

### Base URL

- Default: `http://localhost:5000/api`
- Config: `VITE_API_URL` in `.env`

### Endpoints

| Method | Endpoint              | Description          |
|--------|------------------------|----------------------|
| POST   | /auth/login            | Login                |
| GET    | /auth/me               | Current user (auth)   |
| GET    | /vehicles              | List vehicles        |
| GET    | /vehicles/:id          | Get vehicle          |
| POST   | /vehicles              | Create vehicle       |
| POST   | /vehicles/acquisition  | Vehicle acquisition   |
| GET    | /drivers               | List drivers         |
| GET    | /bookings              | List bookings        |
| POST   | /bookings              | Create booking       |
| PUT    | /bookings/:id/status   | Update booking status|
| GET    | /trips                 | List trips           |
| GET    | /fuel                  | Fuel logs            |
| POST   | /fuel                  | Create fuel log      |
| GET    | /maintenance           | Maintenance records  |
| POST   | /maintenance           | Create maintenance   |
| GET    | /routes                | Routes               |
| GET    | /incidents             | Incidents            |
| GET    | /dashboard/stats       | Dashboard stats      |
| GET    | /driver/profile        | Driver profile (auth) |
| GET    | /driver/trips          | Driver's trips       |
| GET    | /driver/routes        | Driver's assigned routes |
| GET    | /notifications        | User notifications        |
| PUT    | /notifications/:id/read | Mark notification read  |
| PUT    | /notifications/read-all | Mark all read          |

### CORS

- Allowed origins: `localhost:3000`, `localhost:5173`, `127.0.0.1:3000`, `127.0.0.1:5173`
- `FRONTEND_URL` from env added when set

### Data Storage

- **Default:** JSON file (`fleet_backend/data.json`)
- **Optional:** MySQL when `DB_HOST` is set in `.env`

---

## 9. Data Structure (data.json)

### Collections

- `users` – Admin and client users
- `vehicles` – Fleet vehicles (plateNumber, make, model, operationalStatus, etc.)
- `drivers` – Drivers (name, licenseNumber, status, assignedVehicle)
- `bookings` – Booking requests
- `trips` – Trip records
- `fuelLogs` – Fuel entries
- `maintenanceRecords` – Maintenance history
- `routes` – Route definitions
- `incidents` – Incident reports
- `activityLogs` – Activity log entries

### Vehicle operationalStatus

- `Active` – Available
- `On Trip` – In use
- `In Maintenance` – Under maintenance
- `Inactive` – Not available

---

## 10. GPS Tracking

- State-based refresh instead of `window.location.reload()`
- Uses `isInitialized` in AuthContext to avoid redirect before auth check

---

## 11. File Structure

```
FMS_frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx           # Admin layout + sidebar
│   │   └── ClientLayout.jsx     # Client layout
│   ├── context/
│   │   ├── AuthContext.jsx      # Auth state
│   │   └── ThemeContext.jsx     # Dark mode
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── Dashboard.jsx
│   │   ├── VehicleRegistration.jsx
│   │   ├── BookingRequests.jsx
│   │   ├── TripManagement.jsx
│   │   ├── MaintenanceTracking.jsx
│   │   ├── DriverManagement.jsx
│   │   ├── FuelManagement.jsx
│   │   ├── RoutePlanning.jsx
│   │   ├── IncidentManagement.jsx
│   │   ├── ComplianceSafety.jsx
│   │   ├── GPSTracking.jsx
│   │   ├── PerformanceMonitoring.jsx
│   │   ├── ClientLogin.jsx
│   │   ├── ClientDashboard.jsx
│   │   ├── ClientBookingRequest.jsx
│   │   └── ClientHistory.jsx
│   ├── utils/
│   │   └── api.js               # API client
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── fleet_backend/
│   ├── data.json                # JSON data store
│   ├── server.js
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # readData, writeData
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
├── .env                         # VITE_API_URL=http://localhost:5000/api
├── package.json
├── vite.config.js               # port 3000
├── tailwind.config.js           # UCU colors, fonts, shadows
└── PROJECT_DETAILS.md           # This file
```

---

## 12. Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
```

### Backend (fleet_backend/.env)

```
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
DB_HOST=          # Optional, for MySQL
DB_USER=
DB_PASSWORD=
DB_NAME=ucu_fleet_management
```

---

## 13. How to Run

```bash
# Frontend
npm install
npm run dev          # http://localhost:3000

# Backend
cd fleet_backend
npm install
npm run dev          # http://localhost:5000
```

---

## 14. Changelog Summary

| Change                    | Files Affected                                      |
|---------------------------|-----------------------------------------------------|
| HOD Dashboard & approval flow | HODDashboard, HODRequests, HODLayout, App, Login, AuthContext, bookingController |
| Driver accept/decline with reason | DriverTrips, tripController, api.js              |
| Multiple vehicles per trip | BookingRequests, bookingController, driverController |
| Driver trip report       | DriverTrips, tripController, api.js                 |
| Notifications system     | NotificationContext, notificationController, Layout, ClientLayout, DriverLayout, HODLayout |
| Routes pushed to driver  | bookingController (creates route on approve), driverController |
| Uganda plate format UA DDD LL | data.json, VehicleRegistration, DriverManagement, ComplianceSafety, ClientDashboard, ClientHistory |
| Driver dashboard         | DriverLogin, DriverLayout, DriverDashboard, DriverTrips, DriverRoutes |
| Driver API               | /api/driver/profile, /api/driver/trips, /api/driver/routes |
| Route driver assignment  | routeController.js (auto-assign driverId from preferredVehicle) |
| Dashboard fallback data   | Dashboard.jsx                                      |
| Dashboard defensive checks| Dashboard.jsx                                      |
| CORS multiple origins     | fleet_backend/server.js                             |
| Auth isInitialized        | AuthContext.jsx, PrivateRoute, ClientRoute          |
| GPS state refresh         | GPSTracking.jsx                                     |
| Booking filters           | BookingRequests.jsx                                 |
| UCU design system         | tailwind.config.js, index.css, Layout, pages        |

---

© 2025 UCU Fleet Management System. All rights reserved.
