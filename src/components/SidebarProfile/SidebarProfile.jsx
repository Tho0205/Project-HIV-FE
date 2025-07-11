import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./SidebarProfile.css";
import { tokenManager } from "../../services/account";

const SidebarProfile = () => {
  const location = useLocation();
  const userRole = tokenManager.getCurrentUserRole();

  // Xác định active item dựa trên pathname
  const getActiveItem = () => {
    if (location.pathname === "/Profile-Patient") return "general";
    if (location.pathname === "/Docter-MedicalRecord" || location.pathname === "/Patient-MedicalRecord") return "medical";
    if (location.pathname === "/Blog-Management") return "blog";
    if (location.pathname === "/Appointment-History") return "consultation";
    return "";
  };

  const activeItem = getActiveItem();

  return (
    <aside className="sidebar-profile">
      <Link
        to="/Profile-Patient"
        className={`sidebar-link ${activeItem === "general" ? "active" : ""}`}
      >
        Thông tin chung
      </Link>
      
      {/* Hiển thị Hồ sơ bệnh án cho tất cả NGOẠI TRỪ Doctor */}
      {userRole !== "Doctor" && (
        <Link
          to="/Patient-MedicalRecord"
          className={`sidebar-link ${activeItem === "medical" ? "active" : ""}`}
        >
          Hồ sơ bệnh án
        </Link>
      )}
      
      {/* Hiển thị Lịch tư vấn cho tất cả NGOẠI TRỪ Doctor */}
      {userRole !== "Doctor" && (
        <Link
          to="/Appointment-History"
          className={`sidebar-link ${
            activeItem === "consultation" ? "active" : ""
          }`}
        >
          Lịch tư vấn
        </Link>
      )}
      
      <Link
        to="/Blog-Management"
        className={`sidebar-link ${activeItem === "blog" ? "active" : ""}`}
      >
        Quản lý bài viết
      </Link>
    </aside>
  );
};

export default SidebarProfile;