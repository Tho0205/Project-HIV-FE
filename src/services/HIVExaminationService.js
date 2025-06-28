const API_BASE = "https://localhost:7243";

class HIVExaminationService {
  // Base API call method
  async apiCall(url, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: { "Content-Type": "application/json" },
        ...options
      });
      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true, data: result.data, message: result.message };
      }
      return { success: false, message: result.message || "API Error" };
    } catch (error) {
      return { success: false, message: "Lỗi kết nối" };
    }
  }

  // Get patients with exam count
  async getPatientsWithExamCount(page = 1, pageSize = 100) {
    return this.apiCall(`/api/HIVExamination/patients?page=${page}&pageSize=${pageSize}`);
  }

  // Get doctors
  async getDoctors() {
    return this.apiCall("/api/HIVExamination/doctors");
  }

  // Get patient history
  async getPatientHistory(patientId) {
    return this.apiCall(`/api/HIVExamination/patient/${patientId}/examinations`);
  }

  // Save examination (create or update)
  async saveExamination(data) {
    return this.apiCall("/api/HIVExamination/save", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  // Delete examination
  async deleteExamination(examId) {
    return this.apiCall(`/api/HIVExamination/${examId}`, {
      method: "DELETE"
    });
  }

  // Helper method for avatar URL
  getAvatarUrl(avatarPath) {
    return avatarPath ? `${API_BASE}/api/Account/avatar/${avatarPath}` : "/assets/image/patient/patient.png";
  }
}

const hivExaminationService = new HIVExaminationService();
export default hivExaminationService;