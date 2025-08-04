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
  Eye,
  Activity,
  Stethoscope,
  Pill,
  Heart,
  ClipboardList,
} from "lucide-react";
import { 
  getMedicalRecordsByPatient, 
  getMedicalRecordDetail 
} from "../../services/medicalRecordService";
import appointmentService from "../../services/Appointment";
import { tokenManager } from "../../services/account";
import SidebarProfile from "../../components/SidebarProfile/SidebarProfile";

const PatientMedicalRecordPage = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [patientInfo, setPatientInfo] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const patientId = tokenManager.getCurrentUserId();
  const itemsPerPage = 5;

  useEffect(() => {
    const userId = tokenManager.getCurrentUserId();
    if (!userId) {
      setError("Vui lòng đăng nhập để xem hồ sơ bệnh án");
      setLoading(false);
      return;
    }
    loadMedicalRecords();
  }, [patientId]);

  const loadMedicalRecords = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      // Load patient info
      try {
        const patientData = await appointmentService.getPatientInfoApi(patientId);
        setPatientInfo(patientData);
      } catch (err) {
        console.warn("Could not load patient info:", err);
        setPatientInfo({
          fullName: tokenManager.getCurrentUserName() || "Người dùng",
          userId: patientId,
        });
      }

      // Load medical records
      const records = await getMedicalRecordsByPatient(patientId);
      setMedicalRecords(records || []);
    } catch (error) {
      console.error("Error loading medical records:", error);
      setError("Có lỗi xảy ra khi tải hồ sơ bệnh án. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const loadRecordDetail = async (recordId) => {
    setLoadingDetail(true);
    try {
      // Tìm record từ danh sách hiện tại trước
      const recordFromList = medicalRecords.find(r => r.recordId === recordId);
      
      if (recordFromList) {
        console.log("🔍 Using record from list:", recordFromList);
        setSelectedRecord(recordFromList);
        setShowDetailModal(true);
      } else {
        // Fallback: gọi API detail nếu không tìm thấy trong danh sách
        const detail = await getMedicalRecordDetail(recordId);
        console.log("🔍 Using API detail response:", detail);
        setSelectedRecord(detail);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error loading record detail:", error);
      alert("Không thể tải chi tiết hồ sơ bệnh án");
    } finally {
      setLoadingDetail(false);
    }
  };

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

  const formatTime = (timeString) => {
    if (!timeString) return "Không có";
    try {
      return timeString.substring(0, 5);
    } catch {
      return timeString;
    }
  };

  const getStatusStyle = (status) => {
    const baseStyle = {
      padding: "0.25rem 0.75rem",
      borderRadius: "9999px",
      fontSize: "0.875rem",
      fontWeight: "500",
    };

    if (!status) return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#1f2937" };

    const statusLower = status.toLowerCase();
    if (statusLower === "active")
      return { ...baseStyle, backgroundColor: "#dcfce7", color: "#15803d" };
    if (statusLower === "completed")
      return { ...baseStyle, backgroundColor: "#dbeafe", color: "#1e40af" };
    if (statusLower === "pending")
      return { ...baseStyle, backgroundColor: "#fef9c3", color: "#a16207" };
    if (statusLower === "cancelled")
      return { ...baseStyle, backgroundColor: "#fee2e2", color: "#b91c1c" };
    return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#1f2937" };
  };

  // Filter logic
  const filteredRecords = medicalRecords.filter((record) => {
    const matchesSearch =
      (record.doctorName && record.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.summary && record.summary.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (filterStatus === "active") matchesFilter = record.status === "ACTIVE";
    else if (filterStatus === "pending") matchesFilter = record.status === "PENDING";
    else if (filterStatus === "completed") matchesFilter = record.status === "COMPLETED";

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredRecords.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="container">
        <div className="sidebar-Profile">
          <SidebarProfile />
        </div>
        <section className="profile">
          <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "3rem 0" }}>
            <div style={{ animation: "spin 1s linear infinite", borderRadius: "9999px", height: "3rem", width: "3rem", borderBottom: "2px solid #00c497" }}></div>
            <span style={{ marginLeft: "0.75rem", color: "#4b5563" }}>Đang tải hồ sơ bệnh án...</span>
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
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 0", color: "#dc2626" }}>
            <AlertCircle style={{ width: "3rem", height: "3rem", marginBottom: "1rem" }} />
            <span style={{ marginBottom: "1rem", textAlign: "center" }}>{error}</span>
            <button onClick={loadMedicalRecords} className="btn-green" style={{ padding: "0.5rem 1rem" }}>
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
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <ClipboardList style={{ width: "2rem", height: "2rem", color: "#00c497" }} />
          Hồ sơ bệnh án của bạn
        </h2>

        {/* Statistics Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "1rem", padding: "1.5rem", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              {medicalRecords.length}
            </div>
            <div style={{ fontSize: "1rem", opacity: "0.9", fontWeight: "500" }}>
              Tổng số hồ sơ
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", borderRadius: "1rem", padding: "1.5rem", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              {medicalRecords.filter(r => r.status === "ACTIVE").length}
            </div>
            <div style={{ fontSize: "1rem", opacity: "0.9", fontWeight: "500" }}>
              Hồ sơ hoạt động
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", borderRadius: "1rem", padding: "1.5rem", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              {medicalRecords.filter(r => r.examId).length}
            </div>
            <div style={{ fontSize: "1rem", opacity: "0.9", fontWeight: "500" }}>
              Có kết quả xét nghiệm
            </div>
          </div>
        </div>
        <div className="card">
          {/* Search and Filter */}
          <div style={{ display: "flex", flexDirection: "row", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: "1", position: "relative" }}>
              <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#999", width: "1.25rem", height: "1.25rem" }} />
              <input
                type="text"
                placeholder="Tìm kiếm theo bác sĩ hoặc tóm tắt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 1rem 0.5rem 2.5rem", border: "1px solid #ccc", borderRadius: "8px", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter style={{ color: "#999", width: "1.25rem", height: "1.25rem" }} />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "8px", outline: "none" }}
              >
                <option value="all">Tất cả ({medicalRecords.length})</option>
                <option value="active">Hoạt động ({medicalRecords.filter(r => r.status === "ACTIVE").length})</option>
                <option value="pending">Đang xử lý ({medicalRecords.filter(r => r.status === "PENDING").length})</option>
                <option value="completed">Hoàn thành ({medicalRecords.filter(r => r.status === "COMPLETED").length})</option>
              </select>
            </div>
          </div>

          {/* Medical Records List */}
          <div style={{ marginTop: "1rem" }}>
            {currentItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 0", color: "#6b7280" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: "0.5" }}>📋</div>
                <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Không tìm thấy hồ sơ bệnh án nào</p>
                <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>Hãy liên hệ với bác sĩ để tạo hồ sơ bệnh án đầu tiên</p>
              </div>
            ) : (
              currentItems.map((record) => (
                <div key={record.recordId} className="card" style={{ padding: "1.5rem", marginBottom: "1rem", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      {/* Record Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ width: "3rem", height: "3rem", backgroundColor: "#00c497", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#1f2937", margin: 0 }}>
                            Hồ sơ bệnh án #{record.recordId}
                          </h3>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.25rem", fontSize: "0.875rem", color: "#6b7280" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <Calendar style={{ width: "1rem", height: "1rem" }} />
                              {formatDate(record.examDate)}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <Clock style={{ width: "1rem", height: "1rem" }} />
                              {formatTime(record.examTime)}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <User style={{ width: "1rem", height: "1rem" }} />
                              BS. {record.doctorName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                        {record.examId && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", backgroundColor: "#f0fdf4", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                            <Activity style={{ width: "1.25rem", height: "1.25rem", color: "#16a34a" }} />
                            <div>
                              <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "500" }}>Xét nghiệm</div>
                              <div style={{ fontSize: "0.875rem", color: "#15803d", fontWeight: "600" }}>ID: {record.examId}</div>
                            </div>
                          </div>
                        )}
                        {record.customProtocolId && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", backgroundColor: "#fef3f2", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
                            <Pill style={{ width: "1.25rem", height: "1.25rem", color: "#dc2626" }} />
                            <div>
                              <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "500" }}>Phác đồ điều trị</div>
                              <div style={{ fontSize: "0.875rem", color: "#b91c1c", fontWeight: "600" }}>ID: {record.customProtocolId}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      {record.summary && (
                        <div style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                          <h5 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Stethoscope style={{ width: "1rem", height: "1rem" }} />
                            Tóm tắt khám bệnh:
                          </h5>
                          <p style={{ fontSize: "0.875rem", color: "#4b5563", margin: 0, lineHeight: "1.5" }}>
                            {record.summary}
                          </p>
                        </div>
                      )}

                      {/* Issue Date */}
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>
                        Tạo lúc: {formatDate(record.issuedAt)}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1rem" }}>
                      <span style={getStatusStyle(record.status)}>
                        {record.status === "ACTIVE" ? "Hoạt động" : 
                         record.status === "PENDING" ? "Đang xử lý" :
                         record.status === "COMPLETED" ? "Hoàn thành" : record.status}
                      </span>
                      <button
                        onClick={() => loadRecordDetail(record.recordId)}
                        disabled={loadingDetail}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          cursor: loadingDetail ? "not-allowed" : "pointer",
                          opacity: loadingDetail ? 0.7 : 1,
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Eye style={{ width: "1rem", height: "1rem" }} />
                        {loadingDetail ? "Đang tải..." : "Xem chi tiết"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
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
                    (index + 1 >= currentPage - 1 && index + 1 <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "0.375rem",
                          backgroundColor: currentPage === index + 1 ? "#00c497" : "#ffffff",
                          color: currentPage === index + 1 ? "#ffffff" : "#000000",
                          border: "1px solid " + (currentPage === index + 1 ? "#00c497" : "#d1d5db"),
                          cursor: "pointer",
                        }}
                      >
                        {index + 1}
                      </button>
                    );
                  } else if (index + 1 === currentPage - 2 || index + 1 === currentPage + 2) {
                    return <span key={index} style={{ padding: "0 0.25rem" }}>...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  opacity: currentPage === totalPages ? "0.5" : "1",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                }}
              >
                <ChevronRight style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRecord && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem"
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937", margin: 0 }}>
                  Chi tiết hồ sơ bệnh án #{selectedRecord.recordId}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#f3f4f6",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontSize: "1.5rem",
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>

              {/* Record Basic Info */}
              <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f8fafc", borderRadius: "0.75rem" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#374151", marginBottom: "1rem" }}>Thông tin chung</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Bác sĩ khám:</span>
                    <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>BS. {selectedRecord.doctorName}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Ngày khám:</span>
                    <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>{formatDate(selectedRecord.examDate)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Giờ khám:</span>
                    <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>{formatTime(selectedRecord.examTime)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Trạng thái:</span>
                    <span style={getStatusStyle(selectedRecord.status)}>
                      {selectedRecord.status === "ACTIVE" ? "Hoạt động" : selectedRecord.status}
                    </span>
                  </div>
                </div>
                {selectedRecord.summary && (
                  <div style={{ marginTop: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "500" }}>Tóm tắt:</span>
                    <div style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.25rem", lineHeight: "1.6" }}>
                      {selectedRecord.summary}
                    </div>
                  </div>
                )}
              </div>

              {/* Examination Details */}
              {(selectedRecord.examinationInfo || selectedRecord.examId) && (
                <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f0fdf4", borderRadius: "0.75rem", border: "1px solid #bbf7d0" }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#166534", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Activity style={{ width: "1.25rem", height: "1.25rem" }} />
                    Kết quả xét nghiệm
                  </h4>
                  
                  {selectedRecord.examinationInfo ? (
                    // Hiển thị từ API detail nếu có
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                        <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #dcfce7" }}>
                          <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "500", marginBottom: "0.25rem" }}>Ngày xét nghiệm</div>
                          <div style={{ fontSize: "1rem", color: "#15803d", fontWeight: "600" }}>{formatDate(selectedRecord.examinationInfo.examDate)}</div>
                        </div>
                        <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #dcfce7" }}>
                          <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "500", marginBottom: "0.25rem" }}>Trạng thái</div>
                          <span style={getStatusStyle(selectedRecord.examinationInfo.status)}>
                            {selectedRecord.examinationInfo.status === "ACTIVE" ? "Hoạt động" : 
                             selectedRecord.examinationInfo.status === "Completed" ? "Hoàn thành" : 
                             selectedRecord.examinationInfo.status}
                          </span>
                        </div>
                        {selectedRecord.examinationInfo.cd4Count && (
                          <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #dcfce7" }}>
                            <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "500", marginBottom: "0.25rem" }}>CD4 Count</div>
                            <div style={{ fontSize: "1.5rem", color: "#15803d", fontWeight: "700" }}>{selectedRecord.examinationInfo.cd4Count}</div>
                            <div style={{ fontSize: "0.75rem", color: "#166534" }}>tế bào/mm³</div>
                          </div>
                        )}
                        {selectedRecord.examinationInfo.hivLoad && (
                          <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #fed7d7" }}>
                            <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "500", marginBottom: "0.25rem" }}>HIV Load</div>
                            <div style={{ fontSize: "1.5rem", color: "#dc2626", fontWeight: "700" }}>{selectedRecord.examinationInfo.hivLoad}</div>
                            <div style={{ fontSize: "0.75rem", color: "#dc2626" }}>copies/ml</div>
                          </div>
                        )}
                      </div>
                      {selectedRecord.examinationInfo.result && (
                        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem" }}>
                          <span style={{ fontSize: "0.875rem", color: "#166534", fontWeight: "500" }}>Kết quả chi tiết:</span>
                          <div style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.5rem", lineHeight: "1.6" }}>
                            {selectedRecord.examinationInfo.result}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Fallback: hiển thị thông tin cơ bản nếu chỉ có examId
                    <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1rem", color: "#166534", fontWeight: "600", marginBottom: "0.5rem" }}>
                        Xét nghiệm ID: {selectedRecord.examId}
                      </div>
                      <p style={{ color: "#6b7280", fontStyle: "italic", margin: 0 }}>
                        Đang chờ cập nhật kết quả chi tiết từ bác sĩ
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ARV Protocol Details */}
              {selectedRecord.customProtocolInfo && (
                <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#fef2f2", borderRadius: "0.75rem", border: "1px solid #fecaca" }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#dc2626", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Pill style={{ width: "1.25rem", height: "1.25rem" }} />
                    Phác đồ điều trị ARV
                  </h4>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <span style={{ fontSize: "0.875rem", color: "#dc2626", fontWeight: "500" }}>Tên phác đồ:</span>
                        <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>{selectedRecord.customProtocolInfo.name || "Phác đồ tùy chỉnh"}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.875rem", color: "#dc2626", fontWeight: "500" }}>Trạng thái:</span>
                        <span style={getStatusStyle(selectedRecord.customProtocolInfo.status)}>
                          {selectedRecord.customProtocolInfo.status === "ACTIVE" || selectedRecord.customProtocolInfo.status === "Active" ? "Đang áp dụng" : selectedRecord.customProtocolInfo.status}
                        </span>
                      </div>
                      {selectedRecord.customProtocolInfo.baseProtocolName && selectedRecord.customProtocolInfo.baseProtocolName !== "No base protocol" && (
                        <div>
                          <span style={{ fontSize: "0.875rem", color: "#dc2626", fontWeight: "500" }}>Dựa trên:</span>
                          <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>{selectedRecord.customProtocolInfo.baseProtocolName}</div>
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: "0.875rem", color: "#dc2626", fontWeight: "500" }}>Mã phác đồ:</span>
                        <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>#{selectedRecord.customProtocolId}</div>
                      </div>
                    </div>
                    
                    {selectedRecord.customProtocolInfo.description && selectedRecord.customProtocolInfo.description !== "No description available" && (
                      <div style={{ marginTop: "1rem" }}>
                        <span style={{ fontSize: "0.875rem", color: "#dc2626", fontWeight: "500" }}>Mô tả:</span>
                        <div style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.25rem", lineHeight: "1.6" }}>
                          {selectedRecord.customProtocolInfo.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ARV Medications */}
                  {selectedRecord.customProtocolInfo.arvDetails && selectedRecord.customProtocolInfo.arvDetails.length > 0 ? (
                    <div>
                      <h5 style={{ fontSize: "1rem", fontWeight: "600", color: "#dc2626", marginBottom: "1rem" }}>
                        Danh sách thuốc ARV:
                      </h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {selectedRecord.customProtocolInfo.arvDetails.map((detail, index) => (
                          <div key={index} style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 2fr 1fr",
                            gap: "1rem",
                            padding: "1rem",
                            backgroundColor: "white",
                            borderRadius: "0.5rem",
                            border: "1px solid #fecaca",
                            alignItems: "center"
                          }}>
                            <div>
                              <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "500" }}>Tên thuốc</div>
                              <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>{detail.arvName}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "500" }}>Liều dùng</div>
                              <div style={{ fontSize: "1rem", color: "#059669", fontWeight: "600" }}>{detail.dosage}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "500" }}>Cách dùng</div>
                              <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>{detail.usageInstruction}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "500" }}>Trạng thái</div>
                              <span style={getStatusStyle(detail.status)}>
                                {detail.status === "ACTIVE" ? "Đang dùng" : detail.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", textAlign: "center" }}>
                      <p style={{ color: "#6b7280", fontStyle: "italic", margin: 0 }}>
                        Chi tiết thuốc ARV sẽ được bác sĩ bổ sung trong lần khám tiếp theo
                      </p>
                    </div>
                  )}
                  
                  {/* Appointment Info if available */}
                  {selectedRecord.appointmentInfo && (
                    <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#fff7ed", borderRadius: "0.5rem", border: "1px solid #fed7aa" }}>
                      <h6 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#ea580c", marginBottom: "0.5rem" }}>Thông tin cuộc hẹn liên quan:</h6>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.5rem", fontSize: "0.875rem" }}>
                        <div>
                          <span style={{ color: "#ea580c", fontWeight: "500" }}>Ngày hẹn: </span>
                          <span style={{ color: "#1f2937" }}>{formatDate(selectedRecord.appointmentInfo.appointmentDate)}</span>
                        </div>
                        <div>
                          <span style={{ color: "#ea580c", fontWeight: "500" }}>Loại: </span>
                          <span style={{ color: "#1f2937" }}>{selectedRecord.appointmentInfo.appointmentType}</span>
                        </div>
                        <div>
                          <span style={{ color: "#ea580c", fontWeight: "500" }}>Trạng thái: </span>
                          <span style={getStatusStyle(selectedRecord.appointmentInfo.status)}>
                            {selectedRecord.appointmentInfo.status === "COMPLETED" ? "Hoàn thành" : 
                             selectedRecord.appointmentInfo.status === "Checked_in" ? "Đã check-in" : 
                             selectedRecord.appointmentInfo.status}
                          </span>
                        </div>
                      </div>
                      {selectedRecord.appointmentInfo.note && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <span style={{ color: "#ea580c", fontWeight: "500", fontSize: "0.875rem" }}>Ghi chú: </span>
                          <span style={{ color: "#4b5563", fontSize: "0.875rem" }}>{selectedRecord.appointmentInfo.note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Custom ARV Protocol Information */}
              {selectedRecord.customProtocolId && (
                <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#fefbf0", borderRadius: "0.75rem", border: "1px solid #fed7aa" }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#ea580c", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Pill style={{ width: "1.25rem", height: "1.25rem" }} />
                    Thông tin phác đồ ARV tùy chỉnh
                  </h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.875rem", color: "#ea580c", fontWeight: "500" }}>Mã phác đồ:</span>
                      <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>#{selectedRecord.customProtocolId}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.875rem", color: "#ea580c", fontWeight: "500" }}>Bác sĩ phụ trách:</span>
                      <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>BS. {selectedRecord.doctorName}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.875rem", color: "#ea580c", fontWeight: "500" }}>Ngày áp dụng:</span>
                      <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>{formatDate(selectedRecord.examDate)}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.875rem", color: "#ea580c", fontWeight: "500" }}>Thời gian tạo:</span>
                      <div style={{ fontSize: "1rem", color: "#1f2937", fontWeight: "600" }}>{formatDate(selectedRecord.issuedAt)}</div>
                    </div>
                  </div>

                  {/* Protocol Usage Instructions */}
                  <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #fed7aa" }}>
                    <h5 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#ea580c", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Heart style={{ width: "1rem", height: "1rem" }} />
                      Hướng dẫn sử dụng phác đồ:
                    </h5>
                    <ul style={{ fontSize: "0.875rem", color: "#4b5563", margin: 0, paddingLeft: "1rem", lineHeight: "1.6" }}>
                      <li>Tuân thủ nghiêm ngặt thời gian uống thuốc theo chỉ định</li>
                      <li>Không tự ý thay đổi liều lượng hoặc ngừng thuốc</li>
                      <li>Uống thuốc đúng giờ hàng ngày để duy trì nồng độ thuốc trong máu</li>
                      <li>Thông báo ngay cho bác sĩ nếu có tác dụng phụ hoặc bất thường</li>
                      <li>Tái khám định kỳ theo lịch hẹn để theo dõi hiệu quả điều trị</li>
                    </ul>
                  </div>

                  {/* Important Notes */}
                  <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
                    <h5 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#dc2626", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <AlertCircle style={{ width: "1rem", height: "1rem" }} />
                      Lưu ý quan trọng:
                    </h5>
                    <p style={{ fontSize: "0.875rem", color: "#7f1d1d", margin: 0, lineHeight: "1.6" }}>
                      Phác đồ này được bác sĩ thiết kế riêng cho tình trạng sức khỏe của bạn. 
                      Việc tuân thủ điều trị đúng cách sẽ giúp kiểm soát tốt bệnh và cải thiện chất lượng cuộc sống.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <FileText style={{ width: "1rem", height: "1rem" }} />
                  In hồ sơ
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientMedicalRecordPage;