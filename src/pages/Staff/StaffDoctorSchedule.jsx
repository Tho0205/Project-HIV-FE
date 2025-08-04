import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { doctorAvatar } from "../../services/doctorInfo";
import { getDoctorsApi } from "../../services/Appointment";
import scheduleService from "../../services/ScheduleService";
import { tokenManager } from "../../services/account";
import { FaSearch , FaCalendar, FaTimes, FaCheck, FaExclamationTriangle, FaBan, FaHospital, FaLightbulb, FaArrowLeft,
  FaChartBar,FaRegSave
 } from "react-icons/fa";

export default function StaffDoctorSchedule() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [createdSchedulesCount, setCreatedSchedulesCount] = useState(0);
  const [conflictSchedules, setConflictSchedules] = useState([]);
  const [nonConflictSchedules, setNonConflictSchedules] = useState([]);

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

  // Method lấy lịch của tất cả bác sĩ trong tháng để kiểm tra xung đột
  const getAllDoctorsSchedulesInMonth = useCallback(async (fromDate, toDate) => {
    try {
      console.log(" Getting all doctors schedules for conflict check...", { fromDate, toDate });
      const allSchedules = [];

      // Lấy lịch của từng bác sĩ
      for (const doctor of doctors) {
        try {
          console.log(` Getting schedules for doctor ${doctor.id} (${doctor.name})`);
          
          let doctorSchedules = [];
          
          // Sử dụng scheduleService để lấy lịch
          try {
            doctorSchedules = await scheduleService.getDoctorSchedules(doctor.id, fromDate, toDate);
          } catch (serviceError) {
            console.warn(`Service method failed for doctor ${doctor.id}:`, serviceError);
            
            // Fallback: Try using the Appointment API directly
            try {
              const { getDoctorSchedulesApi } = await import("../../services/Appointment");
              const schedules = await getDoctorSchedulesApi(doctor.id);
              
              if (Array.isArray(schedules)) {
                // Filter by date range
                doctorSchedules = schedules.filter(schedule => {
                  const scheduledTime = schedule.scheduledTime || schedule.ScheduledTime;
                  if (!scheduledTime) return false;
                  
                  const scheduleDate = new Date(scheduledTime);
                  const from = new Date(fromDate);
                  const to = new Date(toDate);
                  
                  return scheduleDate >= from && scheduleDate <= to;
                }).map(schedule => ({
                  scheduleId: schedule.scheduleId || schedule.ScheduleId,
                  scheduledTime: schedule.scheduledTime || schedule.ScheduledTime,
                  room: schedule.room || schedule.Room || "Unknown",
                  status: schedule.status || schedule.Status || "ACTIVE"
                }));
              }
            } catch (fallbackError) {
              console.warn(` Fallback also failed for doctor ${doctor.id}:`, fallbackError);
            }
          }
          
          // Thêm thông tin bác sĩ vào mỗi lịch
          const schedulesWithDoctorInfo = doctorSchedules.map(schedule => ({
            ...schedule,
            doctorId: doctor.id,
            doctorName: doctor.name
          }));
          
          console.log(` Found ${schedulesWithDoctorInfo.length} schedules for ${doctor.name}`);
          allSchedules.push(...schedulesWithDoctorInfo);
          
        } catch (error) {
          console.warn(` Cannot get schedules for doctor ${doctor.id} (${doctor.name}):`, error);
          // Tiếp tục với bác sĩ khác nếu một bác sĩ lỗi
        }
      }

      console.log(` Total schedules collected: ${allSchedules.length}`);
      return allSchedules;
    } catch (error) {
      console.error("💥 Error getting all doctors schedules:", error);
      return []; // Trả về mảng rỗng nếu lỗi
    }
  }, [doctors]);

  // Method kiểm tra xung đột phòng khám và lịch bác sĩ
  const checkScheduleConflicts = useCallback(async (schedulesToCheck, doctorId) => {
    try {
      console.log(" Checking room and doctor schedule conflicts...", { 
        schedulesToCheck: schedulesToCheck.length, 
        doctorId 
      });

      const [year, month] = selectedMonth.split("-").map(Number);
      const fromDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const toDate = new Date(year, month, 0).toISOString().split("T")[0];

      console.log(" Date range:", { fromDate, toDate });

      // 1. Lấy lịch của bác sĩ hiện tại
      let doctorSchedules = [];
      try {
        doctorSchedules = await scheduleService.getDoctorSchedules(doctorId, fromDate, toDate);
        console.log(" Doctor existing schedules:", doctorSchedules);
      } catch (error) {
        console.warn(" Cannot get doctor schedules:", error);
        doctorSchedules = [];
      }

      // 2. Lấy lịch của TẤT CẢ bác sĩ trong tháng để kiểm tra xung đột phòng
      const allDoctorsSchedules = await getAllDoctorsSchedulesInMonth(fromDate, toDate);
      console.log(" All doctors schedules for room conflict check:", allDoctorsSchedules);

      const conflicts = [];
      const nonConflicts = [];

      schedulesToCheck.forEach(newSchedule => {
        const newDateTime = `${newSchedule.date}T${newSchedule.startTime}:00`;
        const newDate = new Date(newDateTime);
        let conflictReason = null;
        let conflictingDoctor = null;

        console.log(" Checking schedule:", {
          date: newSchedule.date,
          time: newSchedule.startTime,
          room: newSchedule.room,
          shift: newSchedule.shift
        });

        // 1. Kiểm tra trùng lịch của chính bác sĩ này
        const doctorConflict = doctorSchedules.some(existing => {
          const existingDateTime = existing.scheduledTime || existing.ScheduledTime;
          if (!existingDateTime) return false;
          
          const existingDate = new Date(existingDateTime);
          
          if (existingDate.toDateString() === newDate.toDateString()) {
            const existingHour = existingDate.getHours();
            const newHour = newDate.getHours();
            
            // Ca sáng: 8-12h, Ca chiều: 13-17h
            const existingShift = existingHour < 13 ? 'morning' : 'afternoon';
            const newShift = newHour < 13 ? 'morning' : 'afternoon';
            
            if (existingShift === newShift) {
              console.log(" Doctor conflict found:", {
                existing: existingDateTime,
                new: newDateTime,
                shift: newShift
              });
              return true;
            }
          }
          
          return false;
        });

        if (doctorConflict) {
          conflictReason = 'Bác sĩ đã có lịch khám trong thời gian này';
        }

        // 2. Kiểm tra xung đột phòng khám với bác sĩ khác
        if (!conflictReason) {
          const roomConflict = allDoctorsSchedules.some(existing => {
            // Bỏ qua lịch của chính bác sĩ này
            if (existing.doctorId === doctorId) return false;
            
            // Kiểm tra cùng phòng - normalize room names
            const existingRoom = existing.room?.toString().trim();
            const newRoom = newSchedule.room?.toString().trim();
            
            if (existingRoom !== newRoom) return false;
            
            const existingDateTime = existing.scheduledTime || existing.ScheduledTime;
            if (!existingDateTime) return false;
            
            const existingDate = new Date(existingDateTime);
            
            if (existingDate.toDateString() === newDate.toDateString()) {
              const existingHour = existingDate.getHours();
              const newHour = newDate.getHours();
              
              // Ca sáng: 8-12h, Ca chiều: 13-17h
              const existingShift = existingHour < 13 ? 'morning' : 'afternoon';
              const newShift = newHour < 13 ? 'morning' : 'afternoon';
              
              if (existingShift === newShift) {
                // Lưu thông tin bác sĩ đang sử dụng phòng
                conflictingDoctor = existing.doctorName || `Bác sĩ ID: ${existing.doctorId}`;
                console.log("❌ Room conflict found:", {
                  room: newRoom,
                  existingDoctor: conflictingDoctor,
                  date: newDate.toDateString(),
                  shift: newShift
                });
                return true;
              }
            }
            
            return false;
          });

          if (roomConflict) {
            conflictReason = `Phòng ${newSchedule.room} đã được ${conflictingDoctor} sử dụng trong thời gian này`;
          }
        }

        if (conflictReason) {
          conflicts.push({
            ...newSchedule,
            conflictReason: conflictReason,
            conflictingDoctor: conflictingDoctor
          });
        } else {
          nonConflicts.push(newSchedule);
        }
      });

      console.log(" Final conflicts found:", conflicts);
      console.log(" Final non-conflicts:", nonConflicts);

      return { conflicts, nonConflicts };
    } catch (error) {
      console.error(" Error checking conflicts:", error);
      // Nếu không thể kiểm tra, coi như tất cả đều không trùng để tiếp tục
      console.warn(" Conflict check failed, allowing all schedules");
      return { 
        conflicts: [], 
        nonConflicts: schedulesToCheck 
      };
    }
  }, [selectedMonth, getAllDoctorsSchedulesInMonth]);

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

        console.log(" Auth check:", {
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

        console.log(" Fetching doctors from API...");
        const doctorsData = await getDoctorsApi();
        console.log(" Doctors data received:", doctorsData);

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

        console.log(" Transformed doctors:", transformedDoctors);

        if (transformedDoctors.length === 0) {
          throw new Error("Không tìm thấy bác sĩ nào trong hệ thống");
        }

        setDoctors(transformedDoctors);
      } catch (err) {
        console.error(" Error fetching doctors:", err);

        if (
          err.message.includes("đăng nhập") ||
          err.message.includes("quyền")
        ) {
          setError(err.message);
          setDoctors([]);
        } else {
          setError("Không thể tải danh sách bác sĩ. Chi tiết: " + err.message);

          // Only use fallback for network/API errors
          console.log(" Using fallback sample data...");
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
  const generateMonthDates = useCallback((yearMonth) => {
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
  }, []);

  // Generate schedules based on weekly template
  const generateSchedulesFromTemplate = useCallback((weeklyTemplate, month, doctorRoom) => {
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
  }, [generateMonthDates]);

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

  // Close conflict modal và tiếp tục tạo lịch không trùng
  const handleContinueWithNonConflicts = async () => {
    setShowConflictModal(false);
    await createSchedulesInternal(nonConflictSchedules);
  };

  // Hủy tạo lịch
  const handleCancelScheduleCreation = () => {
    setShowConflictModal(false);
    setConflictSchedules([]);
    setNonConflictSchedules([]);
    // Hiển thị lại modal chính để user có thể chỉnh sửa
    setShowScheduleModal(true);
  };

  // Logic tạo lịch nội bộ
  const createSchedulesInternal = async (schedulesToCreate) => {
    if (schedulesToCreate.length === 0) {
      alert(" Không có lịch nào để tạo!");
      return;
    }

    console.log(" Creating schedules:", {
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      month: selectedMonth,
      totalSchedules: schedulesToCreate.length,
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
          ` Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            schedulesToCreate.length / batchSize
          )}:`,
          batch
        );

        for (const schedule of batch) {
          try {
            console.log(" Creating schedule:", schedule);
            const result = await scheduleService.createSchedule(
              schedule,
              selectedDoctor.id
            );

            console.log(" API Response:", result);

            const isSuccess =
              result &&
              (result.isSuccess === true ||
                (result.data && result.data.scheduleId) ||
                result.success === true);

            if (isSuccess) {
              successCount++;
              console.log(" Schedule created successfully:", {
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

  // Save schedule với kiểm tra trùng lịch
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

    console.log("💾 Starting to create schedules with conflict check:", {
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      month: selectedMonth,
      totalSchedules: schedulesToCreate.length,
      userRole: role,
    });

    setScheduleLoading(true);
    try {
      // Kiểm tra trùng lịch trước khi tạo
      const { conflicts, nonConflicts } = await checkScheduleConflicts(
        schedulesToCreate, 
        selectedDoctor.id
      );

      if (conflicts.length > 0) {
        // Có trùng lịch - ẩn modal chính và hiển thị modal cảnh báo
        setShowScheduleModal(false); // Ẩn modal chính
        setConflictSchedules(conflicts);
        setNonConflictSchedules(nonConflicts);
        setShowConflictModal(true);
      } else {
        // Không có trùng lịch - tạo tất cả
        await createSchedulesInternal(schedulesToCreate);
      }
    } catch (error) {
      console.error("💥 Save schedule error:", error);
      alert(
        `❌ Lỗi khi kiểm tra và lưu lịch làm việc: ${error.message}\n\nVui lòng thử lại hoặc liên hệ admin.`
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  // Format shift for display
  const formatShift = (startTime) => {
    const hour = parseInt(startTime.split(":")[0]);
    return hour < 13 ? "Ca sáng (8:00-12:00)" : "Ca chiều (13:00-17:00)";
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          backgroundColor: "#f9fafb",
          zIndex: 1,
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
              <FaCalendar /> Sắp Xếp Lịch Bác Sĩ Theo Tuần
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
                  <span><FaTimes /></span>
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
                          alt={doctor.name}
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
                      <FaCalendar/> Sắp Xếp Lịch Theo Tuần
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="schedule-modal-overlay success-modal-overlay">
          <div className="schedule-modal-content success-modal">
            <div className="success-icon">
              <span><FaCheck /></span>
            </div>

            <h2>Tạo lịch thành công!</h2>
            <p>{successMessage}</p>

            <div className="success-stats">
              <div className="stats-title">Thống kê:</div>
              <div className="stats-content">
                <FaCheck/> Đã tạo: <strong>{createdSchedulesCount}</strong> ca làm việc
                <br />
                 Bác sĩ: <strong>{selectedDoctor?.name}</strong>
                <br />
                <FaCalendar/> Tháng: <strong>{formatMonth(selectedMonth)}</strong>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="success-button"
            >
               Hoàn tất
            </button>
          </div>
        </div>
      )}

      {/* Conflict Warning Modal */}
      {showConflictModal && (
        <div className="schedule-modal-overlay conflict-modal-overlay">
          <div className="schedule-modal-content conflict-modal">
            <div className="conflict-icon">
              <span><FaExclamationTriangle /></span>
            </div>

            <h2>Phát hiện xung đột lịch làm việc!</h2>

            <div className="conflict-section">
              <div className="conflict-title">
                <FaBan /> Các lịch bị xung đột ({conflictSchedules.length} ca):
              </div>
              <div className="conflict-list">
                {conflictSchedules.map((schedule, index) => (
                  <div key={index} className="conflict-item">
                    <FaCalendar/> {formatDate(schedule.date)} - {formatShift(schedule.startTime)}
                    <br />
                    <FaHospital /> {schedule.room}
                    <br />
                    <span className="conflict-reason">
                      <FaExclamationTriangle/> {schedule.conflictReason}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {nonConflictSchedules.length > 0 && (
              <div className="success-section">
                <div className="success-title">
                  <FaCheck/> Các lịch có thể tạo ({nonConflictSchedules.length} ca):
                </div>
                <div className="success-list">
                  {nonConflictSchedules.slice(0, 5).map((schedule, index) => (
                    <div key={index} className="success-item">
                      <FaCalendar/> {formatDate(schedule.date)} - {formatShift(schedule.startTime)} - 🏥 {schedule.room}
                    </div>
                  ))}
                  {nonConflictSchedules.length > 5 && (
                    <div className="more-items">
                      ... và {nonConflictSchedules.length - 5} ca khác
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="help-section">
              <h4><FaLightbulb/> Tùy chọn xử lý:</h4>
              <ul>
                <li><strong>Tiếp tục:</strong> Tạo {nonConflictSchedules.length} lịch không bị xung đột</li>
                <li><strong>Hủy bỏ:</strong> Quay lại chỉnh sửa mẫu tuần</li>
                <li><strong>Xung đột phòng:</strong> Thay đổi phòng khám hoặc thời gian khác</li>
                <li><strong>Xung đột bác sĩ:</strong> Chọn thời gian khác cho bác sĩ này</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button onClick={handleCancelScheduleCreation} className="cancel-button">
                <FaArrowLeft /> Quay lại chỉnh sửa
              </button>
              
              {nonConflictSchedules.length > 0 && (
                <button onClick={handleContinueWithNonConflicts} className="continue-button">
                   Tiếp tục tạo {nonConflictSchedules.length} lịch
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Creation Modal - Only show when no other modal is active */}
      {showScheduleModal && !showConflictModal && !showSuccessModal && selectedDoctor && (
        <div className="schedule-modal-overlay">
          <div className="schedule-modal-content main-modal">
            <div className="modal-header">
              <h2> Sắp Xếp Lịch Tuần - {selectedDoctor.name}</h2>
              <button onClick={closeScheduleModal} className="close-button">×</button>
            </div>

            {/* Month selection */}
            <div className="month-selection">
              <label><FaCalendar/> Chọn tháng áp dụng:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                min={new Date().toISOString().slice(0, 7)}
              />
              <p>
                <FaChartBar /> Sẽ tạo lịch cho {formatMonth(selectedMonth)} với khoảng{" "}
                {getSchedulesCount()} ca làm việc
              </p>
            </div>

            {/* Weekly schedule grid */}
            <div className="weekly-schedule">
              <div className="schedule-header">
                <h3><FaCalendar/> Chọn lịch làm việc trong tuần</h3>
                <div className="selected-count">
                  Đã chọn: {getSelectedShiftsCount()} ca/tuần
                </div>
              </div>

              {/* Quick select buttons */}
              <div className="quick-select">
                <button
                  onClick={() => handleSelectAllShift("morning", true)}
                  className="quick-btn morning"
                >
                   Chọn tất cả ca sáng
                </button>
                <button
                  onClick={() => handleSelectAllShift("afternoon", true)}
                  className="quick-btn afternoon"
                >
                   Chọn tất cả ca chiều
                </button>
                <button
                  onClick={() => {
                    handleSelectAllShift("morning", false);
                    handleSelectAllShift("afternoon", false);
                  }}
                  className="quick-btn clear"
                >
                  Bỏ chọn tất cả
                </button>
              </div>

              {/* Weekly schedule table */}
              <div className="table-container">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th><FaCalendar/> Thứ</th>
                      <th>
                         Ca Sáng
                        <br />
                        <span className="time-label">8:00-12:00</span>
                      </th>
                      <th>
                         Ca Chiều
                        <br />
                        <span className="time-label">13:00-17:00</span>
                      </th>
                      <th> Phòng</th>
                      <th> Nhanh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daysOfWeek.map((day) => (
                      <tr key={day.key}>
                        <td className="day-label">{day.label}</td>
                        <td className="checkbox-cell">
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
                            className="morning-checkbox"
                          />
                        </td>
                        <td className="checkbox-cell">
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
                            className="afternoon-checkbox"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={weeklySchedule[day.key].room}
                            onChange={(e) =>
                              handleRoomChange(day.key, e.target.value)
                            }
                            placeholder="Phòng"
                            className="room-input"
                          />
                        </td>
                        <td className="quick-actions">
                          <button
                            onClick={() => handleSelectAllDay(day.key, true)}
                            className="quick-action select"
                            title="Chọn cả ngày"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleSelectAllDay(day.key, false)}
                            className="quick-action deselect"
                            title="Bỏ chọn"
                          >
                            ✗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schedule preview */}
            {getSelectedShiftsCount() > 0 && (
              <div className="schedule-preview">
                <h4><FaChartBar/> Xem trước lịch làm việc cho {formatMonth(selectedMonth)}</h4>

                <div className="preview-grid">
                  {daysOfWeek.map((day) => {
                    const daySchedule = weeklySchedule[day.key];
                    const hasShifts = daySchedule.morning || daySchedule.afternoon;

                    if (!hasShifts) return null;

                    return (
                      <div key={day.key} className="preview-day">
                        <div className="preview-day-title">{day.label}</div>
                        <div className="preview-shifts">
                          {daySchedule.morning && (
                            <div> Ca sáng (8:00-12:00)</div>
                          )}
                          {daySchedule.afternoon && (
                            <div> Ca chiều (13:00-17:00)</div>
                          )}
                          <div className="preview-room"> {daySchedule.room}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="preview-stats">
                  <div> Tổng số ca/tuần: <strong>{getSelectedShiftsCount()}</strong></div>
                  <div> Tổng số ca trong tháng: <strong>{getSchedulesCount()}</strong></div>
                  <div> Bác sĩ: <strong>{selectedDoctor.name}</strong></div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="modal-actions">
              <button onClick={closeScheduleModal} className="cancel-button">
                 Đóng
              </button>
              <button
                onClick={saveSchedule}
                disabled={scheduleLoading || getSelectedShiftsCount() === 0}
                className={`save-button ${scheduleLoading || getSelectedShiftsCount() === 0 ? 'disabled' : ''}`}
              >
                {scheduleLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Đang kiểm tra xung đột...
                  </>
                ) : (
                  <><FaRegSave /> Tạo Lịch Cho Tháng ({getSchedulesCount()} ca)</>
                )}
              </button>
            </div>

            {/* Help text */}
            <div className="help-text">
              <h5><FaLightbulb/> Hướng dẫn sử dụng:</h5>
              <ul>
                <li>Chọn các thứ và ca làm việc mong muốn</li>
                <li>Mẫu tuần sẽ được áp dụng cho tất cả các tuần trong tháng</li>
                <li>Có thể đặt phòng khác nhau cho từng ngày trong tuần</li>
                <li>Ca sáng: 8:00-12:00, Ca chiều: 13:00-17:00</li>
                <li>Hệ thống sẽ <strong>tự động kiểm tra xung đột</strong> trước khi tạo</li>
                <li>Kiểm tra cả xung đột lịch bác sĩ và <strong>xung đột phòng khám</strong></li>
                <li>Không thể có 2 bác sĩ cùng sử dụng 1 phòng trong cùng thời gian</li>
                <li>Nếu có xung đột, bạn sẽ được thông báo và có tùy chọn xử lý</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Fixed CSS Styles */}
      <style jsx>{`
        /* Ensure only one modal shows at a time */
        .schedule-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(0, 0, 0, 0.8) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 999999 !important;
          backdrop-filter: blur(3px) !important;
          padding: 20px !important;
          box-sizing: border-box !important;
        }

        /* Hide any other modals when conflict modal is showing */
        body.conflict-modal-open .schedule-modal-overlay:not(.conflict-modal-overlay) {
          display: none !important;
        }

        body.success-modal-open .schedule-modal-overlay:not(.success-modal-overlay) {
          display: none !important;
        }

        .schedule-modal-content {
          background: white !important;
          border-radius: 12px !important;
          max-height: 90vh !important;
          overflow-y: auto !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
          position: relative !important;
          z-index: 1000000 !important;
          animation: modalSlideIn 0.3s ease-out !important;
        }

        /* Success Modal */
        .success-modal {
          padding: 32px !important;
          max-width: 500px !important;
          width: 90% !important;
          text-align: center !important;
          border: 3px solid #10b981 !important;
        }

        .success-icon {
          width: 80px !important;
          height: 80px !important;
          background-color: #dcfce7 !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto 24px !important;
          animation: bounce 1s infinite !important;
        }

        .success-icon span {
          font-size: 40px !important;
        }

        .success-modal h2 {
          font-size: 24px !important;
          font-weight: bold !important;
          color: #1f2937 !important;
          margin-bottom: 16px !important;
        }

        .success-modal p {
          font-size: 16px !important;
          color: #6b7280 !important;
          margin-bottom: 24px !important;
          line-height: 1.5 !important;
        }

        .success-stats {
          padding: 16px !important;
          background-color: #f0fdf4 !important;
          border-radius: 8px !important;
          margin-bottom: 24px !important;
          border: 1px solid #bbf7d0 !important;
        }

        .stats-title {
          font-size: 14px !important;
          color: #166534 !important;
          margin-bottom: 8px !important;
        }

        .stats-content {
          font-size: 12px !important;
          color: #166534 !important;
        }

        .success-button {
          padding: 12px 24px !important;
          background-color: #10b981 !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-weight: bold !important;
          font-size: 14px !important;
        }

        /* Conflict Modal */
        .conflict-modal {
          padding: 32px !important;
          max-width: 800px !important;
          width: 90% !important;
          border: 3px solid #f59e0b !important;
        }

        .conflict-icon {
          width: 80px !important;
          height: 80px !important;
          background-color: #fef3c7 !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto 24px !important;
        }

        .conflict-icon span {
          font-size: 40px !important;
        }

        .conflict-modal h2 {
          font-size: 24px !important;
          font-weight: bold !important;
          color: #1f2937 !important;
          margin-bottom: 16px !important;
          text-align: center !important;
        }

        .conflict-section {
          padding: 16px !important;
          background-color: #fef2f2 !important;
          border: 1px solid #fecaca !important;
          border-radius: 8px !important;
          margin-bottom: 24px !important;
        }

        .conflict-title {
          font-size: 14px !important;
          color: #dc2626 !important;
          font-weight: bold !important;
          margin-bottom: 12px !important;
        }

        .conflict-list {
          max-height: 200px !important;
          overflow-y: auto !important;
          font-size: 12px !important;
          color: #dc2626 !important;
        }

        .conflict-item {
          padding: 8px !important;
          background-color: white !important;
          border-radius: 4px !important;
          margin-bottom: 4px !important;
          border: 1px solid #fecaca !important;
        }

        .conflict-reason {
          color: #ef4444 !important;
          font-weight: bold !important;
        }

        .success-section {
          padding: 16px !important;
          background-color: #f0fdf4 !important;
          border: 1px solid #bbf7d0 !important;
          border-radius: 8px !important;
          margin-bottom: 24px !important;
        }

        .success-title {
          font-size: 14px !important;
          color: #166534 !important;
          font-weight: bold !important;
          margin-bottom: 12px !important;
        }

        .success-list {
          max-height: 150px !important;
          overflow-y: auto !important;
          font-size: 12px !important;
          color: #166534 !important;
        }

        .success-item {
          padding: 4px 8px !important;
          background-color: white !important;
          border-radius: 4px !important;
          margin-bottom: 2px !important;
          border: 1px solid #bbf7d0 !important;
        }

        .more-items {
          padding: 4px 8px !important;
          font-style: italic !important;
        }

        .help-section {
          padding: 16px !important;
          background-color: #fffbeb !important;
          border: 1px solid #fbbf24 !important;
          border-radius: 8px !important;
          margin-bottom: 24px !important;
        }

        .help-section h4 {
          font-size: 14px !important;
          font-weight: bold !important;
          color: #92400e !important;
          margin: 0 0 8px 0 !important;
        }

        .help-section ul {
          font-size: 12px !important;
          color: #92400e !important;
          margin: 0 !important;
          padding-left: 16px !important;
        }

        /* Main Modal */
        .main-modal {
          padding: 24px !important;
          width: 95% !important;
          max-width: 1000px !important;
          border: 3px solid #3b82f6 !important;
        }

        .modal-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 24px !important;
        }

        .modal-header h2 {
          font-size: 20px !important;
          font-weight: bold !important;
          color: #1f2937 !important;
          margin: 0 !important;
        }

        .close-button {
          background-color: transparent !important;
          border: none !important;
          font-size: 24px !important;
          color: #6b7280 !important;
          cursor: pointer !important;
        }

        /* Month Selection */
        .month-selection {
          margin-bottom: 24px !important;
          padding: 16px !important;
          background-color: #f0f9ff !important;
          border-radius: 8px !important;
          border: 2px solid #0ea5e9 !important;
        }

        .month-selection label {
          display: block !important;
          font-size: 14px !important;
          font-weight: bold !important;
          color: #0c4a6e !important;
          margin-bottom: 8px !important;
        }

        .month-selection input {
          padding: 8px 12px !important;
          border: 1px solid #0ea5e9 !important;
          border-radius: 6px !important;
          font-size: 14px !important;
        }

        .month-selection p {
          margin: 8px 0 0 0 !important;
          font-size: 12px !important;
          color: #0c4a6e !important;
        }

        /* Weekly Schedule */
        .weekly-schedule {
          margin-bottom: 24px !important;
        }

        .schedule-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 16px !important;
        }

        .schedule-header h3 {
          font-size: 16px !important;
          font-weight: bold !important;
          color: #1f2937 !important;
          margin: 0 !important;
        }

        .selected-count {
          font-size: 12px !important;
          color: #6b7280 !important;
        }

        /* Quick Select */
        .quick-select {
          margin-bottom: 16px !important;
          display: flex !important;
          gap: 8px !important;
          flex-wrap: wrap !important;
        }

        .quick-btn {
          padding: 6px 12px !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          cursor: pointer !important;
          border: 1px solid !important;
        }

        .quick-btn.morning {
          background-color: #fef3c7 !important;
          color: #92400e !important;
          border-color: #fbbf24 !important;
        }

        .quick-btn.afternoon {
          background-color: #fed7d7 !important;
          color: #c53030 !important;
          border-color: #f56565 !important;
        }

        .quick-btn.clear {
          background-color: #f7fafc !important;
          color: #4a5568 !important;
          border-color: #cbd5e0 !important;
        }

        /* Table */
        .table-container {
          overflow-x: auto !important;
        }

        .schedule-table {
          width: 100% !important;
          border-collapse: collapse !important;
          border: 1px solid #e5e7eb !important;
        }

        .schedule-table thead {
          background-color: #f9fafb !important;
        }

        .schedule-table th {
          padding: 12px !important;
          text-align: left !important;
          border-bottom: 1px solid #e5e7eb !important;
          font-weight: bold !important;
        }

        .schedule-table th:nth-child(2),
        .schedule-table th:nth-child(3),
        .schedule-table th:nth-child(5) {
          text-align: center !important;
        }

        .time-label {
          font-size: 11px !important;
          color: #6b7280 !important;
        }

        .schedule-table tbody tr {
          border-bottom: 1px solid #f3f4f6 !important;
        }

        .schedule-table td {
          padding: 12px !important;
        }

        .day-label {
          font-weight: 500 !important;
        }

        .checkbox-cell {
          text-align: center !important;
        }

        .morning-checkbox {
          width: 18px !important;
          height: 18px !important;
          accent-color: #f59e0b !important;
        }

        .afternoon-checkbox {
          width: 18px !important;
          height: 18px !important;
          accent-color: #ef4444 !important;
        }

        .room-input {
          width: 80px !important;
          padding: 4px 8px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 4px !important;
          font-size: 12px !important;
        }

        .quick-actions {
          text-align: center !important;
        }

        .quick-action {
          padding: 2px 6px !important;
          border: none !important;
          border-radius: 3px !important;
          font-size: 10px !important;
          cursor: pointer !important;
          margin: 0 2px !important;
        }

        .quick-action.select {
          background-color: #dcfce7 !important;
          color: #166534 !important;
        }

        .quick-action.deselect {
          background-color: #fee2e2 !important;
          color: #dc2626 !important;
        }

        /* Schedule Preview */
        .schedule-preview {
          margin-bottom: 24px !important;
          padding: 16px !important;
          background-color: #f0fdf4 !important;
          border: 1px solid #bbf7d0 !important;
          border-radius: 8px !important;
        }

        .schedule-preview h4 {
          font-size: 14px !important;
          font-weight: bold !important;
          color: #166534 !important;
          margin-bottom: 12px !important;
        }

        .preview-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          gap: 12px !important;
        }

        .preview-day {
          padding: 8px !important;
          background-color: white !important;
          border-radius: 6px !important;
          border: 1px solid #bbf7d0 !important;
        }

        .preview-day-title {
          font-weight: bold !important;
          font-size: 12px !important;
          color: #166534 !important;
          margin-bottom: 4px !important;
        }

        .preview-shifts {
          font-size: 11px !important;
          color: #059669 !important;
        }

        .preview-room {
          color: #6b7280 !important;
          margin-top: 2px !important;
        }

        .preview-stats {
          margin-top: 12px !important;
          font-size: 12px !important;
          color: #166534 !important;
        }

        .preview-stats div {
          margin-bottom: 4px !important;
        }

        /* Modal Actions */
        .modal-actions {
          display: flex !important;
          justify-content: flex-end !important;
          gap: 12px !important;
          margin-bottom: 16px !important;
        }

        .cancel-button {
          padding: 10px 20px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 8px !important;
          background-color: white !important;
          color: #374151 !important;
          cursor: pointer !important;
          font-weight: bold !important;
        }

        .continue-button {
          padding: 12px 24px !important;
          background-color: #f59e0b !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-weight: bold !important;
          font-size: 14px !important;
        }

        .save-button {
          padding: 10px 20px !important;
          background-color: #10b981 !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-weight: bold !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .save-button.disabled {
          background-color: #9ca3af !important;
          cursor: not-allowed !important;
        }

        .loading-spinner {
          width: 16px !important;
          height: 16px !important;
          border: 2px solid #ffffff !important;
          border-top: 2px solid transparent !important;
          border-radius: 50% !important;
          animation: spin 1s linear infinite !important;
        }

        /* Help Text */
        .help-text {
          padding: 12px !important;
          background-color: #fef3c7 !important;
          border: 1px solid #fbbf24 !important;
          border-radius: 6px !important;
        }

        .help-text h5 {
          font-size: 12px !important;
          font-weight: bold !important;
          color: #92400e !important;
          margin: 0 0 8px 0 !important;
        }

        .help-text ul {
          font-size: 11px !important;
          color: #92400e !important;
          margin: 0 !important;
          padding-left: 16px !important;
        }

        .help-text li {
          margin-bottom: 2px !important;
        }

        /* Animations */
        @keyframes modalSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(-50px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
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

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .schedule-modal-overlay {
            padding: 10px !important;
          }

          .main-modal {
            width: 98% !important;
            padding: 16px !important;
          }

          .conflict-modal,
          .success-modal {
            width: 98% !important;
            padding: 20px !important;
          }

          .quick-select {
            flex-direction: column !important;
          }

          .quick-btn {
            width: 100% !important;
            margin-bottom: 4px !important;
          }

          .table-container {
            font-size: 12px !important;
          }

          .schedule-table th,
          .schedule-table td {
            padding: 8px 4px !important;
          }

          .preview-grid {
            grid-template-columns: 1fr !important;
          }

          .modal-actions {
            flex-direction: column !important;
          }

          .modal-actions button {
            width: 100% !important;
            margin-bottom: 8px !important;
          }
        }

        /* Ensure modals stay on top */
        .schedule-modal-overlay * {
          box-sizing: border-box !important;
        }

        /* Override any conflicting styles */
        .schedule-modal-overlay,
        .schedule-modal-overlay * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
        }

        /* Prevent body scroll when modal is open */
        body.modal-open {
          overflow: hidden !important;
        }
      `}</style>
    </>
  );
}