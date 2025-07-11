import React, { useState, useEffect, useCallback } from "react";
import appointmentService from "../../services/Appointment";
import { tokenManager } from "../../services/account";
import Sidebar from "../../components/SidebarProfile/SidebarProfile";
import SidebarAdmin from "../../components/Sidebar/Sidebar-Doctor";

const DoctorAppointmentHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const userId = tokenManager.getCurrentUserId();
    const userRole = tokenManager.getCurrentUserRole();
    
    if (!userId) {
      setError("Vui lòng đăng nhập để xem lịch hẹn");
      setLoading(false);
      return;
    }

    if (userRole !== "Doctor") {
      setError("Chỉ bác sĩ mới có thể xem lịch hẹn của mình");
      setLoading(false);
      return;
    }

    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      setError("ID người dùng không hợp lệ");
      setLoading(false);
      return;
    }
    setDoctorId(numericUserId);
  }, []);

  // Thay thế function fetchDoctorAppointments trong component

const fetchDoctorAppointments = useCallback(async () => {
  if (!doctorId) return;
  setLoading(true);
  setError(null);
  
  try {
    // Get doctor information
    const doctorData = await appointmentService.getPatientInfo(doctorId);
    if (!doctorData) {
      throw new Error(`Không tìm thấy thông tin bác sĩ cho doctorId: ${doctorId}`);
    }
    setDoctorInfo(doctorData);

    // Get all appointments
    const allAppointments = await appointmentService.getAppointments();
    
    // Filter appointments for this doctor
    const doctorAppointments = allAppointments.filter(appointment => {
      const appointmentDoctorId = appointment.doctorId || appointment.DoctorId;
      return appointmentDoctorId === doctorId;
    });
    
    console.log("Filtered doctor appointments:", doctorAppointments);
    
    const allDoctorSchedules = await appointmentService.getAllSchedulesOfDoctor(doctorId);
    console.log("All doctor schedules from new API:", allDoctorSchedules);
    
    const scheduleRoomMap = {};
    allDoctorSchedules.forEach(schedule => {

      const scheduleId = schedule.scheduleId || schedule.ScheduleId || schedule.id;
      const room = schedule.room || schedule.Room || schedule.roomName || schedule.RoomName;
      const status = schedule.status || schedule.Status;
      
      console.log(`🗺️ Mapping Schedule ID: ${scheduleId} -> Room: ${room} (Status: ${status})`);
      scheduleRoomMap[scheduleId] = room || "Chưa xác định";
    });
    
    console.log("📋 Complete scheduleRoomMap from all schedules:", scheduleRoomMap);
    
 
    const confirmedAppointments = await Promise.all(
      doctorAppointments
        .filter(appointment => appointment.status === "CONFIRMED")
        .map(async (appointment) => {
          const dateInfo = appointmentService.formatDate(appointment.appointmentDate);
          const isPast = appointmentService.isPast(appointment.appointmentDate);
          
          // 🔧 Get room from comprehensive schedule map
          const appointmentScheduleId = appointment.scheduleId || appointment.ScheduleId;
          const room = scheduleRoomMap[appointmentScheduleId] || "Phòng không xác định";
          
          console.log(`🏥 Appointment ID: ${appointment.appointmentId}, Schedule ID: ${appointmentScheduleId}, Room: ${room}`);
          
          let patientInfo = {
            fullName: "Bệnh nhân ẩn danh",
            phone: "***",
            gender: "***",
            birthdate: "***"
          };

          // Only get patient info if not anonymous
          if (!appointment.isAnonymous) {
            try {
              const patientData = await appointmentService.getPatientInfo(appointment.patientId);
              if (patientData) {
                patientInfo = {
                  fullName: patientData.fullName || "Chưa cập nhật",
                  phone: patientData.phone || "Chưa cập nhật",
                  gender: patientData.gender === "Male" ? "Nam" : patientData.gender === "Female" ? "Nữ" : "Chưa cập nhật",
                  birthdate: patientData.birthdate || "Chưa cập nhật"
                };
              }
            } catch (error) {
              console.warn(`Could not fetch patient info for ID: ${appointment.patientId}`, error);
            }
          }

          return {
            ...appointment,
            doctorName: doctorData.fullName || "Bác sĩ",
            doctorSpecialty: "",
            patientInfo,
            room, 
            formattedDate: dateInfo,
            isPast,
            displayStatus: isPast ? "completed" : "upcoming"
          };
        })
    );

    confirmedAppointments.sort((a, b) => 
      new Date(b.appointmentDate) - new Date(a.appointmentDate)
    );

    console.log("🎯 Final confirmed appointments with rooms:", confirmedAppointments.map(apt => ({
      id: apt.appointmentId,
      scheduleId: apt.scheduleId,
      room: apt.room,
      status: apt.status
    })));
    
    setAppointments(confirmedAppointments);
    
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
    setError(err.message || "Có lỗi xảy ra khi tải lịch hẹn. Vui lòng thử lại.");
  } finally {
    setLoading(false);
  }
}, [doctorId]);

  useEffect(() => {
    fetchDoctorAppointments();
  }, [fetchDoctorAppointments]);

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedAppointment(null);
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = 
      appointment.patientInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.note && appointment.note.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (filterStatus === "completed")
      matchesFilter = appointment.displayStatus === "completed";
    else if (filterStatus === "upcoming")
      matchesFilter = appointment.displayStatus === "upcoming";

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
    }[displayStatus] || { backgroundColor: "#f3f4f6", color: "#1f2937" });

  const getStatusText = (displayStatus) =>
    ({
      completed: "Đã khám",
      upcoming: "Sắp tới",
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

  const viewButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderColor: "#2563eb",
  };

  const viewButtonHoverStyle = {
    ...viewButtonStyle,
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  };

  if (loading) {
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
              justifyContent: "center",
              alignItems: "center",
              padding: "3rem 0",
            }}
          >
            <div
              style={{
                animation: "spin 1s linear infinite",
                borderRadius: "9999px",
                height: "3rem",
                width: "3rem",
                borderBottom: "2px solid #00c497",
              }}
            ></div>
            <span style={{ marginLeft: "0.75rem", color: "#4b5563" }}>
              Đang tải lịch hẹn...
            </span>
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
            <span style={{ marginRight: "0.5rem" }}>⚠️</span>
            <span>{error}</span>
            <button
              onClick={fetchDoctorAppointments}
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
        < SidebarAdmin active="Appointment-History"/>
      </div>
      <section className="profile">
        <h2>Lịch Hẹn Đã Xác Nhận</h2>
        {doctorInfo && (
          <div className="card profile-header">
            <div className="profile-photo">
              <img src="/assets/image/patient/patient.png" alt="Avatar" />
            </div>
            <div className="profile-info">
              <strong>BS. {doctorInfo.fullName || "Chưa cập nhật"}</strong>
              <p>#{doctorInfo.userId}</p>
              <p>{doctorInfo.phone || "Chưa cập nhật"}</p>
              <p>
                {doctorInfo.gender === "Male"
                  ? "Nam"
                  : doctorInfo.gender === "Female"
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
              <span
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999",
                  fontSize: "1.25rem",
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bệnh nhân hoặc ghi chú..."
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
              <span style={{ color: "#999", fontSize: "1.25rem" }}>🔽</span>
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
                <span
                  style={{
                    fontSize: "3rem",
                    display: "block",
                    margin: "0 auto 0.75rem",
                    color: "#d1d5db",
                  }}
                >
                  📅
                </span>
                <p>Không tìm thấy lịch hẹn nào</p>
                <p style={{ fontSize: "0.875rem" }}>
                  Chỉ hiển thị các lịch hẹn đã được xác nhận
                </p>
              </div>
            ) : (
              currentAppointments.map((appointment) => (
                <div
                  key={appointment.appointmentId}
                  className="card"
                  style={{ padding: "1.5rem", marginBottom: "1rem" }}
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
                        <span style={{ fontSize: "1.25rem" }}>
                          {appointment.isAnonymous ? "🛡️" : "👤"}
                        </span>
                        <h3
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: "#1f2937",
                          }}
                        >
                          {appointment.patientInfo.fullName}
                        </h3>
                        {appointment.isAnonymous && (
                          <span
                            style={{ 
                              fontSize: "0.75rem", 
                              color: "#f59e0b",
                              fontStyle: "italic",
                              backgroundColor: "#fef3c7",
                              padding: "2px 6px",
                              borderRadius: "4px"
                            }}
                          >
                            Ẩn danh
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
                          <span>📅</span>
                          <span>
                            {appointment.formattedDate.dayName},{" "}
                            {appointment.formattedDate.date}
                          </span>
                          <span style={{ marginLeft: "0.5rem" }}>🕐</span>
                          <span>{appointment.formattedDate.time}</span>
                        </div>
                        {appointment.note && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              marginTop: "0.25rem",
                            }}
                          >
                            <span>📝</span>
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
                          <span>Mã lịch hẹn: #{appointment.appointmentId}</span>
                          <span>🏥 Phòng: {appointment.room}</span>
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
                      <button
                        onClick={() => handleViewDetails(appointment)}
                        style={viewButtonStyle}
                        onMouseEnter={(e) => {
                          Object.assign(e.target.style, viewButtonHoverStyle);
                        }}
                        onMouseLeave={(e) => {
                          Object.assign(e.target.style, viewButtonStyle);
                        }}
                      >
                        <span>👁️</span>
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))
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
                ⬅️
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
                ➡️
              </button>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAppointment && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>Chi tiết lịch hẹn</h3>
              <div style={{ marginBottom: "1rem", color: "#4b5563" }}>
                <div
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    marginBottom: "1rem",
                  }}
                >
                  <p style={{ fontWeight: "500", color: "#1f2937", marginBottom: "0.5rem" }}>
                    📅 Thông tin lịch hẹn
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    <strong>Mã:</strong> #{selectedAppointment.appointmentId}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    <strong>Ngày giờ:</strong> {selectedAppointment.formattedDate.dayName}, {selectedAppointment.formattedDate.date} - {selectedAppointment.formattedDate.time}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    <strong>Phòng:</strong> {selectedAppointment.room}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#f0f9ff",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    marginBottom: "1rem",
                  }}
                >
                  <p style={{ fontWeight: "500", color: "#1f2937", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {selectedAppointment.isAnonymous ? (
                      <>
                        <span>🛡️</span>
                        Thông tin bệnh nhân (Ẩn danh)
                      </>
                    ) : (
                      <>
                        <span>👤</span>
                        Thông tin bệnh nhân
                      </>
                    )}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    <strong>Họ tên:</strong> {selectedAppointment.patientInfo.fullName}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    <strong>Điện thoại:</strong> {selectedAppointment.patientInfo.phone}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    <strong>Giới tính:</strong> {selectedAppointment.patientInfo.gender}
                  </p>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    <strong>Ngày sinh:</strong> {selectedAppointment.patientInfo.birthdate}
                  </p>
                </div>

                {selectedAppointment.note && (
                  <div
                    style={{
                      backgroundColor: "#fef3c7",
                      padding: "0.75rem",
                      borderRadius: "0.375rem",
                    }}
                  >
                    <p style={{ fontWeight: "500", color: "#1f2937", marginBottom: "0.5rem" }}>
                      📝 Ghi chú từ bệnh nhân
                    </p>
                    <p style={{ fontSize: "0.875rem" }}>
                      {selectedAppointment.note}
                    </p>
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={handleCloseModal}
                  className="btn-green"
                  style={{
                    padding: "8px 16px",
                    minWidth: "80px",
                    height: "36px",
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default DoctorAppointmentHistory;