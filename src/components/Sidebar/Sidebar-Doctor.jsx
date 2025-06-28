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
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">Logo HIV</div>
        <div className="welcome">Chào mừng Bác Sĩ</div>
        <ul className="nav">
          <Link
            to="/Doctor-Patient-Management"
            style={{ textDecoration: "none" }}
          >
            <li className={active === "account" ? "active" : ""}>
              <span className="icon">👤</span>
              <span>Quản Lý Bệnh Nhân</span>
            </li>
          </Link>
        </ul>
      </div>
    </aside>
  );
}
