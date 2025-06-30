import { useState, useEffect } from "react";
import { getDotorInfo } from "../../services/doctorInfo";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const doctorData = await getDotorInfo();
        console.log("11233" + doctorData.doctorName);
        if (doctorData) {
          setDoctors(doctorData);
        } else {
          setError("Không thể tải thông tin bác sĩ");
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu bác sĩ");
        console.error("Error loading doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Hàm helper để chuyển đổi specialization sang tiếng Việt
  const getVietnameseSpecialization = (specialization) => {
    const specializationMap = {
      "Infectious Diseases": "Chuyên khoa Nhiễm khuẩn",
      "HIV/AIDS": "Chuyên khoa HIV/AIDS",
      Psychology: "Tâm lý học Y khoa",
      Nutrition: "Dinh dưỡng HIV",
      "Internal Medicine": "Nội khoa",
      Immunology: "Miễn dịch học",
    };
    return specializationMap[specialization] || specialization;
  };

  // Hàm helper để tạo placeholder avatar
  const getAvatarUrl = (doctorAvatar, doctorId) => {
    if (doctorAvatar) {
      return doctorAvatar;
    }
    return `/placeholder.svg?height=200&width=200&text=BS${doctorId}`;
  };

  return (
    <div className="hiv-home-container">
      {/* Hero Section */}
      <section className="hiv-hero-section">
        <div className="hiv-hero-content">
          <div className="hiv-hero-text">
            <h1 className="hiv-hero-title">
              Tư Vấn & Điều Trị HIV
              <span className="hiv-highlight"> An Toàn & Bảo Mật</span>
            </h1>
            <p className="hiv-hero-description">
              Dịch vụ tư vấn chuyên nghiệp 24/7 với đội ngũ bác sĩ giàu kinh
              nghiệm. Chúng tôi cam kết bảo mật thông tin và hỗ trợ bạn trong
              hành trình chăm sóc sức khỏe.
            </p>
            <div className="hiv-hero-buttons">
              <Link to="/appointment">
                <button className="hiv-btn-primary">
                  <svg
                    className="hiv-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 ..." />
                  </svg>
                  Tư vấn ngay
                </button>
              </Link>
            </div>
          </div>
          <div className="hiv-hero-image">
            <div className="hiv-floating-card">
              <div className="hiv-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z" />
                </svg>
              </div>
              <div className="hiv-card-content">
                <h3>Bảo Mật 100%</h3>
                <p>Thông tin được mã hóa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="hiv-services-section">
        <div className="hiv-container">
          <h2 className="hiv-section-title">Dịch Vụ Của Chúng Tôi</h2>
          <div className="hiv-services-grid">
            <div className="hiv-service-card">
              <div className="hiv-service-icon hiv-video">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <h3>Đặt lịch và tư vấn trực tiếp</h3>
              <p>Tư vấn trực tiếp với bác sĩ chuyên khoa HIV/AIDS</p>
            </div>
            <div className="hiv-service-card">
              <div className="hiv-service-icon hiv-chat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>Chat Trực Tuyến</h3>
              <p>Nhắn tin bảo mật với đội ngũ y tế 24/7</p>
            </div>
            <div className="hiv-service-card">
              <div className="hiv-service-icon hiv-support">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Hỗ Trợ Tâm Lý</h3>
              <p>Tư vấn tâm lý và hỗ trợ tinh thần trong quá trình điều trị</p>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="hiv-doctors-section">
        <div className="hiv-container">
          <h2 className="hiv-section-title">Đội Ngũ Bác Sĩ Chuyên Khoa</h2>
          <p className="hiv-section-subtitle">
            Các chuyên gia hàng đầu trong lĩnh vực HIV/AIDS và các bệnh nhiễm
            khuẩn
          </p>

          {loading && (
            <div className="hiv-loading-container">
              <div className="hiv-loading-spinner"></div>
              <p>Đang tải thông tin bác sĩ...</p>
            </div>
          )}

          {error && (
            <div className="hiv-error-container">
              <p className="hiv-error-message">{error}</p>
              <button
                className="hiv-retry-btn"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && doctors.length === 0 && (
            <div className="hiv-no-data-container">
              <p>Hiện tại chưa có thông tin bác sĩ</p>
            </div>
          )}

          {!loading && !error && doctors.length > 0 && (
            <div className="hiv-doctors-grid">
              {doctors.map((doctor) => (
                <div className="hiv-doctor-card" key={doctor.doctorId}>
                  <div className="hiv-doctor-image">
                    <img
                      src={
                        getAvatarUrl(doctor.doctorAvatar, doctor.doctorId) ||
                        "/placeholder.svg"
                      }
                      alt={doctor.doctorName}
                    />
                    <div className="hiv-doctor-status">
                      <span className="hiv-status-dot"></span>
                      {doctor.status === "ACTIVE"
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </div>
                  </div>
                  <div className="hiv-doctor-info">
                    <h3 className="hiv-doctor-name">
                      {doctor.degree} {doctor.doctorName}
                    </h3>
                    <p className="hiv-doctor-specialty">
                      {getVietnameseSpecialization(doctor.specialization)}
                    </p>
                    <p className="hiv-doctor-experience">
                      {doctor.experienceYears} năm kinh nghiệm
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="hiv-features-section">
        <div className="hiv-container">
          <div className="hiv-features-content">
            <div className="hiv-features-text">
              <h2>Tại Sao Chọn Chúng Tôi?</h2>
              <div className="hiv-features-list">
                <div className="hiv-feature-item">
                  <div className="hiv-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <div>
                    <h4>Bảo Mật Tuyệt Đối</h4>
                    <p>Thông tin cá nhân được mã hóa và bảo vệ nghiêm ngặt</p>
                  </div>
                </div>
                <div className="hiv-feature-item">
                  <div className="hiv-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                  </div>
                  <div>
                    <h4>Hỗ Trợ 24/7</h4>
                    <p>Luôn sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi</p>
                  </div>
                </div>
                <div className="hiv-feature-item">
                  <div className="hiv-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <h4>Chuyên Nghiệp</h4>
                    <p>
                      Đội ngũ bác sĩ giàu kinh nghiệm và được đào tạo bài bản
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hiv-features-image">
              <div className="hiv-stats-card">
                <div className="hiv-stat">
                  <span className="hiv-stat-number">
                    {doctors.length > 0 ? `${doctors.length}+` : "10+"}
                  </span>
                  <span className="hiv-stat-label">Bác sĩ chuyên khoa</span>
                </div>
                <div className="hiv-stat">
                  <span className="hiv-stat-number">24/7</span>
                  <span className="hiv-stat-label">Hỗ trợ trực tuyến</span>
                </div>
                <div className="hiv-stat">
                  <span className="hiv-stat-number">
                    {doctors.length > 0
                      ? `${Math.max(...doctors.map((d) => d.experienceYears))}+`
                      : "15+"}
                  </span>
                  <span className="hiv-stat-label">Năm kinh nghiệm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hiv-cta-section">
        <div className="hiv-container">
          <div className="hiv-cta-content">
            <h2>Bắt Đầu Hành Trình Chăm Sóc Sức Khỏe</h2>
            <p>
              Đừng để lo lắng cản trở bạn. Hãy liên hệ với chúng tôi ngay hôm
              nay để được tư vấn miễn phí.
            </p>
            <div className="hiv-cta-buttons">
              <Link to="/appointment" className="hiv-btn-primary hiv-large">
                Đặt Lịch Tư Vấn
              </Link>

              <Link to="/blog" className="hiv-btn-outline hiv-large">
                Các bài viết liên quan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
