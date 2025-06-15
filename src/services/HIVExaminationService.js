const API_BASE = "https://localhost:7243";

class HIVExaminationService {
  // Get all patients
  async getPatients(page = 1, pageSize = 1000) {
    try {
      const response = await fetch(`${API_BASE}/api/Staff/Patient?page=${page}&pageSize=${pageSize}`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        return { success: true, data: result.data };
      }
      
      return { success: false, error: result.message || "Failed to fetch patients" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all doctors
  async getDoctors() {
    try {
      const response = await fetch(`${API_BASE}/api/HIVExamination/doctors`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        return { success: true, data: result.data || [] };
      }
      
      return { success: false, error: result.message || "Failed to fetch doctors" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get recent examinations
  async getRecentExaminations(page = 1, pageSize = 10) {
    try {
      const response = await fetch(`${API_BASE}/api/HIVExamination/all?page=${page}&pageSize=${pageSize}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        return { success: true, data: result.data || [] };
      }
      
      return { success: false, error: result.message || "Failed to fetch examinations" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get patient examination history
  async getPatientHistory(patientId) {
    try {
      const response = await fetch(`${API_BASE}/api/HIVExamination/patient/${patientId}/history`);
      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, data: result.data || [] };
      }
      
      return { success: false, error: result.message || "Failed to fetch patient history" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Add new examination result
  async addExamination(examinationData) {
    try {
      const response = await fetch(`${API_BASE}/api/HIVExamination`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(examinationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, data: result.data };
      }
      
      const errorMsg = result.errors ? result.errors.join(", ") : result.message;
      return { success: false, error: errorMsg || "Failed to add examination" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Helper method to format avatar URL
  getAvatarUrl(avatarPath) {
    if (!avatarPath) return "/assets/image/patient/patient.png";
    return `${API_BASE}/api/Account/avatar/${avatarPath}`;
  }
}

export default new HIVExaminationService();