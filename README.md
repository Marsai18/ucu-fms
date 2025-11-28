# UCU Fleet Management System - Frontend

A comprehensive fleet management system for Uganda Christian University built with React and Tailwind CSS, featuring UCU brand colors and dark mode support.

## Features

- **Dashboard & Reports**: Overview with charts for mileage, fuel consumption, maintenance costs, activity logs, and vehicle status
- **Vehicle Management**: Register and manage fleet vehicles with comprehensive details and acquisition workflow
- **Booking Requests**: Create and manage vehicle booking requests with approval workflow
- **Trip Management**: Track assigned trips, odometer readings, and trip details for drivers
- **Maintenance Tracking**: Record and manage vehicle maintenance activities and schedules
- **Driver Management**: Manage drivers, training sessions, and performance monitoring
- **Fuel Management**: Track fuel consumption, costs, and efficiency monitoring
- **Route Planning**: Plan routes, identify suitable vehicles, and generate optimized routes
- **Incident Management**: Report, investigate, and manage incidents and accidents
- **Compliance & Safety**: Monitor regulations, ensure compliance, and manage safety checks
- **GPS Tracking**: Real-time vehicle tracking and trip monitoring
- **Performance Monitoring**: Monitor fleet health, utilization, and performance metrics
- **Dark Mode**: Full dark mode support with theme persistence
- **UCU Brand Colors**: Official Uganda Christian University color scheme

## Tech Stack

- React 18
- React Router DOM
- Tailwind CSS (with dark mode)
- Recharts (for data visualization)
- Vite (build tool)
- Lucide React (icons)
- Context API (for theme and authentication)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── Layout.jsx          # Main layout with sidebar navigation
├── pages/
│   ├── Dashboard.jsx       # Dashboard with charts and analytics
│   ├── VehicleRegistration.jsx  # Vehicle registration form
│   ├── BookingRequests.jsx      # Booking requests management
│   ├── TripManagement.jsx       # Trip management for drivers
│   └── MaintenanceTracking.jsx  # Maintenance records tracking
├── App.jsx                 # Main app component with routing
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## Pages

1. **Admin Dashboard** (`/admin`)
   - Welcome screen for administrators
   - Quick access to all system features

2. **Dashboard & Reports** (`/dashboard`)
   - Total mileage and trips chart (UCU Blue & Gold)
   - Fuel consumption and cost chart
   - Maintenance cost breakdown (UCU colors)
   - Recent activity log
   - Notifications and alerts
   - Vehicle availability status

3. **Vehicle Management** (`/vehicles`)
   - Vehicle acquisition workflow (assessment, budget approval, purchase)
   - Vehicle registration form
   - Vehicle identification
   - Technical specifications
   - Operational details
   - Service & maintenance information

4. **Driver Management** (`/drivers`)
   - Driver registration and management
   - Training sessions scheduling
   - Performance metrics and monitoring
   - Driver assignment tracking

5. **Booking Requests** (`/booking`)
   - Create new booking request
   - Booking approval panel
   - Pending and all requests view

6. **Trip Management** (`/trips`)
   - Assigned trips list
   - Trip details view
   - Odometer readings
   - Trip status management

7. **Route Planning** (`/routes`)
   - Create and plan routes
   - Vehicle and driver assignment
   - Route optimization
   - Available vehicles display

8. **Maintenance Tracking** (`/maintenance`)
   - Maintenance records table
   - Add new maintenance record
   - Service history tracking

9. **Fuel Management** (`/fuel`)
   - Fuel consumption tracking
   - Fuel efficiency monitoring
   - Fuel log entries
   - Cost analysis and trends

10. **GPS Tracking** (`/gps`)
    - Real-time vehicle tracking
    - Location monitoring
    - Trip history
    - Vehicle status display

11. **Performance Monitoring** (`/performance`)
    - Fleet health metrics
    - Vehicle performance tracking
    - Utilization analysis
    - KPI dashboard

12. **Incident Management** (`/incidents`)
    - Incident reporting
    - Investigation workflow
    - Damage assessment
    - Repair scheduling

13. **Compliance & Safety** (`/compliance`)
    - Compliance records tracking
    - Safety checks
    - Regulation monitoring
    - Inspection scheduling

## Design Features

### UCU Brand Colors
- **Primary Blue**: `#0066cc` (UCU Blue)
- **Gold/Accent**: `#d4af37` (UCU Gold)
- **Navy**: `#003366`
- **Royal Blue**: `#004080`

### Dark Mode
- Full dark mode support across all pages
- Theme persistence using localStorage
- System preference detection
- Smooth transitions between themes
- Toggle available in header and sidebar

### Responsive Design
- Mobile-first approach
- Responsive grids and layouts
- Touch-friendly interface
- Optimized for tablets and desktops

## License

© 2025 UCU Fleet Management System. All rights reserved.

