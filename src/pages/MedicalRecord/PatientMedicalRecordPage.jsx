import React, { useEffect, useState, useCallback } from "react";
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
import hivExaminationService from "../../services/HIVExaminationService";
import CustomArvProtocolsService from "../../services/CustomArvProtocolsService";
import appointmentService from "../../services/Appointment";
import { tokenManager } from "../../services/account";
import SidebarProfile from "../../components/SidebarProfile/SidebarProfile";

const PatientMedicalRecordPage = () => {
  const [examinations, setExaminations] = useState([]);
  const [protocolHistory, setProtocolHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainView, setMainView] = useState("examinations"); // "examinations", "protocols"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [patientInfo, setPatientInfo] = useState(null);
  const patientId = tokenManager.getCurrentUserId();
  const itemsPerPage = 5;

  useEffect(() => {
    const userId = tokenManager.getCurrentUserId();
    if (!userId) {
      setError("Vui lòng đăng nhập để xem lịch sử y tế");
      setLoading(false);
      return;
    }
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      setError("ID người dùng không hợp lệ");
      setLoading(false);
      return;
    }
    loadAllData();
  }, [patientId]);

  const loadAllData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      // Load patient info (similar to AppointmentHistory)
      try {
        const patientData = await appointmentService.getPatientInfoApi(
          patientId
        );
        setPatientInfo(patientData);
      } catch (err) {
        console.warn("Could not load patient info:", err);
        // Set fallback patient info
        setPatientInfo({
          fullName: tokenManager.getCurrentUserName() || "Người dùng",
          userId: patientId,
        });
      }

      // Load Examination History
      const examinationsPromise = hivExaminationService
        .getPatientHistory(patientId)
        .then((response) => (response.success ? response.data : []))
        .catch((err) => {
          console.error("Failed to fetch examinations:", err);
          return [];
        });

      // Load Protocol History
      const protocolsPromise =
        CustomArvProtocolsService.getPatientProtocolHistory(patientId).catch(
          (err) => {
            console.error("Failed to fetch protocol history:", err);
            return [];
          }
        );

      const [exams, protocols] = await Promise.all([
        examinationsPromise,
        protocolsPromise,
      ]);

      setExaminations(exams || []);
      setProtocolHistory(protocols || []);
    } catch (error) {
      console.error("Error loading patient data:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu y tế. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Không có";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusStyle = (status) => {
    const baseStyle = {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.875rem",
      fontWeight: "500",
    };

    if (!status)
      return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#1f2937" };

    const statusLower = status.toLowerCase();
    if (statusLower.includes("active"))
      return { ...baseStyle, backgroundColor: "#dcfce7", color: "#15803d" };
    if (statusLower.includes("completed"))
      return { ...baseStyle, backgroundColor: "#dbeafe", color: "#1e40af" };
    if (statusLower.includes("inactive"))
      return { ...baseStyle, backgroundColor: "#fef9c3", color: "#a16207" };
    if (statusLower.includes("cancelled"))
      return { ...baseStyle, backgroundColor: "#fee2e2", color: "#b91c1c" };
    return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#1f2937" };
  };

  // Filter logic for examinations
  const filteredExaminations = examinations.filter((exam) => {
    const matchesSearch =
      (exam.doctorName &&
        exam.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exam.result &&
        exam.result.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (filterStatus === "completed") matchesFilter = exam.status === "ACTIVE";
    else if (filterStatus === "pending")
      matchesFilter = exam.status !== "ACTIVE";

    return matchesSearch && matchesFilter;
  });

  // Filter logic for protocols
  const filteredProtocols = protocolHistory.filter((protocol) => {
    const matchesSearch =
      (protocol.name &&
        protocol.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (protocol.description &&
        protocol.description.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (filterStatus === "active") matchesFilter = protocol.status === "ACTIVE";
    else if (filterStatus === "inactive")
      matchesFilter = protocol.status !== "ACTIVE";

    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const currentData =
    mainView === "examinations" ? filteredExaminations : filteredProtocols;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = currentData.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="container">
        <div className="sidebar-Profile">
          <SidebarProfile />
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
              Đang tải dữ liệu y tế...
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
          <SidebarProfile />
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
              onClick={loadAllData}
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
        <SidebarProfile />
      </div>
      <section className="profile">
        <h2>Hồ sơ y tế của bạn</h2>

        {/* Statistics Summary */}
        {/* <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginTop: "2rem",
            padding: "2rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "1rem",
            color: "white",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                marginBottom: "0.5rem",
              }}
            >
              {examinations.length}
            </div>
            <div
              style={{ fontSize: "1rem", opacity: "0.9", fontWeight: "500" }}
            >
              Lần xét nghiệm
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                marginBottom: "0.5rem",
              }}
            >
              {protocolHistory.length}
            </div>
            <div
              style={{ fontSize: "1rem", opacity: "0.9", fontWeight: "500" }}
            >
              Phác đồ ARV
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                marginBottom: "0.5rem",
              }}
            >
              {protocolHistory.filter((p) => p.status === "ACTIVE").length}
            </div>
            <div
              style={{ fontSize: "1rem", opacity: "0.9", fontWeight: "500" }}
            >
              Phác đồ đang áp dụng
            </div>
          </div>
        </div> */}

        <div className="card">
          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1.5rem",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <button
              onClick={() => {
                setMainView("examinations");
                setCurrentPage(1);
              }}
              style={{
                padding: "1rem 1.5rem",
                background: "none",
                border: "none",
                fontWeight: "600",
                color: mainView === "examinations" ? "#3b82f6" : "#64748b",
                cursor: "pointer",
                borderBottom:
                  mainView === "examinations"
                    ? "3px solid #3b82f6"
                    : "3px solid transparent",
                transition: "all 0.3s ease",
              }}
            >
              🔬 Lịch sử xét nghiệm ({examinations.length})
            </button>
            <button
              onClick={() => {
                setMainView("protocols");
                setCurrentPage(1);
              }}
              style={{
                padding: "1rem 1.5rem",
                background: "none",
                border: "none",
                fontWeight: "600",
                color: mainView === "protocols" ? "#3b82f6" : "#64748b",
                cursor: "pointer",
                borderBottom:
                  mainView === "protocols"
                    ? "3px solid #3b82f6"
                    : "3px solid transparent",
                transition: "all 0.3s ease",
              }}
            >
              💊 Lịch sử phác đồ ARV ({protocolHistory.length})
            </button>
          </div>

          {/* Search and Filter */}
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
                placeholder={
                  mainView === "examinations"
                    ? "Tìm kiếm theo bác sĩ hoặc kết quả..."
                    : "Tìm kiếm theo tên hoặc mô tả phác đồ..."
                }
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
                {mainView === "examinations" ? (
                  <>
                    <option value="all">Tất cả ({examinations.length})</option>
                    <option value="completed">
                      Đã hoàn thành (
                      {examinations.filter((e) => e.status === "ACTIVE").length}
                      )
                    </option>
                    <option value="pending">
                      Đang xử lý (
                      {examinations.filter((e) => e.status !== "ACTIVE").length}
                      )
                    </option>
                  </>
                ) : (
                  <>
                    <option value="all">
                      Tất cả ({protocolHistory.length})
                    </option>
                    <option value="active">
                      Đang áp dụng (
                      {
                        protocolHistory.filter((p) => p.status === "ACTIVE")
                          .length
                      }
                      )
                    </option>
                    <option value="inactive">
                      Không áp dụng (
                      {
                        protocolHistory.filter((p) => p.status !== "ACTIVE")
                          .length
                      }
                      )
                    </option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Content Display */}
          <div style={{ marginTop: "1rem" }}>
            {currentItems.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem 0",
                  color: "#6b7280",
                }}
              >
                {mainView === "examinations" ? (
                  <>
                    <div
                      style={{
                        fontSize: "4rem",
                        marginBottom: "1rem",
                        opacity: "0.5",
                      }}
                    >
                      🔬
                    </div>
                    <p>Không tìm thấy lịch sử xét nghiệm nào</p>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: "4rem",
                        marginBottom: "1rem",
                        opacity: "0.5",
                      }}
                    >
                      💊
                    </div>
                    <p>Không tìm thấy lịch sử phác đồ ARV nào</p>
                  </>
                )}
              </div>
            ) : (
              currentItems.map((item) => (
                <div
                  key={
                    mainView === "examinations"
                      ? item.examId
                      : item.customProtocolId
                  }
                  className="card"
                  style={{ padding: "1.5rem", marginBottom: "1rem" }}
                >
                  {mainView === "examinations" ? (
                    // Examination Card
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
                          <span style={{ fontSize: "1.5rem" }}>🔬</span>
                          <h3
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            Xét nghiệm HIV #{item.examId}
                          </h3>
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
                            <Calendar
                              style={{ width: "1rem", height: "1rem" }}
                            />
                            <span>{formatDate(item.examDate)}</span>
                            <User
                              style={{
                                width: "1rem",
                                height: "1rem",
                                marginLeft: "0.5rem",
                              }}
                            />
                            <span>Bác sĩ: {item.doctorName}</span>
                          </div>
                          {item.result && (
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
                              <span>{item.result}</span>
                            </div>
                          )}
                        </div>
                        {/* Examination Results */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "0.75rem",
                            marginTop: "1rem",
                          }}
                        >
                          {item.cd4Count && (
                            <div
                              style={{
                                padding: "0.5rem",
                                backgroundColor: "#dcfce7",
                                borderRadius: "0.5rem",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#166534",
                                }}
                              >
                                CD4
                              </div>
                              <div
                                style={{ fontWeight: "700", color: "#059669" }}
                              >
                                {item.cd4Count} tế bào/mm³
                              </div>
                            </div>
                          )}
                          {item.hivLoad && (
                            <div
                              style={{
                                padding: "0.5rem",
                                backgroundColor: "#fee2e2",
                                borderRadius: "0.5rem",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#dc2626",
                                }}
                              >
                                Tải lượng HIV
                              </div>
                              <div
                                style={{ fontWeight: "700", color: "#dc2626" }}
                              >
                                {item.hivLoad} copies/ml
                              </div>
                            </div>
                          )}
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
                        <span style={getStatusStyle(item.status)}>
                          {item.status === "ACTIVE"
                            ? "Hoàn thành"
                            : item.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Protocol Card
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
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
                          <span style={{ fontSize: "1.5rem" }}>💊</span>
                          <h3
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            {item.name || "Phác đồ tùy chỉnh"}
                          </h3>
                        </div>
                        <div
                          style={{
                            marginTop: "0.25rem",
                            fontSize: "0.875rem",
                            color: "#4b5563",
                          }}
                        >
                          {item.baseProtocolName && (
                            <div style={{ marginBottom: "0.25rem" }}>
                              <span style={{ fontWeight: "500" }}>
                                Dựa trên:
                              </span>{" "}
                              {item.baseProtocolName}
                            </div>
                          )}
                          {item.description && (
                            <div style={{ marginBottom: "0.5rem" }}>
                              {item.description}
                            </div>
                          )}
                        </div>

                        {/* ARV Details */}
                        <div style={{ marginTop: "1rem" }}>
                          <h5
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              color: "#475569",
                              marginBottom: "0.5rem",
                            }}
                          >
                            Danh sách thuốc ARV:
                          </h5>
                          {item.details && item.details.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                              }}
                            >
                              {item.details.slice(0, 3).map((detail, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr 2fr",
                                    gap: "0.5rem",
                                    padding: "0.5rem",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "0.5rem",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "500",
                                      color: "#1e293b",
                                    }}
                                  >
                                    {detail.arvName}
                                  </span>
                                  <span
                                    style={{
                                      color: "#059669",
                                      textAlign: "center",
                                    }}
                                  >
                                    {detail.dosage}
                                  </span>
                                  <span style={{ color: "#64748b" }}>
                                    {detail.usageInstruction}
                                  </span>
                                </div>
                              ))}
                              {item.details.length > 3 && (
                                <div
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "#64748b",
                                    fontStyle: "italic",
                                  }}
                                >
                                  ... và {item.details.length - 3} thuốc khác
                                </div>
                              )}
                            </div>
                          ) : (
                            <p
                              style={{
                                color: "#94a3b8",
                                fontStyle: "italic",
                                margin: 0,
                              }}
                            >
                              Chưa có thuốc ARV nào
                            </p>
                          )}
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
                        <span style={getStatusStyle(item.status)}>
                          {item.status === "ACTIVE"
                            ? "Đang áp dụng"
                            : item.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
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
      </section>
    </div>
  );
};

export default PatientMedicalRecordPage;
