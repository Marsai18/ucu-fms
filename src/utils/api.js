const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CACHE_TTL_MS = 8000; // 8s - fast back-navigation without stale data

const apiCache = new Map();
const getCacheKey = (url, token) => `${url}|${token || 'anon'}`;

class API {
  constructor() {
    this.baseURL = API_URL;
    this.token = localStorage.getItem('ucu_fms_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('ucu_fms_token', token);
    } else {
      localStorage.removeItem('ucu_fms_token');
    }
    apiCache.clear();
  }

  getToken() {
    return this.token || localStorage.getItem('ucu_fms_token');
  }

  invalidateCache(pattern) {
    if (!pattern) {
      apiCache.clear();
      return;
    }
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) apiCache.delete(key);
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const isGet = !options.method || options.method === 'GET';

    if (isGet) {
      const key = getCacheKey(url, token);
      const cached = apiCache.get(key);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;
    }

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON only if response is ok
      const data = await response.json();
      if (isGet) {
        const key = getCacheKey(url, token);
        apiCache.set(key, { data, at: Date.now() });
      } else {
        apiCache.clear();
      }
      return data;
    } catch (error) {
      // Handle network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
      }
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  // Vehicles
  async getVehicles() {
    return this.request('/vehicles');
  }

  async getVehicle(id) {
    return this.request(`/vehicles/${id}`);
  }

  async createVehicle(vehicleData) {
    return this.request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  async createVehicleAcquisition(acquisitionData) {
    return this.request('/vehicles/acquisition', {
      method: 'POST',
      body: JSON.stringify(acquisitionData),
    });
  }

  // Drivers
  async getDrivers() {
    return this.request('/drivers');
  }

  async getDriver(id) {
    return this.request(`/drivers/${id}`);
  }

  async createDriver(driverData) {
    return this.request('/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
  }

  async deleteDriver(id) {
    return this.request(`/drivers/${id}`, {
      method: 'DELETE',
    });
  }

  async getTrainingSessions() {
    return this.request('/drivers/training/sessions');
  }

  async createTrainingSession(sessionData) {
    return this.request('/drivers/training/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Bookings
  async getBookingRequests(status) {
    const url = status ? `/bookings?status=${encodeURIComponent(status)}` : '/bookings';
    return this.request(url);
  }

  async getBookingRoutePreview(bookingId) {
    return this.request(`/bookings/${bookingId}/route-preview`);
  }

  async saveAssignmentDraft(bookingId, driverId, vehicleIds) {
    return this.request(`/bookings/${bookingId}/assignment-draft`, {
      method: 'PUT',
      body: JSON.stringify({ driverId, vehicleIds }),
    });
  }

  async getAssignmentDraft(bookingId) {
    return this.request(`/bookings/${bookingId}/assignment-draft`);
  }

  async createBookingRequest(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBookingStatus(id, status, driverId, vehicleIds, hodApprovalNote, hodSignature, vehicleChangeReason, rejectionReason) {
    return this.request(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        ...(driverId && { driverId }),
        ...(vehicleIds && { vehicleIds }),
        ...(hodApprovalNote && { hodApprovalNote }),
        ...(hodSignature && { hodSignature }),
        ...(vehicleChangeReason && { vehicleChangeReason }),
        ...(rejectionReason != null && { rejectionReason }),
      }),
    });
  }

  // Trips
  async getTrips() {
    return this.request('/trips');
  }

  async getTrip(id) {
    return this.request(`/trips/${id}`);
  }

  async getTripHistory(id) {
    return this.request(`/trips/${id}/history`);
  }

  async updateTrip(id, tripData) {
    return this.request(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    });
  }

  // Fuel
  async getFuelLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/fuel?${queryString}` : '/fuel';
    return this.request(url);
  }

  async createFuelLog(fuelData) {
    return this.request('/fuel', {
      method: 'POST',
      body: JSON.stringify(fuelData),
    });
  }

  async getFuelStatistics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/fuel/statistics?${queryString}` : '/fuel/statistics';
    return this.request(url);
  }

  async getLiveFuelPrice(location) {
    const qs = location ? `?location=${encodeURIComponent(location)}` : '';
    return this.request(`/fuel/price/live${qs}`);
  }

  async getFuelEstimate({ distanceKm, durationMin, vehicleId, reservePercent }) {
    return this.request('/fuel/estimate', {
      method: 'POST',
      body: JSON.stringify({
        distanceKm: Number(distanceKm) || 0,
        durationMin: Number(durationMin) || 0,
        ...(vehicleId && { vehicleId }),
        ...(reservePercent != null && { reservePercent }),
      }),
    });
  }

  // Maintenance
  async getMaintenanceAlerts() {
    return this.request('/maintenance/alerts');
  }

  async getMaintenanceRecords(vehicleId) {
    const url = vehicleId ? `/maintenance?vehicleId=${vehicleId}` : '/maintenance';
    return this.request(url);
  }

  async createMaintenanceRecord(maintenanceData) {
    return this.request('/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    });
  }

  async getMaintenanceStatistics() {
    return this.request('/maintenance/statistics');
  }

  // Routes
  async getRoutes() {
    return this.request('/routes');
  }

  async getSavedRoutes(excludeSuspended = false) {
    const qs = excludeSuspended ? '&excludeSuspended=true' : '';
    return this.request(`/routes?saved=true${qs}`);
  }

  async createRoute(routeData) {
    return this.request('/routes', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  }

  async updateRoute(id, routeData) {
    return this.request(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(routeData),
    });
  }

  // Incidents
  async getIncidents() {
    return this.request('/incidents');
  }

  async createIncident(incidentData) {
    return this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  }

  async updateIncident(id, updates) {
    return this.request(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Driver Portal (requires driver auth)
  async getDriverProfile() {
    return this.request('/driver/profile');
  }

  async getDriverTrips() {
    return this.request('/driver/trips');
  }

  async getDriverRoutes() {
    return this.request('/driver/routes');
  }

  async getDriverFuelLogs() {
    return this.request('/driver/fuel-logs');
  }

  async createDriverFuelLog(fuelData) {
    return this.request('/driver/fuel-logs', {
      method: 'POST',
      body: JSON.stringify(fuelData),
    });
  }

  async getDriverIncidents() {
    return this.request('/driver/incidents');
  }

  async createDriverIncident(incidentData) {
    return this.request('/driver/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  // Driver trip response (accept/decline) with optional feedback
  async respondToTrip(tripId, response, declineReason, acceptanceFeedback) {
    return this.request(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify({
        driverResponse: response,
        ...(declineReason && { declineReason }),
        ...(acceptanceFeedback && { assignmentFeedback: acceptanceFeedback }),
      }),
    });
  }

  // Driver accept trip (dedicated endpoint)
  async acceptTrip(tripId, feedback = '') {
    return this.request(`/driver/trips/${tripId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ assignmentFeedback: feedback || undefined }),
    });
  }

  // Driver reject trip (reason required)
  async rejectTrip(tripId, reason) {
    return this.request(`/driver/trips/${tripId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ declineReason: reason }),
    });
  }

  // Driver submit feedback on assignment (after receiving trip details)
  async submitAssignmentFeedback(tripId, feedback) {
    return this.request(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify({ assignmentFeedback: feedback }),
    });
  }

  // Driver trip report (text and optional file upload as base64)
  async submitTripReport(tripId, report, reportFile, reportFileName) {
    return this.request(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify({
        tripReport: report,
        ...(reportFile && { tripReportFile: reportFile, tripReportFileName: reportFileName || 'trip-report.pdf' }),
      }),
    });
  }
}

export default new API();

