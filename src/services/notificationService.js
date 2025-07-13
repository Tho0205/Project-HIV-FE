import { apiRequest } from "./account";

const backendBaseUrl = "https://localhost:7243"; // Hoặc dùng biến môi trường nếu có

export const notificationService = {
  getNotifications: async (userId) => {
    try {
      const response = await fetch(`${backendBaseUrl}/api/Notification/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${backendBaseUrl}/api/Notification/mark-as-read/${notificationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      return await response.json();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const response = await fetch(`${backendBaseUrl}/api/Notification/mark-all-as-read/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
      return await response.json();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }
};
