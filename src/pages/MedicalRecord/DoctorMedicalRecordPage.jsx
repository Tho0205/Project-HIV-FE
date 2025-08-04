import React, { useEffect, useState } from "react";
import {
  getDoctorPatients,
  getPatientRecordsForDoctor,
  getMedicalRecordDetail,
} from "../../services/medicalRecordService";
import { tokenManager } from "../../services/account";
import "./MedicalRecordDoctor.css";
import SidebarDoctor from "../../components/Sidebar/Sidebar-Doctor";
import { toast } from "react-toastify";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Đã xảy ra lỗi khi tải trang hồ sơ bệnh án.</div>;
    }
    return this.props.children;
  }
}

const DoctorMedicalRecordPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientRecords, setSelectedPatientRecords] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("examination");
  const [view, setView] = useState("patients");
  const doctorId = tokenManager.getCurrentUserId();

  useEffect(() => {
    if (!doctorId) {
      toast.error("Vui lòng đăng nhập");
      window.location.href = "/login";
      return;
    }
    loadDoctorPatients();
  }, [doctorId]);

  const loadDoctorPatients = async () => {
    setLoading(true);
    try {
      const patientsData = await getDoctorPatients(doctorId);
      setPatients(patientsData || []);
    } catch (err) {
      console.error("Failed to fetch doctor patients", err);
      toast.error("Không thể tải danh sách bệnh nhân.");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = async (patient) => {
    setSelectedPatient(patient);
    setRecordsLoading(true);
    setView("records");
    try {
      const records = await getPatientRecordsForDoctor(
        doctorId,
        patient.patientId
      );
      setSelectedPatientRecords(records || []);
    } catch (err) {
      console.error("Failed to fetch patient records", err);
      toast.error("Không thể tải hồ sơ bệnh án.");
      setSelectedPatientRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleBackToPatients = () => {
    setView("patients");
    setSelectedPatient(null);
    setSelectedPatientRecords([]);
  };

  const handleViewDetail = async (recordId) => {
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

  const closeModal = () => {
    setSelectedRecord(null);
    setActiveTab("examination");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Không có";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return "N/A";
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    return age;
  };

  if (loading)
    return (
      <div className="medi-loading-medical-record">Đang tải dữ liệu...</div>
    );

  return (
    <ErrorBoundary>
      <div className="medi-management-page-medical-record">
        <SidebarDoctor active="Doctor-MedicalRecord" />
        <div className="medi-content-medical-record">
          <div className="medi-header-medical-record">
            {view === "patients" ? (
              <h2 className="medi-title-medical-record">
                Danh sách bệnh nhân bạn phụ trách
              </h2>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <button
                  onClick={handleBackToPatients}
                  className="medi-back-button-medical-record"
                >
                  ← Quay lại
                </button>
                <h2 className="medi-title-medical-record">
                  Hồ sơ bệnh án -{" "}
                  {selectedPatient?.patientName || "Không có tên"}
                </h2>
              </div>
            )}
          </div>

          {view === "patients" ? (
            <div className="medi-list-medical-record">
              {patients.length === 0 ? (
                <div className="medi-empty-message-medical-record">
                  Không có bệnh nhân nào với appointment đã check-in.
                </div>
              ) : (
                patients.map((patient) => (
                  <div
                    key={patient.patientId}
                    className="medi-patient-card-medical-record"
                    onClick={() => handlePatientClick(patient)}
                  >
                    <div className="patient-main-info-medical-record">
                      <div className="patient-basic-medical-record">
                        <h3 className="patient-name-medical-record">
                          {patient.patientName || "Không có tên"}
                        </h3>
                        <div className="patient-details-medical-record">
                          <span className="patient-age-medical-record">
                            {calculateAge(patient.birthdate)} tuổi
                          </span>
                          <span className="patient-gender-medical-record">
                            {patient.gender || "N/A"}
                          </span>
                          {patient.phone && (
                            <span className="patient-phone-medical-record">
                              {patient.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="patient-stats-medical-record">
                        <div className="stat-item-medical-record">
                          <span className="stat-label-medical-record">
                            Tổng hồ sơ:
                          </span>
                          <span className="stat-value-medical-record">
                            {patient.totalMedicalRecords || 0}
                          </span>
                        </div>
                        <div className="stat-item-medical-record">
                          <span className="stat-label-medical-record">
                            Lần khám gần nhất:
                          </span>
                          <span className="stat-value-medical-record">
                            {formatDate(patient.lastAppointmentDate) ||
                              "Không có"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="patient-action-medical-record">
                      <span className="view-records-hint-medical-record">
                        Xem hồ sơ →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="medi-list-medical-record">
              {recordsLoading ? (
                <div className="medi-loading-medical-record">
                  Đang tải hồ sơ bệnh án...
                </div>
              ) : selectedPatientRecords.length === 0 ? (
                <div className="medi-empty-message-medical-record">
                  Bệnh nhân này chưa có hồ sơ bệnh án nào.
                </div>
              ) : (
                selectedPatientRecords.map((record) => (
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
                          onClick={() => handleViewDetail(record.recordId)}
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
                ))
              )}
            </div>
          )}
        </div>

        {selectedRecord && (
          <div
            className="record-detail-modal-medical-record"
            onClick={closeModal}
          >
            <div
              className="record-detail-content-medical-record"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="detail-header-medical-record">
                <h2>Chi tiết hồ sơ bệnh án</h2>
                <button
                  className="close-button-medical-record"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

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
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default DoctorMedicalRecordPage;
