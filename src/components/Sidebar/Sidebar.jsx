import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Sidebar.css"; // Sẽ tạo file css riêng cho sidebar
import { toast } from "react-toastify";

export default function Sidebar({ active }) {
  const navigate = useNavigate();
  function logout() {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
    toast.success("Logout Successfully", { autoClose: 1000 });
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo">Logo HIV</div>
        <div className="welcome">Welcome Staff</div>
        <ul className="nav">
          <li className={active === "blog" ? "active" : ""}>
            <Link to="/Staff-Blog">
              <span className="icon">📝</span>
              <span> Quản Lí Bài Viết</span>
            </Link>
          </li>
          <li className={active === "calendar" ? "active" : ""}>
            <Link to="#">
              <span className="icon">📅</span>
              <span>Quản Lí Lịch Đặt Khám</span>
            </Link>
          </li>
          <li className={active === "patient" ? "active" : ""}>
            <Link to="/Staff-ManagerPatient">
              <span className="icon">👤</span>
              <span>Quản Lí Thông Tin KH</span>
            </Link>
          </li>
          <li className={active === "consult" ? "active" : ""}>
            <span className="icon">📋</span>
            <span>Quản Lí DS Tư Vấn Đã Đặt</span>
          </li>
          <li className={active === "result" ? "active" : ""}>
            <span className="icon">🧪</span>
            <Link to="/HIV-ExaminationManagement">
              <span>Quản Lí Kết Quả Xét Nghiệm</span>
            </Link>
          </li>
          <li className={active === "arv" ? "active" : ""}>
            <Link to="/arv">
              <span className="icon">🧪</span>
              <span>Quản Lí ARV</span>
            </Link>
          </li>
          <li className={active === "arv-protocol" ? "active" : ""}>
            <Link to="/arv-protocol">
              <span className="icon">🧪</span>
              <span>Quản Lí ARV Protocol</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-bottom">
        <div className="help">❔ Help</div>
        <div className="logout">
          <button onClick={logout}>🚪 Logout</button>
        </div>
      </div>
    </aside>
  );
}
