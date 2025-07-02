import { apiRequest } from "./account";

const API_BASE = "https://localhost:7243";

class DoctorInfoService {
  async getAllDoctors() {
    try {
      console.log("🔍 Fetching all doctors...");
      const response = await apiRequest(`${API_BASE}/api/DoctorInfo`);
      const data = await response.json();
      console.log("✅ Doctors fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error in getAllDoctors:", error);
      throw error;
    }
  }

  async getActiveDoctors() {
    try {
      const response = await apiRequest(`${API_BASE}/api/DoctorInfo/active`);
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getDoctorById(doctorId) {
    try {
      const response = await apiRequest(
        `${API_BASE}/api/DoctorInfo/${doctorId}`
      );
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async createDoctor(doctorData) {
    try {
      const response = await apiRequest(`${API_BASE}/api/DoctorInfo`, {
        method: "POST",
        body: JSON.stringify(doctorData),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async updateDoctor(doctorId, doctorData) {
    try {
      const response = await apiRequest(
        `${API_BASE}/api/DoctorInfo/${doctorId}`,
        {
          method: "PUT",
          body: JSON.stringify(doctorData),
        }
      );
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async deleteDoctor(doctorId) {
    try {
      const response = await apiRequest(
        `${API_BASE}/api/DoctorInfo/${doctorId}`,
        {
          method: "DELETE",
        }
      );
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const response = await apiRequest(`${API_BASE}/api/Users`);
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getDoctorsWithUserInfo() {
    try {
      const [doctors, users] = await Promise.all([
        this.getAllDoctors(),
        this.getAllUsers(),
      ]);

      return doctors.map((doctor) => {
        const user = users.find((u) => u.userId === doctor.doctorId);
        return {
          ...doctor,
          fullName: user?.fullName || "N/A",
          email: user?.account?.email || user?.email || "N/A",
          phone: user?.phone || "N/A",
          gender: user?.gender || "N/A",
          userAvatar: user?.userAvatar || null,
        };
      });
    } catch (error) {
      console.error("Error fetching doctors with user info:", error);
      throw error;
    }
  }
}

const doctorInfoService = new DoctorInfoService();
export default doctorInfoService;
