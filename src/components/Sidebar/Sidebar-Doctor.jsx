import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Sidebar.css";
import { toast } from "react-toastify";

export default function SidebarAdmin({ active }) {
  const navigate = useNavigate();

  function logout() {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
    toast.success("Đăng xuất thành công", { autoClose: 1000 });
  }

  return (
    <aside
      className="sidebar"
      style={{
        background: "none",
        borderRight: "2px solid rgba(0, 0, 0, 0.05);",
        boxShadow: "none",
      }}
    >
      <div className="sidebar-top">
        <div className="welcome" style={{ fontSize: "20px" }}>
          Dashboard
        </div>
        <ul className="nav">
          <Link
            to="/Doctor-Patient-Management"
            style={{ textDecoration: "none" }}
          >
            <li className={active === "Doctor-Patient-Manager" ? "active" : ""}>
              <span className="icon">👤</span>
              <span>Quản Lý Bệnh Nhân</span>
            </li>
          </Link>
          <Link to="/Protocol-management" style={{ textDecoration: "none" }}>
            <li className={active === "Protocol-Manager" ? "active" : ""}>
              <span className="icon">👤</span>
              <span>Quản Lý Phác đồ</span>
            </li>
          </Link>
          <Link to="/Doctor-MedicalRecord" style={{ textDecoration: "none" }}>
            <li className={active === "Doctor-MedicalRecord" ? "active" : ""}>
              <span className="icon">👤</span>
              <span>Hồ sơ bệnh án</span>
            </li>
          </Link>
          <Link to="/Appointment-History" style={{ textDecoration: "none" }}>
            <li className={active === "Appointment-History" ? "active" : ""}>
              <span className="icon">👤</span>
              <span>Lịch tư vấn</span>
            </li>
          </Link>
        </ul>
      </div>
    </aside>
  );
}
