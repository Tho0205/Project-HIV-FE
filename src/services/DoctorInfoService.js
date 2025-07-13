import { apiRequest } from "./account";

const API_BASE = "https://localhost:7243";

class DoctorInfoService {
  async getAllDoctors() {
    try {
      console.log("🔍 Fetching all doctors...");
      const response = await apiRequest(`${API_BASE}/api/DoctorInfo`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async updateDoctor(doctorId, doctorData) {
    try {
      // Ensure the data is properly formatted
      const updateData = {
        degree: doctorData.degree || null,
        specialization: doctorData.specialization || null,
        experienceYears: doctorData.experienceYears ? parseInt(doctorData.experienceYears) : null,
        doctorAvatar: doctorData.doctorAvatar || null,
        status: doctorData.status || "ACTIVE"
      };

      console.log("📤 Sending update data:", updateData);

      const response = await apiRequest(
        `${API_BASE}/api/DoctorInfo/${doctorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error("❌ Error updating doctor:", error);
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed");
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async uploadAvatar(doctorId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem("jwt_token");
      const response = await fetch(
        `${API_BASE}/api/DoctorInfo/upload-avatar/${doctorId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  }

  async syncDoctorUsers() {
    try {
      const response = await apiRequest(
        `${API_BASE}/api/DoctorInfo/sync-doctor-users`,
        {
          method: "POST",
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Sync failed");
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

const doctorInfoService = new DoctorInfoService();
export default doctorInfoService;