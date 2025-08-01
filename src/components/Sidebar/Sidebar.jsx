import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Sidebar.css";
import { toast } from "react-toastify";

export default function Sidebar({ active }) {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  function logout() {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
    toast.success("Đăng xuất thành công", { autoClose: 1000 });
  }

  return (
    <aside className={`sidebar${isOpen ? " open" : " closed"}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Đóng menu" : "Mở menu"}
      >
        <span role="img" aria-label={isOpen ? "close" : "menu"}>
          {isOpen ? "✖" : "☰"}
        </span>
      </button>
      {isOpen && (
        <>
          <div className="sidebar-top">
            <div className="logo">
              <img
                src="/assets/image/Logo/LogoHIV.jpg"
                width={"120px"}
                height={"90px"}
                alt="Logo"
              />
            </div>
            <div className="welcome">Chào Mừng Nhân Viên</div>
            <ul className="nav">
              <li className={active === "static" ? "active" : ""}>
                <Link to="/DashBoard">
                  <span className="icon">📈</span>
                  <span> Thống kê</span>
                </Link>
              </li>
              <li className={active === "blog" ? "active" : ""}>
                <Link to="/Staff-Blog">
                  <span className="icon">📝</span>
                  <span> Quản Lí Bài Viết</span>
                </Link>
              </li>
              <li className={active === "appointment" ? "active" : ""}>
                <Link to="/Appointment-Management">
                  <span className="icon">📅</span>
                  <span>Xác Nhận Lịch Hẹn</span>
                </Link>
              </li>
              {/* NEW: Check-in/Check-out Menu Item */}
              <li className={active === "checkin-checkout" ? "active" : ""}>
                <Link to="/Staff-CheckinCheckout">
                  <span className="icon">✅</span>
                  <span>Check-in/Check-out</span>
                </Link>
              </li>
              <li className={active === "doctor-schedule" ? "active" : ""}>
                <Link to="/Staff-DoctorSchedule">
                  <span className="icon">👨‍⚕️</span>
                  <span>Sắp Xếp Lịch Bác Sĩ</span>
                </Link>
              </li>
              <li className={active === "patient" ? "active" : ""}>
                <Link to="/Staff-ManagerPatient">
                  <span className="icon">👤</span>
                  <span>Quản Lí Thông Tin KH</span>
                </Link>
              </li>
              {/* <li className={active === "consult" ? "active" : ""}>
            <Link to="#">
              <span className="icon">📋</span>
              <span>Quản Lí DS Tư Vấn Đã Đặt</span>
            </Link>
          </li> */}
              <li className={active === "result" ? "active" : ""}>
                <Link to="/HIV-ExaminationManagement">
                  <span className="icon">🧪</span>
                  <span>Quản Lí Kết Quả Xét Nghiệm</span>
                </Link>
              </li>
              <li className={active === "arv" ? "active" : ""}>
                <Link to="/arv">
                  <span className="icon">💊</span>
                  <span>Quản Lí ARV</span>
                </Link>
              </li>
              <li className={active === "arv-protocol" ? "active" : ""}>
                <Link to="/arv-protocol">
                  <span className="icon">📋</span>
                  <span>Quản Lí ARV Protocol</span>
                </Link>
              </li>
              <li className={active === "doctor" ? "active" : ""}>
                <Link to="/Staff-DoctorInfo">
                  <span className="icon">👨‍⚕️</span>
                  <span>Quản Lí Thông Tin Bác Sĩ</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className="sidebar-bottom">
            <div className="help">❔ Hỗ trợ</div>
            <div className="logout">
              <button onClick={logout}>🚪 Đăng xuất</button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}