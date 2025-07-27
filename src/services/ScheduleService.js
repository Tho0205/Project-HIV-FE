import { tokenManager, apiRequest } from "./account";

const backendBaseUrl = "https://localhost:7243";

class ScheduleService {
  constructor() {
    this.baseUrl = `${backendBaseUrl}/api/schedule`;
  }

  // ============= UTILITY METHODS =============

  /**
   * Get current user info from token
   */
  getCurrentUser() {
    return tokenManager.getUserInfo();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return tokenManager.isAuthenticated();
  }

  /**
   * Convert local schedule format to API format
   */
  convertToApiFormat(schedule, doctorId) {
    return {
      doctorId: doctorId,
      scheduledTime: `${schedule.date}T${schedule.startTime}:00`,
      room: schedule.room,
    };
  }

  /**
   * Enhanced convertFromApiFormat to handle more field variations
   */
  convertFromApiFormat(apiSchedule) {
    try {
      // Handle multiple possible field name formats
      const scheduledTimeField = apiSchedule.scheduledTime || 
                                apiSchedule.ScheduledTime || 
                                apiSchedule.scheduled_time;
      
      const roomField = apiSchedule.room || 
                       apiSchedule.Room || 
                       apiSchedule.roomNumber || 
                       "Unknown";
      
      const scheduleIdField = apiSchedule.scheduleId || 
                             apiSchedule.ScheduleId || 
                             apiSchedule.id;

      if (!scheduledTimeField) {
        console.warn("⚠️ No scheduledTime found in:", apiSchedule);
        return null;
      }

      const scheduledTime = new Date(scheduledTimeField);
      
      if (isNaN(scheduledTime.getTime())) {
        console.warn("⚠️ Invalid date:", scheduledTimeField);
        return null;
      }

      const date = scheduledTime.toISOString().split("T")[0];
      const startTime = scheduledTime.toTimeString().substring(0, 5);

      return {
        scheduleId: scheduleIdField,
        date: date,
        startTime: startTime,
        endTime: startTime, // You might need to calculate this based on your business logic
        room: roomField,
        status: apiSchedule.status || apiSchedule.Status || "ACTIVE",
        hasAppointment: apiSchedule.hasAppointment || apiSchedule.HasAppointment || false,
        patientName: apiSchedule.patientName || apiSchedule.PatientName || null,
        appointmentNote: apiSchedule.appointmentNote || apiSchedule.AppointmentNote || null,
        // Keep original data for debugging
        originalData: apiSchedule,
        // Add scheduledTime for easy access
        scheduledTime: scheduledTimeField
      };
    } catch (error) {
      console.error("💥 Error converting schedule from API format:", error, apiSchedule);
      return null;
    }
  }

  // ============= CORE API METHODS =============

  /**
   * Create a single schedule
   * @param {Object} scheduleData - Local schedule format
   * @param {number} doctorId - Doctor ID
   * @returns {Promise<Object>} API response
   */
  async createSchedule(scheduleData, doctorId) {
    try {
      console.log("🚀 ScheduleService: Creating schedule", {
        scheduleData,
        doctorId,
      });

      const apiData = this.convertToApiFormat(scheduleData, doctorId);
      console.log("📤 API Format:", apiData);

      const response = await apiRequest(`${this.baseUrl}`, {
        method: "POST",
        body: JSON.stringify(apiData),
      });

      console.log("📡 HTTP Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ HTTP Error Response:", errorText);
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`
        );
      }

      const result = await response.json();

      // 🔍 CRITICAL: Log exact response structure
      console.log("🔍 Parsed JSON Response:", {
        fullResult: result,
        isSuccess: result?.isSuccess,
        hasData: !!result?.data,
        dataScheduleId: result?.data?.scheduleId,
        message: result?.message,
        resultType: typeof result,
        dataType: typeof result?.data,
      });

      return result;
    } catch (error) {
      console.error("💥 ScheduleService createSchedule error:", error);
      throw error;
    }
  }

  /**
   * Create multiple schedules
   * @param {Array<Object>} schedulesData - Array of local schedule formats
   * @param {number} doctorId - Doctor ID
   * @returns {Promise<Array>} Array of API responses
   */
  async createMultipleSchedules(schedulesData, doctorId) {
    try {
      console.log("🚀 Creating multiple schedules one by one...");

      const results = [];

      // Tạo từng schedule một thay vì bulk
      for (const scheduleData of schedulesData) {
        try {
          const result = await this.createSchedule(scheduleData, doctorId);
          results.push(result);
        } catch (error) {
          results.push({ isSuccess: false, message: error.message });
        }
      }

      console.log("✅ Multiple schedules processed:", results);
      return results;
    } catch (error) {
      console.error("💥 Error creating multiple schedules:", error);
      throw error;
    }
  }

  /**
   * Get doctor's schedules for conflict checking
   * @param {number} doctorId - Doctor ID
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of schedules
   */
  async getDoctorSchedules(doctorId, fromDate = null, toDate = null) {
    try {
      console.log("🚀 ScheduleService: Getting doctor schedules for conflict check", {
        doctorId,
        fromDate,
        toDate,
      });

      let url = `${this.baseUrl}/doctor/${doctorId}`;
      const params = new URLSearchParams();

      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("📡 Request URL:", url);

      const response = await apiRequest(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ HTTP Error Response:", errorText);
        
        // Nếu API không tồn tại, thử dùng API khác
        if (response.status === 404) {
          console.log("🔄 Trying alternative API endpoint...");
          return await this.getDoctorSchedulesAlternative(doctorId, fromDate, toDate);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log("📥 Raw API Response:", result);

      // Handle different response formats
      let schedules = [];
      
      if (Array.isArray(result)) {
        schedules = result;
      } else if (result.data && Array.isArray(result.data)) {
        schedules = result.data;
      } else if (result.isSuccess && result.data && Array.isArray(result.data)) {
        schedules = result.data;
      } else {
        console.warn("⚠️ Unexpected response format:", result);
        return []; // Return empty array if format is unexpected
      }

      // Convert to local format and filter active schedules
      const localSchedules = schedules
        .filter(schedule => {
          // Only include active schedules
          const status = schedule.status || schedule.Status;
          return !status || status === "ACTIVE" || status === "Active" || status === "active";
        })
        .map(schedule => this.convertFromApiFormat(schedule))
        .filter(schedule => schedule !== null); // Remove invalid schedules

      console.log("✅ Converted schedules:", localSchedules);
      return localSchedules;

    } catch (error) {
      console.error("💥 ScheduleService getDoctorSchedules error:", error);
      
      // Fallback: try alternative method
      try {
        console.log("🔄 Trying alternative method...");
        return await this.getDoctorSchedulesAlternative(doctorId, fromDate, toDate);
      } catch (fallbackError) {
        console.error("💥 Fallback also failed:", fallbackError);
        // Don't throw error - return empty array to allow process to continue
        console.warn("⚠️ Conflict check failed, continuing without check");
        return [];
      }
    }
  }

  /**
   * Alternative method to get doctor schedules using Appointment API
   * @param {number} doctorId - Doctor ID
   * @param {string} fromDate - Start date (YYYY-MM-DD) 
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of schedules
   */
  async getDoctorSchedulesAlternative(doctorId, fromDate, toDate) {
    try {
      console.log("🔄 Using alternative API to get doctor schedules");
      
      // Import here to avoid circular dependency
      const { getDoctorSchedulesApi } = await import("./Appointment");
      
      const schedules = await getDoctorSchedulesApi(doctorId);
      console.log("📥 Alternative API Response:", schedules);
      
      if (!Array.isArray(schedules)) {
        return [];
      }
      
      // Filter by date range if provided
      let filteredSchedules = schedules;
      
      if (fromDate || toDate) {
        filteredSchedules = schedules.filter(schedule => {
          const scheduledTime = schedule.scheduledTime || schedule.ScheduledTime;
          if (!scheduledTime) return false;
          
          const scheduleDate = new Date(scheduledTime);
          const from = fromDate ? new Date(fromDate) : new Date('1900-01-01');
          const to = toDate ? new Date(toDate) : new Date('2100-12-31');
          
          return scheduleDate >= from && scheduleDate <= to;
        });
      }
      
      // Convert to standardized format
      const convertedSchedules = filteredSchedules.map(schedule => ({
        scheduleId: schedule.scheduleId || schedule.ScheduleId,
        scheduledTime: schedule.scheduledTime || schedule.ScheduledTime,
        room: schedule.room || schedule.Room || "Unknown",
        status: schedule.status || schedule.Status || "ACTIVE",
        doctorId: doctorId
      })).filter(schedule => schedule.scheduledTime); // Remove invalid entries
      
      console.log("✅ Alternative method result:", convertedSchedules);
      return convertedSchedules;
      
    } catch (error) {
      console.error("💥 Alternative method failed:", error);
      return [];
    }
  }

  /**
   * Get all active schedules
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of active schedules
   */
  async getActiveSchedules(fromDate = null, toDate = null) {
    try {
      console.log("🚀 ScheduleService: Getting active schedules", {
        fromDate,
        toDate,
      });

      let url = `${this.baseUrl}/active`;
      const params = new URLSearchParams();

      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiRequest(url, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Active schedules loaded:", result);
      return result;
    } catch (error) {
      console.error("💥 ScheduleService getActiveSchedules error:", error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get available schedules (no appointments)
   * @param {string} date - Date to filter (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of available schedules
   */
  async getAvailableSchedules(date = null) {
    try {
      console.log("🚀 ScheduleService: Getting available schedules", { date });

      let url = `${this.baseUrl}/available`;
      if (date) {
        url += `?date=${date}`;
      }

      const response = await apiRequest(url, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Available schedules loaded:", result);
      return result;
    } catch (error) {
      console.error("💥 ScheduleService getAvailableSchedules error:", error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get schedule by ID
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<Object>} Schedule details
   */
  async getScheduleById(scheduleId) {
    try {
      console.log("🚀 ScheduleService: Getting schedule by ID", { scheduleId });

      const response = await apiRequest(`${this.baseUrl}/${scheduleId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Schedule loaded:", result);
      return result;
    } catch (error) {
      console.error("💥 ScheduleService getScheduleById error:", error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Update schedule
   * @param {number} scheduleId - Schedule ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated schedule
   */
  async updateSchedule(scheduleId, updateData) {
    try {
      console.log("🚀 ScheduleService: Updating schedule", {
        scheduleId,
        updateData,
      });

      const response = await apiRequest(`${this.baseUrl}/${scheduleId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Schedule updated:", result);
      return result;
    } catch (error) {
      console.error("💥 ScheduleService updateSchedule error:", error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Delete schedule
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<boolean>} Delete success
   */
  async deleteSchedule(scheduleId) {
    try {
      console.log("🚀 ScheduleService: Deleting schedule", { scheduleId });

      const response = await apiRequest(`${this.baseUrl}/${scheduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Schedule deleted:", result);
      return result;
    } catch (error) {
      console.error("💥 ScheduleService deleteSchedule error:", error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get doctor's available times for a specific date
   * @param {number} doctorId - Doctor ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of available time slots
   */
  async getDoctorAvailableTimes(doctorId, date) {
    try {
      console.log("🚀 ScheduleService: Getting doctor available times", {
        doctorId,
        date,
      });

      const response = await apiRequest(
        `${this.baseUrl}/doctor/${doctorId}/available-times?date=${date}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Doctor available times loaded:", result);
      return result;
    } catch (error) {
      console.error("💥 ScheduleService getDoctorAvailableTimes error:", error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Check schedule conflicts for room and doctor
   * @param {Array} schedulesToCheck - Array of schedules to validate
   * @param {number} doctorId - Doctor ID
   * @param {Array} allExistingSchedules - All existing schedules for conflict check
   * @returns {Promise<Object>} Conflict analysis result
   */
  async checkScheduleConflicts(schedulesToCheck, doctorId, allExistingSchedules = []) {
    try {
      console.log("🔍 ScheduleService: Checking schedule conflicts", {
        schedulesToCheck: schedulesToCheck.length,
        doctorId,
        allExistingSchedules: allExistingSchedules.length
      });

      const conflicts = [];
      const nonConflicts = [];

      schedulesToCheck.forEach(newSchedule => {
        const newDateTime = `${newSchedule.date}T${newSchedule.startTime}:00`;
        const newDate = new Date(newDateTime);
        let conflictReason = null;
        let conflictingDoctor = null;

        // 1. Check doctor's own schedule conflicts
        const doctorConflict = allExistingSchedules.some(existing => {
          if (existing.doctorId !== doctorId) return false;
          
          const existingDateTime = existing.scheduledTime || existing.ScheduledTime;
          if (!existingDateTime) return false;
          
          const existingDate = new Date(existingDateTime);
          
          if (existingDate.toDateString() === newDate.toDateString()) {
            const existingHour = existingDate.getHours();
            const newHour = newDate.getHours();
            
            // Morning shift: 8-12h, Afternoon shift: 13-17h
            const existingShift = existingHour < 13 ? 'morning' : 'afternoon';
            const newShift = newHour < 13 ? 'morning' : 'afternoon';
            
            return existingShift === newShift;
          }
          
          return false;
        });

        if (doctorConflict) {
          conflictReason = 'Bác sĩ đã có lịch khám trong thời gian này';
        }

        // 2. Check room conflicts with other doctors
        if (!conflictReason) {
          const roomConflict = allExistingSchedules.some(existing => {
            // Skip same doctor
            if (existing.doctorId === doctorId) return false;
            
            // Check same room - normalize room names
            const existingRoom = existing.room?.toString().trim();
            const newRoom = newSchedule.room?.toString().trim();
            
            if (existingRoom !== newRoom) return false;
            
            const existingDateTime = existing.scheduledTime || existing.ScheduledTime;
            if (!existingDateTime) return false;
            
            const existingDate = new Date(existingDateTime);
            
            if (existingDate.toDateString() === newDate.toDateString()) {
              const existingHour = existingDate.getHours();
              const newHour = newDate.getHours();
              
              // Morning shift: 8-12h, Afternoon shift: 13-17h
              const existingShift = existingHour < 13 ? 'morning' : 'afternoon';
              const newShift = newHour < 13 ? 'morning' : 'afternoon';
              
              if (existingShift === newShift) {
                conflictingDoctor = existing.doctorName || `Bác sĩ ID: ${existing.doctorId}`;
                return true;
              }
            }
            
            return false;
          });

          if (roomConflict) {
            conflictReason = `Phòng ${newSchedule.room} đã được ${conflictingDoctor} sử dụng trong thời gian này`;
          }
        }

        if (conflictReason) {
          conflicts.push({
            ...newSchedule,
            conflictReason: conflictReason,
            conflictingDoctor: conflictingDoctor
          });
        } else {
          nonConflicts.push(newSchedule);
        }
      });

      console.log("✅ Conflict check completed:", {
        conflicts: conflicts.length,
        nonConflicts: nonConflicts.length
      });

      return { conflicts, nonConflicts };
    } catch (error) {
      console.error("💥 ScheduleService checkScheduleConflicts error:", error);
      // Return safe fallback
      return {
        conflicts: [],
        nonConflicts: schedulesToCheck
      };
    }
  }

  // ============= UTILITY & DEBUG METHODS =============

  /**
   * Test API connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      console.log("🧪 ScheduleService: Testing connection");

      const response = await apiRequest(`${this.baseUrl}/active`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Connection test successful:", data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.log("⚠️ Connection test failed:", errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error("💥 Connection test error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle API errors with user-friendly messages
   * @param {Error} error - The error object
   */
  handleApiError(error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error("🌐 Network Error: Cannot connect to server");
    } else if (error.message.includes("401")) {
      console.error("🔐 Auth Error: Please login again");
    } else if (error.message.includes("403")) {
      console.error("🚫 Permission Error: Not authorized");
    } else if (error.message.includes("500")) {
      console.error("🛠️ Server Error: Internal server error");
    } else {
      console.error("❌ Unknown Error:", error.message);
    }
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    const userInfo = this.getCurrentUser();
    const isAuth = this.isAuthenticated();
    const hasToken = !!tokenManager.getToken();

    return {
      backendUrl: backendBaseUrl,
      baseUrl: this.baseUrl,
      isAuthenticated: isAuth,
      hasToken: hasToken,
      currentUser: userInfo,
      timestamp: new Date().toISOString(),
    };
  }
}

// Create and export singleton instance
const scheduleService = new ScheduleService();

export default scheduleService;

// Also export the class for testing purposes
export { ScheduleService };