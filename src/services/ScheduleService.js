import { tokenManager, apiRequest }  from "./account";

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
      room: schedule.room
    };
  }

  /**
   * Convert API schedule format to local format
   */
  convertFromApiFormat(apiSchedule) {
    const scheduledTime = new Date(apiSchedule.scheduledTime);
    const date = scheduledTime.toISOString().split('T')[0];
    const startTime = scheduledTime.toTimeString().substring(0, 5);
    
    return {
      scheduleId: apiSchedule.scheduleId,
      date: date,
      startTime: startTime,
      endTime: startTime, // You might need to calculate this based on your business logic
      room: apiSchedule.room,
      status: apiSchedule.status,
      hasAppointment: apiSchedule.hasAppointment,
      patientName: apiSchedule.patientName,
      appointmentNote: apiSchedule.appointmentNote
    };
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
      console.log('🚀 ScheduleService: Creating schedule', { scheduleData, doctorId });
      
      const apiData = this.convertToApiFormat(scheduleData, doctorId);
      console.log('📤 API Format:', apiData);
      
      const response = await apiRequest(`${this.baseUrl}`, {
        method: 'POST',
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Create schedule error:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
      }
      
      const result = await response.json();
      console.log('✅ Schedule created successfully:', result);
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService createSchedule error:', error);
      this.handleApiError(error);
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
      console.log('🚀 ScheduleService: Creating multiple schedules', { schedulesData, doctorId });
      
      const apiDataArray = schedulesData.map(schedule => 
        this.convertToApiFormat(schedule, doctorId)
      );
      console.log('📤 API Format Array:', apiDataArray);
      
      const response = await apiRequest(`${this.baseUrl}/bulk`, {
        method: 'POST',
        body: JSON.stringify(apiDataArray)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Bulk create error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Multiple schedules created successfully:', result);
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService createMultipleSchedules error:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get doctor's schedules
   * @param {number} doctorId - Doctor ID
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Array of schedules in local format
   */
  async getDoctorSchedules(doctorId, fromDate = null, toDate = null) {
    try {
      console.log('🚀 ScheduleService: Getting doctor schedules', { doctorId, fromDate, toDate });
      
      let url = `${this.baseUrl}/doctor/${doctorId}`;
      const params = new URLSearchParams();
      
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiRequest(url, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Doctor schedules loaded:', result);
      
      // Convert API format to local format
      if (result.isSuccess && result.data) {
        const localSchedules = result.data.map(apiSchedule => 
          this.convertFromApiFormat(apiSchedule)
        );
        return { ...result, data: localSchedules };
      }
      
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService getDoctorSchedules error:', error);
      this.handleApiError(error);
      throw error;
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
      console.log('🚀 ScheduleService: Getting active schedules', { fromDate, toDate });
      
      let url = `${this.baseUrl}/active`;
      const params = new URLSearchParams();
      
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiRequest(url, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Active schedules loaded:', result);
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService getActiveSchedules error:', error);
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
      console.log('🚀 ScheduleService: Getting available schedules', { date });
      
      let url = `${this.baseUrl}/available`;
      if (date) {
        url += `?date=${date}`;
      }
      
      const response = await apiRequest(url, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Available schedules loaded:', result);
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService getAvailableSchedules error:', error);
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
      console.log('🚀 ScheduleService: Getting schedule by ID', { scheduleId });
      
      const response = await apiRequest(`${this.baseUrl}/${scheduleId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Schedule loaded:', result);
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService getScheduleById error:', error);
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
      console.log('🚀 ScheduleService: Updating schedule', { scheduleId, updateData });
      
      const response = await apiRequest(`${this.baseUrl}/${scheduleId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Schedule updated:', result);
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService updateSchedule error:', error);
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
      console.log('🚀 ScheduleService: Deleting schedule', { scheduleId });
      
      const response = await apiRequest(`${this.baseUrl}/${scheduleId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Schedule deleted:', result);
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService deleteSchedule error:', error);
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
      console.log('🚀 ScheduleService: Getting doctor available times', { doctorId, date });
      
      const response = await apiRequest(`${this.baseUrl}/doctor/${doctorId}/available-times?date=${date}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Doctor available times loaded:', result);
      return result;
      
    } catch (error) {
      console.error('💥 ScheduleService getDoctorAvailableTimes error:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  // ============= UTILITY & DEBUG METHODS =============

  /**
   * Test API connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      console.log('🧪 ScheduleService: Testing connection');
      
      const response = await apiRequest(`${this.baseUrl}/active`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connection test successful:', data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.log('⚠️ Connection test failed:', errorText);
        return { success: false, error: errorText };
      }
      
    } catch (error) {
      console.error('💥 Connection test error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle API errors with user-friendly messages
   * @param {Error} error - The error object
   */
  handleApiError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Network Error: Cannot connect to server');
    } else if (error.message.includes('401')) {
      console.error('🔐 Auth Error: Please login again');
    } else if (error.message.includes('403')) {
      console.error('🚫 Permission Error: Not authorized');
    } else if (error.message.includes('500')) {
      console.error('🛠️ Server Error: Internal server error');
    } else {
      console.error('❌ Unknown Error:', error.message);
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
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export singleton instance
const scheduleService = new ScheduleService();

export default scheduleService;

// Also export the class for testing purposes
export { ScheduleService };