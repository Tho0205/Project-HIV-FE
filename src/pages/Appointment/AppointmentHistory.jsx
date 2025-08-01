import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  CheckCircle,
} from "lucide-react";
import appointmentService from "../../services/Appointment";
import { tokenManager } from "../../services/account";
import Sidebar from "../../components/SidebarProfile/SidebarProfile";

const AppointmentHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const userId = tokenManager.getCurrentUserId();
    if (!userId) {
      setError("Vui lòng đăng nhập để xem lịch sử khám");
      setLoading(false);
      return;
    }
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      setError("ID người dùng không hợp lệ");
      setLoading(false);
      return;
    }
    setPatientId(numericUserId);
  }, []);

  // Helper function to format time with SA/CH
  const formatTimeWithPeriod = (timeString) => {
    if (!timeString) return { time: timeString, period: "", periodColor: "", periodBgColor: "" };
    
    // Extract hour from time string (assumes format like "14:30")
    const [hours] = timeString.split(':');
    const hour = parseInt(hours, 10);
    
    if (isNaN(hour)) return { time: timeString, period: "", periodColor: "", periodBgColor: "" };
    
    const period = hour < 12 ? 'SA' : 'CH';
    const periodColor = hour < 12 ? '#f59e0b' : '#ef4444';
    const periodBgColor = hour < 12 ? '#fef3c7' : '#fee2e2';
    const periodBorderColor = hour < 12 ? '#fbbf24' : '#f87171';
    
    return {
      time: timeString,
      period,
      periodColor,
      periodBgColor,
      periodBorderColor
    };
  };

  const fetchAppointmentHistory = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const patientData = await appointmentService.getPatientInfo(patientId);
      if (!patientData) {
        throw new Error(
          `Không tìm thấy thông tin bệnh nhân cho patientId: ${patientId}`
        );
      }
      setPatientInfo(patientData);

      const allAppointments = await appointmentService.getAppointments();
      const doctors = await appointmentService.getDoctors();

      const patientAppointments = await Promise.all(
        allAppointments
          .filter((app) => {
            const appPatientId = app.patientId || app.PatientId;
            return appPatientId === patientId;
          })
          .map(async (appointment) => {
            const dateInfo = appointmentService.formatDate(
              appointment.appointmentDate || appointment.createdAt
            );
            const isPast = appointmentService.isPast(
              appointment.appointmentDate || appointment.createdAt
            );

            // Get doctor information
            let doctorName = "Bác sĩ không xác định";
            let doctorSpecialty = "";
            const doctorId = appointment.doctorId || appointment.DoctorId;
            if (doctorId && doctors) {
              const doctor = doctors.find((d) => d.userId === doctorId);
              if (doctor) {
                doctorName = doctor.fullName || doctor.name || doctorName;
                doctorSpecialty = doctor.specialty || "";
              }
            }

            // Get room information from schedule
            let roomInfo = "Chưa xác định";
            try {
              if (appointment.scheduleId && doctorId) {
                const schedules = await appointmentService.getAllSchedulesOfDoctor(doctorId);
                const schedule = schedules.find(s => 
                  (s.scheduleId || s.ScheduleId) === appointment.scheduleId
                );
                if (schedule) {
                  roomInfo = schedule.room || schedule.Room || "Chưa xác định";
                }
              }
            } catch (error) {
              console.warn("Could not fetch room info:", error);
            }

            return {
              ...appointment,
              doctorName,
              doctorSpecialty,
              roomInfo,
              formattedDate: dateInfo,
              isPast,
              displayStatus: getDisplayStatus(appointment.status, isPast),
            };
          })
      );

      // Enhanced sorting: prioritize new appointments and important statuses
      patientAppointments.sort((a, b) => {
        // 1. Ưu tiên lịch hẹn "Chờ xác nhận hoàn thành" lên đầu tiên
        const aIsAwaitingConfirm = a.status === "CHECKED_OUT";
        const bIsAwaitingConfirm = b.status === "CHECKED_OUT";
        
        if (aIsAwaitingConfirm && !bIsAwaitingConfirm) return -1;
        if (!aIsAwaitingConfirm && bIsAwaitingConfirm) return 1;
        
        // 2. Ưu tiên các lịch hẹn mới đặt (SCHEDULED/CONFIRMED) lên trước
        const aIsNew = ["SCHEDULED", "CONFIRMED"].includes(a.status);
        const bIsNew = ["SCHEDULED", "CONFIRMED"].includes(b.status);
        
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;
        
        // 3. Ưu tiên lịch hẹn đang diễn ra (CHECKED_IN)
        const aIsInProgress = a.status === "CHECKED_IN";
        const bIsInProgress = b.status === "CHECKED_IN";
        
        if (aIsInProgress && !bIsInProgress) return -1;
        if (!aIsInProgress && bIsInProgress) return 1;
        
        // 4. Sắp xếp theo thời gian đặt hẹn (mới nhất trước)
        const aDate = new Date(a.appointmentDate || a.createdAt);
        const bDate = new Date(b.appointmentDate || b.createdAt);
        
        return bDate - aDate;
      });

      console.log("Patient appointments (sorted):", patientAppointments);
      setAppointments(patientAppointments);
    } catch (err) {
      console.error("Error fetching appointment history:", err);
      setError(
        err.message || "Có lỗi xảy ra khi tải lịch sử khám. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAppointmentHistory();
  }, [fetchAppointmentHistory]);

  const getDisplayStatus = (status, isPast) => {
    if (status === "Cancel" || status === "CANCELLED") return "cancelled";
    if (status === "COMPLETED") return "completed";
    if (status === "CHECKED_OUT") return "awaiting_confirmation";
    if (status === "CHECKED_IN") return "in_progress";
    if (status === "CONFIRMED" && isPast) return "completed";
    if (status === "CONFIRMED" && !isPast) return "upcoming";
    if (status === "SCHEDULED") return "pending";
    return "pending";
  };

  const handleCancelClick = (appointment) => {
    const appointmentTime = new Date(
      appointment.appointmentDate || appointment.createdAt
    ).getTime();
    const now = new Date().getTime();
    const timeDifference = (appointmentTime - now) / (1000 * 60 * 60);
    if (timeDifference <= 1) {
      alert("Không thể hủy lịch hẹn vì chỉ còn dưới 1 giờ nữa!");
      return;
    }
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleConfirmClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment?.appointmentId) {
      alert("Không thể hủy lịch hẹn: ID không hợp lệ");
      return;
    }
    try {
      const result = await appointmentService.cancelAppointment(
        selectedAppointment.appointmentId
      );
      console.log("Cancel result:", result);
      setAppointments(
        appointments.map((app) =>
          app.appointmentId === selectedAppointment.appointmentId
            ? { ...app, status: "Cancel", displayStatus: "cancelled" }
            : app
        )
      );
      setShowCancelModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error("Error canceling appointment:", err);
      alert(`Lỗi khi hủy lịch hẹn: ${err.message || "Vui lòng thử lại sau"}`);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!selectedAppointment?.appointmentId) {
      alert("Không thể xác nhận lịch hẹn: ID không hợp lệ");
      return;
    }
    try {
      // Update status to COMPLETED
      await appointmentService.updateAppointmentStatus(
        selectedAppointment.appointmentId,
        "COMPLETED",
        "Đã xác nhận hoàn thành bởi bệnh nhân"
      );
      
      // Update local state
      setAppointments(
        appointments.map((app) =>
          app.appointmentId === selectedAppointment.appointmentId
            ? { ...app, status: "COMPLETED", displayStatus: "completed" }
            : app
        )
      );
      setShowConfirmModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error("Error confirming appointment completion:", err);
      alert(`Lỗi khi xác nhận: ${err.message || "Vui lòng thử lại sau"}`);
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setSelectedAppointment(null);
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
    setSelectedAppointment(null);
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.note &&
        appointment.note.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (filterStatus === "completed")
      matchesFilter = appointment.displayStatus === "completed";
    else if (filterStatus === "upcoming")
      matchesFilter = appointment.displayStatus === "upcoming";
    else if (filterStatus === "cancelled")
      matchesFilter = appointment.displayStatus === "cancelled";
    else if (filterStatus === "pending")
      matchesFilter = appointment.displayStatus === "pending";
    else if (filterStatus === "awaiting_confirmation")
      matchesFilter = appointment.displayStatus === "awaiting_confirmation";
    else if (filterStatus === "in_progress")
      matchesFilter = appointment.displayStatus === "in_progress";

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  const getStatusColor = (displayStatus) =>
    ({
      completed: { backgroundColor: "#dcfce7", color: "#15803d" },
      upcoming: { backgroundColor: "#dbeafe", color: "#1e40af" },
      cancelled: { backgroundColor: "#fee2e2", color: "#b91c1c" },
      pending: { backgroundColor: "#fef9c3", color: "#a16207" },
      awaiting_confirmation: { backgroundColor: "#fed7d7", color: "#c53030" },
      in_progress: { backgroundColor: "#fef3c7", color: "#d97706" },
    }[displayStatus] || { backgroundColor: "#f3f4f6", color: "#1f2937" });

  const getStatusText = (displayStatus) =>
    ({
      completed: "Đã khám",
      upcoming: "Sắp tới",
      cancelled: "Đã hủy",
      pending: "Chờ xác nhận",
      awaiting_confirmation: "Chờ xác nhận hoàn thành",
      in_progress: "Đang khám",
    }[displayStatus] || displayStatus);

  // Style objects for buttons
  const baseButtonStyle = {
    padding: "8px 16px",
    minWidth: "100px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid",
    textDecoration: "none",
    outline: "none",
  };

  const cancelButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#ef4444",
    color: "#ffffff",
    borderColor: "#ef4444",
  };

  const confirmButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#10b981",
    color: "#ffffff",
    borderColor: "#10b981",
  };

  const cancelButtonHoverStyle = {
    ...cancelButtonStyle,
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  };

  const confirmButtonHoverStyle = {
    ...confirmButtonStyle,
    backgroundColor: "#059669",
    borderColor: "#059669",
  };

  if (loading) {
    return (
      <div className="container">
        <div className="sidebar-Profile">
          <Sidebar active="consultation"/>
        </div>
        <section className="profile">
          <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
            <div style={{ animation: 'spin 1s linear infinite', borderRadius: '9999px', height: '3rem', width: '3rem', borderBottom: '2px solid #00c497' }}></div>
            <span style={{ marginLeft: '0.75rem', color: '#4b5563' }}>Đang tải lịch sử khám...</span>
            </div>
      </section>
    </div>
  );
}

  if (error) {
    return (
      <div className="container">
        <div className="sidebar-Profile">
          <Sidebar />
        </div>
        <section className="profile">
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem 0",
              color: "#dc2626",
            }}
          >
            <AlertCircle
              style={{
                width: "1.5rem",
                height: "1.5rem",
                marginRight: "0.5rem",
              }}
            />
            <span>{error}</span>
            <button
              onClick={fetchAppointmentHistory}
              className="btn-green"
              style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            >
              Thử lại
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="sidebar-Profile">
        <Sidebar active="Appointment-History" />
      </div>
      <section className="profile">
        <h2>Lịch sử Đặt Lịch Khám</h2>
        {patientInfo && (
          <div className="card profile-header">
            <div className="profile-photo">
              <img src="/assets/image/patient/patient.png" alt="Avatar" />
            </div>
            <div className="profile-info">
              <strong>{patientInfo.fullName || "Chưa cập nhật"}</strong>
              <p>#{patientInfo.userId}</p>
              <p>{patientInfo.phone || "Chưa cập nhật"}</p>
              <p>
                {patientInfo.gender === "Male"
                  ? "Nam"
                  : patientInfo.gender === "Female"
                  ? "Nữ"
                  : "Chưa cập nhật"}
              </p>
            </div>
          </div>
        )}
        <div className="card">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ flex: "1", position: "relative" }}>
              <Search
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999",
                  width: "1.25rem",
                  height: "1.25rem",
                }}
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bác sĩ hoặc ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 1rem 0.5rem 2.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Filter
                style={{ color: "#999", width: "1.25rem", height: "1.25rem" }}
              />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  outline: "none",
                }}
              >
                <option value="all">Tất cả ({appointments.length})</option>
                <option value="completed">
                  Đã khám (
                  {
                    appointments.filter((a) => a.displayStatus === "completed")
                      .length
                  }
                  )
                </option>
                <option value="upcoming">
                  Sắp tới (
                  {
                    appointments.filter((a) => a.displayStatus === "upcoming")
                      .length
                  }
                  )
                </option>
                <option value="pending">
                  Chờ xác nhận (
                  {
                    appointments.filter((a) => a.displayStatus === "pending")
                      .length
                  }
                  )
                </option>
                <option value="in_progress">
                  Đang khám (
                  {
                    appointments.filter((a) => a.displayStatus === "in_progress")
                      .length
                  }
                  )
                </option>
                <option value="awaiting_confirmation">
                  Chờ xác nhận hoàn thành (
                  {
                    appointments.filter((a) => a.displayStatus === "awaiting_confirmation")
                      .length
                  }
                  )
                </option>
                <option value="cancelled">
                  Đã hủy (
                  {
                    appointments.filter((a) => a.displayStatus === "cancelled")
                      .length
                  }
                  )
                </option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            {currentAppointments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem 0",
                  color: "#6b7280",
                }}
              >
                <Calendar
                  style={{
                    width: "3rem",
                    height: "3rem",
                    margin: "0 auto 0.75rem",
                    color: "#d1d5db",
                  }}
                />
                <p>Không tìm thấy lịch hẹn nào</p>
              </div>
            ) : (
              currentAppointments.map((appointment) => {
                const timeInfo = formatTimeWithPeriod(appointment.formattedDate.time);
                
                return (
                  <div
                    key={appointment.appointmentId}
                    className="card"
                    style={{ 
                      padding: "1.5rem", 
                      marginBottom: "1rem",
                      backgroundColor: appointment.status === "CHECKED_OUT" ? 
                                     "#fef7f0" : "white"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <User
                            style={{
                              width: "1.25rem",
                              height: "1.25rem",
                              color: "#4b5563",
                            }}
                          />
                          <h3
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            {appointment.doctorName}
                          </h3>
                          {appointment.doctorSpecialty && (
                            <span
                              style={{ fontSize: "0.875rem", color: "#6b7280" }}
                            >
                              • {appointment.doctorSpecialty}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            marginTop: "0.25rem",
                            fontSize: "0.875rem",
                            color: "#4b5563",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <Calendar style={{ width: "1rem", height: "1rem" }} />
                            <span>
                              {appointment.formattedDate.dayName},{" "}
                              {appointment.formattedDate.date}
                            </span>
                            <Clock
                              style={{
                                width: "1rem",
                                height: "1rem",
                                marginLeft: "0.5rem",
                              }}
                            />
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <span>{timeInfo.time}</span>
                              {timeInfo.period && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: "bold",
                                    color: timeInfo.periodColor,
                                    backgroundColor: timeInfo.periodBgColor,
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    border: `1px solid ${timeInfo.periodBorderColor}`,
                                    minWidth: "20px",
                                    textAlign: "center"
                                  }}
                                >
                                  {timeInfo.period}
                                </span>
                              )}
                            </span>
                          </div>
                          {appointment.roomInfo && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginTop: "0.25rem",
                              }}
                            >
                              <div
                                style={{
                                  width: "1rem",
                                  height: "1rem",
                                  backgroundColor: "#e5e7eb",
                                  borderRadius: "2px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.6rem",
                                  fontWeight: "bold",
                                  color: "#6b7280",
                                }}
                              >
                                P
                              </div>
                              <span style={{ fontWeight: "500", color: "#374151" }}>
                                {appointment.roomInfo}
                              </span>
                            </div>
                          )}
                          {appointment.note && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.5rem",
                                marginTop: "0.25rem",
                              }}
                            >
                              <FileText
                                style={{
                                  width: "1rem",
                                  height: "1rem",
                                  marginTop: "0.125rem",
                                }}
                              />
                              <span>{appointment.note}</span>
                            </div>
                          )}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              marginTop: "0.25rem",
                            }}
                          >
                            {appointment.isAnonymous && (
                              <span style={{ fontStyle: "italic" }}>
                                • Đặt lịch ẩn danh
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            ...getStatusColor(appointment.displayStatus),
                          }}
                        >
                          {getStatusText(appointment.displayStatus)}
                        </span>
                        
                        {/* Nút hủy cho lịch hẹn sắp tới và chờ xác nhận */}
                        {(appointment.displayStatus === "upcoming" || appointment.displayStatus === "pending") && (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => handleCancelClick(appointment)}
                              style={cancelButtonStyle}
                              onMouseEnter={(e) => {
                                Object.assign(
                                  e.target.style,
                                  cancelButtonHoverStyle
                                );
                              }}
                              onMouseLeave={(e) => {
                                Object.assign(e.target.style, cancelButtonStyle);
                              }}
                            >
                              Hủy lịch
                            </button>
                          </div>
                        )}

                        {/* Nút xác nhận hoàn thành cho trạng thái CHECKED_OUT */}
                        {appointment.displayStatus === "awaiting_confirmation" && (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => handleConfirmClick(appointment)}
                              style={confirmButtonStyle}
                              onMouseEnter={(e) => {
                                Object.assign(
                                  e.target.style,
                                  confirmButtonHoverStyle
                                );
                              }}
                              onMouseLeave={(e) => {
                                Object.assign(e.target.style, confirmButtonStyle);
                              }}
                            >
                              <CheckCircle style={{ width: "1rem", height: "1rem" }} />
                              Xác nhận hoàn thành
                            </button>
                          </div>
                        )}

                        {appointment.displayStatus === "pending" && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              fontStyle: "italic",
                              textAlign: "right",
                            }}
                          >
                            Đang chờ xác nhận từ phía bệnh viện
                          </div>
                        )}

                        {appointment.displayStatus === "in_progress" && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#d97706",
                              fontStyle: "italic",
                              textAlign: "right",
                            }}
                          >
                            Đang trong quá trình khám
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  opacity: currentPage === 1 ? "0.5" : "1",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                }}
              >
                <ChevronLeft style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {[...Array(totalPages)].map((_, index) => {
                  if (
                    index + 1 === 1 ||
                    index + 1 === totalPages ||
                    (index + 1 >= currentPage - 1 &&
                      index + 1 <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.375rem",
                          backgroundColor:
                            currentPage === index + 1 ? "#00c497" : "#ffffff",
                          color:
                            currentPage === index + 1 ? "#ffffff" : "#000000",
                          border:
                            "1px solid " +
                            (currentPage === index + 1 ? "#00c497" : "#d1d5db"),
                          cursor: "pointer",
                        }}
                      >
                        {index + 1}
                      </button>
                    );
                  } else if (
                    index + 1 === currentPage - 2 ||
                    index + 1 === currentPage + 2
                  ) {
                    return (
                      <span key={index} style={{ padding: "0 0.25rem" }}>
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  opacity: currentPage === totalPages ? "0.5" : "1",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                }}
              >
                <ChevronRight style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && selectedAppointment && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>Xác nhận hủy lịch khám</h3>
              <div style={{ marginBottom: "1rem", color: "#4b5563" }}>
                <p style={{ marginBottom: "0.5rem" }}>
                  Bạn có chắc chắn muốn hủy lịch khám?
                </p>
                <div
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                  }}
                >
                  <p style={{ fontWeight: "500", color: "#1f2937" }}>
                    {selectedAppointment.doctorName}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    {selectedAppointment.formattedDate.dayName},{" "}
                    {selectedAppointment.formattedDate.date} -{" "}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>{selectedAppointment.formattedDate.time}</span>
                      {(() => {
                        const timeInfo = formatTimeWithPeriod(selectedAppointment.formattedDate.time);
                        return timeInfo.period ? (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              color: timeInfo.periodColor,
                              backgroundColor: timeInfo.periodBgColor,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              border: `1px solid ${timeInfo.periodBorderColor}`,
                              minWidth: "20px",
                              textAlign: "center"
                            }}
                          >
                            {timeInfo.period}
                          </span>
                        ) : null;
                      })()}
                    </span>
                    {selectedAppointment.roomInfo && (
                      <span style={{ marginLeft: "0.5rem", color: "#6b7280" }}>
                        • {selectedAppointment.roomInfo}
                      </span>
                    )}
                  </p>
                  {selectedAppointment.note && (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        marginTop: "0.25rem",
                        fontStyle: "italic",
                      }}
                    >
                      {selectedAppointment.note}
                    </p>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={handleCancelModalClose}
                  className="btn-purple"
                  style={{
                    padding: "8px 16px",
                    minWidth: "80px",
                    height: "36px",
                  }}
                >
                  Không
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="btn-green"
                  style={{
                    padding: "8px 16px",
                    minWidth: "80px",
                    height: "36px",
                  }}
                >
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Completion Modal */}
        {showConfirmModal && selectedAppointment && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>Xác nhận hoàn thành lịch khám</h3>
              <div style={{ marginBottom: "1rem", color: "#4b5563" }}>
                <p style={{ marginBottom: "0.5rem" }}>
                  Bạn có chắc chắn đã hoàn thành buổi khám này và muốn xác nhận?
                </p>
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <p style={{ fontWeight: "500", color: "#1f2937" }}>
                    {selectedAppointment.doctorName}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    {selectedAppointment.formattedDate.dayName},{" "}
                    {selectedAppointment.formattedDate.date} -{" "}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>{selectedAppointment.formattedDate.time}</span>
                      {(() => {
                        const timeInfo = formatTimeWithPeriod(selectedAppointment.formattedDate.time);
                        return timeInfo.period ? (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              color: timeInfo.periodColor,
                              backgroundColor: timeInfo.periodBgColor,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              border: `1px solid ${timeInfo.periodBorderColor}`,
                              minWidth: "20px",
                              textAlign: "center"
                            }}
                          >
                            {timeInfo.period}
                          </span>
                        ) : null;
                      })()}
                    </span>
                    {selectedAppointment.roomInfo && (
                      <span style={{ marginLeft: "0.5rem", color: "#6b7280" }}>
                        • {selectedAppointment.roomInfo}
                      </span>
                    )}
                  </p>
                  {selectedAppointment.note && (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        marginTop: "0.25rem",
                        fontStyle: "italic",
                      }}
                    >
                      {selectedAppointment.note}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem",
                      backgroundColor: "#dcfce7",
                      borderRadius: "0.25rem",
                      fontSize: "0.875rem",
                      color: "#15803d",
                    }}
                  >
                    Xác nhận này sẽ đánh dấu buổi khám đã hoàn thành
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={handleConfirmModalClose}
                  className="btn-purple"
                  style={{
                    padding: "8px 16px",
                    minWidth: "80px",
                    height: "36px",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmCompletion}
                  className="btn-green"
                  style={{
                    padding: "8px 16px",
                    minWidth: "120px",
                    height: "36px",
                    backgroundColor: "#10b981",
                  }}
                >
                  <CheckCircle style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
                  Xác nhận hoàn thành
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AppointmentHistory;