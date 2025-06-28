
import { toast } from "react-toastify";
import { apiRequest } from "./account";

const API_BASE = "https://localhost:7243/api/arv";
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || "Request failed";
    throw new Error(errorMessage);
  }
  return response.json();
};

const ARVService = {
  getARVs: async (page = 1, pageSize = 8) => {
    try {
      const response = await apiRequest(`${API_BASE}?page=${page}&pageSize=${pageSize}`);
      return await handleResponse(response);
    } catch (error) {
      console.error("[getARVs] Error:", error);
      throw error;
    }
  },

  getARVById: async (id) => {
    try {
      const response = await apiRequest(`${API_BASE}/${id}`);
      return await handleResponse(response);
    } catch (error) {
      console.error("[getARVById] Error:", error);
      throw error;
    }
  },

  createARV: async (arvData) => {
    try {
      const response = await apiRequest(API_BASE, {
        method: "POST",
        body: JSON.stringify(arvData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("[createARV] Error:", error);
      throw error;
    }
  },

  updateARV: async (id, arvData) => {
    try {
      const response = await apiRequest(`${API_BASE}/${id}`, {
        method: "PUT",
        body: JSON.stringify(arvData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("[updateARV] Error:", error);
      throw error;
    }
  },

  deleteARV: async (id) => {
    try {
      const response = await apiRequest(`${API_BASE}/${id}`, {
        method: "DELETE",
      });
      await handleResponse(response);
      return true;
    } catch (error) {
      console.error("[deleteARV] Error:", error);
      throw error;
    }
  },

  getAllARVs: async () => {
    try {
      const response = await apiRequest(`${API_BASE}`);
      const data = await handleResponse(response);
      console.log("ARV Data received:", data);
      return data;
    } catch (error) {
      console.error("[getAllARVs] Error:", error);
      throw error;
    }
  },

  searchARVs: async (searchTerm) => {
    try {
      const response = await apiRequest(`${API_BASE}/search?term=${encodeURIComponent(searchTerm)}`);
      return await handleResponse(response);
    } catch (error) {
      console.error("[searchARVs] Error:", error);
      throw error;
    }
  }
};

export default ARVService;
