import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SidebarDoctor from "../../components/Sidebar/Sidebar-Doctor";
import Pagination from "../../components/Pagination/Pagination";
import doctorPatientService from "../../services/DoctorPatientService";
import { tokenManager } from "../../services/account";
import "./DoctorPatientManagement.css";

const PAGE_SIZE = 10;
const DEFAULT_AVATAR = "/assets/image/patient/patient.png";

// Utility functions
const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "";
const formatDateTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleString("vi-VN") : "";

// Components
const StatCard = ({ icon, value, label }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

const PatientRow = ({ patient, index, page, onViewHistory, viewMode }) => (
  <tr>
    <td className="text-center">{(page - 1) * PAGE_SIZE + index + 1}</td>
    <td className="text-center">
      <img
        src={doctorPatientService.getAvatarUrl(patient.userAvatar)}
        alt="avatar"
        className="patient-avatar"
        onError={(e) => {
          e.target.src = DEFAULT_AVATAR;
        }}
      />
    </td>
    <td className="patient-name">{patient.fullName}</td>
    <td>{patient.email}</td>
    <td>{patient.phone || "Chưa có"}</td>
    <td className="text-center">{formatDate(patient.birthdate)}</td>
    <td className="text-center">{patient.gender || "Khác"}</td>
    <td className="text-center">
      <span className="appointment-badge">{patient.appointmentCount || 0}</span>
    </td>
    <td className="actions-admin">
      <button
        onClick={() => onViewHistory(patient)}
        className="btn-info-admin"
        title="Xem lịch sử"
      >
        📋
      </button>
    </td>
  </tr>
);

const Modal = ({ show, onClose, title, children, className = "" }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop-admin" onClick={(e) => e.stopPropagation()}>
      <div
        className={`modal-container-admin ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-admin">
          <h2>{title}</h2>
          <button className="close-btn-admin" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

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
    todayAppointments: 0,
    controlledPatients: 0,
    unstablePatients: 0,
  });
  const [viewMode, setViewMode] = useState("myPatients"); // "myPatients" hoặc "allPatients"
  const [scheduleDate, setScheduleDate] = useState(null);

  // Modal states
  const [modals, setModals] = useState({
    history: false,
    exam: false,
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [examData, setExamData] = useState(null);

  const navigate = useNavigate();
  const doctorId = tokenManager.getCurrentUserId();

  // Check authentication
  useEffect(() => {
    if (tokenManager.getCurrentUserRole() !== "Doctor") {
      toast.error("Bạn không có quyền truy cập");
      navigate("/");
    }
  }, [navigate]);

  // Load patients với chế độ xem
  const loadPatients = useCallback(async () => {
    if (!doctorId && viewMode === "myPatients") return;

    setLoading(true);
    try {
      const [sortBy, order] = sort.split("_");
      let result;

      if (viewMode === "allPatients") {
        // Lấy toàn bộ bệnh nhân
        result = await doctorPatientService.getAllPatients(
          searchTerm,
          page,
          PAGE_SIZE,
          sortBy,
          order
        );
      } else {
        // Lấy bệnh nhân của bác sĩ với filter ngày nếu có
        result = await doctorPatientService.getDoctorPatients(
          doctorId,
          page,
          PAGE_SIZE,
          sortBy,
          order,
          scheduleDate,
          false // Bỏ hasScheduleOnly
        );
      }

      if (result.success) {
        setPatients(result.data.data || []);
        setTotal(result.data.total || 0);
        if (result.data.stats) setStats(result.data.stats);
      } else {
        toast.error(result.message || "Không thể tải danh sách bệnh nhân");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }, [
    doctorId,
    page,
    sort,
    searchTerm,
    viewMode,
    scheduleDate,
  ]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    const search = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search) ||
        p.phone?.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  // Modal helpers
  const openModal = (modalName) =>
    setModals((prev) => ({ ...prev, [modalName]: true }));
  const closeModal = (modalName) =>
    setModals((prev) => ({ ...prev, [modalName]: false }));

  // Handlers
  const handleExamClose = () => {
    closeModal("exam");
    openModal("history");
  };

  const handleViewHistory = async (patient) => {
    setSelectedPatient(patient);
    try {
      // Ở tab "Tất cả bệnh nhân", cho phép xem thông tin cơ bản
      if (viewMode === "allPatients") {
        // Lấy thông tin lịch sử từ API (có thể giới hạn thông tin)
        const result = await doctorPatientService.getPatientHistory(
          patient.userId,
          doctorId
        );

        if (result.success && result.data) {
          setPatientHistory(result.data);
          openModal("history");
        } else {
          // Nếu không có quyền đầy đủ, hiển thị thông tin cơ bản
          setPatientHistory({
            appointments: [],
            examinations: [],
            limitedAccess: true
          });
          openModal("history");
        }
      } else {
        // Tab "Bệnh nhân của tôi" - quyền truy cập đầy đủ
        const result = await doctorPatientService.getPatientHistory(
          patient.userId,
          doctorId
        );

        if (result.success && result.data) {
          setPatientHistory(result.data);
          openModal("history");
        } else {
          toast.error(result.message || "Không thể tải lịch sử bệnh nhân");
        }
      }
    } catch (error) {
      toast.error("Không thể tải lịch sử bệnh nhân");
    }
  };

  const openExamModal = (exam = null) => {
    closeModal("history");

    setExamData({
      examId: exam?.examId || null,
      patientId: selectedPatient.userId,
      doctorId: doctorId,
      examDate: exam?.examDate || new Date().toISOString().split("T")[0],
      result: exam?.result || "",
      cd4Count: exam?.cd4Count || "",
      hivLoad: exam?.hivLoad || "",
    });
    openModal("exam");
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
        closeModal("exam");

        // Reload history
        const historyResult = await doctorPatientService.getPatientHistory(
          selectedPatient.userId,
          doctorId
        );
        if (historyResult.success) {
          setPatientHistory(historyResult.data);
          openModal("history");
        }
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDeleteExam = async (examId) => {
    if (
      !window.confirm(
        "Xác nhận xóa kết quả xét nghiệm?\n\nThao tác này không thể hoàn tác."
      )
    )
      return;

    try {
      const result = await doctorPatientService.deleteExamination(examId);
      if (result.success) {
        toast.success("Xóa thành công");
        const historyResult = await doctorPatientService.getPatientHistory(
          selectedPatient.userId,
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

  const getStatusBadge = (status) => {
    const statusMap = {
      SCHEDULED: "Đã lên lịch",
      PENDING: "Chờ khám",
      COMPLETED: "Hoàn thành",
    };
    return (
      <span className={`status-badge-admin status-${status.toLowerCase()}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  return (
    <div className="container">
      <SidebarDoctor active={"Doctor-Patient-Manager"} />
      <div className="main-content-admin">
        {/* Header */}
        <div className="content-header-admin">
          <h1>Quản Lý Bệnh Nhân</h1>
        </div>

        {/* View Mode Tabs */}
        <div className="view-mode-tabs">
          <button
            className={`tab-btn ${viewMode === "myPatients" ? "active" : ""}`}
            onClick={() => {
              setViewMode("myPatients");
              setPage(1);
            }}
          >
            Bệnh nhân của tôi
          </button>
          <button
            className={`tab-btn ${viewMode === "allPatients" ? "active" : ""}`}
            onClick={() => {
              setViewMode("allPatients");
              setPage(1);
              setScheduleDate(null);
            }}
          >
            Tất cả bệnh nhân
          </button>
        </div>

        {/* Statistics - Chỉ hiển thị khi ở tab "Bệnh nhân của tôi" */}
        {viewMode === "myPatients" && (
          <div className="stats-grid">
            <StatCard
              icon="👥"
              value={stats.totalPatients}
              label="Tổng số bệnh nhân"
            />
            <StatCard
              icon="📍"
              value={stats.todayAppointments}
              label="Lịch hẹn hôm nay"
            />
            <StatCard
              icon="✅"
              value={stats.controlledPatients}
              label="Đã kiểm soát"
            />
            <StatCard icon="⚠️" value={stats.unstablePatients} label="Bất ổn" />
          </div>
        )}

        {/* Filters */}
        <div className="filters-admin">
          <div className="search-box-admin">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-admin"
            />
          </div>

          {/* Schedule date filter - chỉ hiện khi xem "Bệnh nhân của tôi" */}
          {viewMode === "myPatients" && (
            <input
              type="date"
              value={scheduleDate || ""}
              onChange={(e) => {
                setScheduleDate(e.target.value || null);
                setPage(1);
              }}
              className="date-filter-admin"
              title="Lọc theo ngày hẹn"
            />
          )}

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="status-filter-admin"
          >
            <option value="full_name_asc">Tên A-Z</option>
            <option value="full_name_desc">Tên Z-A</option>
            <option value="created_at_asc">Cũ nhất</option>
            <option value="created_at_desc">Mới nhất</option>
          </select>
        </div>

        {/* Table */}
        <div className="accounts-table-container-admin">
          <table className="accounts-table-admin">
            <thead>
              <tr>
                <th>STT</th>
                <th>Ảnh</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Số lần hẹn</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="no-data-admin">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data-admin">
                    Không tìm thấy bệnh nhân nào
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, idx) => (
                  <PatientRow
                    key={patient.accountId}
                    patient={patient}
                    index={idx}
                    page={page}
                    onViewHistory={handleViewHistory}
                    viewMode={viewMode}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        {/* History Modal */}
        <Modal
          show={modals.history}
          onClose={() => closeModal("history")}
          title={`Lịch Sử Khám Bệnh - ${selectedPatient?.fullName}`}
          className="modal-standard"
        >
          <div className="modal-info-body-admin">
            {patientHistory ? (
              <>
                {/* Thông báo giới hạn quyền nếu cần */}
                {patientHistory.limitedAccess && viewMode === "allPatients" && (
                  <div className="limited-access-notice">
                    <p>⚠️ Bạn đang xem thông tin cơ bản của bệnh nhân này.</p>
                  </div>
                )}

                {/* Patient Info */}
                <div className="patient-info-section">
                  <h3>📋 Thông Tin Bệnh Nhân</h3>
                  <div className="patient-detail-grid">
                    <div className="info-item">
                      <span className="info-label">Họ tên:</span>
                      <span className="info-value">{selectedPatient?.fullName || "Chưa có"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{selectedPatient?.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Số điện thoại:</span>
                      <span className="info-value">{selectedPatient?.phone || "Chưa có"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Ngày sinh:</span>
                      <span className="info-value">{formatDate(selectedPatient?.birthdate)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Giới tính:</span>
                      <span className="info-value">{selectedPatient?.gender || "Other"}</span>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                <div className="info-section-admin">
                  <h3>📅 Lịch Hẹn Khám</h3>
                  {patientHistory?.appointments?.length > 0 ? (
                    <div className="appointment-list">
                      {patientHistory.appointments.map((appointment) => (
                        <div
                          key={appointment.appointmentId}
                          className="history-item"
                        >
                          <div className="history-item-header">
                            <span className="date">
                              {formatDate(appointment.appointmentDate)}
                            </span>
                            {getStatusBadge(appointment.status)}
                          </div>
                          {appointment.room && (
                            <p className="history-detail">
                              Phòng: {appointment.room}
                            </p>
                          )}
                          {appointment.note && (
                            <p className="history-detail note">
                              {appointment.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data-admin">Chưa có lịch hẹn nào</p>
                  )}
                </div>

                {/* Examinations - Hiển thị cho cả hai tab */}
                <div className="info-section-admin">
                  <div className="section-header-no-border">
                    <h3>🔬 Kết Quả Xét Nghiệm</h3>
                    <button
                      className="btn-add-small"
                      onClick={() => openExamModal()}
                    >
                      + Thêm mới
                    </button>
                  </div>
                    {patientHistory?.examinations?.length > 0 ? (
                      <div className="exam-list">
                        {patientHistory.examinations.map((exam) => (
                          <div key={exam.examId} className="history-item">
                            <div className="history-item-header">
                              <span className="date">
                                Ngày: {formatDate(exam.examDate)}
                              </span>
                              <div className="exam-actions">
                                <button
                                  onClick={() => openExamModal(exam)}
                                  className="btn-icon-small"
                                  title="Chỉnh sửa"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteExam(exam.examId)}
                                  className="btn-icon-small"
                                  title="Xóa"
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
                            <small className="timestamp">
                              Tạo lúc: {formatDateTime(exam.createdAt)}
                            </small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data-section">
                        <p className="no-data-admin">
                          Chưa có kết quả xét nghiệm nào
                        </p>
                        <button
                          className="btn-add-small"
                          onClick={() => openExamModal()}
                        >
                          + Thêm kết quả đầu tiên
                        </button>
                      </div>
                    )}
                  </div>
              </>
            ) : (
              <div className="loading-admin">Đang tải dữ liệu...</div>
            )}
          </div>
          <div className="modal-actions-admin">
            <button
              className="btn-cancel-admin"
              onClick={() => closeModal("history")}
            >
              Đóng
            </button>
          </div>
        </Modal>

        {/* Exam Modal */}
        <Modal
          show={modals.exam}
          onClose={() => closeModal("exam")}
          title={
            examData?.examId
              ? "Chỉnh Sửa Kết Quả Xét Nghiệm"
              : "Thêm Kết Quả Xét Nghiệm"
          }
          className="modal-standard"
        >
          <form onSubmit={handleExamSubmit} className="modal-form-admin">
            <div className="patient-info-box">
              <h4>Thông tin bệnh nhân</h4>
              <p>
                <strong>Họ tên:</strong> {selectedPatient?.fullName}
              </p>
              <p>
                <strong>Email:</strong> {selectedPatient?.email}
              </p>
            </div>

            <div className="form-group-admin">
              <label>
                Ngày xét nghiệm <span className="required-mark">*</span>
              </label>
              {examData && (
                <input
                  type="date"
                  value={examData.examDate}
                  onChange={(e) =>
                    setExamData({ ...examData, examDate: e.target.value })
                  }
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
              )}
            </div>
            <div className="form-group-admin">
              <label>CD4 Count (cells/μL)</label>
              <input
                type="number"
                value={examData?.cd4Count || ""}
                onChange={(e) =>
                  setExamData({ ...examData, cd4Count: e.target.value })
                }
                min="0"
                max="2000"
                placeholder="VD: 350"
              />
            </div>

            <div className="form-group-admin">
              <label>HIV Load (copies/ml)</label>
              <input
                type="number"
                value={examData?.hivLoad || ""}
                onChange={(e) =>
                  setExamData({ ...examData, hivLoad: e.target.value })
                }
                min="0"
                placeholder="VD: 50000"
              />
            </div>

            <div className="form-group-admin">
              <label>
                Kết quả <span className="required-mark">*</span>
              </label>
              <textarea
                className="exam-result-textarea"
                value={examData?.result || ""}
                onChange={(e) =>
                  setExamData({ ...examData, result: e.target.value })
                }
                rows="6"
                required
                placeholder="Nhập kết quả xét nghiệm chi tiết..."
              />
            </div>

            <div className="modal-actions-admin">
              <button
                type="button"
                className="btn-cancel-admin"
                onClick={handleExamClose}
              >
                Hủy
              </button>
              <button type="submit" className="btn-save-admin">
                {examData?.examId ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}