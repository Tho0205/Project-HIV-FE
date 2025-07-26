import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HIVExamService from "../../services/HIVExaminationService";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./HIVExaminationManagement.css";
import { tokenManager } from "../../services/account";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination/Pagination";

const PAGE_SIZE = 8;
const HIVExaminationManagement = () => {
  const navigate = useNavigate();

  // States
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [examinations, setExaminations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteExamId, setDeleteExamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [formData, setFormData] = useState({
    examId: null,
    patientId: "",
    doctorId: "",
    examDate: new Date().toISOString().split("T")[0],
    result: "",
    cd4Count: "",
    hivLoad: "",
  });

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredPatients = patients.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm))
  );

  const pagedPatients = filteredPatients.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Utility functions
  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage({ text: "", isError: false }), 5000);
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "";

  const getResultClass = (result) => {
    if (!result) return "";
    const lower = result.toLowerCase();
    if (lower.includes("dương") || lower.includes("positive"))
      return "status-positive";
    if (lower.includes("âm") || lower.includes("negative"))
      return "status-negative";
    return "";
  };

  const getCD4Class = (cd4Count) => {
    if (!cd4Count || cd4Count === "N/A") return "";
    const count = parseInt(cd4Count);
    return count >= 500 ? "cd4-high" : count < 200 ? "cd4-low" : "";
  };

  const getTimeAgo = (examDate, index) => {
    if (index === 0) return "🔥 Mới nhất";

    const today = new Date();
    const exam = new Date(examDate + "T00:00:00");
    const diffDays = Math.floor(
      (today.getTime() - exam.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  // API calls
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        HIVExamService.getPatientsWithExamCount(),
        HIVExamService.getDoctors(),
      ]);
      if (patientsRes.success) setPatients(patientsRes.data);
      if (doctorsRes.success) setDoctors(doctorsRes.data);
    } catch (error) {
      showMessage("Không thể tải dữ liệu", true);
    }
    setLoading(false);
  }, []);

  const viewHistory = async (patient) => {
    setLoading(true);
    try {
      const result = await HIVExamService.getPatientHistory(patient.userId);
      if (result.success) {
        setSelectedPatient(patient);
        setExaminations(result.data);
        setShowHistory(true);
      } else {
        showMessage(result.message, true);
      }
    } catch (error) {
      showMessage("Lỗi khi tải lịch sử", true);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await HIVExamService.saveExamination(formData);
      if (result.success) {
        showMessage(
          formData.examId ? "Cập nhật thành công" : "Thêm thành công"
        );
        setShowForm(false);
        await Promise.all([viewHistory(selectedPatient), loadData()]);
      } else {
        showMessage(result.message, true);
      }
    } catch (error) {
      showMessage("Lỗi khi lưu", true);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await HIVExamService.deleteExamination(deleteExamId);
      if (result.success) {
        showMessage("Xóa thành công");
        setShowDeleteConfirm(false);
        await Promise.all([viewHistory(selectedPatient), loadData()]);
      } else {
        showMessage(result.message, true);
      }
    } catch (error) {
      showMessage("Lỗi khi xóa", true);
    }
    setLoading(false);
  };

  // Form handlers
  const openForm = (exam = null) => {
    setFormData(
      exam
        ? {
            examId: exam.examId,
            patientId: selectedPatient.userId,
            doctorId: exam.doctorId || "",
            examDate: exam.examDate || "",
            result: exam.result || "",
            cd4Count: exam.cd4Count || "",
            hivLoad: exam.hivLoad || "",
          }
        : {
            examId: null,
            patientId: selectedPatient.userId,
            doctorId: "",
            examDate: new Date().toISOString().split("T")[0],
            result: "",
            cd4Count: "",
            hivLoad: "",
          }
    );
    setShowForm(true);
  };

  const closeModals = () => {
    setShowHistory(false);
    setShowForm(false);
    setShowDeleteConfirm(false);
    setSelectedPatient(null);
  };

  // Effects
  useEffect(() => {
    const role = tokenManager.getCurrentUserRole();
    if (role !== "Staff" && role !== "Manager") {
      toast.error("Ban không có quyền truy cập trang này");
      navigate("/");
    } else {
      loadData();
    }
  }, [navigate, loadData]);

  // Render components
  const renderPatientTable = () => (
    <div className="table-container">
      <div className="table-header">
        <h3>👥 Danh Sách Bệnh Nhân</h3>
        <div className="table-stats">
          <span>
            Tổng số: <strong>{patients.length}</strong> bệnh nhân
          </span>
        </div>
      </div>
      <div className="search-container">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email hoặc SĐT..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // Reset về trang 1 khi search
          }}
          className="search-input"
        />
      </div>
      <table className="examination-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Họ Tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Ngày Sinh</th>
            <th>Số Lần XN</th>
            <th>XN Gần Nhất</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className="text-center">
                ⏳ Đang tải dữ liệu...
              </td>
            </tr>
          ) : pagedPatients.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center">
                📝 Chưa có dữ liệu bệnh nhân
              </td>
            </tr>
          ) : (
            pagedPatients.map((patient, index) => (
              <tr key={patient.userId}>
                <td className="text-center">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </td>
                <td>
                  <strong>{patient.fullName}</strong>
                </td>
                <td>{patient.email}</td>
                <td>{patient.phone || "Chưa có"}</td>
                <td>{formatDate(patient.birthdate)}</td>
                <td className="text-center">
                  <span className="examination-count">{patient.examCount}</span>
                </td>
                <td>{formatDate(patient.lastExamDate) || "Chưa có"}</td>
                <td className="text-center">
                  <button
                    className="btn-action"
                    onClick={() => viewHistory(patient)}
                    disabled={loading}
                    title="Xem lịch sử xét nghiệm"
                  >
                    📋
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Pagination
        page={page}
        total={filteredPatients.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );

  const renderHistoryModal = () =>
    showHistory &&
    selectedPatient && (
      <div className="modal-overlay">
        <div className="history-modal">
          <div className="modal-header">
            <div>
              <h3>🩺 Lịch Sử Xét Nghiệm - {selectedPatient.fullName}</h3>
              <small>
                📧 {selectedPatient.email} | 📞 {selectedPatient.phone || "N/A"}{" "}
                | 🎂 {formatDate(selectedPatient.birthdate)}
              </small>
            </div>
            <button className="close-btn" onClick={closeModals} title="Đóng">
              ✕
            </button>
          </div>
          <div className="history-content">
            {examinations.length === 0 ? (
              <div className="empty-history">
                <p>Chưa có kết quả xét nghiệm nào</p>
                <small>
                  Nhấn nút bên dưới để thêm kết quả xét nghiệm đầu tiên
                </small>
              </div>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>📅 Ngày XN</th>
                    <th>👨‍⚕️ Bác Sĩ</th>
                    <th>🔬 CD4 Count</th>
                    <th>🧬 HIV Load</th>
                    <th>📊 Kết Quả</th>
                    <th>⚙️ Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {examinations.map((exam, index) => (
                    <tr key={exam.examId}>
                      <td>
                        <strong>{formatDate(exam.examDate)}</strong>
                        <br />
                        <small style={{ color: "#6b7280" }}>
                          {getTimeAgo(exam.examDate, index)}
                        </small>
                      </td>
                      <td>
                        <strong>{exam.doctorName}</strong>
                      </td>
                      <td>
                        <span className={getCD4Class(exam.cd4Count)}>
                          {exam.cd4Count ? `${exam.cd4Count} cells/μL` : "N/A"}
                        </span>
                      </td>
                      <td>
                        {exam.hivLoad ? `${exam.hivLoad} copies/ml` : "N/A"}
                      </td>
                      <td>
                        <span className={getResultClass(exam.result)}>
                          {exam.result}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-action"
                          onClick={() => openForm(exam)}
                          title="Chỉnh sửa kết quả"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => {
                            setDeleteExamId(exam.examId);
                            setShowDeleteConfirm(true);
                          }}
                          title="Xóa kết quả"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="fixed-add-button">
              <button
                className="btn-add-exam"
                onClick={() => openForm()}
                disabled={loading}
              >
                ➕ Thêm kết quả xét nghiệm mới
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const renderFormModal = () =>
    showForm && (
      <div className="modal-overlay">
        <div className="form-modal">
          <div className="form-header">
            <h2>
              {formData.examId ? "✏️ Cập Nhật Kết Quả" : "🧪 Thêm Kết Quả Mới"}
            </h2>
            <button className="close-btn" onClick={closeModals}>
              ✕
            </button>
          </div>
          <form onSubmit={handleSave} className="exam-form">
            <div className="form-section">
              <h3>👤 Thông tin bệnh nhân</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={selectedPatient?.fullName || ""}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="text"
                    value={selectedPatient?.email || ""}
                    disabled
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    value={selectedPatient?.phone || "Chưa có"}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input
                    type="text"
                    value={formatDate(selectedPatient?.birthdate) || "N/A"}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>🏥 Thông tin xét nghiệm</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Bác sĩ thực hiện <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) =>
                      setFormData({ ...formData, doctorId: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn bác sĩ thực hiện --</option>
                    {doctors.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Ngày xét nghiệm <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.examDate}
                    onChange={(e) =>
                      setFormData({ ...formData, examDate: e.target.value })
                    }
                    required
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    CD4 Count <small>(cells/μL)</small>
                  </label>
                  <input
                    type="number"
                    value={formData.cd4Count}
                    onChange={(e) =>
                      setFormData({ ...formData, cd4Count: e.target.value })
                    }
                    min="0"
                    max="2000"
                    placeholder="VD: 350"
                  />
                  <small style={{ color: "#6b7280", fontSize: "12px" }}>
                    Bình thường: ≥500 cells/μL
                  </small>
                </div>
                <div className="form-group">
                  <label>
                    HIV Load <small>(copies/ml)</small>
                  </label>
                  <input
                    type="number"
                    value={formData.hivLoad}
                    onChange={(e) =>
                      setFormData({ ...formData, hivLoad: e.target.value })
                    }
                    min="0"
                    placeholder="VD: 50000"
                  />
                  <small style={{ color: "#6b7280", fontSize: "12px" }}>
                    Không phát hiện: &lt;50 copies/ml
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Kết quả chi tiết <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={formData.result}
                  onChange={(e) =>
                    setFormData({ ...formData, result: e.target.value })
                  }
                  required
                  rows="4"
                  placeholder="Nhập mô tả chi tiết kết quả xét nghiệm, chẩn đoán và khuyến nghị..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading
                  ? "⏳ Đang xử lý..."
                  : formData.examId
                  ? "💾 Cập nhật"
                  : "💾 Lưu kết quả"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

  const renderDeleteModal = () =>
    showDeleteConfirm && (
      <div className="modal-overlay">
        <div className="confirm-modal">
          <div className="confirm-content">
            <h3>⚠️ Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa kết quả xét nghiệm này?</p>
            <p>Hành động này không thể hoàn tác.</p>
            <div className="warning-text">
              ⚠️ Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống
            </div>
            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={closeModals}
                disabled={loading}
              >
                Hủy bỏ
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "⏳ Đang xóa..." : "🗑️ Xóa"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="wrapper">
      <Sidebar active="result" />
      <main className="content">
        <h1 className="title">Quản Lý Xét Nghiệm HIV</h1>

        {message.text && (
          <div
            className={`alert ${
              message.isError ? "alert-error" : "alert-success"
            }`}
          >
            {message.isError ? "⚠️" : "✅"} {message.text}
          </div>
        )}

        {renderPatientTable()}
        {renderHistoryModal()}
        {renderFormModal()}
        {renderDeleteModal()}
      </main>
    </div>
  );
};

export default HIVExaminationManagement;
