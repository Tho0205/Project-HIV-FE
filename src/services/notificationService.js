import { apiRequest } from "./account";

const backendBaseUrl = "https://localhost:7243"; 

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
      const response = await fetch(`${backendBaseUrl}/api/Notification/${notificationId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status}: ${errorText}`);
        throw new Error(`Failed to mark notification as read`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },


  markAllAsRead: async (userId) => {
    try {
      const response = await fetch(`${backendBaseUrl}/api/Notification/user/${userId}/read-all`, {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${response.status}: ${errorText}`);
        throw new Error(`Failed to mark notifications as read: HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return null; 
      }

    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

};
