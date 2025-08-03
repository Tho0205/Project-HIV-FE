import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Sidebar.css";
import { toast } from "react-toastify";

export default function SidebarAdmin({ active }) {
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
            <div className="welcome">Chào Mừng Bác Sĩ</div>
            <ul className="nav">
              <li className={active === "static" ? "active" : ""}>
                <Link to="/Doctor-Patient-Management">
                  <span>Quản Lý Bệnh Nhân</span>
                </Link>
              </li>
              <li className={active === "blog" ? "active" : ""}>
                <Link to="/Protocol-management">
                  <span>Quản Lý Phác đồ</span>
                </Link>
              </li>
              <li className={active === "appointment" ? "active" : ""}>
                <Link to="/Doctor-Appointment-History">
                  <span>Lịch tư vấn</span>
                </Link>
              </li>
              <li className={active === "appointment" ? "active" : ""}>
                <Link to="/Doctor-MedicalRecord">
                  <span>Hồ Sơ Bệnh Án</span>
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
