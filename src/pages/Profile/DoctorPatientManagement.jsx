import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SidebarDoctor from "../../components/Sidebar/Sidebar-Doctor";
import Pagination from "../../components/Pagination/Pagination";
import doctorPatientService from "../../services/DoctorPatientService";
import * as medicalRecordService from "../../services/medicalRecordService";
import CustomArvProtocolsService from "../../services/CustomArvProtocolsService";
import ARVService from "../../services/ARVService";
import ARVProtocolService from "../../services/ARVProtocolService";
import { tokenManager } from "../../services/account";
import "./DoctorPatientManagement.css";
import ManagerPatientNavbar from "../../components/Navbar/Navbar-Doctor-Manager-Patient";
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

const PatientRow = ({ patient, index, page, onViewHistory, onViewMedicalRecords, onManagePrescription, viewMode }) => (
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
    <td className="actions-doctor">
      {viewMode === "allPatients" ? (
        // Trong tab "Tất cả bệnh nhân" - chỉ hiển thị nút xem hồ sơ bệnh án
        <button
          onClick={() => onViewMedicalRecords(patient)}
          className="btn-medical-admin"
          title="Xem hồ sơ bệnh án"
        >
          📄
        </button>
      ) : (
        // Trong tab "Bệnh nhân của tôi" - hiển thị tất cả các nút
        <>
          <button
            onClick={() => onViewHistory(patient)}
            className="btn-info-admin"
            title="Xem lịch sử khám"
          >
            📋
          </button>
          <button
            onClick={() => onViewMedicalRecords(patient)}
            className="btn-medical-admin"
            title="Xem hồ sơ bệnh án"
          >
            📄
          </button>
          <button
            onClick={() => onManagePrescription(patient)}
            className="btn-prescription-admin"
            title="Quản lý phác đồ điều trị"
          >
            💊
          </button>
        </>
      )}
    </td>
  </tr>
);

const Modal = ({ show, onClose, title, children, className = "" }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop-doctor" onClick={(e) => e.stopPropagation()}>
      <div
        className={`modal-container-doctor ${className}`}
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
  const [viewMode, setViewMode] = useState("myPatients");
  const [scheduleDate, setScheduleDate] = useState(null);

  // Modal states
  const [modals, setModals] = useState({
    history: false,
    exam: false,
    medicalRecords: false,
    medicalRecordDetail: false,
    prescription: false,
    prescriptionDetail: false,
    protocolManagement: false,
  });
  
  // Data states
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [examData, setExamData] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [availableARVs, setAvailableARVs] = useState([]);
  const [standardProtocols, setStandardProtocols] = useState([]);
  
  // Enhanced states for protocol management
  const [protocolManagementData, setProtocolManagementData] = useState({
    currentProtocol: null,
    protocolHistory: [],
    loading: false,
    showCreateForm: false,
    showStandardProtocols: false,
    selectedStandardProtocol: null,
    newProtocolData: {
      baseProtocolId: null,
      name: "",
      description: "",
      details: [],
    },
    selectedARVId: "",
  });
  
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const navigate = useNavigate();
  const doctorId = tokenManager.getCurrentUserId();

  // Check authentication
  useEffect(() => {
    if (tokenManager.getCurrentUserRole() !== "Doctor") {
      toast.error("Bạn không có quyền truy cập");
      navigate("/");
    }
  }, [navigate]);

  // Load available ARVs and standard protocols
  useEffect(() => {
    const loadARVData = async () => {
      try {
        const [arvs, protocols] = await Promise.all([
          ARVService.getAllARVs(),
          ARVProtocolService.getAllProtocols(),
        ]);
        
        setAvailableARVs(arvs || []);
        setStandardProtocols(protocols || []);
      } catch (error) {
        console.error("Error loading ARV data:", error);
      }
    };

    loadARVData();
  }, []);

  // Load patients
  const loadPatients = useCallback(async () => {
    if (!doctorId && viewMode === "myPatients") return;

    setLoading(true);
    try {
      const [sortBy, order] = sort.split("_");
      let result;

      if (viewMode === "allPatients") {
        result = await doctorPatientService.getAllPatients(
          searchTerm,
          page,
          PAGE_SIZE,
          sortBy,
          order
        );
      } else {
        result = await doctorPatientService.getDoctorPatients(
          doctorId,
          page,
          PAGE_SIZE,
          sortBy,
          order,
          scheduleDate,
          false
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
  }, [doctorId, page, sort, searchTerm, viewMode, scheduleDate]);

  useEffect(() => {
    loadPatients();
    if (!isFirstLoad && viewMode === "myPatients") {
      const interval = setInterval(() => {
        loadPatients();
      }, 10000);

      return () => clearInterval(interval);
    }
    setIsFirstLoad(false);
  }, [loadPatients, viewMode, isFirstLoad]);

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

  // Reset protocol management data
  const resetProtocolManagementData = () => {
    setProtocolManagementData({
      currentProtocol: null,
      protocolHistory: [],
      loading: false,
      showCreateForm: false,
      showStandardProtocols: false,
      selectedStandardProtocol: null,
      newProtocolData: {
        baseProtocolId: null,
        name: "",
        description: "",
        details: [],
      },
      selectedARVId: "",
    });
  };

  // Handlers
  const handleViewHistory = async (patient) => {
    setSelectedPatient(patient);
    try {
      let result;

      if (viewMode === "allPatients") {
        result = await doctorPatientService.getPatientHistoryViewOnly(
          patient.userId
        );

        if (result.success && result.data) {
          setPatientHistory({
            ...result.data,
            viewOnly: true,
          });
          openModal("history");
        } else {
          toast.error("Không thể tải thông tin bệnh nhân");
        }
      } else {
        result = await doctorPatientService.getPatientHistory(
          patient.userId,
          doctorId
        );

        if (result.success && result.data) {
          setPatientHistory({
            ...result.data,
            viewOnly: false,
          });
          openModal("history");
        } else {
          toast.error(result.message || "Không thể tải lịch sử bệnh nhân");
        }
      }
    } catch (error) {
      toast.error("Không thể tải lịch sử bệnh nhân");
    }
  };

  // Medical Records Handlers
  const handleViewMedicalRecords = async (patient) => {
    setSelectedPatient(patient);
    try {
      const records = await medicalRecordService.getMedicalRecordsByPatient(patient.userId);
      setMedicalRecords(records || []);
      openModal("medicalRecords");
    } catch (error) {
      console.error("Error fetching medical records:", error);
      toast.error("Không thể tải hồ sơ bệnh án");
      setMedicalRecords([]);
      openModal("medicalRecords");
    }
  };

  const handleViewMedicalRecordDetail = async (record) => {
    try {
      const detail = await medicalRecordService.getMedicalRecordDetail(record.recordId);
      setSelectedMedicalRecord(detail);
      openModal("medicalRecordDetail");
    } catch (error) {
      toast.error("Không thể tải chi tiết hồ sơ bệnh án");
    }
  };

  // Protocol Management Handlers
  const handleManagePrescription = async (patient) => {
    setSelectedPatient(patient);
    setProtocolManagementData(prev => ({ ...prev, loading: true }));
    
    try {
      console.log("🔍 Loading protocol data for patient:", patient.userId);
      
      const [currentProtocol, protocolHistory] = await Promise.all([
        CustomArvProtocolsService.getPatientCurrentProtocol(patient.userId),
        CustomArvProtocolsService.getPatientProtocolHistory(patient.userId)
      ]);
      
      console.log("📥 Current protocol:", currentProtocol);
      console.log("📥 Protocol history:", protocolHistory);
      
      setProtocolManagementData(prev => ({
        ...prev,
        currentProtocol,
        protocolHistory: protocolHistory || [],
        loading: false
      }));
      
      openModal("protocolManagement");
      
    } catch (error) {
      console.error("Error loading protocol data:", error);
      toast.error("Không thể tải thông tin phác đồ điều trị: " + error.message);
      setProtocolManagementData(prev => ({ ...prev, loading: false }));
    }
  };

  // Load protocol details for standard protocol
  const loadProtocolDetails = async (protocolId) => {
    try {
      const details = await ARVProtocolService.getProtocolDetails(protocolId);
      return details || [];
    } catch (error) {
      console.error("Error loading protocol details:", error);
      toast.error("Không thể tải chi tiết phác đồ: " + error.message);
      return [];
    }
  };

  // Handle standard protocol selection
  const handleStandardProtocolSelect = async (protocolId) => {
    const protocol = standardProtocols.find((p) => p.protocolId === protocolId);
    if (!protocol) return;

    try {
      setProtocolManagementData(prev => ({ ...prev, loading: true }));
      
      const details = await loadProtocolDetails(protocolId);

      const selectedStandardProtocol = {
        ...protocol,
        details: details,
      };

      const newProtocolData = {
        baseProtocolId: protocolId,
        name: `Phác đồ cho ${selectedPatient.fullName} - ${protocol.name}`,
        description: protocol.description,
        details: details.map((d) => ({
          arvId: d.arvId,
          dosage: d.dosage || "1 viên",
          usageInstruction: d.usageInstruction || "Uống hàng ngày",
          status: "ACTIVE",
        })),
      };

      setProtocolManagementData(prev => ({
        ...prev,
        selectedStandardProtocol,
        newProtocolData,
        showStandardProtocols: false,
        showCreateForm: true,
        loading: false
      }));
    } catch (error) {
      console.error("Error selecting standard protocol:", error);
      setProtocolManagementData(prev => ({ ...prev, loading: false }));
    }
  };

  // Add ARV to new protocol
  const addARVToProtocol = (arvId) => {
    const arv = availableARVs.find((a) => a.arvId === arvId);
    if (!arv) return;

    const newDetail = {
      arvId,
      dosage: "1 viên",
      usageInstruction: "Uống hàng ngày",
      status: "ACTIVE",
    };

    setProtocolManagementData(prev => ({
      ...prev,
      newProtocolData: {
        ...prev.newProtocolData,
        details: [...prev.newProtocolData.details, newDetail]
      },
      selectedARVId: ""
    }));
  };

  // Remove ARV from protocol
  const removeARVFromProtocol = (index) => {
    setProtocolManagementData(prev => ({
      ...prev,
      newProtocolData: {
        ...prev.newProtocolData,
        details: prev.newProtocolData.details.filter((_, i) => i !== index)
      }
    }));
  };

  // Update ARV detail in protocol
  const updateARVDetail = (index, field, value) => {
    setProtocolManagementData(prev => ({
      ...prev,
      newProtocolData: {
        ...prev.newProtocolData,
        details: prev.newProtocolData.details.map((detail, i) => 
          i === index ? { ...detail, [field]: value } : detail
        )
      }
    }));
  };

  // Create new protocol
  const handleCreateNewProtocol = async () => {
    try {
      setProtocolManagementData(prev => ({ ...prev, loading: true }));
      
      const result = await CustomArvProtocolsService.createCustomProtocol(
        doctorId,
        selectedPatient.userId,
        protocolManagementData.newProtocolData
      );
      
      toast.success("Tạo phác đồ mới thành công!");
      
      // Reload protocol data
      const [currentProtocol, protocolHistory] = await Promise.all([
        CustomArvProtocolsService.getPatientCurrentProtocol(selectedPatient.userId),
        CustomArvProtocolsService.getPatientProtocolHistory(selectedPatient.userId)
      ]);
      
      setProtocolManagementData(prev => ({
        ...prev,
        currentProtocol,
        protocolHistory: protocolHistory || [],
        loading: false,
        showCreateForm: false,
        selectedStandardProtocol: null,
        newProtocolData: {
          baseProtocolId: null,
          name: "",
          description: "",
          details: [],
        }
      }));
      
      // Refresh patient list
      loadPatients();
      
    } catch (error) {
      console.error("Error creating protocol:", error);
      toast.error("Không thể tạo phác đồ mới: " + error.message);
      setProtocolManagementData(prev => ({ ...prev, loading: false }));
    }
  };

  // Update protocol
  const handleUpdateProtocol = async (protocolId, isCustom) => {
    try {
      setProtocolManagementData(prev => ({ ...prev, loading: true }));
      
      await CustomArvProtocolsService.updatePatientProtocol(
        selectedPatient.userId,
        { protocolId, isCustom }
      );
      
      toast.success("Cập nhật phác đồ thành công!");
      
      // Reload protocol data
      const [currentProtocol, protocolHistory] = await Promise.all([
        CustomArvProtocolsService.getPatientCurrentProtocol(selectedPatient.userId),
        CustomArvProtocolsService.getPatientProtocolHistory(selectedPatient.userId)
      ]);
      
      setProtocolManagementData(prev => ({
        ...prev,
        currentProtocol,
        protocolHistory: protocolHistory || [],
        loading: false
      }));
      
      // Refresh patient list
      loadPatients();
      
    } catch (error) {
      console.error("Error updating protocol:", error);
      toast.error("Không thể cập nhật phác đồ: " + error.message);
      setProtocolManagementData(prev => ({ ...prev, loading: false }));
    }
  };

  // View prescription detail
  const handleViewPrescriptionDetail = async (prescription) => {
    try {
      const detail = await CustomArvProtocolsService.getProtocolById(prescription.customProtocolId);
      setSelectedPrescription(detail);
      openModal("prescriptionDetail");
    } catch (error) {
      toast.error("Không thể tải chi tiết phác đồ điều trị");
    }
  };

  // Existing examination handlers
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

        const historyResult = await doctorPatientService.getPatientHistory(
          selectedPatient.userId,
          doctorId
        );
        if (historyResult.success) {
          setPatientHistory(historyResult.data);
          openModal("history");
        }
        loadPatients();
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
        loadPatients();
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
      CANCELLED: "Đã hủy",
      ACTIVE: "Đang hoạt động",
      INACTIVE: "Ngừng hoạt động",
    };
    return (
      <span className={`status-badge-admin status-${status.toLowerCase()}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  return (
    <div className="container-m">
      <SidebarDoctor active={"Doctor-Patient-Manager"} />
      <div className="main-content-doctor">
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

        {/* Statistics - Only for "myPatients" view */}
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
                    onViewMedicalRecords={handleViewMedicalRecords}
                    onManagePrescription={handleManagePrescription}
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

        {/* Protocol Management Modal */}
        <Modal
          show={modals.protocolManagement}
          onClose={() => {
            closeModal("protocolManagement");
            resetProtocolManagementData();
          }}
          title={`Quản Lý Phác Đồ Điều Trị - ${selectedPatient?.fullName}`}
          className="modal-extra-large"
        >
          <div className="modal-info-body-admin">
            {protocolManagementData.loading ? (
              <div className="loading-admin">Đang tải dữ liệu...</div>
            ) : (
              <>
                {/* Show Create Form */}
                {protocolManagementData.showCreateForm ? (
                  <div className="create-protocol-form">
                    <h3>Tạo Phác Đồ Mới</h3>
                    
                    {protocolManagementData.selectedStandardProtocol && (
                      <div className="standard-protocol-info">
                        <p><strong>Dựa trên phác đồ chuẩn:</strong> {protocolManagementData.selectedStandardProtocol.name}</p>
                      </div>
                    )}

                    <div className="form-group-admin">
                      <label>Tên phác đồ *</label>
                      <input
                        type="text"
                        value={protocolManagementData.newProtocolData.name}
                        onChange={(e) =>
                          setProtocolManagementData(prev => ({
                            ...prev,
                            newProtocolData: {
                              ...prev.newProtocolData,
                              name: e.target.value
                            }
                          }))
                        }
                        placeholder="Nhập tên phác đồ..."
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group-admin">
                      <label>Mô tả</label>
                      <textarea
                        value={protocolManagementData.newProtocolData.description}
                        onChange={(e) =>
                          setProtocolManagementData(prev => ({
                            ...prev,
                            newProtocolData: {
                              ...prev.newProtocolData,
                              description: e.target.value
                            }
                          }))
                        }
                        placeholder="Nhập mô tả phác đồ..."
                        className="form-textarea"
                        rows="3"
                      />
                    </div>

                    {/* ARV Selection */}
                    <div className="arv-selection">
                      <h4>Chọn thuốc ARV:</h4>
                      <div className="arv-add-section">
                        <select
                          value={protocolManagementData.selectedARVId}
                          onChange={(e) =>
                            setProtocolManagementData(prev => ({
                              ...prev,
                              selectedARVId: e.target.value
                            }))
                          }
                          className="arv-select"
                        >
                          <option value="">-- Chọn thuốc ARV --</option>
                          {availableARVs
                            .filter(arv => !protocolManagementData.newProtocolData.details.some(detail => detail.arvId === arv.arvId))
                            .map((arv) => (
                            <option key={arv.arvId} value={arv.arvId}>
                              {arv.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (protocolManagementData.selectedARVId) {
                              addARVToProtocol(parseInt(protocolManagementData.selectedARVId));
                            }
                          }}
                          disabled={!protocolManagementData.selectedARVId}
                          className="btn-add-arv"
                        >
                          + Thêm ARV
                        </button>
                      </div>
                    </div>

                    {/* Selected ARVs List */}
                    {protocolManagementData.newProtocolData.details.length > 0 && (
                      <div className="selected-arvs">
                        <h4>Thuốc ARV đã chọn:</h4>
                        <div className="arv-details-list">
                          {protocolManagementData.newProtocolData.details.map((detail, index) => {
                            const arv = availableARVs.find(a => a.arvId === detail.arvId);
                            return (
                              <div key={index} className="arv-detail-item">
                                <div className="arv-detail-header">
                                  <h5>{arv?.name}</h5>
                                  <button
                                    type="button"
                                    onClick={() => removeARVFromProtocol(index)}
                                    className="btn-remove-arv"
                                    title="Xóa thuốc này"
                                  >
                                    ❌
                                  </button>
                                </div>
                                <div className="arv-detail-inputs">
                                  <div className="input-group">
                                    <label>Liều dùng:</label>
                                    <input
                                      type="text"
                                      value={detail.dosage}
                                      onChange={(e) => updateARVDetail(index, 'dosage', e.target.value)}
                                      placeholder="VD: 1 viên"
                                      className="detail-input"
                                    />
                                  </div>
                                  <div className="input-group">
                                    <label>Hướng dẫn sử dụng:</label>
                                    <input
                                      type="text"
                                      value={detail.usageInstruction}
                                      onChange={(e) => updateARVDetail(index, 'usageInstruction', e.target.value)}
                                      placeholder="VD: Uống hàng ngày vào buổi sáng"
                                      className="detail-input"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-back-small"
                        onClick={() => 
                          setProtocolManagementData(prev => ({
                            ...prev,
                            showCreateForm: false,
                            showStandardProtocols: false
                          }))
                        }
                      >
                        ← Quay lại
                      </button>
                      <button
                        type="button"
                        className="btn-select-standard"
                        onClick={() =>
                          setProtocolManagementData(prev => ({
                            ...prev,
                            showStandardProtocols: true
                          }))
                        }
                      >
                        📋 Chọn từ phác đồ chuẩn
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNewProtocol}
                        disabled={
                          protocolManagementData.loading || 
                          !protocolManagementData.newProtocolData.name.trim() || 
                          protocolManagementData.newProtocolData.details.length === 0
                        }
                        className="btn-save-protocol"
                      >
                        {protocolManagementData.loading ? "Đang tạo..." : "💾 Lưu phác đồ"}
                      </button>
                    </div>
                  </div>
                ) : protocolManagementData.showStandardProtocols ? (
                  /* Show Standard Protocols List */
                  <div className="standard-protocols-list">
                    <h3>Chọn Phác Đồ Chuẩn</h3>
                    {standardProtocols.length > 0 ? (
                      <div className="protocols-grid">
                        {standardProtocols.map((protocol) => (
                          <div key={protocol.protocolId} className="protocol-card">
                            <div className="protocol-card-header">
                              <h4>{protocol.name}</h4>
                              <span className="protocol-status">Phác đồ chuẩn</span>
                            </div>
                            <p className="protocol-description">{protocol.description}</p>
                            <div className="protocol-card-actions">
                              <button
                                className="btn-select-protocol"
                                onClick={() => handleStandardProtocolSelect(protocol.protocolId)}
                                disabled={protocolManagementData.loading}
                              >
                                {protocolManagementData.loading ? "Đang tải..." : "Chọn phác đồ này"}
                              </button>
                              <button
                                className="btn-apply-direct"
                                onClick={() => handleUpdateProtocol(protocol.protocolId, false)}
                                disabled={protocolManagementData.loading}
                              >
                                Áp dụng trực tiếp
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-admin">Chưa có phác đồ chuẩn nào</p>
                    )}
                    <div className="form-actions">
                      <button
                        className="btn-back-small"
                        onClick={() =>
                          setProtocolManagementData(prev => ({
                            ...prev,
                            showStandardProtocols: false
                          }))
                        }
                      >
                        ← Quay lại
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Show Main Protocol Management View */
                  <>
                    {/* Current Protocol Section */}
                    <div className="protocol-section">
                      <h3>Phác Đồ Hiện Tại</h3>
                      {protocolManagementData.currentProtocol ? (
                        <div className="current-protocol-card">
                          <div className="protocol-header">
                            <h4>{protocolManagementData.currentProtocol.name}</h4>
                            {getStatusBadge(protocolManagementData.currentProtocol.status)}
                          </div>
                          <p><strong>Mô tả:</strong> {protocolManagementData.currentProtocol.description}</p>
                          <p><strong>Ngày tạo:</strong> {formatDate(protocolManagementData.currentProtocol.createdAt)}</p>
                          
                          {protocolManagementData.currentProtocol.details && protocolManagementData.currentProtocol.details.length > 0 && (
                            <div className="arv-details">
                              <h5>Thuốc ARV:</h5>
                              {protocolManagementData.currentProtocol.details.map((detail, index) => (
                                <div key={index} className="arv-detail-item">
                                  <p><strong>{detail.arvName}</strong></p>
                                  <p>Liều dùng: {detail.dosage}</p>
                                  <p>Hướng dẫn: {detail.usageInstruction}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="no-protocol-card">
                          <p>Bệnh nhân chưa có phác đồ điều trị nào</p>
                          <button
                            className="btn-add-small"
                            onClick={() =>
                              setProtocolManagementData(prev => ({
                                ...prev,
                                showCreateForm: true,
                                newProtocolData: {
                                  baseProtocolId: null,
                                  name: `Phác đồ cho ${selectedPatient.fullName}`,
                                  description: "",
                                  details: [],
                                }
                              }))
                            }
                          >
                            + Tạo phác đồ mới
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Protocol History Section */}
                    <div className="protocol-section">
                      <h3>Lịch Sử Phác Đồ</h3>
                      {protocolManagementData.protocolHistory.length > 0 ? (
                        <div className="protocol-history-list">
                          {protocolManagementData.protocolHistory.map((protocol) => (
                            <div key={protocol.customProtocolId} className="protocol-history-item">
                              <div className="protocol-item-header">
                                <div className="protocol-info">
                                  <h4>{protocol.name}</h4>
                                  <p>{protocol.description}</p>
                                  <span className="protocol-date">
                                    Ngày tạo: {formatDate(protocol.createdDate)}
                                  </span>
                                </div>
                                <div className="protocol-status">
                                  {getStatusBadge(protocol.status)}
                                </div>
                              </div>
                              
                              <div className="protocol-actions">
                                <button
                                  onClick={() => handleViewPrescriptionDetail(protocol)}
                                  className="btn-detail-small"
                                >
                                  Xem chi tiết
                                </button>
                                {protocol.status !== "ACTIVE" && (
                                  <button
                                    onClick={() => handleUpdateProtocol(protocol.customProtocolId, true)}
                                    className="btn-activate-small"
                                    disabled={protocolManagementData.loading}
                                  >
                                    Kích hoạt
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data-admin">Chưa có lịch sử phác đồ</p>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="protocol-actions-section">
                      <h3>Thao Tác Nhanh</h3>
                      <div className="quick-actions">
                        <button
                          className="btn-create-protocol"
                          onClick={() =>
                            setProtocolManagementData(prev => ({
                              ...prev,
                              showCreateForm: true,
                              newProtocolData: {
                                baseProtocolId: null,
                                name: `Phác đồ cho ${selectedPatient.fullName}`,
                                description: "",
                                details: [],
                              }
                            }))
                          }
                        >
                          🔬 Tạo phác đồ tùy chỉnh
                        </button>
                        
                        <button
                          className="btn-view-standards"
                          onClick={() =>
                            setProtocolManagementData(prev => ({
                              ...prev,
                              showStandardProtocols: true
                            }))
                          }
                        >
                          📋 Áp dụng phác đồ chuẩn
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div className="modal-actions-admin">
            <button
              className="btn-cancel-admin"
              onClick={() => {
                closeModal("protocolManagement");
                resetProtocolManagementData();
              }}
            >
              Đóng
            </button>
          </div>
        </Modal>

        {/* Existing History Modal */}
        <Modal
          show={modals.history}
          onClose={() => closeModal("history")}
          title={`Lịch Sử Khám Bệnh - ${selectedPatient?.fullName}`}
          className="modal-large"
        >
          <ManagerPatientNavbar />
          <div className="modal-info-body-admin">
            {patientHistory ? (
              <>
                {/* Patient Info */}
                <div className="patient-info-section">
                  <h3>Thông Tin Bệnh Nhân</h3>
                  <div className="patient-detail-grid">
                    <div className="info-item">
                      <span className="info-label">Họ tên:</span>
                      <span className="info-value">
                        {selectedPatient?.fullName || "Chưa có"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">
                        {selectedPatient?.email}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Số điện thoại:</span>
                      <span className="info-value">
                        {selectedPatient?.phone || "Chưa có"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Ngày sinh:</span>
                      <span className="info-value">
                        {formatDate(selectedPatient?.birthdate)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Giới tính:</span>
                      <span className="info-value">
                        {selectedPatient?.gender || "Other"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                <div className="info-section-admin">
                  <h3>Lịch Hẹn Khám</h3>
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
                            <p
                              className={`history-detail note ${
                                appointment.status === "CANCELLED"
                                  ? "cancelled-note"
                                  : ""
                              }`}
                            >
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
                  <div className="section-header-no-border">
                    <h3>Kết Quả Xét Nghiệm</h3>
                    {!patientHistory?.viewOnly && (
                      <button
                        className="btn-add-small"
                        onClick={() => openExamModal()}
                      >
                        + Thêm mới
                      </button>
                    )}
                  </div>
                  {patientHistory?.examinations?.length > 0 ? (
                    <div className="exam-list">
                      {patientHistory.examinations.map((exam) => (
                        <div key={exam.examId} className="history-item">
                          <div className="history-item-header">
                            <span className="date">
                              Ngày: {formatDate(exam.examDate)}
                            </span>
                            {!patientHistory?.viewOnly && (
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
                            )}
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
                      {!patientHistory?.viewOnly && (
                        <button
                          className="btn-add-small"
                          onClick={() => openExamModal()}
                        >
                          + Thêm kết quả đầu tiên
                        </button>
                      )}
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
        {/* Medical Records Modal - View Only */}
        <Modal
          show={modals.medicalRecords}
          onClose={() => closeModal("medicalRecords")}
          title={`Hồ Sơ Bệnh Án - ${selectedPatient?.fullName}`}
          className="modal-large"
        >
          <div className="modal-info-body-admin">
            <div className="section-header-no-border">
              <h3>Danh Sách Hồ Sơ Bệnh Án</h3>
            </div>
            
            {medicalRecords.length > 0 ? (
              <div className="medical-records-list">
                {medicalRecords.map((record) => (
                  <div key={record.recordId} className="medical-record-item">
                    <div className="record-header">
                      <span className="record-date">
                        Ngày: {formatDate(record.createdAt)}
                      </span>
                      <button
                        onClick={() => handleViewMedicalRecordDetail(record)}
                        className="btn-detail-small"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                    <div className="record-summary">
                      <p><strong>Chẩn đoán:</strong> {record.diagnosis || "Chưa có"}</p>
                      <p><strong>Điều trị:</strong> {record.treatment || "Chưa có"}</p>
                      {record.doctorName && (
                        <p><strong>Bác sĩ:</strong> {record.doctorName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-section">
                <p className="no-data-admin">Chưa có hồ sơ bệnh án nào</p>
              </div>
            )}
          </div>
          <div className="modal-actions-admin">
            <button
              className="btn-cancel-admin"
              onClick={() => closeModal("medicalRecords")}
            >
              Đóng
            </button>
          </div>
        </Modal>

        {/* Medical Record Detail Modal */}
        <Modal
          show={modals.medicalRecordDetail}
          onClose={() => closeModal("medicalRecordDetail")}
          title="Chi Tiết Hồ Sơ Bệnh Án"
          className="modal-large"
        >
          <div className="modal-info-body-admin">
            {selectedMedicalRecord ? (
              <>
                <div className="medical-record-detail">
                  <div className="record-basic-info">
                    <h3>Thông Tin Cơ Bản</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Ngày tạo:</span>
                        <span className="info-value">
                          {formatDateTime(selectedMedicalRecord.createdAt)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Bác sĩ:</span>
                        <span className="info-value">
                          {selectedMedicalRecord.doctorName || "N/A"}
                        </span>
                      </div>
                      {selectedMedicalRecord.followUpDate && (
                        <div className="info-item">
                          <span className="info-label">Ngày tái khám:</span>
                          <span className="info-value">
                            {formatDate(selectedMedicalRecord.followUpDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="record-content">
                    <div className="content-section">
                      <h4>Chẩn Đoán</h4>
                      <p>{selectedMedicalRecord.diagnosis}</p>
                    </div>

                    <div className="content-section">
                      <h4>Phương Pháp Điều Trị</h4>
                      <p>{selectedMedicalRecord.treatment}</p>
                    </div>

                    {selectedMedicalRecord.notes && (
                      <div className="content-section">
                        <h4>Ghi Chú</h4>
                        <p>{selectedMedicalRecord.notes}</p>
                      </div>
                    )}

                    {/* Examination Details if available */}
                    {selectedMedicalRecord.examination && (
                      <div className="content-section">
                        <h4>Kết Quả Xét Nghiệm</h4>
                        <div className="exam-details">
                          <p><strong>Kết quả:</strong> {selectedMedicalRecord.examination.result}</p>
                          {selectedMedicalRecord.examination.cd4Count && (
                            <p><strong>CD4 Count:</strong> {selectedMedicalRecord.examination.cd4Count} cells/μL</p>
                          )}
                          {selectedMedicalRecord.examination.hivLoad && (
                            <p><strong>HIV Load:</strong> {selectedMedicalRecord.examination.hivLoad} copies/ml</p>
                          )}
                          <p><strong>Ngày xét nghiệm:</strong> {formatDate(selectedMedicalRecord.examination.examDate)}</p>
                        </div>
                      </div>
                    )}

                    {/* ARV Protocol if available */}
                    {selectedMedicalRecord.customizedProtocol && (
                      <div className="content-section">
                        <h4>Phác Đồ ARV</h4>
                        <div className="protocol-details">
                          <p><strong>Tên phác đồ:</strong> {selectedMedicalRecord.customizedProtocol.name}</p>
                          <p><strong>Mô tả:</strong> {selectedMedicalRecord.customizedProtocol.description}</p>
                          
                          {selectedMedicalRecord.customizedProtocol.arvDetails?.length > 0 && (
                            <div className="arv-list">
                              <h5>Danh sách thuốc ARV:</h5>
                              {selectedMedicalRecord.customizedProtocol.arvDetails.map((arv, index) => (
                                <div key={index} className="arv-item">
                                  <p><strong>{arv.arvName}</strong></p>
                                  <p>Liều dùng: {arv.dosage}</p>
                                  <p>Hướng dẫn: {arv.usageInstruction}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="loading-admin">Đang tải dữ liệu...</div>
            )}
          </div>
          <div className="modal-actions-admin">
            <button
              className="btn-cancel-admin"
              onClick={() => closeModal("medicalRecordDetail")}
            >
              Đóng
            </button>
          </div>
        </Modal>

        {/* Prescription Detail Modal */}
        <Modal
          show={modals.prescriptionDetail}
          onClose={() => closeModal("prescriptionDetail")}
          title="Chi Tiết Phác Đồ Điều Trị"
          className="modal-large"
        >
          <div className="modal-info-body-admin">
            {selectedPrescription ? (
              <>
                <div className="prescription-detail">
                  <div className="protocol-basic-info">
                    <h3>Thông Tin Phác Đồ</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Tên phác đồ:</span>
                        <span className="info-value">{selectedPrescription.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Mô tả:</span>
                        <span className="info-value">{selectedPrescription.description}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Trạng thái:</span>
                        {getStatusBadge(selectedPrescription.status)}
                      </div>
                      <div className="info-item">
                        <span className="info-label">Ngày tạo:</span>
                        <span className="info-value">
                          {formatDateTime(selectedPrescription.createdAt)}
                        </span>
                      </div>
                      {selectedPrescription.baseProtocolName && (
                        <div className="info-item">
                          <span className="info-label">Dựa trên:</span>
                          <span className="info-value">{selectedPrescription.baseProtocolName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="arv-medications">
                    <h3>Danh Sách Thuốc ARV</h3>
                    {selectedPrescription.arvDetails?.length > 0 ? (
                      <div className="arv-cards">
                        {selectedPrescription.arvDetails.map((arv, index) => (
                          <div key={index} className="arv-card-detail">
                            <div className="arv-header">
                              <h4>{arv.arvName}</h4>
                              {getStatusBadge(arv.status)}
                            </div>
                            <div className="arv-content">
                              <p><strong>Mô tả:</strong> {arv.arvDescription || "Không có mô tả"}</p>
                              <p><strong>Liều dùng:</strong> {arv.dosage}</p>
                              <p><strong>Hướng dẫn sử dụng:</strong> {arv.usageInstruction}</p>
                              {arv.sideEffects && (
                                <p><strong>Tác dụng phụ:</strong> {arv.sideEffects}</p>
                              )}
                              {arv.contraindications && (
                                <p><strong>Chống chỉ định:</strong> {arv.contraindications}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-admin">Chưa có thuốc ARV nào trong phác đồ</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="loading-admin">Đang tải dữ liệu...</div>
            )}
          </div>
          <div className="modal-actions-admin">
            <button
              className="btn-cancel-admin"
              onClick={() => closeModal("prescriptionDetail")}
            >
              Đóng
            </button>
          </div>
        </Modal>

        {/* Existing Exam Modal */}
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
              <p><strong>Họ tên:</strong> {selectedPatient?.fullName}</p>
              <p><strong>Email:</strong> {selectedPatient?.email}</p>
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
                onClick={() => closeModal("exam")}
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