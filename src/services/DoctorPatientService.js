import { apiRequest } from "./account";
const API_BASE = "https://localhost:7243";

class DoctorPatientService {
  // Helper method for API calls with better error handling
  async apiCall(url, options = {}) {
    try {
      const response = await apiRequest(`${API_BASE}${url}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });

      if (!response) {
        return { success: false, message: "Không có phản hồi từ server" };
      }

      if (!response.ok) {
        const statusMessages = {
          403: "Không có quyền truy cập",
          404: "Không tìm thấy dữ liệu",
        };
        return {
          success: false,
          message:
            statusMessages[response.status] || `Lỗi server: ${response.status}`,
        };
      }

      if (response.status === 204) {
        return { success: true };
      }

      try {
        const data = await response.json();
        return { success: true, data };
      } catch (jsonError) {
        console.error("JSON Parse Error:", jsonError);
        return { success: true, data: null };
      }
    } catch (error) {
      console.error("API Error:", error);

      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        return {
          success: false,
          message:
            "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
        };
      }

      return {
        success: false,
        message: error.message || "Lỗi không xác định",
      };
    }
  }

  // API Methods
  async getDoctorPatients(
    doctorId,
    page = 1,
    pageSize = 8,
    sortBy = "full_name",
    order = "asc",
    scheduleDate = null,
    hasScheduleOnly = false
  ) {
    let url = `/api/Doctor/Patients?doctorId=${doctorId}&page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&order=${order}`;

    if (scheduleDate) {
      url += `&scheduleDate=${scheduleDate}`;
    }

    if (hasScheduleOnly) {
      url += `&hasScheduleOnly=true`;
    }

    return this.apiCall(url);
  }

  async getAllPatients(
    searchTerm = null,
    page = 1,
    pageSize = 10,
    sortBy = "full_name",
    order = "asc"
  ) {
    let url = `/api/Doctor/AllPatients?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&order=${order}`;

    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    return this.apiCall(url);
  }

  async getPatientStats(doctorId) {
    return this.apiCall(`/api/Doctor/PatientStats/${doctorId}`);
  }

  async getAvailablePatients() {
    return this.apiCall("/api/Doctor/AvailablePatients");
  }

  async assignPatientToDoctor(doctorId, patientId) {
    return this.apiCall("/api/Doctor/AssignPatient", {
      method: "POST",
      body: JSON.stringify({ doctorId, patientId }),
    });
  }

  async getPatientHistory(patientId, doctorId) {
    return this.apiCall(
      `/api/Doctor/PatientHistory/${patientId}?doctorId=${doctorId}`
    );
  }

  async getPatientDetail(patientId, doctorId) {
    return this.apiCall(
      `/api/Doctor/PatientDetail/${patientId}?doctorId=${doctorId}`
    );
  }

  async saveExamination(examData) {
    return this.apiCall("/api/HIVExamination/save", {
      method: "POST",
      body: JSON.stringify(examData),
    });
  }

  async deleteExamination(examId) {
    return this.apiCall(`/api/HIVExamination/${examId}`, {
      method: "DELETE",
    });
  }

  // Fixed avatar URL helper - sửa đường dẫn ảnh mặc định
  getAvatarUrl(avatarPath) {
    // Đường dẫn mặc định - sửa từ patient.png thành default-avatar.png
    const DEFAULT_AVATAR = "/assets/image/patient/patient.png";

    if (!avatarPath) {
      return DEFAULT_AVATAR;
    }

    // Check if it's already a full URL
    if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
      return avatarPath;
    }

    // Check if it starts with /
    if (avatarPath.startsWith("/")) {
      return `${API_BASE}${avatarPath}`;
    }

    // Otherwise, assume it's just the filename
    return `${API_BASE}/api/Account/avatar/${avatarPath}`;
  }
}

const doctorPatientService = new DoctorPatientService();
export default doctorPatientService;