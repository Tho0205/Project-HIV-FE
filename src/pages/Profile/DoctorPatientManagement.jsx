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

const PatientRow = ({ patient, index, page, onViewHistory }) => (
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

  // Modal states
  const [modals, setModals] = useState({
    add: false,
    history: false,
    exam: false,
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [examData, setExamData] = useState(null);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [selectedNewPatient, setSelectedNewPatient] = useState(null);

  const navigate = useNavigate();
  const doctorId = tokenManager.getCurrentUserId();

  // Check authentication
  useEffect(() => {
    if (tokenManager.getCurrentUserRole() !== "Doctor") {
      toast.error("Bạn không có quyền truy cập");
      navigate("/");
    }
  }, [navigate]);

  // Load patients
  const loadPatients = useCallback(async () => {
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
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }, [doctorId, page, sort]);

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

  const handleAddPatient = async () => {
    try {
      const result = await doctorPatientService.getAvailablePatients();
      if (result.success) {
        setAvailablePatients(result.data || []);
        openModal("add");
      } else {
        toast.error("Không thể tải danh sách bệnh nhân khả dụng");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedNewPatient || !doctorId) {
      toast.error("Thiếu thông tin bác sĩ hoặc bệnh nhân");
      return;
    }

    try {
      const result = await doctorPatientService.assignPatientToDoctor(
        doctorId,
        selectedNewPatient
      );
      if (result.success) {
        toast.success("Thêm bệnh nhân thành công");
        closeModal("add");
        setSelectedNewPatient(null);
        loadPatients();
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
        patient.userId,
        doctorId
      );

      if (result.success && result.data) {
        setPatientHistory(result.data);
        openModal("history");
      } else {
        toast.error(result.message || "Không thể tải lịch sử bệnh nhân");
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
          <button
            className="btn-primary-admin btn-doctor"
            onClick={handleAddPatient}
          >
            <span>➕</span> Thêm bệnh nhân mới
          </button>
        </div>

        {/* Statistics */}
        <div className="stats-grid">
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
        </div>

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

        {/* Add Patient Modal */}
        <Modal
          show={modals.add}
          onClose={() => closeModal("add")}
          title="Thêm Bệnh Nhân Mới"
        >
          <div className="modal-form-admin">
            {availablePatients.length === 0 ? (
              <div className="no-data-admin">
                <p>Không có bệnh nhân nào chưa được phân công</p>
              </div>
            ) : (
              <>
                <p className="modal-subtitle">
                  Chọn bệnh nhân từ danh sách dưới đây:
                </p>
                <div className="patient-selection-list">
                  {availablePatients.map((patient) => (
                    <div
                      key={patient.accountId}
                      className={`patient-selection-item ${
                        selectedNewPatient === patient.userId ? "selected" : ""
                      }`}
                      onClick={() => setSelectedNewPatient(patient.userId)}
                    >
                      <img
                        src={doctorPatientService.getAvatarUrl(
                          patient.userAvatar
                        )}
                        alt="avatar"
                        className="patient-avatar-small"
                        onError={(e) => {
                          e.target.src = DEFAULT_AVATAR;
                        }}
                      />
                      <div className="patient-info-selection">
                        <p className="patient-name">{patient.fullName}</p>
                        <p className="patient-email">{patient.email}</p>
                        <p className="patient-phone">
                          {patient.phone || "Chưa có SĐT"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="modal-actions-admin">
              <button
                className="btn-cancel-admin"
                onClick={() => closeModal("add")}
              >
                Hủy
              </button>
              <button
                className="btn-save-admin"
                onClick={handleAssignPatient}
                disabled={!selectedNewPatient}
              >
                Thêm
              </button>
            </div>
          </div>
        </Modal>

        {/* History Modal */}

        <Modal
          show={modals.history}
          onClose={() => closeModal("history")}
          title={`Lịch Sử Khám Bệnh - ${selectedPatient?.fullName}`}
          className="modal-large"
        >
          <div className="modal-info-body-admin">
            {patientHistory ? (
              <>
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

                {/* Examinations */}
                <div className="info-section-admin">
                  <div className="section-header-with-action">
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
