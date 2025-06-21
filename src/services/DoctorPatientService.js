const API_BASE = "https://localhost:7243";

class DoctorPatientService {
  // Helper method for API calls
  async apiCall(url, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: { "Content-Type": "application/json" },
        ...options
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Không có quyền truy cập");
        }
        if (response.status === 404) {
          throw new Error("Không tìm thấy dữ liệu");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      // Check if it's a network error
      if (error.message === 'Failed to fetch') {
        console.error("Network Error: Cannot connect to API server");
        return { 
          success: false, 
          message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy." 
        };
      }
      
      console.error("API Error:", error);
      return { 
        success: false, 
        message: error.message || "Lỗi kết nối server" 
      };
    }
  }

  // Get doctor's patients list
  async getDoctorPatients(doctorId, page = 1, pageSize = 8, sortBy = "full_name", order = "asc") {
    return this.apiCall(
      `/api/Doctor/Patients?doctorId=${doctorId}&page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&order=${order}`
    );
  }

  // Update patient information
  async updatePatientInfo(accountId, patientData) {
    return this.apiCall(`/api/Doctor/UpdatePatient/${accountId}`, {
      method: "PUT",
      body: JSON.stringify(patientData)
    });
  }

  // Get patient stats
  async getPatientStats(doctorId) {
    return this.apiCall(`/api/Doctor/PatientStats/${doctorId}`);
  }

  // Get patient history
  async getPatientHistory(patientId, doctorId) {
    return this.apiCall(`/api/Doctor/PatientHistory/${patientId}?doctorId=${doctorId}`);
  }

  // Get patient detail
  async getPatientDetail(patientId, doctorId) {
    return this.apiCall(`/api/Doctor/PatientDetail/${patientId}?doctorId=${doctorId}`);
  }

  // Create or update examination
  async saveExamination(examData) {
    return this.apiCall("/api/HIVExamination/save", {
      method: "POST",
      body: JSON.stringify(examData)
    });
  }

  // Delete examination (soft delete - set status to INACTIVE)
  async deleteExamination(examId) {
    return this.apiCall(`/api/HIVExamination/${examId}`, {
      method: "DELETE"
    });
  }

  // Helper method for avatar URL
  getAvatarUrl(avatarPath) {
    return avatarPath 
      ? `${API_BASE}/api/Account/avatar/${avatarPath}` 
      : "/assets/image/patient/patient.png";
  }
}

const doctorPatientService = new DoctorPatientService();
export default doctorPatientService;