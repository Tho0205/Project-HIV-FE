import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { doctorAvatar } from "../../services/doctorInfo";
import { getDoctorsApi } from "../../services/Appointment";
import scheduleService from "../../services/ScheduleService";
import { tokenManager } from "../../services/account";
import doctorPatientService from "../../services/DoctorPatientService";

export default function StaffDoctorSchedule() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [createdSchedulesCount, setCreatedSchedulesCount] = useState(0);

  // Weekly schedule template
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { morning: false, afternoon: false, room: "Room 1" },
    tuesday: { morning: false, afternoon: false, room: "Room 1" },
    wednesday: { morning: false, afternoon: false, room: "Room 1" },
    thursday: { morning: false, afternoon: false, room: "Room 1" },
    friday: { morning: false, afternoon: false, room: "Room 1" },
    saturday: { morning: false, afternoon: false, room: "Room 1" },
    sunday: { morning: false, afternoon: false, room: "Room 1" },
  });

  const daysOfWeek = [
    { key: "monday", label: "Thứ 2", shortLabel: "T2" },
    { key: "tuesday", label: "Thứ 3", shortLabel: "T3" },
    { key: "wednesday", label: "Thứ 4", shortLabel: "T4" },
    { key: "thursday", label: "Thứ 5", shortLabel: "T5" },
    { key: "friday", label: "Thứ 6", shortLabel: "T6" },
    { key: "saturday", label: "Thứ 7", shortLabel: "T7" },
    { key: "sunday", label: "Chủ nhật", shortLabel: "CN" },
  ];

  // Fetch doctors from API when component mounts
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication and authorization first
        const role = tokenManager.getCurrentUserRole();
        const token = tokenManager.getToken();
        const isAuthenticated = tokenManager.isAuthenticated();

        console.log("🔐 Auth check:", {
          role,
          hasToken: !!token,
          isAuthenticated,
          tokenValid: !tokenManager.isTokenExpired(),
        });

        if (!isAuthenticated || !token) {
          throw new Error("Vui lòng đăng nhập để sử dụng chức năng này");
        }

        if (role !== "Staff" && role !== "Manager" && role !== "Admin") {
          throw new Error(
            "Bạn không có quyền sắp xếp lịch bác sĩ. Chỉ Staff/Manager mới có quyền này."
          );
        }

        console.log("🔍 Fetching doctors from API...");
        const doctorsData = await getDoctorsApi();
        console.log("📥 Doctors data received:", doctorsData);

        // Better data validation
        if (!Array.isArray(doctorsData)) {
          throw new Error("Dữ liệu bác sĩ không hợp lệ (không phải là array)");
        }

        const transformedDoctors = doctorsData
          .filter(
            (doctor) =>
              doctor && (doctor.userId || doctor.accountId || doctor.id)
          )
          .map((doctor) => ({
            id: doctor.userId || doctor.accountId || doctor.id,
            name:
              doctor.fullName ||
              doctor.name ||
              `Bác sĩ #${doctor.userId || doctor.accountId || doctor.id}`,
            room:
              doctor.room ||
              `Room ${doctor.userId || doctor.accountId || doctor.id}`,
            originalData: doctor,
          }));

        console.log("🔄 Transformed doctors:", transformedDoctors);

        if (transformedDoctors.length === 0) {
          throw new Error("Không tìm thấy bác sĩ nào trong hệ thống");
        }

        setDoctors(transformedDoctors);
      } catch (err) {
        console.error("💥 Error fetching doctors:", err);

        if (
          err.message.includes("đăng nhập") ||
          err.message.includes("quyền")
        ) {
          setError(err.message);
          setDoctors([]);
        } else {
          setError("Không thể tải danh sách bác sĩ. Chi tiết: " + err.message);

          // Only use fallback for network/API errors
          console.log("🔄 Using fallback sample data...");
          setDoctors([
            { id: 1, name: "BS. Nguyễn Văn An", room: "Room 1" },
            { id: 2, name: "BS. Trần Thị Bình", room: "Room 2" },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Hide navbar and footer
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      nav, .navbar, header, .header { display: none !important; }
      footer, .footer { display: none !important; }
      body { margin: 0 !important; padding: 0 !important; }
    `;
    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  // Generate dates for the selected month
  const generateMonthDates = (yearMonth) => {
    const [year, month] = yearMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const dates = [];

    for (
      let date = new Date(firstDay);
      date <= lastDay;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(new Date(date));
    }

    return dates;
  };

  // Generate schedules based on weekly template
  const generateSchedulesFromTemplate = (weeklyTemplate, month, doctorRoom) => {
    const monthDates = generateMonthDates(month);
    const schedules = [];

    monthDates.forEach((date) => {
      const dayOfWeek = date.getDay();
      const dayKeys = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayKey = dayKeys[dayOfWeek];

      const daySchedule = weeklyTemplate[dayKey];

      if (daySchedule.morning) {
        schedules.push({
          date: date.toISOString().split("T")[0],
          startTime: "08:00",
          room: daySchedule.room || doctorRoom,
          shift: "morning",
          dayOfWeek: dayKey,
        });
      }

      if (daySchedule.afternoon) {
        schedules.push({
          date: date.toISOString().split("T")[0],
          startTime: "13:00",
          room: daySchedule.room || doctorRoom,
          shift: "afternoon",
          dayOfWeek: dayKey,
        });
      }
    });

    return schedules;
  };

  // Handle checkbox changes
  const handleShiftChange = (dayKey, shiftKey, checked) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [shiftKey]: checked,
      },
    }));
  };

  // Handle room change for a specific day
  const handleRoomChange = (dayKey, room) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        room: room,
      },
    }));
  };

  // Handle "select all" for a day
  const handleSelectAllDay = (dayKey, selectAll) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        morning: selectAll,
        afternoon: selectAll,
      },
    }));
  };

  // Handle "select all" for a shift across all days
  const handleSelectAllShift = (shiftKey, selectAll) => {
    setWeeklySchedule((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((dayKey) => {
        updated[dayKey] = {
          ...updated[dayKey],
          [shiftKey]: selectAll,
        };
      });
      return updated;
    });
  };

  // Open schedule modal
  const openScheduleModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowScheduleModal(true);

    const resetSchedule = {};
    daysOfWeek.forEach((day) => {
      resetSchedule[day.key] = {
        morning: false,
        afternoon: false,
        room: doctor.room,
      };
    });
    setWeeklySchedule(resetSchedule);
  };

  // Close schedule modal
  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedDoctor(null);
  };

  // Save schedule
  const saveSchedule = async () => {
    if (!selectedDoctor || !selectedMonth) {
      return;
    }

    const schedulesToCreate = generateSchedulesFromTemplate(
      weeklySchedule,
      selectedMonth,
      selectedDoctor.room
    );

    if (schedulesToCreate.length === 0) {
      return;
    }

    const isAuthenticated = tokenManager.isAuthenticated();
    const role = tokenManager.getCurrentUserRole();

    if (!isAuthenticated) {
      return;
    }

    if (role !== "Staff" && role !== "Manager" && role !== "Admin") {
      return;
    }

    console.log("💾 Starting to create schedules:", {
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      month: selectedMonth,
      totalSchedules: schedulesToCreate.length,
      userRole: role,
    });

    setScheduleLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Create schedules one by one
      const batchSize = 5;
      for (let i = 0; i < schedulesToCreate.length; i += batchSize) {
        const batch = schedulesToCreate.slice(i, i + batchSize);
        console.log(
          `📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            schedulesToCreate.length / batchSize
          )}:`,
          batch
        );

        for (const schedule of batch) {
          try {
            console.log("🔄 Creating schedule:", schedule);
            const result = await scheduleService.createSchedule(
              schedule,
              selectedDoctor.id
            );

            console.log("📥 API Response:", result);

            const isSuccess =
              result &&
              (result.isSuccess === true ||
                (result.data && result.data.scheduleId) ||
                result.success === true);

            if (isSuccess) {
              successCount++;
              console.log("✅ Schedule created successfully:", {
                scheduleId: result.data?.scheduleId,
                message: result.message,
                success: result.isSuccess,
              });
            } else {
              errorCount++;
              const errorMsg =
                result?.message ||
                result?.error ||
                "API không trả về dữ liệu hợp lệ";
              errors.push(errorMsg);
              console.error("❌ Schedule creation failed:", {
                result,
                expectedFormat: "ApiResponse<ScheduleDto>",
                hasIsSuccess: !!result?.isSuccess,
                hasData: !!result?.data,
                hasScheduleId: !!result?.data?.scheduleId,
              });
            }
          } catch (scheduleError) {
            errorCount++;
            console.error("💥 Schedule error:", scheduleError);

            if (
              scheduleError.message.includes("403") ||
              scheduleError.message.includes("Forbidden")
            ) {
              errors.push("Không có quyền tạo lịch");
            } else if (
              scheduleError.message.includes("405") ||
              scheduleError.message.includes("Method Not Allowed")
            ) {
              errors.push("API không hỗ trợ phương thức này");
            } else if (
              scheduleError.message.includes("401") ||
              scheduleError.message.includes("Unauthorized")
            ) {
              errors.push("Chưa đăng nhập hoặc phiên đã hết hạn");
            } else {
              errors.push(scheduleError.message || "Lỗi không xác định");
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log("📊 Final results:", { successCount, errorCount, errors });

      if (successCount > 0) {
        // Show success popup
        setCreatedSchedulesCount(successCount);
        setSuccessMessage(
          `Đã tạo thành công ${successCount}/${schedulesToCreate.length} lịch làm việc cho ${selectedDoctor.name}!`
        );
        setShowSuccessModal(true);
        closeScheduleModal();
      } else {
        // Show error popup if no schedules were created
        let errorMessage = `❌ Có ${errorCount}/${schedulesToCreate.length} lịch không thể tạo.\n`;
        if (errors.length > 0) {
          const uniqueErrors = [...new Set(errors)];
          errorMessage += `\nCác lỗi gặp phải:\n${uniqueErrors
            .slice(0, 5)
            .join("\n")}${uniqueErrors.length > 5 ? "\n..." : ""}`;
        }
        errorMessage +=
          "\n\n💡 Gợi ý:\n- Kiểm tra quyền truy cập\n- Thử đăng nhập lại\n- Liên hệ admin nếu vấn đề tiếp tục";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("💥 Save schedule error:", error);
      alert(
        `❌ Lỗi khi lưu lịch làm việc: ${error.message}\n\nVui lòng thử lại hoặc liên hệ admin.`
      );
    } finally {
      setScheduleLoading(false);
    }
  };

  // Get count of selected shifts
  const getSelectedShiftsCount = () => {
    let count = 0;
    Object.values(weeklySchedule).forEach((day) => {
      if (day.morning) count++;
      if (day.afternoon) count++;
    });
    return count;
  };

  // Get preview of generated schedules count
  const getSchedulesCount = () => {
    const schedules = generateSchedulesFromTemplate(
      weeklySchedule,
      selectedMonth,
      selectedDoctor?.room || "Room 1"
    );
    return schedules.length;
  };

  // Format month display
  const formatMonth = (yearMonth) => {
    const [year, month] = yearMonth.split("-");
    return `Tháng ${month}/${year}`;
  };

  // Common styles
  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
  };

  const modalContentStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    width: "95%",
    maxWidth: "1000px",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        backgroundColor: "#f9fafb",
        zIndex: 1000,
      }}
    >
      {/* Sidebar */}
      <Sidebar active="doctor-schedule" />

      <div
        style={{
          flex: 1,
          padding: "24px",
          backgroundColor: "#f9fafb",
          overflow: "auto",
        }}
      >
        <h1
          style={{
            paddingBottom: "20px",
            color: "#3b82f6",
            textAlign: "center",
          }}
        >
          Sắp Xếp Lịch Bác Sĩ
        </h1>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            📅 Sắp Xếp Lịch Bác Sĩ Theo Tuần
          </h1>
          <p style={{ marginBottom: "16px", color: "#6b7280" }}>
            Chọn các thứ trong tuần với ca sáng/chiều, áp dụng cho cả tháng.
            Quản lý {doctors.length} bác sĩ.
          </p>

          {/* Loading state */}
          {loading && (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}
            >
              <div style={{ fontSize: "18px", marginBottom: "8px" }}>🔄</div>
              <p>Đang tải danh sách bác sĩ...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
                color: "#dc2626",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Doctors list */}
          {!loading && doctors.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "20px",
              }}
            >
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        backgroundColor: "#dbeafe",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "16px",
                      }}
                    >
                      <img
                        src={doctorAvatar(doctor.originalData?.userAvatar)}
                        alt={doctor.doctorName}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.src = "/assets/image/patient/doctor.png";
                        }}
                      />
                    </div>

                    <div>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#1f2937",
                          margin: 0,
                        }}
                      >
                        {doctor.name}
                      </h3>
                      <p style={{ color: "#6b7280", margin: 0 }}>
                        ID: {doctor.id} | {doctor.room}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => openScheduleModal(doctor)}
                    style={{
                      width: "100%",
                      backgroundColor: "#2563eb",
                      color: "white",
                      fontWeight: "bold",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#1d4ed8")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#2563eb")
                    }
                  >
                    📅 Sắp Xếp Lịch Theo Tuần
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={modalStyle}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              textAlign: "center",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#dcfce7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                animation: "bounce 1s infinite",
              }}
            >
              <span style={{ fontSize: "40px" }}>✅</span>
            </div>

            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "16px",
              }}
            >
              Tạo lịch thành công!
            </h2>

            <p
              style={{
                fontSize: "16px",
                color: "#6b7280",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              {successMessage}
            </p>

            <div
              style={{
                padding: "16px",
                backgroundColor: "#f0fdf4",
                borderRadius: "8px",
                marginBottom: "24px",
                border: "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#166534",
                  marginBottom: "8px",
                }}
              >
                📊 Thống kê:
              </div>
              <div style={{ fontSize: "12px", color: "#166534" }}>
                ✅ Đã tạo: <strong>{createdSchedulesCount}</strong> ca làm việc
                <br />
                👨‍⚕️ Bác sĩ: <strong>{selectedDoctor?.name}</strong>
                <br />
                📅 Tháng: <strong>{formatMonth(selectedMonth)}</strong>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              🎉 Hoàn tất
            </button>
          </div>
        </div>
      )}

      {/* Schedule Creation Modal */}
      {showScheduleModal && selectedDoctor && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                📅 Sắp Xếp Lịch Tuần - {selectedDoctor.name}
              </h2>
              <button
                onClick={closeScheduleModal}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "24px",
                  color: "#6b7280",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Month selection */}
            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
                border: "2px solid #0ea5e9",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#0c4a6e",
                  marginBottom: "8px",
                }}
              >
                📅 Chọn tháng áp dụng:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                min={new Date().toISOString().slice(0, 7)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #0ea5e9",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "12px",
                  color: "#0c4a6e",
                }}
              >
                📊 Sẽ tạo lịch cho {formatMonth(selectedMonth)} với khoảng{" "}
                {getSchedulesCount()} ca làm việc
              </p>
            </div>

            {/* Weekly schedule grid */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  🗓️ Chọn lịch làm việc trong tuần
                </h3>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Đã chọn: {getSelectedShiftsCount()} ca/tuần
                </div>
              </div>

              {/* Quick select buttons */}
              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => handleSelectAllShift("morning", true)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#fef3c7",
                    color: "#92400e",
                    border: "1px solid #fbbf24",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  ☀️ Chọn tất cả ca sáng
                </button>
                <button
                  onClick={() => handleSelectAllShift("afternoon", true)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#fed7d7",
                    color: "#c53030",
                    border: "1px solid #f56565",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  🌅 Chọn tất cả ca chiều
                </button>
                <button
                  onClick={() => {
                    handleSelectAllShift("morning", false);
                    handleSelectAllShift("afternoon", false);
                  }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#f7fafc",
                    color: "#4a5568",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  🚫 Bỏ chọn tất cả
                </button>
              </div>

              {/* Weekly schedule table */}
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb" }}>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          borderBottom: "1px solid #e5e7eb",
                          fontWeight: "bold",
                        }}
                      >
                        📅 Thứ
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          borderBottom: "1px solid #e5e7eb",
                          fontWeight: "bold",
                        }}
                      >
                        ☀️ Ca Sáng
                        <br />
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>
                          8:00-12:00
                        </span>
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          borderBottom: "1px solid #e5e7eb",
                          fontWeight: "bold",
                        }}
                      >
                        🌅 Ca Chiều
                        <br />
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>
                          13:00-17:00
                        </span>
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          borderBottom: "1px solid #e5e7eb",
                          fontWeight: "bold",
                        }}
                      >
                        🏥 Phòng
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          borderBottom: "1px solid #e5e7eb",
                          fontWeight: "bold",
                        }}
                      >
                        ⚡ Nhanh
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {daysOfWeek.map((day) => (
                      <tr
                        key={day.key}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <td style={{ padding: "12px", fontWeight: "500" }}>
                          {day.label}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={weeklySchedule[day.key].morning}
                            onChange={(e) =>
                              handleShiftChange(
                                day.key,
                                "morning",
                                e.target.checked
                              )
                            }
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: "#f59e0b",
                            }}
                          />
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={weeklySchedule[day.key].afternoon}
                            onChange={(e) =>
                              handleShiftChange(
                                day.key,
                                "afternoon",
                                e.target.checked
                              )
                            }
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: "#ef4444",
                            }}
                          />
                        </td>
                        <td style={{ padding: "12px" }}>
                          <input
                            type="text"
                            value={weeklySchedule[day.key].room}
                            onChange={(e) =>
                              handleRoomChange(day.key, e.target.value)
                            }
                            placeholder="Phòng"
                            style={{
                              width: "80px",
                              padding: "4px 8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          />
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              onClick={() => handleSelectAllDay(day.key, true)}
                              style={{
                                padding: "2px 6px",
                                backgroundColor: "#dcfce7",
                                color: "#166534",
                                border: "none",
                                borderRadius: "3px",
                                fontSize: "10px",
                                cursor: "pointer",
                              }}
                              title="Chọn cả ngày"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleSelectAllDay(day.key, false)}
                              style={{
                                padding: "2px 6px",
                                backgroundColor: "#fee2e2",
                                color: "#dc2626",
                                border: "none",
                                borderRadius: "3px",
                                fontSize: "10px",
                                cursor: "pointer",
                              }}
                              title="Bỏ chọn"
                            >
                              ✗
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schedule preview */}
            {getSelectedShiftsCount() > 0 && (
              <div
                style={{
                  marginBottom: "24px",
                  padding: "16px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#166534",
                    marginBottom: "12px",
                  }}
                >
                  📊 Xem trước lịch làm việc cho {formatMonth(selectedMonth)}
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {daysOfWeek.map((day) => {
                    const daySchedule = weeklySchedule[day.key];
                    const hasShifts =
                      daySchedule.morning || daySchedule.afternoon;

                    if (!hasShifts) return null;

                    return (
                      <div
                        key={day.key}
                        style={{
                          padding: "8px",
                          backgroundColor: "white",
                          borderRadius: "6px",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "12px",
                            color: "#166534",
                            marginBottom: "4px",
                          }}
                        >
                          {day.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "#059669" }}>
                          {daySchedule.morning && (
                            <div>☀️ Ca sáng (8:00-12:00)</div>
                          )}
                          {daySchedule.afternoon && (
                            <div>🌅 Ca chiều (13:00-17:00)</div>
                          )}
                          <div style={{ color: "#6b7280", marginTop: "2px" }}>
                            🏥 {daySchedule.room}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#166534",
                  }}
                >
                  <div>
                    📈 Tổng số ca/tuần:{" "}
                    <strong>{getSelectedShiftsCount()}</strong>
                  </div>
                  <div>
                    📅 Tổng số ca trong tháng:{" "}
                    <strong>{getSchedulesCount()}</strong>
                  </div>
                  <div>
                    👨‍⚕️ Bác sĩ: <strong>{selectedDoctor.name}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={closeScheduleModal}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ❌ Đóng
              </button>
              <button
                onClick={saveSchedule}
                disabled={scheduleLoading || getSelectedShiftsCount() === 0}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    scheduleLoading || getSelectedShiftsCount() === 0
                      ? "#9ca3af"
                      : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    scheduleLoading || getSelectedShiftsCount() === 0
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {scheduleLoading ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid #ffffff",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    ></div>
                    Đang tạo lịch...
                  </>
                ) : (
                  <>💾 Tạo Lịch Cho Tháng ({getSchedulesCount()} ca)</>
                )}
              </button>
            </div>

            {/* Help text */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#fef3c7",
                border: "1px solid #fbbf24",
                borderRadius: "6px",
              }}
            >
              <h5
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#92400e",
                  margin: "0 0 8px 0",
                }}
              >
                💡 Hướng dẫn sử dụng:
              </h5>
              <ul
                style={{
                  fontSize: "11px",
                  color: "#92400e",
                  margin: 0,
                  paddingLeft: "16px",
                }}
              >
                <li>Chọn các thứ và ca làm việc mong muốn</li>
                <li>
                  Mẫu tuần sẽ được áp dụng cho tất cả các tuần trong tháng
                </li>
                <li>Có thể đặt phòng khác nhau cho từng ngày trong tuần</li>
                <li>Ca sáng: 8:00-12:00, Ca chiều: 13:00-17:00</li>
                <li>Lịch sẽ được tạo tự động cho toàn bộ tháng đã chọn</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%,
          20%,
          53%,
          80%,
          100% {
            animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
            transform: translate3d(0, 0, 0);
          }
          40%,
          43% {
            animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
            transform: translate3d(0, -6px, 0);
          }
          70% {
            animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
            transform: translate3d(0, -3px, 0);
          }
          90% {
            transform: translate3d(0, -1px, 0);
          }
        }
      `}</style>
    </div>
  );
}
