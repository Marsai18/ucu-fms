const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  }

  getToken() {
    return this.token || localStorage.getItem('ucu_fms_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

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
    const url = status ? `/bookings?status=${status}` : '/bookings';
    return this.request(url);
  }

  async createBookingRequest(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBookingStatus(id, status) {
    return this.request(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Trips
  async getTrips() {
    return this.request('/trips');
  }

  async getTrip(id) {
    return this.request(`/trips/${id}`);
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

  // Maintenance
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
}

export default new API();

