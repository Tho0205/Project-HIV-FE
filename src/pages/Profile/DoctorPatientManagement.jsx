import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SidebarDoctor from "../../components/Sidebar/Sidebar-Doctor";
import Pagination from "../../components/Pagination/Pagination";
import doctorPatientService from "../../services/DoctorPatientService";
import ARVProtocolService from "../../services/ARVProtocolService";
import ARVService from "../../services/ARVService";
import CustomArvProtocolsService from "../../services/CustomArvProtocolsService";
import { tokenManager } from "../../services/account";
import {
  getPatientRecordsForDoctor,
  getMedicalRecordDetail,
} from "../../services/medicalRecordService";
import "./DoctorPatientManagement.css";
import ManagerPatientNavbar from "../../components/Navbar/Navbar-Doctor";

const PAGE_SIZE = 5;
const DEFAULT_AVATAR = "/assets/image/patient/patient.png";

// Utility functions
const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "";
const formatDateTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleString("vi-VN") : "";
const formatTime = (timeString) => {
  if (!timeString) return "";
  const parts = timeString.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeString;
};

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
    <td className="actions-doctor">
      <button
        onClick={() => onViewHistory(patient)}
        className="btn-info-doctor"
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
    <div className="modal-backdrop-doctor" onClick={(e) => e.stopPropagation()}>
      <div
        className={`modal-container-doctor ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-doctor">
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
  const [standardProtocols, setStandardProtocols] = useState([]);
  const [availableARVs, setAvailableARVs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentProtocol, setCurrentProtocol] = useState(null);
  const [protocolHistory, setProtocolHistory] = useState([]);
  const [newProtocolData, setNewProtocolData] = useState({
    baseProtocolId: null,
    name: "",
    description: "",
    details: [],
  });
  const [selectedStandardProtocol, setSelectedStandardProtocol] =
    useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(5);
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
  const [scheduleDate, setScheduleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [modals, setModals] = useState({
    history: false,
    exam: false,
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [examData, setExamData] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [patientRecords, setPatientRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const navigate = useNavigate();
  const doctorId = tokenManager.getCurrentUserId();

  // Check authentication
  useEffect(() => {
    if (tokenManager.getCurrentUserRole() !== "Doctor") {
      toast.error("Bạn không có quyền truy cập");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const loadProtocolsAndARVs = async () => {
      try {
        const [protocolsResult, arvsResult] = await Promise.all([
          ARVProtocolService.getAllProtocols(),
          ARVService.getAllARVs(),
        ]);

        setStandardProtocols(protocolsResult || []);
        setAvailableARVs(arvsResult || []);
      } catch (error) {
        console.error("Error loading protocols and ARVs:", error);
      }
    };

    loadProtocolsAndARVs();
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

  // Load patient records for medicalhistorys tab
  const loadPatientRecords = useCallback(
    async (patientId) => {
      setRecordsLoading(true);
      try {
        const records = await getPatientRecordsForDoctor(doctorId, patientId);
        setPatientRecords(records || []);
      } catch (err) {
        console.error("Failed to fetch patient records", err);
        toast.error("Không thể tải hồ sơ bệnh án.");
        setPatientRecords([]);
      } finally {
        setRecordsLoading(false);
      }
    },
    [doctorId]
  );

  useEffect(() => {
    if (activeTab === "medicalhistorys" && selectedPatient) {
      loadPatientRecords(selectedPatient.userId);
    }
  }, [activeTab, selectedPatient, loadPatientRecords]);

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

  const handleExamClose = () => {
    closeModal("exam");
    openModal("history");
  };

  const handleViewProtocol = async (patient) => {
    try {
      setSelectedPatient(patient);
      const patientId = patient.userId || patient.patientId;
      await loadPatientProtocol(patientId);
      setModalType("view");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading protocol:", error);
      toast.error("Không thể tải thông tin phác đồ");
    }
  };

  const loadPatientProtocolForHistory = async (patientId) => {
    try {
      const current = await CustomArvProtocolsService.getPatientCurrentProtocol(
        patientId
      );
      if (current && current.baseProtocolId) {
        setCurrentProtocol(current);
      }
    } catch (error) {
      console.error("Error loading patient protocol:", error);
      setCurrentProtocol(null);
    }
  };

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
          await loadPatientProtocolForHistory(patient.userId);
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
          await loadPatientProtocolForHistory(patient.userId);
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

  const loadPatientProtocol = async (patientId) => {
    try {
      setLoading(true);
      const [current, history] = await Promise.all([
        CustomArvProtocolsService.getPatientCurrentProtocol(patientId),
        CustomArvProtocolsService.getPatientProtocolHistory(patientId),
      ]);

      setCurrentProtocol(current);
      setProtocolHistory(history);
    } catch (err) {
      toast.error("Lỗi khi tải thông tin phác đồ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProtocol = async () => {
    try {
      setLoading(true);
      const patientId = selectedPatient.userId || selectedPatient.patientId;
      const createdProtocol =
        await CustomArvProtocolsService.createCustomProtocol(
          doctorId,
          patientId,
          newProtocolData
        );

      toast.success("Tạo phác đồ thành công!");
      await loadPatientProtocol(patientId);
      setModalType("view");

      setNewProtocolData({
        baseProtocolId: null,
        name: "",
        description: "",
        details: [],
      });

      loadPatients();
    } catch (err) {
      console.error("Error creating protocol:", err);
      toast.error("Lỗi khi tạo phác đồ: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProtocol = async (protocolId, isCustom) => {
    try {
      setLoading(true);
      const patientId = selectedPatient.userId || selectedPatient.patientId;

      await CustomArvProtocolsService.updatePatientProtocol(patientId, {
        protocolId,
        isCustom,
      });

      await loadPatientProtocol(patientId);
      await loadPatientProtocolForHistory(patientId);

      toast.success("Cập nhật phác đồ thành công!");
      setModalType("view");
      loadPatients();
    } catch (err) {
      console.error("Error updating protocol:", err);
      toast.error(err.message || "Lỗi khi cập nhật phác đồ");
    } finally {
      setLoading(false);
    }
  };

  const loadProtocolDetails = async (protocolId) => {
    try {
      const details = await ARVProtocolService.getProtocolDetails(protocolId);
      return details;
    } catch (err) {
      toast.error("Không thể lấy chi tiết phác đồ: " + err.message);
      return [];
    }
  };

  const handleStandardProtocolSelect = async (protocolId) => {
    const protocol = standardProtocols.find((p) => p.protocolId === protocolId);
    if (!protocol) return;

    const details = await loadProtocolDetails(protocolId);

    setSelectedStandardProtocol({
      ...protocol,
      details: details,
    });

    setNewProtocolData({
      baseProtocolId: protocolId,
      name: protocol.name,
      description: protocol.description,
      details: details.map((d) => ({
        arvId: d.arvId,
        dosage: d.dosage || "1 viên",
        usageInstruction: d.usageInstruction || "Uống hàng ngày",
        status: "ACTIVE",
      })),
    });
  };

  const handleViewRecordDetail = async (recordId) => {
    setDetailLoading(true);
    try {
      const detail = await getMedicalRecordDetail(recordId);
      setSelectedRecord(detail || {});
    } catch (err) {
      console.error("Failed to fetch detail", err);
      toast.error("Không thể tải chi tiết hồ sơ.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeRecordModal = () => {
    setSelectedRecord(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      SCHEDULED: "Đã lên lịch",
      PENDING: "Chờ khám",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
    };
    return (
      <span className={`status-badge-admin status-${status.toLowerCase()}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  // Render modal content
  const renderModalContent = () => {
    if (!patientHistory) {
      return <div className="loading-admin">Đang tải dữ liệu...</div>;
    }

    switch (activeTab) {
      case "info":
        return (
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
                <span className="info-value">{selectedPatient?.email}</span>
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
              {/* <div className="info-item">
                <span className="info-label">Tổng số lần hẹn:</span>
                <span className="info-value">
                  {selectedPatient?.appointmentCount || 0}
                </span>
              </div> */}
            </div>
          </div>
        );

      case "appointments":
        return (
          <div className="info-section-doctor">
            <h3>Lịch Hẹn Khám</h3>
            {patientHistory?.appointments?.length > 0 ? (
              <div className="appointment-list">
                {patientHistory.appointments.map((appointment) => (
                  <div key={appointment.appointmentId} className="history-item">
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
                    {appointment.status === "CANCELLED" &&
                      appointment.note?.includes("bác sĩ mới") && (
                        <div className="transfer-warning">
                          Lịch hẹn này đã bị hủy tự động do bệnh nhân chuyển
                          sang bác sĩ khác
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-admin">Chưa có lịch hẹn nào</p>
            )}
          </div>
        );

      case "medicalhistorys":
        return (
          <div className="info-section-doctor">
            <h3>Hồ Sơ Bệnh Án</h3>
            {recordsLoading ? (
              <div className="medi-loading-medical-record">
                Đang tải hồ sơ bệnh án...
              </div>
            ) : patientRecords.length === 0 ? (
              <div className="medi-empty-message-medical-record">
                Bệnh nhân này chưa có hồ sơ bệnh án nào.
              </div>
            ) : (
              <div className="medi-list-medical-record">
                {patientRecords.map((record) => (
                  <div
                    key={record.recordId}
                    className="medi-card-medical-record"
                  >
                    <div className="medi-main-medical-record">
                      <div>
                        <h3 className="medi-record-title-medical-record">
                          Hồ sơ #{record.recordId}
                        </h3>
                        <div className="medi-datetime-medical-record">
                          <span className="medi-exam-date-medical-record">
                            {formatDate(record.examDate)}
                          </span>
                          <span className="medi-exam-time-medical-record">
                            {formatTime(record.examTime)}
                          </span>
                        </div>
                      </div>
                      <div className="medi-actions-medical-record">
                        <span
                          className={`medi-status-medical-record ${record.status?.toLowerCase()}`}
                        >
                          {record.status || "N/A"}
                        </span>
                        <button
                          className="medi-detail-button-medical-record"
                          onClick={() =>
                            handleViewRecordDetail(record.recordId)
                          }
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                    <div className="medi-summary-medical-record">
                      {record.summary || (
                        <span className="medi-no-summary-medical-record">
                          Không có ghi chú
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedRecord && (
              <Modal
                show={!!selectedRecord}
                onClose={closeRecordModal}
                title="Chi tiết hồ sơ bệnh án"
                className="modal-standard"
              >
                <div className="detail-tabs-medical-record">
                  <button
                    className={`tab-button-medical-record ${
                      activeTab === "examination" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("examination")}
                  >
                    Thông tin khám bệnh
                  </button>
                  <button
                    className={`tab-button-medical-record ${
                      activeTab === "arv" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("arv")}
                  >
                    Phác đồ ARV
                  </button>
                </div>
                <div className="detail-body-medical-record">
                  {detailLoading ? (
                    <div className="detail-loading-medical-record">
                      Đang tải thông tin...
                    </div>
                  ) : (
                    <>
                      {activeTab === "examination" && (
                        <div className="examination-detail-medical-record">
                          <h3>Thông tin khám bệnh</h3>
                          {selectedRecord.examination ? (
                            <div className="detail-info-medical-record">
                              <div className="info-row-medical-record">
                                <span className="info-label-medical-record">
                                  Mã khám:
                                </span>
                                <span className="info-value-medical-record">
                                  {selectedRecord.examination.examId || "N/A"}
                                </span>
                              </div>
                              <div className="info-row-medical-record">
                                <span className="info-label-medical-record">
                                  Ngày khám:
                                </span>
                                <span className="info-value-medical-record">
                                  {formatDate(
                                    selectedRecord.examination.examDate
                                  )}
                                </span>
                              </div>
                              <div className="info-row-medical-record">
                                <span className="info-label-medical-record">
                                  Kết quả:
                                </span>
                                <span className="info-value-medical-record">
                                  {selectedRecord.examination.result ||
                                    "Chưa có kết quả"}
                                </span>
                              </div>
                              <div className="info-row-medical-record">
                                <span className="info-label-medical-record">
                                  Chỉ số CD4:
                                </span>
                                <span className="info-value-medical-record">
                                  {selectedRecord.examination.cd4Count !== null
                                    ? `${selectedRecord.examination.cd4Count} tế bào/mm³`
                                    : "Chưa có"}
                                </span>
                              </div>
                              <div className="info-row-medical-record">
                                <span className="info-label-medical-record">
                                  Tải lượng HIV:
                                </span>
                                <span className="info-value-medical-record">
                                  {selectedRecord.examination.hivLoad !== null
                                    ? `${selectedRecord.examination.hivLoad} copies/ml`
                                    : "Chưa có"}
                                </span>
                              </div>
                              <div className="info-row-medical-record">
                                <span className="info-label-medical-record">
                                  Trạng thái:
                                </span>
                                <span
                                  className={`status-badge-medical-record ${selectedRecord.examination.status?.toLowerCase()}`}
                                >
                                  {selectedRecord.examination.status || "N/A"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="no-data-medical-record">
                              Không có thông tin khám bệnh
                            </p>
                          )}
                        </div>
                      )}
                      {activeTab === "arv" && (
                        <div className="arv-detail-medical-record">
                          <h3>Thông tin phác đồ ARV</h3>
                          {selectedRecord.customizedProtocol ? (
                            <div className="protocol-info-medical-record">
                              <div className="protocol-header-medical-record">
                                <h4>
                                  {selectedRecord.customizedProtocol.name ||
                                    "Phác đồ tùy chỉnh"}
                                </h4>
                                <p className="protocol-desc-medical-record">
                                  {selectedRecord.customizedProtocol
                                    .description || "Không có mô tả"}
                                </p>
                                {selectedRecord.customizedProtocol
                                  .baseProtocolName && (
                                  <p className="base-protocol-medical-record">
                                    Dựa trên:{" "}
                                    <strong>
                                      {
                                        selectedRecord.customizedProtocol
                                          .baseProtocolName
                                      }
                                    </strong>
                                  </p>
                                )}
                              </div>
                              <div className="arv-list-medical-record">
                                <h5>Danh sách thuốc ARV:</h5>
                                {selectedRecord.customizedProtocol.arvDetails
                                  ?.length > 0 ? (
                                  <div className="arv-cards-medical-record">
                                    {selectedRecord.customizedProtocol.arvDetails.map(
                                      (arv) => (
                                        <div
                                          key={arv.arvId}
                                          className="arv-card-medical-record"
                                        >
                                          <div className="arv-name-medical-record">
                                            {arv.arvName || "Không tên"}
                                          </div>
                                          <div className="arv-info-medical-record">
                                            <div className="arv-desc-medical-record">
                                              {arv.arvDescription ||
                                                "Không có mô tả"}
                                            </div>
                                            <div className="arv-dosage-medical-record">
                                              <strong>Liều dùng:</strong>{" "}
                                              {arv.dosage || "Chưa xác định"}
                                            </div>
                                            <div className="arv-instruction-medical-record">
                                              <strong>Hướng dẫn:</strong>{" "}
                                              {arv.usageInstruction ||
                                                "Theo chỉ định của bác sĩ"}
                                            </div>
                                            <div className="arv-status-medical-record">
                                              <span
                                                className={`status-badge-medical-record ${arv.status?.toLowerCase()}`}
                                              >
                                                {arv.status || "N/A"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="no-data-medical-record">
                                    Chưa có thuốc ARV nào được chỉ định
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="no-data-medical-record">
                              Không có phác đồ ARV
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Modal>
            )}
          </div>
        );

      case "tests":
        return (
          <div className="info-section-doctor">
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
                  <div key={exam.examId} className="history-item-1">
                    <div className="history-item-header-1">
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
                <p className="no-data-admin">Chưa có kết quả xét nghiệm nào</p>
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
        );

      case "treatment":
        return (
          <div className="info-section-doctor">
            <div className="section-header-no-border">
              <h3>Phác Đồ Điều Trị</h3>
              {!patientHistory?.viewOnly && (
                <button
                  className="btn-add-small"
                  onClick={() => handleViewProtocol(selectedPatient)}
                >
                  📋 Quản lý phác đồ
                </button>
              )}
            </div>
            {currentProtocol ? (
              <div className="current-protocol-display">
                <div className="protocol-info">
                  <h4>Phác đồ hiện tại: {currentProtocol.name}</h4>
                  <p className="protocol-description">
                    {currentProtocol.description}
                  </p>
                  {/* <p className="protocol-status">
                    Trạng thái:{" "}
                    <span className="status-active">
                      {currentProtocol.status}
                    </span>
                  </p> */}
                </div>
                {currentProtocol.details &&
                  currentProtocol.details.length > 0 && (
                    <div className="arv-list-display">
                      <h5>Danh sách thuốc ARV:</h5>
                      <ul className="arv-items">
                        {currentProtocol.details.map((detail, index) => (
                          <li key={index} className="arv-item">
                            <div className="arv-name">{detail.arvName}</div>
                            <div className="arv-dosage">
                              Liều: {detail.dosage}
                            </div>
                            <div className="arv-instruction">
                              Hướng dẫn: {detail.usageInstruction}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <div className="no-protocol-display">
                <p className="no-data-admin">
                  Bệnh nhân chưa có phác đồ điều trị
                </p>
                {!patientHistory?.viewOnly && (
                  <button
                    className="btn-add-small"
                    onClick={() => handleViewProtocol(selectedPatient)}
                  >
                    + Tạo phác đồ đầu tiên
                  </button>
                )}
              </div>
            )}
          </div>
        );

      default:
        return <div>Tab không tồn tại</div>;
    }
  };

  return (
    <div className="container-m">
      <SidebarDoctor active={"Doctor-Patient-Manager"} />
      <div className="main-content-doctor">
        <div className="content-header-admin">
          <h1>Quản Lý Bệnh Nhân</h1>
        </div>
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
        </div>
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
              value={scheduleDate || new Date().toISOString().split("T")[0]}
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
        <Modal
          show={modals.history}
          onClose={() => {
            closeModal("history");
            setActiveTab("info");
          }}
          title={`Hồ Sơ Bệnh Nhân - ${selectedPatient?.fullName}`}
          className="modal-standard"
        >
          <ManagerPatientNavbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="modal-info-body-admin">{renderModalContent()}</div>
        </Modal>
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
            <div className="modal-actions-doctor">
              <button
                type="button"
                className="btn-cancel-doctor"
                onClick={handleExamClose}
              >
                Hủy
              </button>
              <button type="submit" className="btn-save-doctor">
                {examData?.examId ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
        </Modal>
        {isModalOpen && (
          <div className="modal-overlay-ARVProtocol">
            <div className="modal-content-ARVProtocol">
              <div className="modal-header-ARVProtocol">
                <h3>
                  {modalType === "view" &&
                    `Phác đồ của ${selectedPatient?.fullName}`}
                  {modalType === "create" && `Tạo phác đồ mới`}
                  {modalType === "history" && `Lịch sử phác đồ`}
                  {modalType === "select-standard" && `Chọn phác đồ chuẩn`}
                </h3>
                <button
                  className="close-btn-ARVProtocol"
                  onClick={() => {
                    setIsModalOpen(false);
                    setModalType(null);
                    setSelectedStandardProtocol(null);
                    setNewProtocolData({
                      baseProtocolId: null,
                      name: "",
                      description: "",
                      details: [],
                    });
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body-ARVProtocol">
                {modalType === "view" && (
                  <div className="protocol-details-ARVProtocol">
                    {currentProtocol ? (
                      <>
                        <div className="current-protocol-ARVProtocol">
                          <h4>Phác đồ hiện tại</h4>
                          <p>
                            <strong>Tên:</strong> {currentProtocol.name}
                          </p>
                          <p>
                            <strong>Mô tả:</strong>{" "}
                            {currentProtocol.description}
                          </p>
                          <p>
                            <strong>Trạng thái:</strong>{" "}
                            {currentProtocol.status}
                          </p>
                          {currentProtocol.details &&
                            currentProtocol.details.length > 0 && (
                              <>
                                <h5>Danh sách ARV</h5>
                                <ul className="arv-list-ARVProtocol">
                                  {currentProtocol.details.map(
                                    (detail, index) => (
                                      <li key={index}>
                                        {detail.arvName} - {detail.dosage} (
                                        {detail.usageInstruction})
                                      </li>
                                    )
                                  )}
                                </ul>
                              </>
                            )}
                        </div>
                        <div className="action-buttons-ARVProtocol">
                          <button
                            className="btn-history-ARVProtocol"
                            onClick={() => setModalType("history")}
                          >
                            Xem lịch sử
                          </button>
                          <button
                            className="btn-switch-ARVProtocol"
                            onClick={() => setModalType("select-standard")}
                          >
                            Chuyển phác đồ
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="no-protocol-ARVProtocol">
                        <p>Bệnh nhân chưa có phác đồ điều trị</p>
                        <button
                          className="btn-create-ARVProtocol"
                          onClick={() => setModalType("select-standard")}
                        >
                          Tạo phác đồ mới
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {modalType === "select-standard" && (
                  <div className="select-standard-protocol-ARVProtocol">
                    <h4>Chọn phác đồ chuẩn</h4>
                    <div className="form-group-ARVProtocol">
                      <label>Phác đồ chuẩn:</label>
                      <select
                        onChange={(e) =>
                          handleStandardProtocolSelect(parseInt(e.target.value))
                        }
                        value={selectedStandardProtocol?.protocolId || ""}
                      >
                        <option value="">-- Chọn phác đồ --</option>
                        {standardProtocols.map((protocol) => (
                          <option
                            key={protocol.protocolId}
                            value={protocol.protocolId}
                          >
                            {protocol.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedStandardProtocol && (
                      <div className="protocol-preview-ARVProtocol">
                        <h5>Thông tin phác đồ:</h5>
                        <p>
                          <strong>Tên:</strong> {selectedStandardProtocol.name}
                        </p>
                        <p>
                          <strong>Mô tả:</strong>{" "}
                          {selectedStandardProtocol.description}
                        </p>
                        <h5>Danh sách ARV:</h5>
                        {selectedStandardProtocol.details &&
                        selectedStandardProtocol.details.length > 0 ? (
                          <ul className="arv-list-ARVProtocol">
                            {selectedStandardProtocol.details.map(
                              (detail, index) => {
                                const arv = availableARVs.find(
                                  (a) => a.arvId === detail.arvId
                                );
                                return (
                                  <li key={index}>
                                    <div className="arv-info-ARVProtocol">
                                      <span className="arv-name-ARVProtocol">
                                        {arv?.name || `ARV ID: ${detail.arvId}`}
                                      </span>
                                      <span className="arv-dosage-ARVProtocol">
                                        Liều lượng: {detail.dosage}
                                      </span>
                                      <span className="arv-instruction-ARVProtocol">
                                        Hướng dẫn: {detail.usageInstruction}
                                      </span>
                                    </div>
                                  </li>
                                );
                              }
                            )}
                          </ul>
                        ) : (
                          <p>Đang tải danh sách ARV...</p>
                        )}
                        <div className="action-buttons-ARVProtocol">
                          <button
                            className="btn-customize-ARVProtocol"
                            onClick={() => setModalType("create")}
                          >
                            Tùy chỉnh phác đồ
                          </button>
                          <button
                            className="btn-apply-ARVProtocol"
                            onClick={() =>
                              handleUpdateProtocol(
                                selectedStandardProtocol.protocolId,
                                false
                              )
                            }
                            disabled={
                              !selectedStandardProtocol.details ||
                              selectedStandardProtocol.details.length === 0
                            }
                          >
                            Áp dụng nguyên mẫu
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      className="btn-back-ARVProtocol"
                      onClick={() => setModalType("view")}
                    >
                      Quay lại
                    </button>
                  </div>
                )}
                {modalType === "create" && (
                  <div className="create-protocol-ARVProtocol">
                    <h4>Tạo phác đồ mới</h4>
                    {selectedStandardProtocol && (
                      <div className="standard-protocol-info-ARVProtocol">
                        <p>
                          Đang tạo từ phác đồ:{" "}
                          <strong>{selectedStandardProtocol.name}</strong>
                        </p>
                      </div>
                    )}
                    <div className="form-group-ARVProtocol">
                      <label>Tên phác đồ:</label>
                      <input
                        type="text"
                        value={newProtocolData.name}
                        onChange={(e) =>
                          setNewProtocolData({
                            ...newProtocolData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Nhập tên phác đồ"
                      />
                    </div>
                    <div className="form-group-ARVProtocol">
                      <label>Mô tả:</label>
                      <textarea
                        value={newProtocolData.description}
                        onChange={(e) =>
                          setNewProtocolData({
                            ...newProtocolData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Nhập mô tả phác đồ"
                      />
                    </div>
                    <div className="arv-selections-ARVProtocol">
                      <h5>Danh sách thuốc ARV:</h5>
                      <button
                        className="btn-add-arv-ARVProtocol"
                        onClick={() =>
                          setNewProtocolData((prev) => ({
                            ...prev,
                            details: [
                              ...prev.details,
                              {
                                arvId: "",
                                dosage: "",
                                usageInstruction: "",
                                status: "ACTIVE",
                              },
                            ],
                          }))
                        }
                      >
                        + Thêm thuốc
                      </button>
                      {newProtocolData.details.length === 0 ? (
                        <p>Chưa có thuốc ARV nào trong phác đồ</p>
                      ) : (
                        <ul>
                          {newProtocolData.details.map((detail, index) => (
                            <li key={index} className="arv-item-ARVProtocol">
                              <div className="form-group-ARVProtocol">
                                <label>Thuốc ARV:</label>
                                <select
                                  value={detail.arvId || ""}
                                  onChange={(e) => {
                                    const updatedDetails = [
                                      ...newProtocolData.details,
                                    ];
                                    updatedDetails[index].arvId = parseInt(
                                      e.target.value
                                    );
                                    setNewProtocolData({
                                      ...newProtocolData,
                                      details: updatedDetails,
                                    });
                                  }}
                                >
                                  <option value="">-- Chọn thuốc --</option>
                                  {availableARVs.map((arv) => (
                                    <option key={arv.arvId} value={arv.arvId}>
                                      {arv.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group-ARVProtocol">
                                <label>Liều dùng:</label>
                                <input
                                  type="text"
                                  placeholder="VD: 1 viên/ngày"
                                  value={detail.dosage}
                                  onChange={(e) => {
                                    const updatedDetails = [
                                      ...newProtocolData.details,
                                    ];
                                    updatedDetails[index].dosage =
                                      e.target.value;
                                    setNewProtocolData({
                                      ...newProtocolData,
                                      details: updatedDetails,
                                    });
                                  }}
                                />
                              </div>
                              <div className="form-group-ARVProtocol">
                                <label>Hướng dẫn:</label>
                                <input
                                  type="text"
                                  placeholder="VD: Uống buổi sáng"
                                  value={detail.usageInstruction}
                                  onChange={(e) => {
                                    const updatedDetails = [
                                      ...newProtocolData.details,
                                    ];
                                    updatedDetails[index].usageInstruction =
                                      e.target.value;
                                    setNewProtocolData({
                                      ...newProtocolData,
                                      details: updatedDetails,
                                    });
                                  }}
                                />
                              </div>
                              <button
                                className="btn-remove-ARVProtocol"
                                onClick={() => {
                                  const updatedDetails =
                                    newProtocolData.details.filter(
                                      (_, i) => i !== index
                                    );
                                  setNewProtocolData({
                                    ...newProtocolData,
                                    details: updatedDetails,
                                  });
                                }}
                              >
                                Xóa
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="form-actions-ARVProtocol">
                      <button
                        className="btn-cancel-ARVProtocol"
                        onClick={() => {
                          if (selectedStandardProtocol) {
                            setModalType("select-standard");
                          } else {
                            setModalType("view");
                          }
                        }}
                      >
                        Quay lại
                      </button>
                      <button
                        className="btn-submit-ARVProtocol"
                        onClick={handleCreateProtocol}
                        disabled={
                          loading ||
                          !newProtocolData.name ||
                          newProtocolData.details.length === 0
                        }
                      >
                        {loading ? "Đang xử lý..." : "Lưu phác đồ"}
                      </button>
                    </div>
                  </div>
                )}
                {modalType === "history" && (
                  <div className="protocol-history-ARVProtocol">
                    <h4>Lịch sử phác đồ</h4>
                    {protocolHistory && protocolHistory.length > 0 ? (
                      <table className="history-table-ARVProtocol">
                        <thead>
                          <tr>
                            <th>Ngày tạo</th>
                            <th>Tên phác đồ</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {protocolHistory
                            .filter(
                              (protocol) => protocol.baseProtocolId !== null
                            )
                            .map((protocol) => (
                              <tr key={protocol.customProtocolId}>
                                <td>{formatDate(protocol.createdDate)}</td>
                                <td>{protocol.name}</td>
                                <td>{protocol.description}</td>
                                <td>{protocol.status}</td>
                                <td>
                                  {protocol.status !== "ACTIVE" && (
                                    <button
                                      className="btn-activate-ARVProtocol"
                                      onClick={() =>
                                        handleUpdateProtocol(
                                          protocol.customProtocolId,
                                          true
                                        )
                                      }
                                    >
                                      Kích hoạt
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>Chưa có lịch sử phác đồ</p>
                    )}
                    <button
                      className="btn-back-ARVProtocol"
                      onClick={() => setModalType("view")}
                    >
                      Quay lại
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
