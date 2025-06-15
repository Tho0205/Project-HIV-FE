const API_BASE = "https://localhost:7243/api/arv";

export const ARVService = {
  // Lấy danh sách ARV với phân trang
  getARVs: async (page = 1, pageSize = 8) => {
    try {
      const response = await fetch(`${API_BASE}?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch ARVs:", error);
      throw error;
    }
  },

  // Lấy chi tiết ARV theo ID
  getARVById: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch ARV details:", error);
      throw error;
    }
  },

  // Tạo mới ARV
  createARV: async (arvData) => {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arvData),
      });
      if (!response.ok) throw new Error("Failed to create ARV");
      return await response.json();
    } catch (error) {
      console.error("Create ARV error:", error);
      throw error;
    }
  },

  // Cập nhật ARV
  updateARV: async (id, arvData) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arvData),
      });
      if (!response.ok) throw new Error("Failed to update ARV");
      return await response.json();
    } catch (error) {
      console.error("Update ARV error:", error);
      throw error;
    }
  },

  // Xóa ARV
  deleteARV: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete ARV");
      return true;
    } catch (error) {
      console.error("Delete ARV error:", error);
      throw error;
    }
  },
};

export default ARVService;