import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SidebarDoctor from "../../components/Sidebar/Sidebar-Doctor";
import doctorPatientService from "../../services/DoctorPatientService";
import { tokenManager } from "../../services/account";
import "./DoctorPatientManagement.css";

const PAGE_SIZE = 8;

export default function DoctorPatientManagement() {
  // States
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("full_name_asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    recentAppointments: 0,
    pendingAppointments: 0,
  });

  // Modal & Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [examData, setExamData] = useState(null);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [selectedNewPatient, setSelectedNewPatient] = useState(null);

  const navigate = useNavigate();
  const doctorId = tokenManager.getCurrentUserId();

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const [sortBy, order] = sort.split("_");
      const result = await doctorPatientService.getDoctorPatients(
        doctorId,
        page,
        PAGE_SIZE,
        sortBy,
        order
      );

      if (result.success) {
        setPatients(result.data.data || []);
        setTotal(result.data.total || 0);
        if (result.data.stats) setStats(result.data.stats);
      } else {
        toast.error(result.message || "Không thể tải danh sách bệnh nhân");
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Lỗi kết nối server. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, page, sort]);

  // Initialize
  useEffect(() => {
    const role = tokenManager.getCurrentUserRole();
    if (role !== "Doctor") {
      toast.error("Bạn không có quyền truy cập");
      navigate("/");
      return;
    }
    fetchPatients();
  }, [fetchPatients, navigate]);

  // Filter patients by search
  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = patient.fullName || "";
    return (
      fullName.toLowerCase().includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.phone?.includes(searchTerm)
    );
  });

  // Handle add new patient
  const handleAddPatient = async () => {
    try {
      const result = await doctorPatientService.getAvailablePatients();
      if (result.success) {
        setAvailablePatients(result.data || []);
        setShowAddModal(true);
      } else {
        toast.error("Không thể tải danh sách bệnh nhân khả dụng");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  // Handle assign patient
  const handleAssignPatient = async () => {
    if (!selectedNewPatient) {
      toast.error("Vui lòng chọn bệnh nhân");
      return;
    }

    try {
      const result = await doctorPatientService.assignPatientToDoctor(
        doctorId,
        selectedNewPatient
      );
      
      if (result.success) {
        toast.success("Thêm bệnh nhân thành công");
        setShowAddModal(false);
        setSelectedNewPatient(null);
        fetchPatients();
      } else {
        toast.error(result.message || "Không thể thêm bệnh nhân");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleViewHistory = async (patient) => {
    setSelectedPatient(patient);
    try {
      const result = await doctorPatientService.getPatientHistory(
        patient.accountId,
        doctorId
      );
      if (result.success) {
        setPatientHistory(result.data);
        setShowHistoryModal(true);
      } else {
        toast.error(result.message || "Không thể tải lịch sử bệnh nhân");
      }
    } catch (error) {
      toast.error("Không thể tải lịch sử bệnh nhân");
    }
  };

  const openExamModal = (exam = null) => {
    setExamData(
      exam
        ? {
            examId: exam.examId,
            patientId: selectedPatient.accountId,
            doctorId: doctorId,
            examDate: exam.examDate || new Date().toISOString().split("T")[0],
            result: exam.result || "",
            cd4Count: exam.cd4Count || "",
            hivLoad: exam.hivLoad || "",
          }
        : {
            examId: null,
            patientId: selectedPatient.accountId,
            doctorId: doctorId,
            examDate: new Date().toISOString().split("T")[0],
            result: "",
            cd4Count: "",
            hivLoad: "",
          }
    );
    setShowExamModal(true);
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...examData,
        cd4Count: examData.cd4Count ? parseInt(examData.cd4Count) : null,
        hivLoad: examData.hivLoad ? parseInt(examData.hivLoad) : null,
      };
      const result = await doctorPatientService.saveExamination(payload);
      if (result.success) {
        toast.success(
          examData.examId ? "Cập nhật thành công" : "Thêm kết quả thành công"
        );
        setShowExamModal(false);
        const historyResult = await doctorPatientService.getPatientHistory(
          selectedPatient.accountId,
          doctorId
        );
        if (historyResult.success) setPatientHistory(historyResult.data);
      } else {
        toast.error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Bạn có chắc muốn xóa kết quả xét nghiệm này?")) return;

    try {
      const result = await doctorPatientService.deleteExamination(examId);
      if (result.success) {
        toast.success("Xóa thành công");
        const historyResult = await doctorPatientService.getPatientHistory(
          selectedPatient.accountId,
          doctorId
        );
        if (historyResult.success) setPatientHistory(historyResult.data);
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi xóa");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa");
    }
  };

  // Format helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  return (
    <div className="container">
      <SidebarDoctor />

      <section className="profile">
        <div className="section-header">
          <h2>Quản lý bệnh nhân</h2>
          <button className="btn-add-patient" onClick={handleAddPatient}>
            ➕ Thêm bệnh nhân mới
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalPatients}</h3>
              <p>Tổng số bệnh nhân</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.activePatients}</h3>
              <p>Đang hoạt động</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>{stats.recentAppointments}</h3>
              <p>Lịch hẹn gần đây</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>{stats.pendingAppointments}</h3>
              <p>Đang chờ khám</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="sort-wrapper">
            <label>Sắp xếp: </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="sort-select"
            >
              <option value="full_name_asc">Tên A-Z</option>
              <option value="full_name_desc">Tên Z-A</option>
              <option value="created_at_asc">Cũ nhất</option>
              <option value="created_at_desc">Mới nhất</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="table-card">
          <table className="patients-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>ẢNH</th>
                <th>HỌ TÊN</th>
                <th>EMAIL</th>
                <th>SĐT</th>
                <th>NGÀY SINH</th>
                <th>GIỚI TÍNH</th>
                <th>SỐ LẦN HẸN</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="loading-cell">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-cell">
                    Không tìm thấy bệnh nhân nào
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, idx) => (
                  <tr key={patient.accountId}>
                    <td className="text-center">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td>
                      <img
                        src={doctorPatientService.getAvatarUrl(
                          patient.userAvatar
                        )}
                        alt="avatar"
                        className="patient-avatar"
                        onError={(e) => {
                          e.target.src = "/assets/image/patient/patient.png";
                        }}
                      />
                    </td>
                    <td className="patient-name">{patient.fullName}</td>
                    <td>{patient.email}</td>
                    <td>{patient.phone || "-"}</td>
                    <td>{formatDate(patient.birthdate)}</td>
                    <td className="text-center">{patient.gender}</td>
                    <td className="text-center">
                      <span className="badge">
                        {patient.appointmentCount || 0}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button
                        onClick={() => handleViewHistory(patient)}
                        className="btn-icon"
                        title="Xem lịch sử"
                      >
                        📋
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {Math.ceil(total / PAGE_SIZE) > 1 && (
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </button>
            
            {[...Array(Math.ceil(total / PAGE_SIZE))].map((_, idx) => (
              <button
                key={idx + 1}
                className={page === idx + 1 ? "active" : ""}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            
            <button
              disabled={page === Math.ceil(total / PAGE_SIZE)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}

        {/* Add Patient Modal */}
        {showAddModal && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>Thêm bệnh nhân mới</h3>
              <div className="available-patients-list">
                {availablePatients.length === 0 ? (
                  <p className="no-data">Không có bệnh nhân nào chưa được phân công</p>
                ) : (
                  <>
                    <p>Chọn bệnh nhân từ danh sách:</p>
                    <div className="patient-selection-list">
                      {availablePatients.map((patient) => (
                        <div
                          key={patient.accountId}
                          className={`patient-selection-item ${
                            selectedNewPatient === patient.accountId ? "selected" : ""
                          }`}
                          onClick={() => setSelectedNewPatient(patient.accountId)}
                        >
                          <img
                            src={doctorPatientService.getAvatarUrl(patient.userAvatar)}
                            alt="avatar"
                            className="patient-avatar-small"
                            onError={(e) => {
                              e.target.src = "/assets/image/patient/patient.png";
                            }}
                          />
                          <div className="patient-info-selection">
                            <p className="patient-name">{patient.fullName}</p>
                            <p className="patient-email">{patient.email}</p>
                            <p className="patient-phone">{patient.phone || "Chưa có SĐT"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  className="btn-green" 
                  onClick={handleAssignPatient}
                  disabled={!selectedNewPatient}
                >
                  Thêm
                </button>
                <button
                  className="btn-purple"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedNewPatient(null);
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedPatient && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content history-modal">
              <h3>Lịch sử khám bệnh - {selectedPatient.fullName}</h3>
              <div className="history-content">
                {patientHistory ? (
                  <>
                    {/* Appointments */}
                    <div className="history-section">
                      <h4>📅 Lịch hẹn khám</h4>
                      {patientHistory.appointments?.length > 0 ? (
                        <div className="appointment-list">
                          {patientHistory.appointments.map((appointment) => (
                            <div
                              key={appointment.appointmentId}
                              className="appointment-item"
                            >
                              <div className="appointment-info">
                                <span className="date">
                                  {formatDate(appointment.appointmentDate)}
                                </span>
                                <span
                                  className={`status ${appointment.status?.toLowerCase()}`}
                                >
                                  {appointment.status}
                                </span>
                              </div>
                              {appointment.room && (
                                <p>Phòng: {appointment.room}</p>
                              )}
                              {appointment.note && (
                                <p className="note">{appointment.note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">Chưa có lịch hẹn nào</p>
                      )}
                    </div>

                    {/* Examinations */}
                    <div className="history-section">
                      <div className="section-header">
                        <h4>🔬 Kết quả xét nghiệm</h4>
                        <button
                          className="btn-add"
                          onClick={() => openExamModal()}
                        >
                          + Thêm mới
                        </button>
                      </div>
                      {patientHistory.examinations?.length > 0 ? (
                        <div className="exam-list">
                          {patientHistory.examinations.map((exam) => (
                            <div key={exam.examId} className="exam-item">
                              <div className="exam-header">
                                <span className="date">
                                  Ngày: {formatDate(exam.examDate)}
                                </span>
                                <div className="exam-actions">
                                  <button
                                    onClick={() => openExamModal(exam)}
                                    className="btn-icon"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteExam(exam.examId)
                                    }
                                    className="btn-icon"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              <p className="result">{exam.result}</p>
                              <div className="metrics">
                                {exam.cd4Count && (
                                  <span className="metric">
                                    CD4: {exam.cd4Count} cells/μL
                                  </span>
                                )}
                                {exam.hivLoad && (
                                  <span className="metric">
                                    HIV Load: {exam.hivLoad} copies/ml
                                  </span>
                                )}
                              </div>
                              <small>
                                Ngày tạo: {formatDateTime(exam.createdAt)}
                              </small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-data-section">
                          <p>Chưa có kết quả xét nghiệm nào</p>
                          <button
                            className="btn-add"
                            onClick={() => openExamModal()}
                          >
                            + Thêm kết quả đầu tiên
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="loading-spinner">Đang tải...</div>
                )}
              </div>
              <div className="modal-actions">
                <button
                  className="btn-purple"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exam Modal */}
        {showExamModal && examData && (
          <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content">
              <h3>
                {examData.examId
                  ? "Chỉnh sửa kết quả xét nghiệm"
                  : "Thêm kết quả xét nghiệm"}
              </h3>
              <form onSubmit={handleExamSubmit} id="modalForm">
                <div className="patient-info">
                  <h4>Thông tin bệnh nhân</h4>
                  <p>
                    <strong>Họ tên:</strong> {selectedPatient?.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedPatient?.email}
                  </p>
                </div>

                <label>Ngày xét nghiệm</label>
                <input
                  type="date"
                  value={examData.examDate}
                  onChange={(e) =>
                    setExamData({ ...examData, examDate: e.target.value })
                  }
                  required
                  max={new Date().toISOString().split("T")[0]}
                />

                <label>CD4 Count (cells/μL)</label>
                <input
                  type="number"
                  value={examData.cd4Count}
                  onChange={(e) =>
                    setExamData({ ...examData, cd4Count: e.target.value })
                  }
                  min="0"
                  max="2000"
                  placeholder="VD: 350"
                />

                <label>HIV Load (copies/ml)</label>
                <input
                  type="number"
                  value={examData.hivLoad}
                  onChange={(e) =>
                    setExamData({ ...examData, hivLoad: e.target.value })
                  }
                  min="0"
                  placeholder="VD: 50000"
                />

                <label>Kết quả</label>
                <textarea
                  value={examData.result}
                  onChange={(e) =>
                    setExamData({ ...examData, result: e.target.value })
                  }
                  rows="4"
                  required
                  placeholder="Nhập kết quả xét nghiệm..."
                  style={{ width: "100%", gridColumn: "1 / -1" }}
                />

                <div className="modal-actions" style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="btn-green">
                    {examData.examId ? "Cập nhật" : "Thêm mới"}
                  </button>
                  <button
                    type="button"
                    className="btn-purple"
                    onClick={() => setShowExamModal(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}