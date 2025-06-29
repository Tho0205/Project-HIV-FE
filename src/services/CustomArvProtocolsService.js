import { apiRequest, tokenManager } from "./account";
const backendBaseUrl = "https://localhost:7243";

const CustomArvProtocolsService = {
  /**
   * Get all active patients with their protocols for a specific doctor
   * @param {number} doctorId - The ID of the doctor
   * @returns {Promise<Array>} List of patients with their protocols
   */
  getPatientsWithProtocols: async (doctorId) => {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/CustomArvProtocols/doctor/${doctorId}/patients`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients with protocols');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getPatientsWithProtocols:', error);
      throw error;
    }
  },

  /**
   * Get the current active protocol for a patient
   * @param {number} patientId - The ID of the patient
   * @returns {Promise<Object>} The patient's current protocol details
   */
  getPatientCurrentProtocol: async (patientId) => {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/CustomArvProtocols/patient/${patientId}/current-protocol`
      );
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient current protocol');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getPatientCurrentProtocol:', error);
      throw error;
    }
  },

  /**
   * Create a new custom protocol for a patient
   * @param {number} doctorId - The ID of the creating doctor
   * @param {number} patientId - The ID of the patient
   * @param {Object} request - The protocol creation request
   * @returns {Promise<Object>} The created protocol details
   */
  createCustomProtocol: async (doctorId, patientId, request) => {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/CustomArvProtocols/doctor/${doctorId}/patient/${patientId}`,
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create custom protocol');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in createCustomProtocol:', error);
      throw error;
    }
  },

  /**
   * Update a patient's protocol (switch to standard or activate existing custom)
   * @param {number} patientId - The ID of the patient
   * @param {Object} request - The update request
   * @returns {Promise<boolean>} True if successful
   */
  updatePatientProtocol: async (patientId, request) => {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/CustomArvProtocols/patient/${patientId}/update-protocol`,
        {
          method: 'PUT',
          body: JSON.stringify(request)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update patient protocol');
      }
      
      return true;
    } catch (error) {
      console.error('Error in updatePatientProtocol:', error);
      throw error;
    }
  },

  /**
   * Get the protocol history for a patient
   * @param {number} patientId - The ID of the patient
   * @returns {Promise<Array>} List of all protocols the patient has had
   */
  getPatientProtocolHistory: async (patientId) => {
    try {
      const response = await apiRequest(
        `${backendBaseUrl}/api/CustomArvProtocols/patient/${patientId}/history`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient protocol history');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getPatientProtocolHistory:', error);
      throw error;
    }
  },

  /**
   * Check if the current user has doctor role
   * @returns {boolean} True if the user is a doctor
   */
  isCurrentUserDoctor: () => {
    const role = tokenManager.getCurrentUserRole();
    return role === 'Doctor';
  },

  /**
   * Check if the current user has permission to access patient data
   * @param {number} patientId - The ID of the patient
   * @returns {Promise<boolean>} True if the user has permission
   */
  checkPatientAccessPermission: async (patientId) => {
    try {
      // Implement your permission logic here
      // For example, check if the current user is the patient's doctor
      const currentUserId = tokenManager.getCurrentUserId();
      const currentUserRole = tokenManager.getCurrentUserRole();
      
      if (currentUserRole === 'Admin') {
        return true;
      }
      
      if (currentUserRole === 'Patient' && currentUserId === patientId.toString()) {
        return true;
      }
      
      if (currentUserRole === 'Doctor') {
        // You might need an additional API call to verify doctor-patient relationship
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in checkPatientAccessPermission:', error);
      return false;
    }
  },

  /**
   * Check if the current user has permission to modify protocols
   * @returns {boolean} True if the user has permission
   */
  checkProtocolModificationPermission: () => {
    const role = tokenManager.getCurrentUserRole();
    return role === 'Doctor' || role === 'Admin';
  }
};

export default CustomArvProtocolsService;