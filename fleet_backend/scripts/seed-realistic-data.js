/**
 * Seed realistic data for UCU Fleet Management System
 * Uses existing 25 vehicles, creates coherent bookings, trips, fuel, maintenance, etc.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, '../data.json');

const data = JSON.parse(readFileSync(dataPath, 'utf8'));

// Add users for new drivers 6,7,8 (keep existing users)
const existingDriverIds = new Set(data.users.filter(u => u.driverId).map(u => u.driverId));
const newDriverUsers = [
  { id: "8", username: "joseph.okello@ucu.ac.ug", password: "driver123", role: "driver", driverId: "6", name: "Joseph Okello", email: "joseph.okello@ucu.ac.ug", createdAt: "2025-01-15T08:00:00Z" },
  { id: "9", username: "mary.nankya@ucu.ac.ug", password: "driver123", role: "driver", driverId: "7", name: "Mary Nankya", email: "mary.nankya@ucu.ac.ug", createdAt: "2025-01-16T09:00:00Z" },
  { id: "10", username: "robert.mugisha@ucu.ac.ug", password: "driver123", role: "driver", driverId: "8", name: "Robert Mugisha", email: "robert.mugisha@ucu.ac.ug", createdAt: "2025-01-17T10:00:00Z" },
];
data.users = data.users.filter(u => !u.driverId || ["1","2","3","4","5"].includes(u.driverId));
data.users.push(...newDriverUsers);

// Fix drivers: assign valid vehicle IDs, add 6,7,8
const drivers = [
  { id: "1", name: "David Ssebunya", licenseNumber: "DL-1001", phone: "+256 700 111 001", email: "david.ssebunya@ucu.ac.ug", status: "Active", yearsOfExperience: 8, assignedVehicle: "1", createdAt: "2025-01-10T08:00:00Z" },
  { id: "2", name: "Grace Nalubega", licenseNumber: "DL-1002", phone: "+256 700 111 002", email: "grace.nalubega@ucu.ac.ug", status: "Active", yearsOfExperience: 6, assignedVehicle: "2", createdAt: "2025-01-11T09:00:00Z" },
  { id: "3", name: "James Mukasa", licenseNumber: "DL-1003", phone: "+256 700 111 003", email: "james.mukasa@ucu.ac.ug", status: "Active", yearsOfExperience: 10, assignedVehicle: "3", createdAt: "2025-01-12T10:00:00Z" },
  { id: "4", name: "Sarah Nakazzi", licenseNumber: "DL-1004", phone: "+256 700 111 004", email: "sarah.nakazzi@ucu.ac.ug", status: "Active", yearsOfExperience: 5, assignedVehicle: "4", createdAt: "2025-01-13T11:00:00Z" },
  { id: "5", name: "Peter Mutesa", licenseNumber: "DL-1005", phone: "+256 700 111 005", email: "peter.mutesa@ucu.ac.ug", status: "Active", yearsOfExperience: 7, assignedVehicle: "5", createdAt: "2025-01-14T12:00:00Z" },
  { id: "6", name: "Joseph Okello", licenseNumber: "DL-1006", phone: "+256 700 111 006", email: "joseph.okello@ucu.ac.ug", status: "Active", yearsOfExperience: 4, assignedVehicle: "6", createdAt: "2025-01-15T08:00:00Z" },
  { id: "7", name: "Mary Nankya", licenseNumber: "DL-1007", phone: "+256 700 111 007", email: "mary.nankya@ucu.ac.ug", status: "Active", yearsOfExperience: 6, assignedVehicle: "7", createdAt: "2025-01-16T09:00:00Z" },
  { id: "8", name: "Robert Mugisha", licenseNumber: "DL-1008", phone: "+256 700 111 008", email: "robert.mugisha@ucu.ac.ug", status: "Active", yearsOfExperience: 9, assignedVehicle: "8", createdAt: "2025-01-17T10:00:00Z" },
];
data.drivers = drivers;

// Update vehicles: 1,2 On Trip (in-progress trips), 12 In Maintenance, rest Active
const vStatus = (id) => {
  if (["1", "2"].includes(id)) return "On Trip";
  if (id === "12") return "In Maintenance";
  return "Active";
};
data.vehicles = data.vehicles.map(v => {
  const numId = parseInt(v.id, 10);
  const assignedDriver = numId >= 1 && numId <= 8 ? String(numId) : undefined;
  const extras = { operationalStatus: vStatus(v.id), ...(assignedDriver && { assignedDriver }) };
  // GPS: vehicles on trip get lastKnownLocation from their trip destination
  if (v.id === "1") extras.lastKnownLocation = "Mukono District Offices";
  if (v.id === "2") extras.lastKnownLocation = "Entebbe International Airport";
  return { ...v, ...extras };
});

// Bookings: Pending (2), HODApproved (2), Approved (4), Rejected (1)
data.bookings = [
  { id: "1", request_id: "BK-001", vehicleId: "1", vehicleIds: ["1"], driverId: "1", numberOfPassengers: 12, purpose: "Faculty workshop transport", destination: "Kampala City Centre", waypoints: "Mukono", startDateTime: "2026-03-18T08:00:00Z", endDateTime: "2026-03-18T17:00:00Z", status: "Approved", userId: "2", hodApprovedBy: "HOD", hodApprovedAt: "2026-03-16T10:00:00Z", createdAt: "2026-03-15T09:00:00Z", updatedAt: "2026-03-16T10:35:00Z" },
  { id: "2", request_id: "BK-002", vehicleId: "1", vehicleIds: ["1"], driverId: "1", numberOfPassengers: 25, purpose: "Student field trip to Jinja", destination: "Jinja Campus", waypoints: "Mukono, Lugazi", startDateTime: "2026-03-20T07:00:00Z", endDateTime: "2026-03-20T18:00:00Z", status: "HODApproved", userId: "2", hodApprovedBy: "HOD", hodApprovedAt: "2026-03-16T11:30:00Z", hodApprovalNote: "Approved - Source of the Nile visit", createdAt: "2026-03-15T14:00:00Z", updatedAt: "2026-03-16T11:30:00Z" },
  { id: "3", request_id: "BK-003", vehicleId: "5", vehicleIds: ["5"], driverId: "3", numberOfPassengers: 8, purpose: "Airport pickup for visiting professor", destination: "Entebbe International Airport", waypoints: "", startDateTime: "2026-03-22T06:00:00Z", endDateTime: "2026-03-22T12:00:00Z", status: "Approved", userId: "2", hodApprovedBy: "HOD", hodApprovedAt: "2026-03-16T14:00:00Z", createdAt: "2026-03-16T08:00:00Z", updatedAt: "2026-03-16T10:17:00Z" },
  { id: "4", request_id: "BK-004", vehicleId: null, numberOfPassengers: 45, purpose: "Inter-campus sports event", destination: "Mbarara Teaching Hospital", waypoints: "Masaka, Lyantonde", startDateTime: "2026-03-25T06:00:00Z", endDateTime: "2026-03-26T20:00:00Z", status: "Pending", userId: "2", createdAt: "2026-03-16T09:00:00Z", updatedAt: "2026-03-16T09:00:00Z" },
  { id: "5", request_id: "BK-005", vehicleId: null, numberOfPassengers: 6, purpose: "Executive meeting transport", destination: "Kampala Serena Hotel", waypoints: "", startDateTime: "2026-03-19T09:00:00Z", endDateTime: "2026-03-19T15:00:00Z", status: "Pending", userId: "2", createdAt: "2026-03-16T11:00:00Z", updatedAt: "2026-03-16T11:00:00Z" },
  { id: "6", request_id: "BK-006", vehicleId: "1", vehicleIds: ["1"], driverId: "1", numberOfPassengers: 20, purpose: "Medical outreach", destination: "Mukono District Offices", waypoints: "", startDateTime: "2026-03-17T08:00:00Z", endDateTime: "2026-03-17T14:00:00Z", status: "Approved", userId: "2", hodApprovedBy: "HOD", hodApprovedAt: "2026-03-16T08:00:00Z", createdAt: "2026-03-15T16:00:00Z", updatedAt: "2026-03-16T08:30:00Z" },
  { id: "7", request_id: "BK-007", vehicleId: "4", vehicleIds: ["4"], driverId: "4", numberOfPassengers: 12, purpose: "ICT equipment delivery", destination: "Mbale Regional Office", waypoints: "Jinja, Iganga", startDateTime: "2026-03-14T06:00:00Z", endDateTime: "2026-03-14T20:00:00Z", status: "Rejected", userId: "2", hodApprovedBy: "HOD", hodApprovedAt: "2026-03-13T10:00:00Z", hodApprovalNote: "Budget constraints", createdAt: "2026-03-12T09:00:00Z", updatedAt: "2026-03-13T14:00:00Z" },
  { id: "8", request_id: "BK-008", vehicleId: null, numberOfPassengers: 15, purpose: "Research trip to Gulu", destination: "Gulu University", waypoints: "Luweero, Lira", startDateTime: "2026-03-24T05:00:00Z", endDateTime: "2026-03-25T18:00:00Z", status: "HODApproved", userId: "2", hodApprovedBy: "HOD", hodApprovedAt: "2026-03-16T12:00:00Z", hodApprovalNote: "Approved - research collaboration", createdAt: "2026-03-15T10:00:00Z", updatedAt: "2026-03-16T12:00:00Z" },
];

// Trips: 2 In Progress, 5 Completed, 2 Pending
data.trips = [
  { id: "1", tripCode: "TR-001", bookingId: "1", vehicleId: "1", vehicleIds: ["1"], driverId: "1", origin: "Uganda Christian University Main Campus", destination: "Kampala City Centre", status: "Completed", routeDistance: 25, routeDuration: 75, startOdometer: 184800, endOdometer: 184920, distanceTraveled: 120, departureTime: "2026-03-18T08:00:00Z", arrivalTime: "2026-03-18T10:15:00Z", driverNotes: "Smooth traffic", createdAt: "2026-03-16T10:35:00Z", updatedAt: "2026-03-18T10:20:00Z" },
  { id: "2", tripCode: "TR-002", bookingId: "6", vehicleId: "1", vehicleIds: ["1"], driverId: "1", origin: "Uganda Christian University Main Campus", destination: "Mukono District Offices", status: "In Progress", routeDistance: 8, routeDuration: 25, startOdometer: 184950, endOdometer: null, distanceTraveled: 15, departureTime: "2026-03-17T08:00:00Z", arrivalTime: null, driverNotes: "", createdAt: "2026-03-16T08:30:00Z", updatedAt: "2026-03-17T08:15:00Z" },
  { id: "3", tripCode: "TR-003", vehicleId: "2", driverId: "2", origin: "Uganda Christian University Main Campus", destination: "Entebbe International Airport", status: "In Progress", routeDistance: 50, routeDuration: 120, startOdometer: 132400, endOdometer: null, distanceTraveled: 85, departureTime: "2026-03-16T06:00:00Z", arrivalTime: null, driverNotes: "Airport pickup in progress", createdAt: "2026-03-15T14:00:00Z", updatedAt: "2026-03-16T08:30:00Z" },
  { id: "4", tripCode: "TR-004", vehicleId: "4", driverId: "4", origin: "Uganda Christian University Main Campus", destination: "Jinja Campus", status: "Completed", routeDistance: 85, routeDuration: 150, startOdometer: 84300, endOdometer: 84440, distanceTraveled: 140, departureTime: "2026-03-14T07:00:00Z", arrivalTime: "2026-03-14T10:30:00Z", driverNotes: "Field research visit completed", createdAt: "2026-03-13T10:00:00Z", updatedAt: "2026-03-14T10:45:00Z" },
  { id: "5", tripCode: "TR-005", vehicleId: "5", driverId: "5", origin: "Uganda Christian University Main Campus", destination: "Kampala City Centre", status: "Completed", routeDistance: 25, routeDuration: 75, startOdometer: 92100, endOdometer: 92180, distanceTraveled: 80, departureTime: "2026-03-13T08:00:00Z", arrivalTime: "2026-03-13T10:15:00Z", driverNotes: "Finance meeting", createdAt: "2026-03-12T09:00:00Z", updatedAt: "2026-03-13T10:30:00Z" },
  { id: "6", tripCode: "TR-006", vehicleId: "7", driverId: "2", origin: "Uganda Christian University Main Campus", destination: "Entebbe International Airport", status: "Completed", routeDistance: 50, routeDuration: 120, startOdometer: 40000, endOdometer: 40100, distanceTraveled: 100, departureTime: "2026-03-12T05:00:00Z", arrivalTime: "2026-03-12T08:00:00Z", driverNotes: "Lecturer pickup", createdAt: "2026-03-11T14:00:00Z", updatedAt: "2026-03-12T08:15:00Z" },
  { id: "7", tripCode: "TR-007", bookingId: "3", vehicleId: "5", vehicleIds: ["5"], driverId: "3", origin: "Uganda Christian University Main Campus", destination: "Entebbe International Airport", status: "Pending", scheduledDeparture: "2026-03-22T06:00:00Z", scheduledArrival: "2026-03-22T12:00:00Z", driverResponse: "pending", createdAt: "2026-03-16T10:17:00Z", updatedAt: "2026-03-16T10:17:00Z" },
  { id: "8", tripCode: "TR-008", vehicleId: "10", driverId: "1", origin: "Uganda Christian University Main Campus", destination: "Kampala City Centre", status: "Completed", routeDistance: 25, routeDuration: 75, startOdometer: 59800, endOdometer: 59890, distanceTraveled: 90, departureTime: "2026-03-11T09:00:00Z", arrivalTime: "2026-03-11T11:15:00Z", driverNotes: "Admin errand", createdAt: "2026-03-10T16:00:00Z", updatedAt: "2026-03-11T11:30:00Z" },
];

// Fuel logs - spread Oct 2025 - Mar 2026 for dashboard charts
const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
data.fuelLogs = [];
let flId = 1;
months.forEach((m, i) => {
  [1,2,3,4,5,6,7,8].forEach(vId => {
    data.fuelLogs.push({
      id: String(flId++),
      vehicleId: String(vId),
      quantity: 40 + Math.floor(Math.random() * 40),
      cost: 220000 + Math.floor(Math.random() * 200000),
      notes: ["Total Mukono", "Shell Seeta", "Vivo Kampala", "Stabex Jinja"][i % 4],
      createdAt: `${m}-${String(10 + i).padStart(2,'0')}T09:00:00Z`
    });
  });
});

// Maintenance records - vehicles 1-12, spread over last 6 months
data.maintenanceRecords = [
  { id: "1", vehicleId: "1", serviceDate: "2026-02-12", serviceType: "Routine Service", description: "Oil and filter change", odometerReading: 184500, cost: 280000, mechanicDetails: "AutoCare Mukono", nextServiceDueDate: "2026-05-12", createdAt: "2026-02-12T10:00:00Z" },
  { id: "2", vehicleId: "2", serviceDate: "2026-02-15", serviceType: "Brake Inspection", description: "Brake pads checked", odometerReading: 132200, cost: 150000, mechanicDetails: "Isuzu Service", nextServiceDueDate: "2026-05-15", createdAt: "2026-02-15T11:00:00Z" },
  { id: "3", vehicleId: "3", serviceDate: "2026-02-10", serviceType: "Suspension Check", description: "Front shocks replaced", odometerReading: 210100, cost: 420000, mechanicDetails: "Nile Mechanics", nextServiceDueDate: "2026-05-10", createdAt: "2026-02-10T12:00:00Z" },
  { id: "4", vehicleId: "4", serviceDate: "2026-03-01", serviceType: "Engine Repair", description: "Injector cleaning", odometerReading: 84300, cost: 380000, mechanicDetails: "QuickFix Garage", nextServiceDueDate: "2026-06-01", createdAt: "2026-03-01T09:00:00Z" },
  { id: "5", vehicleId: "5", serviceDate: "2026-02-18", serviceType: "Routine Service", description: "Oil and fluids", odometerReading: 92100, cost: 250000, mechanicDetails: "AutoCity Ltd", nextServiceDueDate: "2026-05-18", createdAt: "2026-02-18T13:00:00Z" },
  { id: "6", vehicleId: "12", serviceDate: "2026-01-15", serviceType: "Battery Replacement", description: "New maintenance-free battery", odometerReading: 134800, cost: 480000, mechanicDetails: "Toyota Uganda", nextServiceDueDate: "2026-04-15", createdAt: "2026-01-15T16:00:00Z" },
  { id: "7", vehicleId: "7", serviceDate: "2026-03-05", serviceType: "Routine Service", description: "Scheduled 10k km service", odometerReading: 40100, cost: 260000, mechanicDetails: "Toyota Service", nextServiceDueDate: "2026-06-05", createdAt: "2026-03-05T11:00:00Z" },
  { id: "8", vehicleId: "12", serviceDate: "2026-03-20", serviceType: "Tyre Replacement", description: "All four tyres - due soon", odometerReading: 135200, cost: 0, mechanicDetails: "Pending", nextServiceDueDate: "2026-03-25", createdAt: "2026-03-16T08:00:00Z" },
];

// Incidents
data.incidents = [
  { id: "1", vehicleId: "1", driverId: "1", incidentType: "Minor Scratch", severity: "Low", location: "Main Campus Parking", description: "Scratch on rear bumper during parking", status: "Resolved", createdAt: "2026-03-10T14:00:00Z", updatedAt: "2026-03-11T09:00:00Z" },
  { id: "2", vehicleId: "2", driverId: "2", incidentType: "Speeding Alert", severity: "Medium", location: "Mukono-Kampala Highway", description: "Telematics speeding alert", status: "Resolved", createdAt: "2026-03-08T12:30:00Z", updatedAt: "2026-03-09T10:00:00Z" },
  { id: "3", vehicleId: "4", driverId: "4", incidentType: "Engine Overheating", severity: "High", location: "Jinja Road", description: "Engine overheated en route", status: "Investigating", createdAt: "2026-03-14T11:00:00Z", updatedAt: "2026-03-14T11:00:00Z" },
  { id: "4", vehicleId: "7", driverId: "2", incidentType: "Near Miss", severity: "Medium", location: "Entebbe Road", description: "Near miss at junction", status: "Investigating", createdAt: "2026-03-12T09:20:00Z", updatedAt: "2026-03-12T09:20:00Z" },
];

// Activity logs
data.activityLogs = [
  { id: "1", type: "Trip Completed", vehicleId: "1", driverId: "1", description: "Trip TR-001 to Kampala City Centre completed", createdAt: "2026-03-18T10:20:00Z" },
  { id: "2", type: "Trip Started", vehicleId: "2", driverId: "1", description: "Trip TR-002 to Mukono District Offices started", createdAt: "2026-03-17T08:15:00Z" },
  { id: "3", type: "Trip Started", vehicleId: "2", driverId: "2", description: "Airport pickup for Entebbe started", createdAt: "2026-03-16T06:15:00Z" },
  { id: "4", type: "Booking Approved", vehicleId: "1", description: "Booking BK-001 approved by admin", createdAt: "2026-03-16T10:35:00Z" },
  { id: "5", type: "Booking Approved", vehicleId: "5", description: "Booking BK-003 approved", createdAt: "2026-03-16T10:17:00Z" },
  { id: "6", type: "Fuel Logged", vehicleId: "1", description: "60L at Total Mukono - 330,000 UGX", createdAt: "2026-03-15T09:00:00Z" },
  { id: "7", type: "Maintenance Scheduled", vehicleId: "12", description: "Tyre replacement scheduled for Land Cruiser Hardtop", createdAt: "2026-03-16T08:00:00Z" },
  { id: "8", type: "Incident Reported", vehicleId: "4", description: "Engine overheating incident reported", createdAt: "2026-03-14T11:05:00Z" },
  { id: "9", type: "Trip Completed", vehicleId: "4", driverId: "4", description: "Trip TR-004 to Jinja Campus completed", createdAt: "2026-03-14T10:45:00Z" },
  { id: "10", type: "HOD Approval", description: "Booking BK-002 approved by HOD for Jinja field trip", createdAt: "2026-03-16T11:30:00Z" },
];

// Notifications
data.notifications = [
  { id: "1", type: "trip_assigned", driverId: "1", title: "New Trip Assigned", message: "Trip TR-002 to Mukono District Offices. Vehicle UAA 102A assigned.", tripId: "2", bookingId: "6", recipientRole: "driver", read: true, createdAt: "2026-03-16T08:30:00Z" },
  { id: "2", type: "booking_approved", userId: "2", title: "Booking Approved", message: "Your booking BK-001 has been approved. Driver David Ssebunya assigned.", bookingId: "1", recipientRole: "client", read: false, createdAt: "2026-03-16T10:35:00Z" },
  { id: "3", type: "new_booking", title: "New Booking Request", message: "Booking BK-004 requested - 45 passengers to Mbarara. Awaiting HOD approval.", bookingId: "4", recipientRole: "hod", read: false, createdAt: "2026-03-16T09:00:00Z" },
  { id: "4", type: "maintenance_alert", title: "Service Due Soon", message: "Vehicle UAA 590M (Land Cruiser Hardtop) - tyre replacement due 25 Mar 2026", recipientRole: "admin", read: false, createdAt: "2026-03-16T08:00:00Z" },
  { id: "5", type: "incident_report", title: "Incident Reported", message: "Engine overheating - Vehicle UAA 441D on Jinja Road. Status: Investigating.", recipientRole: "admin", read: false, createdAt: "2026-03-14T11:00:00Z" },
];

// Routes - preferredVehicle for driver route matching
data.routes = [
  { id: "1", origin: "Uganda Christian University Main Campus", destination: "Kampala City Centre", distance: 25, duration: 75, preferredVehicle: "1", driverId: "1", tripId: "1", status: "Saved", createdAt: "2026-03-16T10:35:00Z", updatedAt: "2026-03-16T10:35:00Z" },
  { id: "2", origin: "Uganda Christian University Main Campus", destination: "Mukono District Offices", distance: 8, duration: 25, preferredVehicle: "1", driverId: "1", tripId: "2", status: "Saved", createdAt: "2026-03-16T08:30:00Z", updatedAt: "2026-03-16T08:30:00Z" },
  { id: "3", origin: "Uganda Christian University Main Campus", destination: "Entebbe International Airport", distance: 50, duration: 120, preferredVehicle: "2", driverId: "2", tripId: "3", status: "Saved", createdAt: "2026-03-15T14:00:00Z", updatedAt: "2026-03-15T14:00:00Z" },
  { id: "4", origin: "Uganda Christian University Main Campus", destination: "Entebbe International Airport", distance: 50, duration: 120, preferredVehicle: "5", driverId: "3", tripId: "7", status: "Saved", createdAt: "2026-03-16T10:17:00Z", updatedAt: "2026-03-16T10:17:00Z" },
];

writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('✅ Realistic data seeded successfully.');
console.log('   - 8 drivers, 25 vehicles');
console.log('   - 8 bookings (2 Pending, 2 HODApproved, 4 Approved, 1 Rejected)');
console.log('   - 8 trips (2 In Progress, 5 Completed, 1 Pending)');
console.log('   - 48 fuel logs (Oct 2025 - Mar 2026)');
console.log('   - 8 maintenance records');
console.log('   - 4 incidents');
console.log('   - 10 activity logs');
