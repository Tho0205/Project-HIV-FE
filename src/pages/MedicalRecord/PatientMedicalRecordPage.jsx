import { useEffect, useState } from "react";
import { getMedicalRecordsByPatient, getMedicalRecordDetail } from "../../services/medicalRecordService";
import { tokenManager } from "../../services/account";
import "./MedicalRecordPage.css";
import SidebarProfile from "../../components/SidebarProfile/SidebarProfile";

const PatientMedicalRecordPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("examination");
  const patientId = tokenManager.getCurrentUserId();

  useEffect(() => {
    getMedicalRecordsByPatient(patientId)
      .then(setRecords)
      .catch((err) => console.error("Failed to fetch patient records", err))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleViewDetail = async (recordId) => {
    setDetailLoading(true);
    try {
      const detail = await getMedicalRecordDetail(recordId);
      setSelectedRecord(detail);
    } catch (err) {
      console.error("Failed to fetch detail", err);
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

  if (loading) return <div className="medi-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="container">
      <SidebarProfile />
      <div className="medi-content">
        <div className="medi-header">
          <h2 className="medi-title">Hồ sơ bệnh án của bạn</h2>
        </div>

        <div className="medi-list">
          {!records || records.length === 0 ? (
            <div className="medi-empty-message">Không có hồ sơ nào.</div>
          ) : (
            records.map((r) => (
              <div key={r.recordId} className="medi-card">
                <div className="medi-main">
                  <div>
                    <h3 className="medi-patient-name">Bác sĩ: {r.doctorName}</h3>
                    <div className="medi-datetime">
                      <span className="medi-exam-date">{formatDate(r.examDate)}</span>
                      <span className="medi-exam-time">{formatTime(r.examTime)}</span>
                    </div>
                  </div>
                  <div className="medi-actions">
                    <span className={`medi-status ${r.status?.toLowerCase()}`}>
                      {r.status}
                    </span>
                    <button
                      className="medi-detail-button"
                      onClick={() => handleViewDetail(r.recordId)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>

                <div className="medi-summary">
                  {r.summary || (
                    <span className="medi-no-summary">Không có ghi chú</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal chi tiết */}
      {selectedRecord && (
        <div className="record-detail-modal" onClick={closeModal}>
          <div className="record-detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h2>Chi tiết hồ sơ bệnh án</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>

            <div className="detail-tabs">
              <button
                className={`tab-button ${activeTab === "examination" ? "active" : ""}`}
                onClick={() => setActiveTab("examination")}
              >
                Thông tin khám bệnh
              </button>
              <button
                className={`tab-button ${activeTab === "arv" ? "active" : ""}`}
                onClick={() => setActiveTab("arv")}
              >
                Phác đồ ARV
              </button>
            </div>

            <div className="detail-body">
              {detailLoading ? (
                <div className="detail-loading">Đang tải thông tin...</div>
              ) : (
                <>
                  {activeTab === "examination" && (
                    <div className="examination-detail">
                      <h3>Thông tin khám bệnh</h3>
                      {selectedRecord.examination ? (
                        <div className="detail-info">
                          <div className="info-row">
                            <span className="info-label">Mã khám:</span>
                            <span className="info-value">{selectedRecord.examination.examId}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Ngày khám:</span>
                            <span className="info-value">
                              {formatDate(selectedRecord.examination.examDate)}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Kết quả:</span>
                            <span className="info-value">
                              {selectedRecord.examination.result || "Chưa có kết quả"}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Chỉ số CD4:</span>
                            <span className="info-value">
                              {selectedRecord.examination.cd4Count !== null
                                ? `${selectedRecord.examination.cd4Count} tế bào/mm³`
                                : "Chưa có"}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Tải lượng HIV:</span>
                            <span className="info-value">
                              {selectedRecord.examination.hivLoad !== null
                                ? `${selectedRecord.examination.hivLoad} copies/ml`
                                : "Chưa có"}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Trạng thái:</span>
                            <span className={`status-badge ${selectedRecord.examination.status?.toLowerCase()}`}>
                              {selectedRecord.examination.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="no-data">Không có thông tin khám bệnh</p>
                      )}
                    </div>
                  )}

                  {activeTab === "arv" && (
                    <div className="arv-detail">
                      <h3>Thông tin phác đồ ARV</h3>
                      {selectedRecord.customizedProtocol ? (
                        <div className="protocol-info">
                          <div className="protocol-header">
                            <h4>{selectedRecord.customizedProtocol.name || "Phác đồ tùy chỉnh"}</h4>
                            <p className="protocol-desc">
                              {selectedRecord.customizedProtocol.description || "Không có mô tả"}
                            </p>
                            {selectedRecord.customizedProtocol.baseProtocolName && (
                              <p className="base-protocol">
                                Dựa trên: <strong>{selectedRecord.customizedProtocol.baseProtocolName}</strong>
                              </p>
                            )}
                          </div>

                          <div className="arv-list">
                            <h5>Danh sách thuốc ARV:</h5>
                            {selectedRecord.customizedProtocol.arvDetails?.length > 0 ? (
                              <div className="arv-cards">
                                {selectedRecord.customizedProtocol.arvDetails.map((arv) => (
                                  <div key={arv.arvId} className="arv-card">
                                    <div className="arv-name">{arv.arvName || "Không tên"}</div>
                                    <div className="arv-info">
                                      <div className="arv-desc">
                                        {arv.arvDescription || "Không có mô tả"}
                                      </div>
                                      <div className="arv-dosage">
                                        <strong>Liều dùng:</strong> {arv.dosage || "Chưa xác định"}
                                      </div>
                                      <div className="arv-instruction">
                                        <strong>Hướng dẫn:</strong>{" "}
                                        {arv.usageInstruction || "Theo chỉ định của bác sĩ"}
                                      </div>
                                      <div className="arv-status">
                                        <span className={`status-badge ${arv.status?.toLowerCase()}`}>
                                          {arv.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-data">Chưa có thuốc ARV nào được chỉ định</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="no-data">Không có phác đồ ARV</p>
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
  );
};

export default PatientMedicalRecordPage;