import { apiRequest } from "./account";

const backendBaseUrl = "https://localhost:7243";
class AdminAccountService {
  // Get all accounts
  async getAllAccounts() {
    try {
      const response = await apiRequest(`${backendBaseUrl}/api/Admin`);
      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get account by ID
  async getAccountById(accountId) {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/Admin/${accountId}`
      );
      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new account
  async createAccount(accountData) {
    try {
      const response = await apiRequest(`${backendBaseUrl}/api/Admin`, {
        method: "POST",
        body: JSON.stringify(accountData),
      });

      if (response.status === 204) return null; // No content
      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update account
  async updateAccount(accountId, accountData) {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/Admin/${accountId}`,
        {
          method: "PUT",
          body: JSON.stringify(accountId, accountData),
        }
      );
      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update account status
  // AdminAccountService.js
  async updateAccountStatus(accountId, status) {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/Admin/${accountId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ accountId, status }),
        }
      );
      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete account
  async deleteAccount(accountId) {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/Admin/${accountId}`,
        {
          method: "DELETE",
        }
      );
      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get accounts by status
  async getAccountsByStatus(status) {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/Admin/status/${status}`
      );
      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get account by username
  async getAccountByUsername(username) {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/Admin/username/${username}`
      );
      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      return new Error(error.response.data?.message || "Lỗi máy chủ");
    } else if (error.request) {
      return new Error("Không thể kết nối đến máy chủ");
    } else {
      return new Error(error.message || "Lỗi không xác định");
    }
  }
}

const adminAccountService = new AdminAccountService();
export default adminAccountService;
