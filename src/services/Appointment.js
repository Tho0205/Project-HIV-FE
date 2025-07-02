// import { apiRequest } from "./account";
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

// Get doctor schedules by doctor ID
export const getDoctorSchedulesApi = async (doctorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Appointment/${doctorId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Không thể tải lịch khám");
    }

    const schedules = await response.json();

    // Filter only available schedules if status field exists
    const availableSchedules = schedules.filter(
      (s) => !s.status || s.status === "Active" || s.status === "active"
    );

    // Sort schedules by date
    availableSchedules.sort(
      (a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)
    );

    return availableSchedules;
  } catch (error) {
    console.error("Error fetching doctor schedules:", error);
    throw error;
  }
};

// Create new appointment
export const createAppointmentApi = async (appointmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Appointment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Không thể tạo lịch hẹn");
    }

    // Backend returns text "create success", not JSON
    const result = await response.text();
    return result;
  } catch (error) {
    console.error("Error creating appointment:", error);
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

// NEW STATUS MANAGEMENT METHODS (using existing endpoints)

// Update appointment status using the available endpoint
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

// Confirm appointment using the available endpoint
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

// Complete appointment using the available endpoint
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

// Get appointment by ID using the available endpoint
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

// Main appointmentService object
export const appointmentService = {
  getPatientInfo: getPatientInfoApi,
  getDoctorInfo: getDoctorInfoApi,
  getDoctors: getDoctorsApi,
  getDoctorSchedules: getDoctorSchedulesApi,
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