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
        <div className="welcome">Chào mừng quản trị viên</div>
        <ul className="nav">
          <Link
            to="/Admin-AccountManagement"
            style={{ textDecoration: "none" }}
          >
            <li className={active === "account" ? "active" : ""}>
              <span className="icon">👤</span>
              <span>Quản Lý Tài Khoản</span>
            </li>
          </Link>
        </ul>
      </div>
      <div className="sidebar-bottom">
        <div className="help">❔ Trợ giúp</div>
        <div className="logout">
          <button onClick={logout}>🚪 Đăng xuất</button>
        </div>
      </div>
    </aside>
  );
}