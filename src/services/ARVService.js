const API_BASE = "https://localhost:7243/api/arv";

const ARVService = {
  getARVs: async (page = 1, pageSize = 8) => {
    try {
      const response = await fetch(`${API_BASE}?page=${page}&pageSize=${pageSize}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch ARVs");
      }
      
      return await response.json();
    } catch (error) {
      console.error("[getARVs] Error:", error);
      throw error;
    }
  },

  getARVById: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
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
      console.error("[getARVById] Error:", error);
      throw error;
    }
  },

  createARV: async (arvData) => {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(arvData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create ARV");
      }
      
      return await response.json();
    } catch (error) {
      console.error("[createARV] Error:", error);
      throw error;
    }
  },

  updateARV: async (id, arvData) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(arvData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update ARV");
      }
      
      return await response.json();
    } catch (error) {
      console.error("[updateARV] Error:", error);
      throw error;
    }
  },

  deleteARV: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete ARV");
      }
      
      return true;
    } catch (error) {
      console.error("[deleteARV] Error:", error);
      throw error;
    }
  },

 getAllARVs: async () => {
  try {
    const response = await fetch(`${API_BASE}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch ARVs");
    }
    
    const data = await response.json();
    console.log("ARV Data received:", data); // Debug log
    return data;
  } catch (error) {
    console.error("[getAllARVs] Error:", error);
    throw error;
  }
},

  searchARVs: async (searchTerm) => {
    try {
      const response = await fetch(`${API_BASE}/search?term=${encodeURIComponent(searchTerm)}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to search ARVs");
      }
      
      return await response.json();
    } catch (error) {
      console.error("[searchARVs] Error:", error);
      throw error;
    }
  }
};

export default ARVService;