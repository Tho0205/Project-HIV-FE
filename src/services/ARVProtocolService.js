const API_BASE = "https://localhost:7243/api/ARVProtocol";

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.errors 
      ? errorData.errors.join(", ") 
      : errorData.message || "Request failed";
    throw new Error(errorMessage);
  }
  return response.json();
};

export const ARVProtocolService = {
  getAllProtocols: async () => {
    try {
      const response = await fetch(API_BASE, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      const data = await handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch protocols:", error);
      throw error;
    }
  },

  getProtocolById: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      const data = await handleResponse(response);
      return data || null;
    } catch (error) {
      console.error("Failed to fetch protocol:", error);
      throw error;
    }
  },

  getProtocolDetails: async (protocolId) => {
    try {
      const response = await fetch(`${API_BASE}/${protocolId}/arv-details`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      const data = await handleResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch ARV details:", error);
      throw error;
    }
  },

  createProtocol: async (protocolData) => {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(protocolData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Create protocol error:", error);
      throw error;
    }
  },

  createProtocolWithDetails: async (protocolData) => {
    try {
      const response = await fetch(`${API_BASE}/create-with-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(protocolData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Create protocol with details error:", error);
      throw error;
    }
  },

  updateProtocol: async (id, protocolData) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(protocolData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Update protocol error:", error);
      throw error;
    }
  },

  deleteProtocol: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Delete protocol error:", error);
      throw error;
    }
  },

  addARVToProtocol: async (protocolId, arvData) => {
    try {
      const response = await fetch(`${API_BASE}/${protocolId}/add-arv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(arvData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to add ARV to protocol:", error);
      throw error;
    }
  },

  updateProtocolDetail: async (protocolId, detailId, detailData) => {
    try {
      const response = await fetch(`${API_BASE}/${protocolId}/details/${detailId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(detailData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to update protocol detail:", error);
      throw error;
    }
  },

  removeProtocolDetail: async (protocolId, detailId) => {
    try {
      const response = await fetch(`${API_BASE}/${protocolId}/details/${detailId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      return await handleResponse(response);
    } catch (error) {
      console.error("Failed to remove protocol detail:", error);
      throw error;
    }
  }
};

export default ARVProtocolService;