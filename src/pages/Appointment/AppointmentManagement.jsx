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
        return { icon: "✅", color: "#10b981", bgColor: "#d1fae5" };
      case "error":
        return { icon: "❌", color: "#ef4444", bgColor: "#fee2e2" };
      case "warning":
        return { icon: "⚠️", color: "#f59e0b", bgColor: "#fef3c7" };
      case "confirm":
        return { icon: "❓", color: "#3b82f6", bgColor: "#dbeafe" };
      default:
        return { icon: "ℹ️", color: "#6b7280", bgColor: "#f3f4f6" };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

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
          {icon}
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
  const [statusFilter, setStatusFilter] = useState("all"); // New status filter
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validStatuses, setValidStatuses] = useState([]);
  const [validTransitions, setValidTransitions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

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

  // Styles (keeping existing styles)
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

  const sortBarStyle = {
    display: "none", // Ẩn sort bar riêng biệt vì đã gộp vào header
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

  const appointmentIdStyle = {
    ...tdStyle,
    fontWeight: "bold",
    color: "#1e40af",
    textAlign: "center",
    minWidth: "100px",
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

  const statusStyle = {
    ...tdStyle,
    textAlign: "center",
    minWidth: "120px",
  };

  const typeStyle = {
    ...tdStyle,
    textAlign: "center",
    minWidth: "80px",
    fontStyle: "italic",
  };

  const actionsStyle = {
    ...tdStyle,
    minWidth: "120px",
  };

  const actionButtonsStyle = {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    justifyContent: "center",
  };

  const buttonStyle = {
    minWidth: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s ease",
  };

  const approveButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#10b981",
    color: "white",
  };

  const editButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f59e0b",
    color: "white",
  };

  const completeButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#10b981",
    color: "white",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#ef4444",
    color: "white",
  };

  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
  };

  const modalTitleStyle = {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#333",
  };

  const errorStyle = {
    color: "#ef4444",
    marginBottom: "15px",
    fontSize: "14px",
  };

  const infoBoxStyle = {
    backgroundColor: "#f3f4f6",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#374151",
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    marginBottom: "15px",
    outline: "none",
  };

  const textareaStyle = {
    ...inputStyle,
    resize: "vertical",
    minHeight: "80px",
  };

  const modalActionsStyle = {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "20px",
  };

  const btnGreenStyle = {
    backgroundColor: "#10b981",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  };

  const btnCancelStyle = {
    backgroundColor: "#6b7280",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  };

  // Helper function to get patient display info
  const getPatientDisplayInfo = (appointment) => {
    if (appointment.isAnonymous) {
      return {
        name: "🔒 Bệnh nhân ẩn danh",
        id: "***",
        style: anonymousPatientStyle,
      };
    }
    return {
      name: appointment.patientName,
      id: `#${appointment.patientId}`,
      style: patientNameStyle,
    };
  };

  // Get status counts for filter labels
  const getStatusCounts = () => {
    const counts = {
      all: appointments.length,
      SCHEDULED: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    appointments.forEach((appointment) => {
      if (counts.hasOwnProperty(appointment.status)) {
        counts[appointment.status]++;
      }
    });

    return counts;
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
      const [appointmentsData, doctorsData, statusesData] = await Promise.all([
        appointmentService.getAppointments(),
        appointmentService.getDoctors(),
        appointmentService.getValidStatuses(),
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

          // Get patient information - chỉ lấy nếu không phải ẩn danh
          let patientName = "Bệnh nhân không xác định";
          if (!appointment.isAnonymous) {
            try {
              const patientInfo = await appointmentService.getPatientInfo(
                patientId
              );
              patientName = patientInfo.fullName || `Bệnh nhân #${patientId}`;
            } catch (error) {
              patientName = `Bệnh nhân #${patientId}`;
            }
          } else {
            patientName = "Bệnh nhân ẩn danh";
          }

          return {
            ...appointment,
            doctorName: doctor
              ? doctor.fullName || doctor.name || "Bác sĩ không xác định"
              : "Bác sĩ không xác định",
            doctorSpecialty: doctor ? doctor.specialty || "" : "",
            patientId: patientId,
            patientName: patientName,
            formattedDate: dateInfo,
            appointmentDateTime: new Date(
              appointment.appointmentDate || appointment.createdAt
            ),
          };
        })
      );

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
          const matchesId = appointment.appointmentId
            .toString()
            .includes(search);
          const matchesNote =
            appointment.note &&
            appointment.note.toLowerCase().includes(search.toLowerCase());

          let matchesPatient = false;
          if (!appointment.isAnonymous) {
            matchesPatient =
              appointment.patientName
                .toLowerCase()
                .includes(search.toLowerCase()) ||
              appointment.patientId.toString().includes(search);
          }

          return matchesDoctor || matchesId || matchesNote || matchesPatient;
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
          case "status_asc":
            return a.status.localeCompare(b.status);
          case "status_desc":
            return b.status.localeCompare(a.status);
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
      setValidStatuses(statusesData);
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

  // Handle open status modal
  async function openStatusModal(appointment) {
    setSelectedAppointment(appointment);
    setSelectedStatus("");
    setStatusNote("");
    setError("");

    try {
      const transitions = await appointmentService.getValidTransitions(
        appointment.status
      );
      setValidTransitions(transitions);
      setShowModal(true);
    } catch (err) {
      showPopup(
        "Lỗi",
        `Lỗi khi tải danh sách chuyển đổi: ${err.message}`,
        "error"
      );
    }
  }

  // Handle modal close
  function closeModal() {
    setShowModal(false);
    setSelectedAppointment(null);
    setSelectedStatus("");
    setStatusNote("");
    setError("");
  }

  // Handle status update
  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!selectedStatus) {
      setError("Vui lòng chọn trạng thái mới");
      return;
    }

    setUpdating(true);
    setError("");

    try {
      await appointmentService.updateAppointmentStatus(
        selectedAppointment.appointmentId,
        selectedStatus,
        statusNote || null
      );

      closeModal();
      showPopup("Thành công", "Cập nhật trạng thái thành công!", "success");
      fetchAppointments(page, sort, searchTerm, statusFilter);
    } catch (err) {
      setError(err.message || "Cập nhật trạng thái thất bại");
    } finally {
      setUpdating(false);
    }
  }

  // Quick status change
  async function handleQuickStatusChange(appointment, newStatus) {
    showPopup(
      "Xác nhận thay đổi",
      `Bạn có chắc chắn muốn chuyển trạng thái thành "${getStatusText(
        newStatus
      )}"?`,
      "confirm",
      async () => {
        closePopup();
        try {
          await appointmentService.updateAppointmentStatus(
            appointment.appointmentId,
            newStatus,
            null
          );
          showPopup("Thành công", "Cập nhật trạng thái thành công!", "success");
          fetchAppointments(page, sort, searchTerm, statusFilter);
        } catch (err) {
          showPopup(
            "Lỗi",
            `Lỗi khi cập nhật trạng thái: ${err.message}`,
            "error"
          );
        }
      }
    );
  }

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "bold",
      display: "inline-block",
    };

    switch (status) {
      case "CONFIRMED":
        return { ...baseStyle, backgroundColor: "#dbeafe", color: "#1e40af" };
      case "COMPLETED":
        return { ...baseStyle, backgroundColor: "#dcfce7", color: "#15803d" };
      case "CANCELLED":
        return { ...baseStyle, backgroundColor: "#fee2e2", color: "#b91c1c" };
      case "SCHEDULED":
        return { ...baseStyle, backgroundColor: "#fef3c7", color: "#d97706" };
      default:
        return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#1f2937" };
    }
  };

  // Get status text
  const getStatusText = (status) => {
    const texts = {
      CONFIRMED: "Đã xác nhận",
      COMPLETED: "Đã hoàn thành",
      CANCELLED: "Đã hủy",
      SCHEDULED: "Chờ xét duyệt",
    };
    return texts[status] || status;
  };

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("vi-VN");
  }

  // Format time
  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
            placeholder="Tìm kiếm theo ID, bác sĩ, tên bệnh nhân..."
            style={searchStyle}
            value={searchTerm}
            onChange={handleSearchChange}
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={filterStyle}
          >
            <option value="all">Tất cả trạng thái ({total})</option>
            <option value="SCHEDULED">Chờ xét duyệt</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
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
              <option value="status_asc">Theo Trạng thái: A - Z</option>
              <option value="status_desc">Theo Trạng thái: Z - A</option>
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
                Lọc: {getStatusText(statusFilter)}
              </div>
            )}
          </div>
        </div>

        {/* Ẩn sort bar cũ */}
        {false && (
          <div style={sortBarStyle}>
            <label style={{ fontWeight: "bold", color: "#374151" }}>
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
              <option value="status_asc">Theo Trạng thái: A - Z</option>
              <option value="status_desc">Theo Trạng thái: Z - A</option>
            </select>

            {/* Filter summary */}
            <div
              style={{ marginLeft: "auto", fontSize: "14px", color: "#6b7280" }}
            >
              Hiển thị {appointments.length} / {total} lịch hẹn
              {statusFilter !== "all" && (
                <span style={{ fontWeight: "bold", color: "#3b82f6" }}>
                  {" "}
                  • Lọc: {getStatusText(statusFilter)}
                </span>
              )}
            </div>
          </div>
        )}

        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>STT</th>
              <th style={thStyle}>ID Lịch Hẹn</th>
              <th style={thStyle}>Bác Sĩ</th>
              <th style={thStyle}>Thông Tin Bệnh Nhân</th>
              <th style={thStyle}>Ngày Khám</th>
              <th style={thStyle}>Giờ Khám</th>
              <th style={thStyle}>Ghi Chú</th>
              <th style={thStyle}>Trạng Thái</th>
              <th style={thStyle}>Loại Hẹn</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  style={{ ...tdStyle, textAlign: "center", padding: "40px" }}
                >
                  Đang tải...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{ ...tdStyle, textAlign: "center", padding: "40px" }}
                >
                  {statusFilter !== "all"
                    ? `Không có lịch hẹn nào với trạng thái "${getStatusText(
                        statusFilter
                      )}"`
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
                    <td style={appointmentIdStyle}>
                      #{appointment.appointmentId}
                    </td>
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
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "2px",
                          }}
                        >
                          ID: {patientInfo.id}
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
                            🔒 Thông tin được bảo mật
                          </div>
                        )}
                      </div>
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
                    <td style={statusStyle}>
                      <span style={getStatusBadgeStyle(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td style={typeStyle}>
                      {appointment.isAnonymous ? (
                        <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                          🔒 Ẩn danh
                        </span>
                      ) : (
                        "Thường"
                      )}
                    </td>
                    <td style={actionsStyle}>
                      <div style={actionButtonsStyle}>
                        {/* Nút duyệt cho trạng thái SCHEDULED */}
                        {appointment.status === "SCHEDULED" && (
                          <button
                            style={approveButtonStyle}
                            onClick={() =>
                              handleQuickStatusChange(appointment, "CONFIRMED")
                            }
                            title="Duyệt lịch hẹn"
                            onMouseEnter={(e) =>
                              (e.target.style.transform = "scale(1.1)")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.transform = "scale(1)")
                            }
                          >
                            ✓
                          </button>
                        )}

                        {/* Nút hoàn thành và hủy cho trạng thái CONFIRMED */}
                        {appointment.status === "CONFIRMED" && (
                          <>
                            <button
                              style={completeButtonStyle}
                              onClick={() =>
                                handleQuickStatusChange(
                                  appointment,
                                  "COMPLETED"
                                )
                              }
                              title="Hoàn thành"
                              onMouseEnter={(e) =>
                                (e.target.style.transform = "scale(1.1)")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.transform = "scale(1)")
                              }
                            >
                              ✓
                            </button>
                            <button
                              style={cancelButtonStyle}
                              onClick={() =>
                                handleQuickStatusChange(
                                  appointment,
                                  "CANCELLED"
                                )
                              }
                              title="Hủy"
                              onMouseEnter={(e) =>
                                (e.target.style.transform = "scale(1.1)")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.transform = "scale(1)")
                              }
                            >
                              ✗
                            </button>
                          </>
                        )}

                        {/* Nút chỉnh sửa cho tất cả trạng thái */}
                        <button
                          style={editButtonStyle}
                          onClick={() => openStatusModal(appointment)}
                          title="Chỉnh sửa"
                          onMouseEnter={(e) =>
                            (e.target.style.transform = "scale(1.1)")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.transform = "scale(1)")
                          }
                        >
                          ✏️
                        </button>
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

        {/* Status Change Modal */}
        {showModal && selectedAppointment && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <h3 style={modalTitleStyle}>Thay Đổi Trạng Thái Lịch Hẹn</h3>
              {error && <div style={errorStyle}>{error}</div>}

              {/* Appointment Info */}
              <div style={infoBoxStyle}>
                <div style={{ marginBottom: "8px" }}>
                  <strong>ID Lịch Hẹn:</strong> #
                  {selectedAppointment.appointmentId}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Bác Sĩ:</strong> {selectedAppointment.doctorName}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Bệnh Nhân:</strong>
                  {selectedAppointment.isAnonymous ? (
                    <span style={{ color: "#6b7280", fontStyle: "italic" }}>
                      🔒 Bệnh nhân ẩn danh (ID: ***)
                    </span>
                  ) : (
                    `${selectedAppointment.patientName} (ID: #${selectedAppointment.patientId})`
                  )}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Ngày & Giờ:</strong>{" "}
                  {formatDate(selectedAppointment.appointmentDate)} -{" "}
                  {formatTime(selectedAppointment.appointmentDate)}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Loại hẹn:</strong>
                  {selectedAppointment.isAnonymous ? (
                    <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                      {" "}
                      🔒 Ẩn danh
                    </span>
                  ) : (
                    <span style={{ color: "#059669" }}> Thường</span>
                  )}
                </div>
                <div>
                  <strong>Trạng Thái Hiện Tại:</strong>
                  <span
                    style={{
                      ...getStatusBadgeStyle(selectedAppointment.status),
                      marginLeft: "8px",
                    }}
                  >
                    {getStatusText(selectedAppointment.status)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleStatusUpdate}>
                <label style={labelStyle}>Trạng Thái Mới</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={inputStyle}
                  required
                >
                  <option value="">-- Chọn trạng thái --</option>
                  {validTransitions.map((status) => (
                    <option key={status} value={status}>
                      {getStatusText(status)}
                    </option>
                  ))}
                </select>

                {validTransitions.length === 0 && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: "12px",
                      marginTop: "-10px",
                      marginBottom: "15px",
                    }}
                  >
                    Không thể thay đổi trạng thái từ "
                    {getStatusText(selectedAppointment.status)}"
                  </div>
                )}

                <label style={labelStyle}>Ghi Chú (tùy chọn)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Nhập ghi chú về việc thay đổi trạng thái..."
                  style={textareaStyle}
                />

                <div style={modalActionsStyle}>
                  <button
                    type="submit"
                    style={{
                      ...btnGreenStyle,
                      opacity: updating || !selectedStatus ? 0.6 : 1,
                      cursor:
                        updating || !selectedStatus ? "not-allowed" : "pointer",
                    }}
                    disabled={updating || !selectedStatus}
                  >
                    {updating ? "Đang cập nhật..." : "Cập Nhật"}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...btnCancelStyle,
                      opacity: updating ? 0.6 : 1,
                      cursor: updating ? "not-allowed" : "pointer",
                    }}
                    onClick={closeModal}
                    disabled={updating}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
