import React, { useEffect, useState } from "react";
import { getMedicalRecordsByDoctor } from "../../services/medicalRecordService";
import { tokenManager } from "../../services/account";
import "./MedicalRecordPage.css";
import SidebarProfile from "../../components/SidebarProfile/SidebarProfile";

const DoctorMedicalRecordPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const doctorId = tokenManager.getCurrentUserId();

  useEffect(() => {
    getMedicalRecordsByDoctor(doctorId)
      .then(setRecords)
      .catch((err) => console.error("Failed to fetch doctor records", err))
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <div className="medi-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="medi-management-page">
        <SidebarProfile />
      <div className="medi-content">
        <div className="medi-header">
          <h2 className="medi-title">Hồ sơ bệnh nhân bạn phụ trách</h2>
        </div>
        
        <div className="medi-list">
          {records.length === 0 ? (
            <div className="medi-empty-message">Không có hồ sơ nào.</div>
          ) : (
            records.map((r) => (
              <div key={r.recordId} className="medi-card">
                <div className="medi-main">
                  <h3 className="medi-patient-name">{r.patientName}</h3>
                  <div className="medi-actions">
                    <span className={`medi-status ${r.status?.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
                
                <div className="medi-datetime">
                  <span className="medi-exam-date">{r.examDate}</span>
                  <span className="medi-exam-time">{r.examTime}</span>
                </div>
                
                <div className="medi-summary">
                  {r.summary || <span className="medi-no-summary">Không có ghi chú</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorMedicalRecordPage;