import axios from 'axios';

const API_BASE = "https://localhost:7243";

class AdminAccountService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token if needed
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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

  // Get all accounts
  async getAllAccounts() {
    try {
      const response = await this.api.get('/api/Admin');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get account by ID
  async getAccountById(accountId) {
    try {
      const response = await this.api.get(`/api/Admin/${accountId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new account
  async createAccount(accountData) {
    try {
      const response = await this.api.post('/api/Admin', accountData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update account
  async updateAccount(accountId, accountData) {
    try {
      const response = await this.api.put(`/api/Admin/${accountId}`, accountData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update account status
  async updateAccountStatus(accountId, status) {
    try {
      const response = await this.api.patch(`/api/Admin/${accountId}/status`, {
        accountId: accountId,
        status: status
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete account
  async deleteAccount(accountId) {
    try {
      const response = await this.api.delete(`/api/Admin/${accountId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get accounts by status
  async getAccountsByStatus(status) {
    try {
      const response = await this.api.get(`/api/Admin/status/${status}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get account by username
  async getAccountByUsername(username) {
    try {
      const response = await this.api.get(`/api/Admin/username/${username}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
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

const adminAccountService = new AdminAccountService();
export default adminAccountService;