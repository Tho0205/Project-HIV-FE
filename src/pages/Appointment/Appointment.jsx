import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Clock,
  Search,
  Phone,
  Shield,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getDoctorsApi,
  getPatientInfoApi,
  getDoctorSchedulesApi,
  createAppointmentApi,
} from "../../services/Appointment";
import { getAppointmentsApi } from "../../services/Appointment";
import { tokenManager } from "../../services/account";

const Appointment = () => {
  // State management
  const [currentPatientInfo, setCurrentPatientInfo] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [note, setNote] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load doctors and patient info on component mount
  const navigate = useNavigate();
  useEffect(() => {
    const role = tokenManager.getCurrentUserRole();
    console.log("Component mounted");
    console.log("All localStorage data:", {
      username: localStorage.getItem("username"),
      role: localStorage.getItem("role"),
      account_id: localStorage.getItem("account_id"),
      user_id: localStorage.getItem("user_id"),
    });
    loadDoctors();
    loadCurrentUserInfo();
  }, []);

  // Load current user's patient information from localStorage
  const loadCurrentUserInfo = async () => {
    const userId = tokenManager.getCurrentUserId();
    console.log("User ID from localStorage:", userId);

    if (!userId) {
      showError("Vui lòng đăng nhập để đặt lịch khám");
      return;
    }

    try {
      setLoading(true);
      const numericUserId = parseInt(userId);
      if (isNaN(numericUserId)) {
        throw new Error("ID người dùng không hợp lệ");
      }

      const patientData = await getPatientInfoApi(numericUserId);
      setCurrentPatientInfo(patientData);
    } catch (error) {
      console.error("Error loading patient info:", error);

      if (error.message.includes("404")) {
        console.warn("User not found, using temporary data for testing");
        setCurrentPatientInfo({
          fullName: localStorage.getItem("username") || "Người dùng",
          gender: "M",
          birthdate: "2000-01-01",
          phone: "0123456789",
        });
        showError(
          "Không tìm thấy thông tin bệnh nhân. Đang sử dụng dữ liệu tạm."
        );
      } else {
        showError(
          error.message ||
            "Không thể tải thông tin của bạn. Vui lòng thử lại sau."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Load doctors
  const loadDoctors = async () => {
    try {
      const userId = tokenManager.getCurrentUserId();
      if (userId === null) {
      } else {
        setLoading(true);
        const doctorsData = await getDoctorsApi();
        setDoctors(doctorsData);
      }
    } catch (error) {
      console.error("Error:", error);
      showError("Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // FUNCTIONS FOR DUPLICATE APPOINTMENT PREVENTION

  // 1. Kiểm tra lịch hẹn trùng lặp chính xác (cùng bác sĩ, cùng schedule)
  const checkExistingAppointments = async (patientId, doctorId, scheduleId) => {
    try {
      // Lấy tất cả lịch hẹn của bệnh nhân
      const allAppointments = await getAppointmentsApi();

      // Lọc các lịch hẹn của bệnh nhân hiện tại
      const patientAppointments = allAppointments.filter((appointment) => {
        const appPatientId = appointment.patientId || appointment.PatientId;
        return appPatientId === patientId;
      });

      // Kiểm tra xem có lịch hẹn nào với cùng bác sĩ và cùng schedule không
      const duplicateAppointment = patientAppointments.find((appointment) => {
        const appDoctorId = appointment.doctorId || appointment.DoctorId;
        const appScheduleId = appointment.scheduleId || appointment.ScheduleId;
        const appStatus = appointment.status;

        // Chỉ kiểm tra các lịch hẹn chưa hủy và chưa hoàn thành
        const activeStatuses = ["SCHEDULED", "CONFIRMED", "CHECKED_IN"];

        return (
          appDoctorId === doctorId &&
          appScheduleId === scheduleId &&
          activeStatuses.includes(appStatus)
        );
      });

      return duplicateAppointment;
    } catch (error) {
      console.error("Error checking existing appointments:", error);
      return null;
    }
  };

  // 2. Kiểm tra lịch hẹn cùng thời gian với bác sĩ (cùng ca)
  const checkSameDoctorSameTime = async (
    patientId,
    doctorId,
    selectedScheduleTime
  ) => {
    try {
      const allAppointments = await getAppointmentsApi();

      const conflictingAppointments = allAppointments.filter((appointment) => {
        const appPatientId = appointment.patientId || appointment.PatientId;
        const appDoctorId = appointment.doctorId || appointment.DoctorId;
        const appStatus = appointment.status;

        // Chỉ kiểm tra lịch hẹn active của chính bệnh nhân này
        const activeStatuses = ["SCHEDULED", "CONFIRMED", "CHECKED_IN"];

        if (appPatientId !== patientId || !activeStatuses.includes(appStatus)) {
          return false;
        }

        // Kiểm tra cùng bác sĩ
        if (appDoctorId === doctorId) {
          const appointmentDate = new Date(
            appointment.appointmentDate || appointment.createdAt
          );
          const selectedDate = new Date(selectedScheduleTime);

          // Kiểm tra cùng ngày
          if (appointmentDate.toDateString() === selectedDate.toDateString()) {
            // Kiểm tra cùng ca (sáng hoặc chiều)
            const appointmentHour = appointmentDate.getHours();
            const selectedHour = selectedDate.getHours();

            const appointmentShift =
              appointmentHour < 13 ? "morning" : "afternoon";
            const selectedShift = selectedHour < 13 ? "morning" : "afternoon";

            return appointmentShift === selectedShift;
          }
        }

        return false;
      });

      return conflictingAppointments;
    } catch (error) {
      console.error("Error checking same doctor same time:", error);
      return [];
    }
  };

  // 3. Lọc schedules để loại bỏ những lịch mà bệnh nhân đã đặt
  const filterSchedulesForPatient = async (schedules, patientId) => {
    try {
      const allAppointments = await getAppointmentsApi();

      // Lấy danh sách scheduleId mà bệnh nhân đã đặt (trạng thái active)
      const bookedScheduleIds = allAppointments
        .filter((appointment) => {
          const appPatientId = appointment.patientId || appointment.PatientId;
          const appStatus = appointment.status;
          const activeStatuses = ["SCHEDULED", "CONFIRMED", "CHECKED_IN"];

          return (
            appPatientId === patientId && activeStatuses.includes(appStatus)
          );
        })
        .map((appointment) => appointment.scheduleId || appointment.ScheduleId);

      // Lọc ra những schedule mà bệnh nhân chưa đặt
      const availableSchedules = schedules.filter((schedule) => {
        return !bookedScheduleIds.includes(schedule.scheduleId);
      });

      console.log("Filtered schedules for patient:", {
        originalCount: schedules.length,
        bookedScheduleIds,
        availableCount: availableSchedules.length,
      });

      return availableSchedules;
    } catch (error) {
      console.error("Error filtering schedules for patient:", error);
      return schedules; // Trả về schedules gốc nếu có lỗi
    }
  };

  // Load schedules with 5-person booking limit and patient duplicate prevention
  const loadSchedules = async (doctorId) => {
    try {
      setLoading(true);
      console.log("Loading schedules for doctor:", doctorId);

      // 1. Get doctor schedules
      const schedulesData = await getDoctorSchedulesApi(doctorId);
      console.log("Raw schedules data:", schedulesData);

      // Ensure schedulesData is an array
      const schedulesArray = Array.isArray(schedulesData) ? schedulesData : [];

      if (schedulesArray.length === 0) {
        console.log("No schedules found for doctor:", doctorId);
        setSchedules([]);
        setSelectedScheduleId(null);
        return;
      }

      // 2. Get all appointments to count bookings per schedule
      const allAppointments = await getAppointmentsApi();
      console.log("All appointments:", allAppointments);

      // Map and normalize the schedules data
      const normalizedSchedules = schedulesArray.map((schedule) => ({
        scheduleId: schedule.scheduleId || schedule.ScheduleId || schedule.id,
        scheduledTime: schedule.scheduledTime || schedule.ScheduledTime,
        room: schedule.room || schedule.Room,
        status: schedule.status || schedule.Status || "ACTIVE",
        doctorId: schedule.doctorId || schedule.DoctorId || doctorId,
      }));

      console.log("Normalized schedules:", normalizedSchedules);

      // 3. Filter schedules: only show FUTURE schedules that haven't reached booking limit
      const now = new Date();
      const MAX_BOOKINGS_PER_SCHEDULE = 5; // Maximum 5 people can book the same schedule

      const filteredSchedules = normalizedSchedules.filter((schedule) => {
        // Check if schedule has required fields
        if (!schedule.scheduleId || !schedule.scheduledTime) {
          console.warn("Schedule missing required fields:", schedule);
          return false;
        }

        const scheduleDate = new Date(schedule.scheduledTime);

        // Check if date is valid
        if (isNaN(scheduleDate.getTime())) {
          console.warn("Invalid schedule date:", schedule.scheduledTime);
          return false;
        }

        // Check if schedule is in the future
        const isFuture = scheduleDate > now;

        // Check if schedule is active
        const isActive =
          !schedule.status ||
          schedule.status === "ACTIVE" ||
          schedule.status === "Active";

        // Count how many appointments are already booked for this schedule
        const bookingCount = allAppointments.filter((appointment) => {
          const appointmentScheduleId =
            appointment.scheduleId || appointment.ScheduleId;
          const appointmentStatus = appointment.status || appointment.Status;

          // Count only non-cancelled appointments
          return (
            appointmentScheduleId === schedule.scheduleId &&
            appointmentStatus !== "CANCELLED" &&
            appointmentStatus !== "REJECTED" &&
            appointmentStatus !== "CANCELED"
          ); // Handle different spelling variations
        }).length;

        // Check if schedule hasn't reached booking limit
        const hasAvailableSlots = bookingCount < MAX_BOOKINGS_PER_SCHEDULE;

        console.log("Schedule filter check:", {
          scheduleId: schedule.scheduleId,
          scheduledTime: schedule.scheduledTime,
          status: schedule.status,
          isFuture,
          isActive,
          bookingCount,
          hasAvailableSlots,
          maxBookings: MAX_BOOKINGS_PER_SCHEDULE,
          willShow: isFuture && isActive && hasAvailableSlots,
        });

        return isFuture && isActive && hasAvailableSlots;
      });

      // 4. Filter schedules để loại bỏ những lịch mà bệnh nhân đã đặt
      const userId = tokenManager.getCurrentUserId();
      const patientFilteredSchedules = userId
        ? await filterSchedulesForPatient(filteredSchedules, parseInt(userId))
        : filteredSchedules;

      // 5. Add booking count info to each schedule for display
      const schedulesWithBookingInfo = patientFilteredSchedules.map(
        (schedule) => {
          const bookingCount = allAppointments.filter((appointment) => {
            const appointmentScheduleId =
              appointment.scheduleId || appointment.ScheduleId;
            const appointmentStatus = appointment.status || appointment.Status;

            return (
              appointmentScheduleId === schedule.scheduleId &&
              appointmentStatus !== "CANCELLED" &&
              appointmentStatus !== "REJECTED" &&
              appointmentStatus !== "CANCELED"
            );
          }).length;

          return {
            ...schedule,
            bookingCount,
            availableSlots: MAX_BOOKINGS_PER_SCHEDULE - bookingCount,
          };
        }
      );

      console.log(
        "Final filtered schedules with booking info:",
        schedulesWithBookingInfo
      );

      setSchedules(schedulesWithBookingInfo);
      setSelectedScheduleId(null);
    } catch (error) {
      console.error("Error loading schedules:", error);
      showError("Không thể tải lịch khám. Vui lòng thử lại.");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle doctor selection
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctorId(doctorId);
    setSelectedScheduleId(null);

    if (doctorId) {
      loadSchedules(doctorId);
    } else {
      setSchedules([]);
    }
  };

  // Handle form submission with duplicate prevention
  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = tokenManager.getCurrentUserId();

    if (!userId || !currentPatientInfo) {
      showError("Vui lòng đăng nhập để đặt lịch khám");
      return;
    }

    if (!selectedScheduleId) {
      showError("Vui lòng chọn thời gian khám");
      return;
    }

    if (!termsAccepted) {
      showError("Vui lòng đồng ý với điều khoản sử dụng");
      return;
    }

    const selectedSchedule = schedules.find(
      (s) => s.scheduleId === selectedScheduleId
    );

    if (!selectedSchedule) {
      showError("Lịch khám đã chọn không hợp lệ");
      return;
    }

    // Check availability one more time before booking
    if (selectedSchedule.availableSlots <= 0) {
      showError("Lịch khám này đã đầy. Vui lòng chọn lịch khác!");
      return;
    }

    // Additional check: prevent booking past appointments
    if (isSchedulePast(selectedSchedule.scheduledTime)) {
      showError("Không thể đặt lịch cho thời gian đã qua");
      return;
    }

    // KIỂM TRA DUPLICATE APPOINTMENT
    try {
      setLoading(true);

      // 1. Kiểm tra lịch hẹn trùng lặp chính xác
      const duplicateAppointment = await checkExistingAppointments(
        parseInt(userId),
        parseInt(selectedDoctorId),
        parseInt(selectedScheduleId)
      );

      if (duplicateAppointment) {
        showError(
          "Bạn đã có lịch hẹn với bác sĩ này trong thời gian này. Vui lòng chọn thời gian khác hoặc kiểm tra lại lịch sử đặt khám."
        );
        setLoading(false);
        return;
      }

      // 2. Kiểm tra cùng bác sĩ cùng thời gian (cùng ca)
      const conflictingAppointments = await checkSameDoctorSameTime(
        parseInt(userId),
        parseInt(selectedDoctorId),
        selectedSchedule.scheduledTime
      );

      if (conflictingAppointments.length > 0) {
        const conflictInfo = conflictingAppointments[0];
        const conflictDate = new Date(
          conflictInfo.appointmentDate || conflictInfo.createdAt
        );
        const formattedDate = conflictDate.toLocaleDateString("vi-VN");
        const formattedTime = conflictDate.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        showError(
          `Bạn đã có lịch hẹn với bác sĩ này vào ${formattedDate} lúc ${formattedTime}. Không thể đặt thêm lịch trong cùng ca khám.`
        );
        setLoading(false);
        return;
      }

      // 3. Tiếp tục với quy trình đặt lịch bình thường
      console.log("\n🔍 === TIMEZONE DEBUGGING ===");
      console.log("Selected schedule object:", selectedSchedule);
      console.log("Original scheduledTime:", selectedSchedule.scheduledTime);
      console.log(
        "Type of scheduledTime:",
        typeof selectedSchedule.scheduledTime
      );

      const testDate = new Date(selectedSchedule.scheduledTime);
      console.log("Date object:", testDate);
      console.log("getHours():", testDate.getHours());
      console.log("getMinutes():", testDate.getMinutes());
      console.log("toLocaleString():", testDate.toLocaleString());
      console.log("toISOString():", testDate.toISOString());
      console.log("getTimezoneOffset():", testDate.getTimezoneOffset());

      let appointmentDateValue = selectedSchedule.scheduledTime;

      if (typeof appointmentDateValue !== "string") {
        appointmentDateValue = appointmentDateValue.toString();
      }

      console.log("Final appointmentDate to send:", appointmentDateValue);

      const formData = {
        patientId: parseInt(userId),
        scheduleId: parseInt(selectedScheduleId),
        doctorId: parseInt(selectedDoctorId),
        note: note || null,
        isAnonymous: isAnonymous,
        appointmentDate: appointmentDateValue,
      };

      console.log("\n📤 Final form data being sent:");
      console.log(JSON.stringify(formData, null, 2));

      console.log("🚀 Calling createAppointmentApi...");
      const result = await createAppointmentApi(formData);
      console.log("✅ API Response:", result);

      setShowSuccessModal(true);

      // Reset form and reload schedules to update availability
      resetForm();
      if (selectedDoctorId) {
        loadSchedules(selectedDoctorId);
      }
    } catch (error) {
      console.error("❌ Error creating appointment:", error);
      showError(error.message || "Không thể đặt lịch hẹn. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedDoctorId("");
    setSchedules([]);
    setSelectedScheduleId(null);
    setNote("");
    setIsAnonymous(false);
    setTermsAccepted(false);
    loadCurrentUserInfo();
  };

  // Helper functions
  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatGender = (gender) => {
    return gender === "Male"
      ? "Nam"
      : gender === "Female"
      ? "Nữ"
      : gender || "-";
  };

  const formatScheduleTime = (dateString) => {
    const date = new Date(dateString);

    console.log("Original dateString:", dateString);
    console.log("Parsed date:", date);
    console.log("Local time:", date.toLocaleString());

    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayName = dayNames[date.getDay()];

    const time = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    console.log("Formatted time:", time);

    return { date, dayName, time };
  };

  const isSchedulePast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const selectedDoctor = doctors.find((d) => d.userId === selectedDoctorId);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #dcd5d5)",
        minHeight: "100vh",
        padding: "2rem 1rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            background: "white",
            borderRadius: "1.5rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth >= 768 ? "1fr 1fr" : "1fr",
              gap: 0,
            }}
          >
            {/* Left Column - Form */}
            <div
              style={{ padding: window.innerWidth >= 768 ? "3rem" : "2rem" }}
            >
              <h1
                style={{
                  fontSize: "1.875rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: "2rem",
                }}
              >
                Nội dung chi tiết đặt hẹn
              </h1>

              <form onSubmit={handleSubmit}>
                {/* Patient Info Display */}
                {currentPatientInfo ? (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      padding: "1rem",
                      backgroundColor: "#dbeafe",
                      borderRadius: "0.5rem",
                      opacity: isAnonymous ? 0.5 : 1,
                      transition: "opacity 0.3s",
                    }}
                  >
                    <h3
                      style={{
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <User
                        style={{
                          color: "#2563eb",
                          marginRight: "0.5rem",
                          width: "1.25rem",
                          height: "1.25rem",
                        }}
                      />
                      Thông tin cá nhân
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div>
                        <span style={{ color: "#4b5563" }}>Họ Và tên:</span>
                        <p
                          style={{
                            fontWeight: "500",
                            color: "#1f2937",
                            margin: 0,
                          }}
                        >
                          {currentPatientInfo.fullName ||
                            currentPatientInfo.FullName ||
                            "-"}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: "#4b5563" }}>Giới tính:</span>
                        <p
                          style={{
                            fontWeight: "500",
                            color: "#1f2937",
                            margin: 0,
                          }}
                        >
                          {formatGender(
                            currentPatientInfo.gender ||
                              currentPatientInfo.Gender
                          )}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: "#4b5563" }}>Ngày sinh:</span>
                        <p
                          style={{
                            fontWeight: "500",
                            color: "#1f2937",
                            margin: 0,
                          }}
                        >
                          {currentPatientInfo.birthdate ||
                          currentPatientInfo.Birthdate
                            ? formatDate(
                                currentPatientInfo.birthdate ||
                                  currentPatientInfo.Birthdate
                              )
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <span style={{ color: "#4b5563" }}>Số điện thoại:</span>
                        <p
                          style={{
                            fontWeight: "500",
                            color: "#1f2937",
                            margin: 0,
                          }}
                        >
                          {currentPatientInfo.phone ||
                            currentPatientInfo.Phone ||
                            "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      padding: "2rem",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "0.5rem",
                      textAlign: "center",
                    }}
                  >
                    <User
                      style={{
                        color: "#6b7280",
                        margin: "0 auto 0.5rem",
                        width: "3rem",
                        height: "3rem",
                      }}
                    />
                    <p style={{ color: "#6b7280" }}>
                      Đang tải thông tin của bạn...
                    </p>
                  </div>
                )}

                {/* Doctor Selection */}
                <div style={{ marginBottom: "2rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#0891b2",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Bác sĩ*
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={selectedDoctorId}
                      onChange={handleDoctorChange}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        outline: "none",
                        fontSize: "1rem",
                        appearance: "none",
                        background: "white",
                        cursor: "pointer",
                      }}
                      required
                    >
                      <option value="">Chọn Bác sĩ muốn khám</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.userId} value={doctor.userId}>
                          {`Bác sĩ ${doctor.fullName}` ||
                            `Bác sĩ ${doctor.userId}`}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "1rem",
                        color: "#9ca3af",
                        pointerEvents: "none",
                      }}
                    >
                      <svg
                        style={{ width: "1rem", height: "1rem" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Doctor Info Display */}
                  {selectedDoctor && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        backgroundColor: "#ecfeff",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <User
                          style={{
                            color: "#0891b2",
                            fontSize: "1.5rem",
                            marginRight: "0.75rem",
                          }}
                        />
                        <div>
                          <p
                            style={{
                              fontWeight: "600",
                              color: "#1f2937",
                              margin: 0,
                            }}
                          >
                            {selectedDoctor.fullName}
                          </p>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#4b5563",
                              margin: 0,
                            }}
                          >
                            Mã BS: {selectedDoctor.userId}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Selection */}
                <div style={{ marginBottom: "2rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#0891b2",
                      marginBottom: "1rem",
                    }}
                  >
                    Thời gian khám*
                  </label>

                  {/* Schedule Buttons Container */}
                  <div
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                      overflowX: "hidden",
                      padding: "0.5rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.75rem",
                      backgroundColor: "#fafafa",
                      marginBottom: "1rem",
                      scrollbarWidth: "thin",
                      scrollbarColor: "#cbd5e1 #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          window.innerWidth >= 768 ? "1fr 1fr 1fr" : "1fr 1fr",
                        gap: "0.75rem",
                      }}
                    >
                      {!selectedDoctorId ? (
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            textAlign: "center",
                            color: "#6b7280",
                            padding: "2rem",
                          }}
                        >
                          <Calendar
                            style={{
                              margin: "0 auto 0.5rem",
                              width: "4rem",
                              height: "4rem",
                            }}
                          />
                          <p>Vui lòng chọn bác sĩ trước</p>
                        </div>
                      ) : schedules.length === 0 ? (
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            textAlign: "center",
                            color: "#6b7280",
                            padding: "2rem",
                          }}
                        >
                          <Calendar
                            style={{
                              margin: "0 auto 0.5rem",
                              width: "4rem",
                              height: "4rem",
                            }}
                          />
                          <p
                            style={{ fontSize: "1.125rem", fontWeight: "500" }}
                          >
                            Bạn đã đặt hết lịch khám có sẵn với bác sĩ này
                          </p>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              marginTop: "0.5rem",
                            }}
                          >
                            Vui lòng chọn bác sĩ khác hoặc kiểm tra lại lịch sử
                            đặt khám
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Render schedule buttons */}
                          {schedules.map((schedule) => {
                            const { date, dayName, time } = formatScheduleTime(
                              schedule.scheduledTime
                            );
                            const isSelected =
                              selectedScheduleId === schedule.scheduleId;

                            return (
                              <button
                                key={schedule.scheduleId}
                                type="button"
                                onClick={() =>
                                  setSelectedScheduleId(schedule.scheduleId)
                                }
                                style={{
                                  padding: "0.75rem 1rem",
                                  borderRadius: "0.5rem",
                                  fontWeight: "500",
                                  textAlign: "center",
                                  border: isSelected
                                    ? "2px solid #14b8a6"
                                    : "2px solid transparent",
                                  cursor: "pointer",
                                  backgroundColor: isSelected
                                    ? "#14b8a6"
                                    : "#ffffff",
                                  color: isSelected ? "white" : "#374151",
                                  fontSize: "0.875rem",
                                  transition: "all 0.2s",
                                  boxShadow: isSelected
                                    ? "0 4px 12px rgba(20, 184, 166, 0.4)"
                                    : "0 1px 3px rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                {/* Date */}
                                <div
                                  style={{
                                    fontSize: "1.125rem",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {date.getDate()}/{date.getMonth() + 1}
                                </div>

                                {/* Day name */}
                                <div style={{ fontSize: "0.875rem" }}>
                                  {dayName}
                                </div>

                                {/* Time */}
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    marginTop: "0.25rem",
                                  }}
                                >
                                  {time}
                                </div>

                                {/* Room */}
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: isSelected
                                      ? "rgba(255,255,255,0.8)"
                                      : "#6b7280",
                                  }}
                                >
                                  Phòng {schedule.room || "N/A"}
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#4b5563",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <AlertTriangle
                      style={{
                        color: "#f59e0b",
                        marginRight: "0.25rem",
                        width: "1rem",
                        height: "1rem",
                      }}
                    />
                    *Lưu ý: Bộ phận chăm sóc khách hàng sẽ liên hệ xác nhận lại
                    thời gian với quý khách.
                  </p>
                </div>

                {/* Anonymous Option */}
                <div style={{ marginBottom: "2rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "1rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.5rem",
                      transition: "background-color 0.2s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      style={{
                        marginRight: "0.75rem",
                        width: "1rem",
                        height: "1rem",
                        accentColor: "#0891b2",
                      }}
                    />
                    <div>
                      <span style={{ fontWeight: "500", color: "#374151" }}>
                        Đặt hẹn ẩn danh
                      </span>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          marginTop: "0.25rem",
                          margin: 0,
                        }}
                      >
                        Thông tin của bạn sẽ được bảo mật
                      </p>
                    </div>
                  </label>
                </div>

                {/* Note Section */}
                <div style={{ marginBottom: "2rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#0891b2",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Ghi chú cho bác sĩ
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Mô tả triệu chứng hoặc yêu cầu đặc biệt (không bắt buộc)"
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      outline: "none",
                      resize: "none",
                      fontFamily: "inherit",
                      fontSize: "1rem",
                    }}
                  />
                </div>

                {/* Terms Agreement */}
                <div style={{ marginBottom: "2rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      style={{
                        marginTop: "0.25rem",
                        marginRight: "0.75rem",
                        accentColor: "#0891b2",
                      }}
                      required
                    />
                    <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                      Tôi đã đọc và đồng ý với các điều khoản sử dụng dịch vụ và
                      cam kết thông tin cung cấp là chính xác. *
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !currentPatientInfo}
                  style={{
                    width: window.innerWidth >= 768 ? "auto" : "100%",
                    padding: "1rem 2rem",
                    backgroundColor:
                      loading || !currentPatientInfo ? "#9ca3af" : "#14b8a6",
                    color: "white",
                    fontWeight: "600",
                    borderRadius: "9999px",
                    border: "none",
                    cursor:
                      loading || !currentPatientInfo
                        ? "not-allowed"
                        : "pointer",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                >
                  <svg
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      marginRight: "0.5rem",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  {loading ? "Đang xử lý..." : "Gửi thông tin đặt hẹn"}
                </button>
              </form>
            </div>

            {/* Right Column - Visual */}
            <div
              style={{
                position: "relative",
                background: "linear-gradient(135deg, #a7f3d0 0%, #bfdbfe 100%)",
                padding: window.innerWidth >= 768 ? "3rem" : "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "relative" }}>
                {/* Main Image */}
                <div
                  style={{
                    position: "relative",
                    borderRadius: "1rem",
                    overflow: "hidden",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop"
                    alt="Doctor consultation"
                    style={{ width: "100%", height: "auto" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, transparent 100%)",
                    }}
                  ></div>
                </div>

                {/* Success Check Circle */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-1rem",
                    right: "-1rem",
                    width: "6rem",
                    height: "6rem",
                    backgroundColor: "#dc2626",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    animation: "pulse 2s infinite",
                  }}
                >
                  <CheckCircle
                    style={{ color: "white", width: "2rem", height: "2rem" }}
                  />
                </div>

                {/* Feature Badges */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "3rem",
                    left: "2rem",
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Shield
                      style={{
                        color: "#14b8a6",
                        width: "1.25rem",
                        height: "1.25rem",
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                      An toàn & Bảo mật
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "5rem",
                    left: "2rem",
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Clock
                      style={{
                        color: "#3b82f6",
                        width: "1.25rem",
                        height: "1.25rem",
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                      Đặt lịch 24/7
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1rem",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "4rem",
                  height: "4rem",
                  border: "4px solid #a7f3d0",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  borderTopColor: "#0891b2",
                }}
              ></div>
            </div>
            <p style={{ color: "#374151", fontWeight: "500" }}>Đang xử lý...</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "28rem",
              margin: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "5rem",
                height: "5rem",
                backgroundColor: "#dcfce7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <CheckCircle
                style={{ color: "#10b981", width: "2.5rem", height: "2.5rem" }}
              />
            </div>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "0.5rem",
              }}
            >
              Đặt hẹn thành công!
            </h3>
            <p
              style={{
                color: "#4b5563",
                marginBottom: "1.5rem",
                lineHeight: "1.6",
              }}
            >
              Chúng tôi đã nhận được yêu cầu đặt hẹn của bạn. Bộ phận chăm sóc
              khách hàng sẽ liên hệ xác nhận trong thời gian sớm nhất.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                // Reload schedules to update availability after successful booking
                if (selectedDoctorId) {
                  loadSchedules(selectedDoctorId);
                }
              }}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                color: "white",
                backgroundColor: "#0891b2",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "28rem",
              margin: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "5rem",
                height: "5rem",
                backgroundColor: "#fecaca",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <AlertTriangle
                style={{ color: "#ef4444", width: "2.5rem", height: "2.5rem" }}
              />
            </div>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "0.5rem",
              }}
            >
              Có lỗi xảy ra!
            </h3>
            <p
              style={{
                color: "#4b5563",
                marginBottom: "1.5rem",
              }}
            >
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                color: "white",
                backgroundColor: "#dc2626",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          /* Custom scrollbar styles for WebKit browsers */
          div::-webkit-scrollbar {
            width: 8px;
          }
          
          div::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
    </div>
  );
};

export default Appointment;
