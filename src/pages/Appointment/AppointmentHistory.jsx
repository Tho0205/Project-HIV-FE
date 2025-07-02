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
} from "lucide-react";
import appointmentService from "../../services/Appointment";
import { tokenManager } from "../../services/account";

const AppointmentHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  // Xóa doctors nếu không sử dụng
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const userId = tokenManager.getCurrentUserId();
    console.log("Component mounted, User ID:", userId);
    console.log("LocalStorage data:", {
      username: localStorage.getItem("username"),
      role: localStorage.getItem("role"),
      account_id: localStorage.getItem("account_id"),
      user_id: localStorage.getItem("user_id"),
    });

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

  // Sử dụng useCallback để memoize fetchAppointmentHistory
  const fetchAppointmentHistory = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching data for patientId:", patientId);

      const patientData = await appointmentService.getPatientInfo(patientId);
      if (!patientData) {
        throw new Error(
          `Không tìm thấy thông tin bệnh nhân cho patientId: ${patientId}`
        );
      }
      setPatientInfo(patientData);

      const allAppointments = await appointmentService.getAppointments();
      console.log("All appointments fetched:", allAppointments);

      // Xóa gọi getDoctorsApi nếu không sử dụng doctors
      const patientAppointments = allAppointments
        .filter((app) => {
          const appPatientId = app.patientId || app.PatientId;
          return appPatientId === patientId;
        })
        .map((appointment) => {
          const dateInfo = appointmentService.formatDate(
            appointment.appointmentDate || appointment.createdAt
          );
          const isPast = appointmentService.isPast(
            appointment.appointmentDate || appointment.createdAt
          );

          return {
            ...appointment,
            doctorName: "Bác sĩ không xác định", // Giả định nếu không có doctors
            doctorSpecialty: "",
            formattedDate: dateInfo,
            isPast,
            displayStatus: getDisplayStatus(appointment.status, isPast),
          };
        })
        .sort(
          (a, b) =>
            new Date(b.appointmentDate || b.createdAt) -
            new Date(a.appointmentDate || a.createdAt)
        );

      console.log("Patient appointments:", patientAppointments);

      setAppointments(patientAppointments);
    } catch (err) {
      console.error("Error fetching appointment history:", err);
      setError(
        err.message || "Có lỗi xảy ra khi tải lịch sử khám. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]); // Thêm patientId vào dependency array

  useEffect(() => {
    fetchAppointmentHistory();
  }, [fetchAppointmentHistory]); // Sử dụng fetchAppointmentHistory đã memoized

  const getDisplayStatus = (status, isPast) => {
    if (status === "Cancel" || status === "CANCELLED") return "cancelled";
    if (status === "CONFIRMED" && isPast) return "completed";
    if (status === "CONFIRMED" && !isPast) return "upcoming";
    return "pending";
  };

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
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
      alert("Hủy lịch hẹn thành công!");
    } catch (err) {
      console.error("Error canceling appointment:", err);
      alert(`Lỗi khi hủy lịch hẹn: ${err.message || "Vui lòng thử lại sau"}`);
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
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
    }[displayStatus] || { backgroundColor: "#f3f4f6", color: "#1f2937" });

  const getStatusText = (displayStatus) =>
    ({
      completed: "Đã khám",
      upcoming: "Sắp tới",
      cancelled: "Đã hủy",
      pending: "Chờ xác nhận",
    }[displayStatus] || displayStatus);

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "1152px",
          margin: "0 auto",
          padding: "1.5rem",
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "1.5rem",
          }}
        >
          <div
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
                borderBottom: "2px solid #3b82f6",
              }}
            ></div>
            <span style={{ marginLeft: "0.75rem", color: "#4b5563" }}>
              Đang tải lịch sử khám...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: "1152px",
          margin: "0 auto",
          padding: "1.5rem",
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "1.5rem",
          }}
        >
          <div
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
          </div>
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              onClick={fetchAppointmentHistory}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1152px",
        margin: "0 auto",
        padding: "1.5rem",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          padding: "1.5rem",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            Lịch sử Đặt Lịch Khám
          </h1>
          {patientInfo && (
            <div
              style={{
                backgroundColor: "#eff6ff",
                padding: "0.75rem",
                borderRadius: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                }}
              >
                <p style={{ color: "#4b5563" }}>
                  <span style={{ fontWeight: "500" }}>Bệnh nhân:</span>{" "}
                  {patientInfo.fullName || "Chưa cập nhật"}
                </p>
                <p style={{ color: "#4b5563" }}>
                  <span style={{ fontWeight: "500" }}>Mã BN:</span> #
                  {patientInfo.userId}
                </p>
                <p style={{ color: "#4b5563" }}>
                  <span style={{ fontWeight: "500" }}>Số điện thoại:</span>{" "}
                  {patientInfo.phone || "Chưa cập nhật"}
                </p>
                <p style={{ color: "#4b5563" }}>
                  <span style={{ fontWeight: "500" }}>Giới tính:</span>{" "}
                  {patientInfo.gender === "Male"
                    ? "Nam"
                    : patientInfo.gender === "Female"
                    ? "Nữ"
                    : "Chưa cập nhật"}
                </p>
              </div>
            </div>
          )}
        </div>

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
                color: "#9ca3af",
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
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter
              style={{ color: "#9ca3af", width: "1.25rem", height: "1.25rem" }}
            />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
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
            currentAppointments.map((appointment) => (
              <div
                key={appointment.appointmentId}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  marginBottom: "1rem",
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
                        <span>{appointment.formattedDate.time}</span>
                      </div>
                      {appointment.note && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.5rem",
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
                        }}
                      >
                        <span>Mã lịch hẹn: #{appointment.appointmentId}</span>
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
                    {appointment.displayStatus === "upcoming" && (
                      <button
                        onClick={() => handleCancelClick(appointment)}
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.875rem",
                          backgroundColor: "#ef4444",
                          color: "#ffffff",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                        }}
                      >
                        Hủy lịch
                      </button>
                    )}
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
              }}
            >
              <ChevronLeft style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {[...Array(totalPages)].map((_, index) => {
                if (
                  index + 1 === 1 ||
                  index + 1 === totalPages ||
                  (index + 1 >= currentPage - 1 && index + 1 <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "0.375rem",
                        backgroundColor:
                          currentPage === index + 1 ? "#3b82f6" : "#ffffff",
                        color:
                          currentPage === index + 1 ? "#ffffff" : "#000000",
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
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              <ChevronRight style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          </div>
        )}
      </div>

      {showCancelModal && selectedAppointment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              maxWidth: "28rem",
              width: "100%",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "1rem",
              }}
            >
              Xác nhận hủy lịch khám
            </h3>
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
                  {selectedAppointment.formattedDate.time}
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
                style={{
                  padding: "0.5rem 1rem",
                  color: "#374151",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                Không
              </button>
              <button
                onClick={handleConfirmCancel}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                }}
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentHistory;
