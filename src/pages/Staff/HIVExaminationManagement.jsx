import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HIVExamService from "../../services/HIVExaminationService";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./HIVExaminationManagement.css";

const HIVExaminationManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [data, setData] = useState({ patients: [], doctors: [], examinations: [] });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modals, setModals] = useState({ add: false, history: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    examDate: new Date().toISOString().split('T')[0],
    result: "",
    cd4Range: "",
    hivLoadRange: "",
    currentCondition: ""
  });

  // Effects
  useEffect(() => {
    const role = localStorage.getItem("role");
    console.log("Current role:", role); // Debug log
    
    // Kiểm tra role case-insensitive
    const allowedRoles = ["staff", "manager"];
    const normalizedRole = role ? role.toLowerCase().trim() : "";
    
    if (!allowedRoles.includes(normalizedRole)) {
      alert(`Bạn không có quyền truy cập trang này. Role hiện tại: ${role}`);
      navigate("/");
      return;
    }
    
    loadData();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    const patientName = params.get('patientName');
    if (patientId && patientName) {
      viewHistory(parseInt(patientId), decodeURIComponent(patientName));
    }
  }, [location.search]);

  // Functions
  const loadData = async () => {
    setLoading(true);
    try {
      const [patients, doctors, exams] = await Promise.all([
        HIVExamService.getPatients(),
        HIVExamService.getDoctors(),
        HIVExamService.getRecentExaminations()
      ]);
      
      setData({
        patients: patients.data || [],
        doctors: doctors.data || [],
        examinations: exams.data || []
      });
    } catch (error) {
      showMessage("Không thể tải dữ liệu", true);
    }
    setLoading(false);
  };

  const viewHistory = async (patientId, patientName) => {
    setLoading(true);
    const result = await HIVExamService.getPatientHistory(patientId);
    
    if (result.success) {
      setSelectedPatient({ id: patientId, name: patientName, examinations: result.data });
      setModals({ ...modals, history: true });
    } else {
      showMessage(result.error, true);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await HIVExamService.addExamination(formData);
    
    if (result.success) {
      showMessage("Thêm kết quả xét nghiệm thành công!");
      setModals({ ...modals, add: false });
      setFormData({
        patientId: "", doctorId: "", examDate: new Date().toISOString().split('T')[0],
        result: "", cd4Range: "", hivLoadRange: "", currentCondition: ""
      });
      loadData();
    } else {
      showMessage(result.error, true);
    }
    setLoading(false);
  };

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage({ text: "", isError: false }), 5000);
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : "";

  // Render
  return (
    <div className="wrapper">
      {/* Sidebar */}
      <Sidebar active="result" />
      
      {/* Main */}
      <main className="content">
        <div className="header">
          <input type="text" placeholder="Tìm Kiếm..." className="search" />
          <div className="user">
            <span className="notification">🔔<span className="dot"></span></span>
            <img src="https://i.pravatar.cc/40?img=5" className="avatar" alt="avatar" />
          </div>
        </div>
        
        <h1 className="title">Quản Lý Xét Nghiệm HIV</h1>
        
        {/* Messages */}
        {message.text && (
          <div className={`alert ${message.isError ? 'alert-error' : 'alert-success'}`}>
            {message.isError ? '⚠️' : '✅'} {message.text}
          </div>
        )}
        
        {/* Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>📋 Danh Sách Xét Nghiệm HIV</h3>
            <div className="table-actions">
              <select className="sort-select">
                <option>Thời Gian</option>
              </select>
              <button 
                className="btn-add"
                onClick={() => setModals({ ...modals, add: true })}
                disabled={loading}
              >
                Thêm Kết Quả Xét Nghiệm
              </button>
            </div>
          </div>

          <table className="examination-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ Và Tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Ngày Sinh</th>
                <th>CD4 (cells/μL)</th>
                <th>Tải Lượng HIV</th>
                <th>Chẩn Đoán</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="loading-cell">⏳ Đang tải dữ liệu...</td></tr>
              ) : data.patients.length === 0 ? (
                <tr><td colSpan="9" className="empty-cell">📝 Chưa có dữ liệu bệnh nhân</td></tr>
              ) : (
                data.patients.map((patient, index) => (
                  <tr key={patient.accountId}>
                    <td className="text-center">{index + 1}</td>
                    <td className="patient-info">
                      <img
                        src={HIVExamService.getAvatarUrl(patient.userAvatar)}
                        className="avatar-sm"
                        alt="Avatar"
                      />
                      <span className="patient-name">{patient.full_name}</span>
                    </td>
                    <td>{patient.email}</td>
                    <td>{patient.phone || "N/A"}</td>
                    <td>{formatDate(patient.birthdate)}</td>
                    <td className="text-center">-</td>
                    <td className="text-center">-</td>
                    <td>-</td>
                    <td className="text-center">
                      <button
                        className="btn-action"
                        onClick={() => viewHistory(patient.accountId, patient.full_name)}
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
        </div>

        {/* Add Modal */}
        {modals.add && (
          <div className="modal-overlay">
            <div className="add-form-container">
              <div className="form-header">
                <h2>🧪 Thêm Kết Quả Xét Nghiệm HIV</h2>
                <button 
                  className="close-btn"
                  onClick={() => setModals({ ...modals, add: false })}
                  title="Đóng"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="add-form">
                {/* Patient Information Section */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <span>👤</span> Thông tin bệnh nhân
                  </h3>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Họ và tên *</label>
                      <select
                        value={formData.patientId}
                        onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                        required
                        className="form-input"
                      >
                        <option value="">-- Chọn bệnh nhân --</option>
                        {data.patients.map(p => (
                          <option key={p.accountId} value={p.accountId}>
                            {p.full_name} - {p.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tuổi/Năm sinh</label>
                      <input 
                        type="text" 
                        placeholder="Tự động điền" 
                        className="form-input" 
                        disabled 
                      />
                    </div>
                    <div className="form-group">
                      <label>Giới tính</label>
                      <input 
                        type="text" 
                        placeholder="Tự động điền" 
                        className="form-input" 
                        disabled 
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information Section */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <span>🏥</span> Thông tin khám
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bác sĩ chỉ định *</label>
                      <select
                        value={formData.doctorId}
                        onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                        required
                        className="form-input"
                      >
                        <option value="">-- Chọn bác sĩ --</option>
                        {data.doctors.map(d => (
                          <option key={d.userId} value={d.userId}>
                            {d.displayName} {d.specialization && `(${d.specialization})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ngày xét nghiệm *</label>
                      <input
                        type="date"
                        value={formData.examDate}
                        onChange={(e) => setFormData({...formData, examDate: e.target.value})}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Tình trạng hiện tại</label>
                      <textarea
                        value={formData.currentCondition}
                        onChange={(e) => setFormData({...formData, currentCondition: e.target.value})}
                        className="form-textarea"
                        rows="3"
                        placeholder="Mô tả tình trạng sức khỏe hiện tại của bệnh nhân..."
                      />
                    </div>
                  </div>
                </div>

                {/* Test Results Section */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <span>🔬</span> Kết quả xét nghiệm
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Chỉ số CD4 (cells/μL)</label>
                      <select
                        value={formData.cd4Range}
                        onChange={(e) => setFormData({...formData, cd4Range: e.target.value})}
                        className="form-input"
                      >
                        <option value="">-- Chọn khoảng --</option>
                        <option value="> 200">&gt; 200</option>
                        <option value="100-200">100 - 200</option>
                        <option value="< 100">&lt; 100</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tải lượng HIV</label>
                      <select
                        value={formData.hivLoadRange}
                        onChange={(e) => setFormData({...formData, hivLoadRange: e.target.value})}
                        className="form-input"
                      >
                        <option value="">-- Chọn khoảng --</option>
                        <option value="Không phát hiện">Không phát hiện</option>
                        <option value="< 50 copies/ml">&lt; 50 copies/ml</option>
                        <option value="50-1000 copies/ml">50 - 1000 copies/ml</option>
                        <option value="> 1000 copies/ml">&gt; 1000 copies/ml</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Kết quả chi tiết *</label>
                      <textarea
                        value={formData.result}
                        onChange={(e) => setFormData({...formData, result: e.target.value})}
                        required
                        className="form-textarea"
                        rows="5"
                        placeholder="Nhập kết quả xét nghiệm chi tiết, chẩn đoán và ghi chú..."
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? "⏳ Đang xử lý..." : "💾 Lưu kết quả xét nghiệm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {modals.history && selectedPatient && (
          <div className="modal-overlay">
            <div className="history-modal">
              <div className="modal-header">
                <h3>📋 Lịch Sử Xét Nghiệm - {selectedPatient.name}</h3>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setModals({ ...modals, history: false });
                    setSelectedPatient(null);
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div className="history-content">
                {selectedPatient.examinations.length === 0 ? (
                  <div className="empty-history">
                    <p>📝 Chưa có kết quả xét nghiệm nào</p>
                    <p>Bệnh nhân này chưa thực hiện xét nghiệm HIV lần nào.</p>
                  </div>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Ngày XN</th>
                        <th>Bác Sĩ</th>
                        <th>CD4 Count</th>
                        <th>HIV Load</th>
                        <th>Kết Quả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPatient.examinations.map((exam) => (
                        <tr key={exam.examId}>
                          <td>{formatDate(exam.examDate)}</td>
                          <td>{exam.doctorName}</td>
                          <td className={`cd4-${exam.cd4Count > 200 ? 'good' : exam.cd4Count < 100 ? 'bad' : 'medium'}`}>
                            {exam.cd4Count || 'N/A'}
                          </td>
                          <td className={`hiv-${exam.hivLoad === 0 ? 'good' : exam.hivLoad > 1000 ? 'bad' : 'medium'}`}>
                            {exam.hivLoad !== null ? exam.hivLoad : 'N/A'}
                          </td>
                          <td className="result-cell" title={exam.result}>{exam.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HIVExaminationManagement;