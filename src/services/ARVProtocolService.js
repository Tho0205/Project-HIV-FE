const API_BASE = "https://localhost:7243/api/arvprotocol";

export const ARVProtocolService = {
  // Lấy danh sách protocol với phân trang
  getProtocols: async (page = 1, pageSize = 8) => {
    try {
      const response = await fetch(`${API_BASE}?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch protocols:", error);
      throw error;
    }
  },

  // Lấy chi tiết ARV của protocol
  getARVDetails: async (protocolId) => {
    try {
      const response = await fetch(`${API_BASE}/${protocolId}/arv-details`);
      if (!response.ok) throw new Error("Failed to fetch ARV details");
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch ARV details:", error);
      throw error;
    }
  },

  // Tạo mới protocol
  createProtocol: async (protocolData) => {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(protocolData),
      });
      if (!response.ok) throw new Error("Failed to create protocol");
      return await response.json();
    } catch (error) {
      console.error("Create protocol error:", error);
      throw error;
    }
  },

  // Cập nhật protocol
  updateProtocol: async (id, protocolData) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(protocolData),
      });
      if (!response.ok) throw new Error("Failed to update protocol");
      return await response.json();
    } catch (error) {
      console.error("Update protocol error:", error);
      throw error;
    }
  },

  // Xóa protocol
  deleteProtocol: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete protocol");
      return true;
    } catch (error) {
      console.error("Delete protocol error:", error);
      throw error;
    }
  },
};

export default ARVProtocolService;