
const API_BASE_URL = "https://localhost:7243/api";

// Get patient information by ID
export const getPatientInfoApi = async (patientId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Appointment/patient/${patientId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Không tìm thấy thông tin người dùng");
      }
      throw new Error("Lỗi khi tải thông tin người dùng");
    }

    const patientData = await response.json();
    return patientData;
  } catch (error) {
    console.error("Error fetching patient info:", error);
    throw error;
  }
};

// Get doctor information by ID
export const getDoctorInfoApi = async (doctorId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Appointment/doctor/${doctorId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Không tìm thấy thông tin bác sĩ");
      }
      throw new Error("Lỗi khi tải thông tin bác sĩ");
    }

    const doctorData = await response.json();
    return doctorData;
  } catch (error) {
    console.error("Error fetching doctor info:", error);
    throw error;
  }
};

// Get list of doctors
export const getDoctorsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/Appointment`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách bác sĩ");
    }

    const doctors = await response.json();
    return doctors;
  } catch (error) {
    console.error("Error fetching doctors:", error);
    throw error;
  }
};

// Fixed: Get doctor schedules by doctor ID
export const getDoctorSchedulesApi = async (doctorId) => {
  try {
    console.log("🚀 getDoctorSchedulesApi called with doctorId:", doctorId);
    
    const response = await fetch(`${API_BASE_URL}/Appointment/${doctorId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);
      throw new Error(`HTTP ${response.status}: Không thể tải lịch khám`);
    }

    const schedules = await response.json();
    console.log("✅ Raw API Response:", schedules);
    
    // Ensure we return an array
    if (!Array.isArray(schedules)) {
      console.warn("⚠️ API returned non-array data:", schedules);
      return [];
    }

    // Log each schedule to debug structure
    schedules.forEach((schedule, index) => {
      console.log(`📅 Schedule ${index}:`, {
        scheduleId: schedule.scheduleId || schedule.ScheduleId,
        scheduledTime: schedule.scheduledTime || schedule.ScheduledTime,
        room: schedule.room || schedule.Room,
        status: schedule.status || schedule.Status,
        rawData: schedule
      });
    });

    // Filter only available schedules if status field exists
    const availableSchedules = schedules.filter((s) => {
      const status = s.status || s.Status;
      return !status || status === "ACTIVE" || status === "Active" || status === "active";
    });

    console.log(`🔍 Filtered ${availableSchedules.length} available schedules from ${schedules.length} total`);

    // Sort schedules by date
    const sortedSchedules = availableSchedules.sort((a, b) => {
      const dateA = new Date(a.scheduledTime || a.ScheduledTime);
      const dateB = new Date(b.scheduledTime || b.ScheduledTime);
      return dateA - dateB;
    });

    console.log("📊 Final sorted schedules:", sortedSchedules);
    return sortedSchedules;

  } catch (error) {
    console.error("💥 Error in getDoctorSchedulesApi:", error);
    throw error;
  }
};

// Create new appointment
// Fixed createAppointmentApi function
export const createAppointmentApi = async (appointmentData) => {
  try {
    console.log("\n🚀 === CREATE APPOINTMENT API ===");
    console.log("Input appointmentData:", appointmentData);
    console.log("appointmentDate type:", typeof appointmentData.appointmentDate);
    console.log("appointmentDate value:", appointmentData.appointmentDate);
    
    // Nếu appointmentDate là Date object, cần convert cẩn thận
    let finalAppointmentData = { ...appointmentData };
    
    if (appointmentData.appointmentDate instanceof Date) {
      console.log("⚠️ appointmentDate is Date object, converting...");
      finalAppointmentData.appointmentDate = appointmentData.appointmentDate.toISOString();
    } else if (typeof appointmentData.appointmentDate === 'string') {
      console.log("✅ appointmentDate is already string");
      // Giữ nguyên string format
      finalAppointmentData.appointmentDate = appointmentData.appointmentDate;
    } else {
      console.warn("⚠️ Unknown appointmentDate type, converting to string");
      finalAppointmentData.appointmentDate = String(appointmentData.appointmentDate);
    }
    
    console.log("📤 Final data to send:", finalAppointmentData);
    
    const response = await fetch(`${API_BASE_URL}/Appointment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalAppointmentData),
    });

    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);
      throw new Error(errorText || "Không thể tạo lịch hẹn");
    }

    // Backend trả về text "create success", không phải JSON
    const result = await response.text();
    console.log("✅ API Success Response:", result);
    
    // Log để kiểm tra xem appointment có được tạo đúng không
    console.log("🎯 Appointment should be created with appointmentDate:", finalAppointmentData.appointmentDate);
    
    return result;
  } catch (error) {
    console.error("💥 Error in createAppointmentApi:", error);
    throw error;
  }
};

// Get all appointments
export const getAppointmentsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/Appointment/GetAll`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách lịch hẹn");
    }

    const appointments = await response.json();
    return appointments;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
};

// Cancel appointment (old method)
export const cancelAppointmentApi = async (appointmentId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/Appointment/delete/${appointmentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Không tìm thấy lịch hẹn");
      }
      throw new Error("Không thể hủy lịch hẹn");
    }

    // Backend returns text "delete success", not JSON
    const result = await response.text();
    return result;
  } catch (error) {
    console.error("Error canceling appointment:", error);
    throw error;
  }
};

export const updateAppointmentStatusApi = async (appointmentId, status, note = null) => {
  try {
    const requestBody = {
      appointmentId: appointmentId,
      status: status,
      note: note
    };

    const response = await fetch(`${API_BASE_URL}/Appointment/update-status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = "Không thể cập nhật status";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
};

export const confirmAppointmentApi = async (appointmentId, note = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Appointment/confirm/${appointmentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: note ? JSON.stringify(note) : null,
    });

    if (!response.ok) {
      let errorMessage = "Không thể xác nhận lịch hẹn";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error confirming appointment:", error);
    throw error;
  }
};
export const completeAppointmentApi = async (appointmentId, note = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Appointment/complete/${appointmentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: note ? JSON.stringify(note) : null,
    });

    if (!response.ok) {
      let errorMessage = "Không thể hoàn thành lịch hẹn";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error completing appointment:", error);
    throw error;
  }
};

export const getAppointmentByIdApi = async (appointmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Appointment/${appointmentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Không tìm thấy lịch hẹn");
      }
      throw new Error("Lỗi khi tải thông tin lịch hẹn");
    }

    const appointment = await response.json();
    return appointment;
  } catch (error) {
    console.error("Error fetching appointment:", error);
    throw error;
  }
};

// Static list of valid statuses (since we don't have the endpoint)
export const getValidStatusesApi = async () => {
  return ['CONFIRMED', 'COMPLETED', 'CANCELLED'];
};

// Static list of valid transitions (since we don't have the endpoint)
export const getValidTransitionsApi = async (currentStatus) => {
  const validTransitions = {
    'CONFIRMED': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'CANCELLED': []
  };
  
  return validTransitions[currentStatus] || [];
};

// Helper function to format date for display
export const formatAppointmentDate = (dateString) => {
  const date = new Date(dateString);
  const dayNames = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const dayName = dayNames[date.getDay()];

  return {
    dayName,
    date: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
    time: `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`,
    fullDateTime: date,
  };
};

// Helper function to check if appointment time is in the past
export const isAppointmentPast = (dateString) => {
  const appointmentDate = new Date(dateString);
  const now = new Date();
  return appointmentDate < now;
};

export const getAllSchedulesOfDoctorApi = async (doctorId) => {
  try {
    console.log("🚀 getAllSchedulesOfDoctorApi called with doctorId:", doctorId);
    
    const response = await fetch(`${API_BASE_URL}/Appointment/GetAllSchedule/${doctorId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);
      throw new Error(`HTTP ${response.status}: Không thể tải tất cả lịch khám`);
    }

    const schedules = await response.json();
    console.log("✅ Raw API Response from GetAllSchedule:", schedules);
    
    // Ensure we return an array
    if (!Array.isArray(schedules)) {
      console.warn("⚠️ API returned non-array data:", schedules);
      return [];
    }

    // Log each schedule to debug structure
    schedules.forEach((schedule, index) => {
      console.log(`📅 All Schedule ${index}:`, {
        scheduleId: schedule.scheduleId || schedule.ScheduleId,
        scheduledTime: schedule.scheduledTime || schedule.ScheduledTime,
        room: schedule.room || schedule.Room,
        status: schedule.status || schedule.Status,
        rawData: schedule
      });
    });

    console.log("📊 Total schedules returned:", schedules.length);
    return schedules;

  } catch (error) {
    console.error("💥 Error in getAllSchedulesOfDoctorApi:", error);
    throw error;
  }
};

// Main appointmentService object
export const appointmentService = {
  getPatientInfo: getPatientInfoApi,
  getDoctorInfo: getDoctorInfoApi,
  getDoctors: getDoctorsApi,
  getDoctorSchedules: getDoctorSchedulesApi,
  getAllSchedulesOfDoctor: getAllSchedulesOfDoctorApi,
  createAppointment: createAppointmentApi,
  getAppointments: getAppointmentsApi,
  cancelAppointment: cancelAppointmentApi,
  
  // New status management methods
  updateAppointmentStatus: updateAppointmentStatusApi,
  confirmAppointment: confirmAppointmentApi,
  completeAppointment: completeAppointmentApi,
  getAppointmentById: getAppointmentByIdApi,
  getValidStatuses: getValidStatusesApi,
  getValidTransitions: getValidTransitionsApi,
  
  formatDate: formatAppointmentDate,
  isPast: isAppointmentPast,
};

// Default export
export default appointmentService;