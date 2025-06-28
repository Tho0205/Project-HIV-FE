import axios from 'axios';

const API_BASE = "http://localhost:7243";

class DoctorInfoService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Get all doctors
  async getAllDoctors() {
    try {
      const response = await this.api.get('/api/DoctorInfo');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get active doctors only
  async getActiveDoctors() {
    try {
      const response = await this.api.get('/api/DoctorInfo/active');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get doctor by ID
  async getDoctorById(doctorId) {
    try {
      const response = await this.api.get(`/api/DoctorInfo/${doctorId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new doctor info
  async createDoctor(doctorData) {
    try {
      const response = await this.api.post('/api/DoctorInfo', doctorData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update doctor info
  async updateDoctor(doctorId, doctorData) {
    try {
      const response = await this.api.put(`/api/DoctorInfo/${doctorId}`, doctorData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete doctor (soft delete - changes status)
  async deleteDoctor(doctorId) {
    try {
      const response = await this.api.delete(`/api/DoctorInfo/${doctorId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all users (to get users with Doctor role)
  async getAllUsers() {
    try {
      const response = await this.api.get('/api/Users');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get doctors with user information joined
  async getDoctorsWithUserInfo() {
    try {
      const [doctors, users] = await Promise.all([
        this.getAllDoctors(),
        this.getAllUsers()
      ]);

      // Map doctor info with user info
      return doctors.map(doctor => {
        const user = users.find(u => u.userId === doctor.doctorId);
        return {
          ...doctor,
          fullName: user?.fullName || 'N/A',
          email: user?.account?.email || user?.email || 'N/A',
          phone: user?.phone || 'N/A',
          gender: user?.gender || 'N/A',
          userAvatar: user?.userAvatar || null
        };
      });
    } catch (error) {
      console.error('Error fetching doctors with user info:', error);
      throw error;
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || error.response.data || 'An error occurred';
      return new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error: No response from server');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

const doctorInfoService = new DoctorInfoService();
export default doctorInfoService;