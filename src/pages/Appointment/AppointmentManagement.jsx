import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Sidebar from "../../components/Sidebar/Sidebar";
import Pagination from "../../components/Pagination/Pagination";
import { tokenManager } from "../../services/account";
import appointmentService from "../../services/Appointment";

const PAGE_SIZE = 8;

// Custom Popup Component
const CustomPopup = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
}) => {
  if (!isOpen) return null;

  const getPopupStyle = () => {
    const baseStyle = {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
    };
    return baseStyle;
  };

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return { color: "#10b981", bgColor: "#d1fae5" };
      case "error":
        return { color: "#ef4444", bgColor: "#fee2e2" };
      case "warning":
        return { color: "#f59e0b", bgColor: "#fef3c7" };
      case "confirm":
        return { color: "#3b82f6", bgColor: "#dbeafe" };
      default:
        return { color: "#6b7280", bgColor: "#f3f4f6" };
    }
  };

  const { color, bgColor } = getIconAndColor();

  return (
    <div style={getPopupStyle()}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            backgroundColor: bgColor,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "24px",
          }}
        >
        </div>

        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "12px",
            margin: "0 0 12px 0",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            color: "#6b7280",
            marginBottom: "24px",
            lineHeight: "1.5",
            margin: "0 0 24px 0",
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          {type === "confirm" && (
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#374151",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={type === "confirm" ? onConfirm : onClose}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: color,
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {type === "confirm" ? confirmText : "Đóng"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AppointmentManagement = () => {
  // Hide navbar and footer with CSS
  React.useEffect(() => {
    const navbar = document.querySelector("nav, .navbar, header");
    const footer = document.querySelector("footer, .footer");

    if (navbar) navbar.style.display = "none";
    if (footer) footer.style.display = "none";

    return () => {
      if (navbar) navbar.style.display = "";
      if (footer) footer.style.display = "";
    };
  }, []);

  // State
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date_desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("SCHEDULED"); // Default to only SCHEDULED appointments
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Custom popup state
  const [popup, setPopup] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const navigate = useNavigate();

  // Show custom popup function
  const showPopup = (title, message, type = "info", onConfirm = null) => {
    setPopup({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  const closePopup = () => {
    setPopup({
      isOpen: false,
      title: "",
      message: "",
      type: "info",
      onConfirm: null,
    });
  };

  // Styles
  const wrapperStyle = {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f5f5f5",
    margin: 0,
    padding: 0,
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  };

  const contentStyle = {
    flex: 1,
    padding: "20px",
    overflow: "auto",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    gap: "15px",
    flexWrap: "wrap",
  };

  const searchStyle = {
    padding: "10px 15px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    flex: "1",
    minWidth: "250px",
    outline: "none",
  };

  const filterStyle = {
    padding: "10px 15px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    minWidth: "180px",
    outline: "none",
  };

  const titleStyle = {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: "20px",
    textAlign: "center",
  };

  const selectStyle = {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  };

  const tableStyle = {
    width: "100%",
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  };

  const theadStyle = {
    backgroundColor: "#f8f9fa",
  };

  const thStyle = {
    padding: "15px 10px",
    textAlign: "left",
    fontWeight: "bold",
    color: "#333",
    borderBottom: "1px solid #dee2e6",
    fontSize: "14px",
  };

  const tdStyle = {
    padding: "12px 10px",
    borderBottom: "1px solid #f1f1f1",
    fontSize: "14px",
    color: "#555",
  };

  const sttStyle = {
    ...tdStyle,
    textAlign: "center",
    fontWeight: "bold",
    width: "60px",
  };

  const doctorNameStyle = {
    ...tdStyle,
    minWidth: "180px",
  };

  const patientNameStyle = {
    ...tdStyle,
    fontWeight: "bold",
    color: "#059669",
    minWidth: "150px",
  };

  const anonymousPatientStyle = {
    ...tdStyle,
    fontWeight: "bold",
    color: "#6b7280",
    minWidth: "150px",
    fontStyle: "italic",
  };

  const phoneStyle = {
    ...tdStyle,
    minWidth: "120px",
    textAlign: "center",
    fontWeight: "bold",
    color: "#7c3aed",
  };

  const dateStyle = {
    ...tdStyle,
    minWidth: "110px",
    textAlign: "center",
  };

  const timeStyle = {
    ...tdStyle,
    minWidth: "80px",
    textAlign: "center",
    fontWeight: "bold",
    color: "#7c3aed",
  };

  const noteStyle = {
    ...tdStyle,
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const typeStyle = {
    ...tdStyle,
    textAlign: "center",
    minWidth: "80px",
    fontStyle: "italic",
  };

  const actionsStyle = {
    ...tdStyle,
    minWidth: "140px",
    textAlign: "center",
  };

  const actionButtonsStyle = {
    display: "flex",
    gap: "8px",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60px",
  };

  const confirmButtonStyle = {
    padding: "6px 12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    minWidth: "80px",
    justifyContent: "center",
  };

  const cancelButtonStyle = {
    padding: "6px 12px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    minWidth: "80px",
    justifyContent: "center",
  };

  // Helper function to get patient display info including phone
  const getPatientDisplayInfo = (appointment) => {
    if (appointment.isAnonymous) {
      return {
        name: "Bệnh nhân ẩn danh",
        phone: appointment.patientPhone || "Chưa có",
        style: anonymousPatientStyle,
      };
    }
    return {
      name: appointment.patientName,
      phone: appointment.patientPhone || "Chưa có",
      style: patientNameStyle,
    };
  };

  // Fetch appointments
  useEffect(() => {
    fetchAppointments(page, sort, searchTerm, statusFilter);
  }, [page, sort, searchTerm, statusFilter]);

  // Check authorization
  useEffect(() => {
    const role = tokenManager.getCurrentUserRole();
    if (role !== "Staff" && role !== "Manager" && role !== "Doctor") {
      showPopup(
        "Không có quyền truy cập",
        "Bạn không có quyền truy cập trang này",
        "error",
        () => {
          closePopup();
          navigate("/");
        }
      );
    }
  }, [navigate]);

  async function fetchAppointments(page, sort, search, statusFilter) {
    setLoading(true);
    try {
      const [appointmentsData, doctorsData] = await Promise.all([
        appointmentService.getAppointments(),
        appointmentService.getDoctors(),
      ]);

      // Map appointments with doctor and patient information
      let mappedAppointments = await Promise.all(
        appointmentsData.map(async (appointment) => {
          const doctorId = appointment.doctorId || appointment.DoctorId;
          const patientId = appointment.patientId || appointment.PatientId;
          const doctor = doctorsData.find((d) => d.userId === doctorId);
          const dateInfo = appointmentService.formatDate(
            appointment.appointmentDate || appointment.createdAt
          );

          // Get patient information - lấy cả tên và số điện thoại
          let patientName = "Bệnh nhân không xác định";
          let patientPhone = "Chưa có";
          
          // Luôn cố gắng lấy thông tin bệnh nhân (kể cả khi ẩn danh)
          try {
            const patientInfo = await appointmentService.getPatientInfo(patientId);
            // Luôn lấy số điện thoại
            patientPhone = patientInfo.phone || patientInfo.Phone || "Chưa có";
            
            if (!appointment.isAnonymous) {
              // Nếu không ẩn danh thì hiển thị tên thật
              patientName = patientInfo.fullName || `Bệnh nhân #${patientId}`;
            } else {
              // Nếu ẩn danh thì chỉ ẩn tên, vẫn hiển thị số điện thoại
              patientName = "Bệnh nhân ẩn danh";
            }
          } catch (error) {
            // Nếu không lấy được thông tin bệnh nhân
            if (!appointment.isAnonymous) {
              patientName = `Bệnh nhân #${patientId}`;
            } else {
              patientName = "Bệnh nhân ẩn danh";
            }
            patientPhone = "Chưa có";
          }

          return {
            ...appointment,
            doctorName: doctor
              ? doctor.fullName || doctor.name || "Bác sĩ không xác định"
              : "Bác sĩ không xác định",
            doctorSpecialty: doctor ? doctor.specialty || "" : "",
            patientId: patientId,
            patientName: patientName,
            patientPhone: patientPhone,
            formattedDate: dateInfo,
            appointmentDateTime: new Date(
              appointment.appointmentDate || appointment.createdAt
            ),
          };
        })
      );

      // Filter to only show SCHEDULED and CONFIRMED appointments (manageable statuses)
      mappedAppointments = mappedAppointments.filter(
        (appointment) => appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED"
      );

      // **NEW: Filter to only show current and future appointments**
      const now = new Date();
      // Set time to beginning of today to include all appointments for today
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      mappedAppointments = mappedAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate || appointment.createdAt);
        // Set appointment time to beginning of day for comparison
        const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
        
        // Only show appointments from today onwards
        return appointmentDay >= today;
      });

      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        mappedAppointments = mappedAppointments.filter(
          (appointment) => appointment.status === statusFilter
        );
      }

      // Apply search filter
      if (search) {
        mappedAppointments = mappedAppointments.filter((appointment) => {
          const matchesDoctor = appointment.doctorName
            .toLowerCase()
            .includes(search.toLowerCase());
          const matchesNote =
            appointment.note &&
            appointment.note.toLowerCase().includes(search.toLowerCase());
          const matchesPhone = 
            appointment.patientPhone &&
            appointment.patientPhone.includes(search);

          let matchesPatient = false;
          if (!appointment.isAnonymous) {
            matchesPatient =
              appointment.patientName
                .toLowerCase()
                .includes(search.toLowerCase());
          }

          return matchesDoctor || matchesNote || matchesPatient || matchesPhone;
        });
      }

      // Apply sorting
      mappedAppointments.sort((a, b) => {
        switch (sort) {
          case "date_asc":
            return a.appointmentDateTime - b.appointmentDateTime;
          case "date_desc":
            return b.appointmentDateTime - a.appointmentDateTime;
          case "doctor_asc":
            return a.doctorName.localeCompare(b.doctorName);
          case "doctor_desc":
            return b.doctorName.localeCompare(a.doctorName);
          default:
            return b.appointmentDateTime - a.appointmentDateTime;
        }
      });

      // Apply pagination
      setTotal(mappedAppointments.length);
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedAppointments = mappedAppointments.slice(
        startIndex,
        endIndex
      );

      setAppointments(paginatedAppointments);
    } catch (err) {
      setAppointments([]);
      setTotal(0);
      showPopup(
        "Lỗi tải dữ liệu",
        err.message || "Có lỗi xảy ra khi tải dữ liệu",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // Handle sort change
  function handleSortChange(e) {
    setSort(e.target.value);
    setPage(1);
  }

  // Handle search
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setPage(1);
  }

  // Handle status filter change
  function handleStatusFilterChange(e) {
    setStatusFilter(e.target.value);
    setPage(1);
  }

  // Quick status change - Only for confirmation and cancellation
  async function handleQuickStatusChange(appointment, newStatus) {
    let actionText = "";
    let confirmMessage = "";
    
    switch (newStatus) {
      case "CONFIRMED":
        actionText = "xác nhận";
        confirmMessage = "Bạn có chắc chắn muốn xác nhận lịch khám này?";
        break;
      case "CANCELLED":
        actionText = "hủy";
        confirmMessage = "Bạn có chắc chắn muốn hủy lịch khám này?";
        break;
      default:
        actionText = "cập nhật";
        confirmMessage = "Bạn có chắc chắn muốn thực hiện thao tác này?";
    }
    
    showPopup(
      `Xác nhận ${actionText}`,
      confirmMessage,
      "confirm",
      async () => {
        closePopup();
        try {
          await appointmentService.updateAppointmentStatus(
            appointment.appointmentId,
            newStatus,
            null
          );
          
          let successMessage = "";
          if (newStatus === "CONFIRMED") {
            successMessage = "Xác nhận lịch khám thành công!";
          } else {
            successMessage = `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} lịch khám thành công!`;
          }
          
          showPopup("Thành công", successMessage, "success");
          fetchAppointments(page, sort, searchTerm, statusFilter);
        } catch (err) {
          showPopup(
            "Lỗi",
            `Lỗi khi ${actionText} lịch khám: ${err.message}`,
            "error"
          );
        }
      }
    );
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("vi-VN");
  }

  // Format time with AM/PM
  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    
    // Vietnamese SA/CH format
    const time12Hour = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit", 
      hour12: true
    });
    return time12Hour.replace("AM", "SA").replace("PM", "CH");
  }

  return (
    <div style={wrapperStyle}>
      {/* Sidebar */}
      <Sidebar active="appointment" />

      {/* Main Content */}
      <main style={contentStyle}>
        <h1 style={titleStyle}>Quản Lý Lịch Đặt Khám</h1>

        <div style={headerStyle}>
          <input
            type="text"
            placeholder="Tìm kiếm theo bác sĩ, tên bệnh nhân, số điện thoại..."
            style={searchStyle}
            value={searchTerm}
            onChange={handleSearchChange}
          />

          {/* Status Filter - Only for manageable statuses */}
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={filterStyle}
          >
            <option value="all">Tất cả ({total})</option>
            <option value="SCHEDULED">Chờ xét duyệt</option>
            <option value="CONFIRMED">Đã xác nhận</option>
          </select>

          {/* Sort Control */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label
              style={{
                fontWeight: "bold",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              Sắp Xếp:
            </label>
            <select
              value={sort}
              onChange={handleSortChange}
              style={selectStyle}
            >
              <option value="date_desc">Theo Ngày: Mới nhất</option>
              <option value="date_asc">Theo Ngày: Cũ nhất</option>
              <option value="doctor_asc">Theo Bác sĩ: A - Z</option>
              <option value="doctor_desc">Theo Bác sĩ: Z - A</option>
            </select>
          </div>

          {/* Filter summary */}
          <div
            style={{ fontSize: "14px", color: "#6b7280", whiteSpace: "nowrap" }}
          >
            Hiển thị {appointments.length} / {total} lịch hẹn
            {statusFilter !== "all" && (
              <div
                style={{
                  fontWeight: "bold",
                  color: "#3b82f6",
                  marginTop: "2px",
                }}
              >
                Lọc: {statusFilter === "SCHEDULED" ? "Chờ xét duyệt" : "Đã xác nhận"}
              </div>
            )}
          </div>
        </div>

        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>STT</th>
              <th style={thStyle}>Bác Sĩ</th>
              <th style={thStyle}>Thông Tin Bệnh Nhân</th>
              <th style={thStyle}>Số Điện Thoại</th>
              <th style={thStyle}>Ngày Khám</th>
              <th style={thStyle}>Giờ Khám</th>
              <th style={thStyle}>Ghi Chú</th>
              <th style={thStyle}>Loại Hẹn</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ ...tdStyle, textAlign: "center", padding: "40px" }}
                >
                  Đang tải...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ ...tdStyle, textAlign: "center", padding: "40px" }}
                >
                  {statusFilter !== "all"
                    ? `Không có lịch hẹn nào với trạng thái "${statusFilter === "SCHEDULED" ? "Chờ xét duyệt" : "Đã xác nhận"}"`
                    : "Không có dữ liệu"}
                </td>
              </tr>
            ) : (
              appointments.map((appointment, idx) => {
                const patientInfo = getPatientDisplayInfo(appointment);
                return (
                  <tr
                    key={appointment.appointmentId}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#fafafa" : "white",
                    }}
                  >
                    <td style={sttStyle}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td style={doctorNameStyle}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#1f2937" }}>
                          {appointment.doctorName}
                        </div>
                        {appointment.doctorSpecialty && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "2px",
                            }}
                          >
                            {appointment.doctorSpecialty}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={patientInfo.style}>
                      <div>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: appointment.isAnonymous
                              ? "#6b7280"
                              : "#059669",
                          }}
                        >
                          {patientInfo.name}
                        </div>
                        {appointment.isAnonymous && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#ef4444",
                              marginTop: "2px",
                              fontWeight: "bold",
                            }}
                          >
                            Thông tin được bảo mật
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={phoneStyle}>
                      {patientInfo.phone}
                    </td>
                    <td style={dateStyle}>
                      {formatDate(appointment.appointmentDate)}
                    </td>
                    <td style={timeStyle}>
                      {formatTime(appointment.appointmentDate)}
                    </td>
                    <td style={noteStyle} title={appointment.note || "-"}>
                      {appointment.note || "-"}
                    </td>
                    <td style={typeStyle}>
                      {appointment.isAnonymous ? (
                        <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                          Ẩn danh
                        </span>
                      ) : (
                        "Thường"
                      )}
                    </td>
                    <td style={actionsStyle}>
                      <div style={actionButtonsStyle}>
                        {/* Actions based on status */}
                        {appointment.status === "SCHEDULED" && (
                          <>
                            <button
                              style={confirmButtonStyle}
                              onClick={() =>
                                handleQuickStatusChange(appointment, "CONFIRMED")
                              }
                              title="Xác nhận lịch khám"
                              onMouseEnter={(e) => {
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "none";
                              }}
                            >
                              <span>Xác nhận</span>
                            </button>
                            <button
                              style={cancelButtonStyle}
                              onClick={() =>
                                handleQuickStatusChange(appointment, "CANCELLED")
                              }
                              title="Hủy lịch khám"
                              onMouseEnter={(e) => {
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "none";
                              }}
                            >
                              <span>Hủy</span>
                            </button>
                          </>
                        )}

                        {appointment.status === "CONFIRMED" && (
                          <button
                            style={cancelButtonStyle}
                            onClick={() =>
                              handleQuickStatusChange(appointment, "CANCELLED")
                            }
                            title="Hủy lịch khám"
                            onMouseEnter={(e) => {
                              e.target.style.transform = "translateY(-1px)";
                              e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "none";
                            }}
                          >
                            <span>Hủy lịch</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        {/* Custom Popup */}
        <CustomPopup
          isOpen={popup.isOpen}
          onClose={closePopup}
          onConfirm={popup.onConfirm}
          title={popup.title}
          message={popup.message}
          type={popup.type}
        />
      </main>
    </div>
  );
};

export default AppointmentManagement;