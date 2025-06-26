const API_BASE = "https://localhost:7243/api/arvprotocol";

export const ARVProtocolService = {
  getProtocols: async (page = 1, pageSize = 8) => {
    try {
      const response = await fetch(
        `${API_BASE}?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch protocols");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch protocols:", error);
      throw error;
    }
  },

  getARVDetails: async (protocolId) => {
    try {
      const response = await fetch(`${API_BASE}/${protocolId}/arv-details`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch ARV details");
      }
      
      return await response.json();
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create protocol");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Create protocol error:", error);
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update protocol");
      }
      
      return await response.json();
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete protocol");
      }
      
      return true;
    } catch (error) {
      console.error("Delete protocol error:", error);
      throw error;
    }
  },

  createWithDetailsAsync: async (protocolData) => {
    try {
      const response = await fetch(`${API_BASE}/create-with-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(protocolData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.errors?.join(", "));
      }
      
      return await response.json();
    } catch (error) {
      console.error("[createWithDetailsAsync] Error:", error);
      throw error;
    }
  },

  getFullProtocol: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}/full`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch protocol details");
      }
      
      return await response.json();
    } catch (error) {
      console.error("[getFullProtocol] Error:", error);
      throw error;
    }
  },

  addDetailsToProtocol: async (protocolId, details) => {
    try {
      const response = await fetch(`${API_BASE}/${protocolId}/add-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(details),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add ARV details");
      }
      
      return await response.json();
    } catch (error) {
      console.error("[addDetailsToProtocol] Error:", error);
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update ARV detail");
      }
      
      return await response.json();
    } catch (error) {
      console.error("[updateProtocolDetail] Error:", error);
      throw error;
    }
  },

  removeDetailFromProtocol: async (protocolId, detailId) => {
    try {
      const response = await fetch(`${API_BASE}/${protocolId}/details/${detailId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove ARV detail");
      }
      
      return true;
    } catch (error) {
      console.error("[removeDetailFromProtocol] Error:", error);
      throw error;
    }
  }

  
};

export default ARVProtocolService;