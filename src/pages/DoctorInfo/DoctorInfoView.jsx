import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorInfoService from "../../services/DoctorInfoService";
import "./DoctorInfoView.css";

export default function DoctorInfoView() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await DoctorInfoService.getDoctorsWithUserInfo();
      // Filter only active doctors
      const activeDoctors = data.filter(d => d.status === "ACTIVE");
      setDoctors(activeDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchSearch = 
      doctor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSpecialization = 
      !filterSpecialization || doctor.specialization === filterSpecialization;
    return matchSearch && matchSpecialization;
  });

  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const handleBookAppointment = (doctorId) => {
    navigate(`/appointment?doctorId=${doctorId}`);
  };

  return (
    <div className="doctor-view-container">
      <div className="doctor-view-header">
        <h1>Đội Ngũ Bác Sĩ Chuyên Khoa HIV/AIDS</h1>
        <p>Tìm kiếm và chọn bác sĩ phù hợp với nhu cầu của bạn</p>
      </div>

      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bác sĩ hoặc chuyên khoa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <select 
          className="filter-select"
          value={filterSpecialization}
          onChange={(e) => setFilterSpecialization(e.target.value)}
        >
          <option value="">Tất cả chuyên khoa</option>
          {specializations.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin bác sĩ...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="no-results">
          <p>Không tìm thấy bác sĩ phù hợp</p>
        </div>
      ) : (
        <div className="doctors-grid">
          {filteredDoctors.map(doctor => (
            <div key={doctor.doctorId} className="doctor-card">
              <div className="doctor-card-header">
                <img 
                  src={doctor.doctorAvatar || doctor.userAvatar || "/default-doctor.png"} 
                  alt={doctor.fullName}
                  className="doctor-photo"
                />
                <div className="doctor-basic-info">
                  <h3>{doctor.fullName}</h3>
                  <p className="degree">{doctor.degree || "Bác sĩ"}</p>
                  <p className="specialization">
                    <span className="icon">🏥</span>
                    {doctor.specialization || "Đa khoa"}
                  </p>
                </div>
              </div>
              
              <div className="doctor-details">
                <div className="detail-item">
                  <span className="icon">📧</span>
                  <span>{doctor.email}</span>
                </div>
                <div className="detail-item">
                  <span className="icon">📞</span>
                  <span>{doctor.phone || "Đang cập nhật"}</span>
                </div>
                <div className="detail-item">
                  <span className="icon">⏰</span>
                  <span>
                    {doctor.experienceYears 
                      ? `${doctor.experienceYears} năm kinh nghiệm` 
                      : "Đang cập nhật"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="icon">👤</span>
                  <span>Giới tính: {doctor.gender || "Đang cập nhật"}</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-view-detail"
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  Xem chi tiết
                </button>
                <button 
                  className="btn-book"
                  onClick={() => handleBookAppointment(doctor.doctorId)}
                >
                  Đặt lịch khám
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="modal-detail" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedDoctor(null)}>×</button>
            
            <div className="modal-header-detail">
              <img 
                src={selectedDoctor.doctorAvatar || selectedDoctor.userAvatar || "/default-doctor.png"} 
                alt={selectedDoctor.fullName}
                className="doctor-photo-large"
              />
              <div className="doctor-info-detail">
                <h2>{selectedDoctor.fullName}</h2>
                <p className="degree-large">{selectedDoctor.degree || "Bác sĩ"}</p>
                <p className="specialization-large">
                  {selectedDoctor.specialization || "Đa khoa"}
                </p>
              </div>
            </div>

            <div className="modal-body-detail">
              <h3>Thông tin liên hệ</h3>
              <div className="contact-info">
                <p><strong>Email:</strong> {selectedDoctor.email}</p>
                <p><strong>Điện thoại:</strong> {selectedDoctor.phone || "Đang cập nhật"}</p>
                <p><strong>Giới tính:</strong> {selectedDoctor.gender || "Đang cập nhật"}</p>
              </div>

              <h3>Kinh nghiệm làm việc</h3>
              <p>
                {selectedDoctor.experienceYears 
                  ? `${selectedDoctor.experienceYears} năm kinh nghiệm trong lĩnh vực ${selectedDoctor.specialization || "Y khoa"}`
                  : "Thông tin đang được cập nhật"}
              </p>

              <div className="modal-actions">
                <button 
                  className="btn-book-modal"
                  onClick={() => handleBookAppointment(selectedDoctor.doctorId)}
                >
                  Đặt lịch khám ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}