import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./nav-bar.css"; // css

const Header = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState(localStorage.getItem("role"));
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    // Cập nhật avatar khi component mount
    const storedAvatar = localStorage.getItem("user_avatar");
    if (storedAvatar) {
      setAvatarUrl(`${storedAvatar}?t=${new Date().getTime()}`);
    } else {
      setAvatarUrl("/assets/image/patient/patient.png");
    }
  }, []);

  const Logout = () => {
    sessionStorage.clear();
    localStorage.clear();
    setRole(null);
    navigate("/");
  };

  return (
    <header className="custom-header">
      <div className="logo">
        <Link to="/">Logo HIV</Link>
      </div>

      <nav className="nav-links">
        <Link to="/">Trang Chủ</Link>
        <a href="/Pages/ViewPage/BookingPage.html">Đặt Lịch Hẹn</a>
        <Link to="/blog">Blog</Link>
        <a href="/Pages/ViewPage/ResourcesPage.html">Tài Liệu Giáo Dục</a>
      </nav>

      <div className="header-buttons">
        <span className="lang-switch">🌐</span>

        {/* Booking Now button - luôn hiển thị */}
        <button className="btn-outline">Booking Now</button>

        {/* Conditional Buttons */}
        {!role ? (
          <button
            className="btn-primary login"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        ) : (
          <>
            <button className="btn-primary logout" onClick={Logout}>
              Logout
            </button>
            <button
              className="avatar-btn profile"
              onClick={() => navigate("/Profile-Patient")}
            >
              <img src={avatarUrl} alt="Avatar" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
