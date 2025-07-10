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
    if (location.pathname === "/Docter-MedicalRecord") return "medical";
    if (location.pathname === "/Blog-Management") return "blog";
    // if (location.pathname === "/Doctor-Patient-Management")
    //   return "patient-management";
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
      <Link
        to={userRole === "Doctor" ? "/Docter-MedicalRecord" : "/Patient-MedicalRecord"}
        className={`sidebar-link ${activeItem === "medical" ? "active" : ""}`}
      >
        Hồ sơ bệnh án
      </Link>
      <Link
        to={userRole === "Doctor" ? "/Doctor-Appointment-History" : "/Appointment-History"}
        className={`sidebar-link ${
          activeItem === "consultation" ? "active" : ""
        }`}
      >
        Lịch tư vấn
      </Link>
      <Link
        to="/Blog-Management"
        className={`sidebar-link ${activeItem === "blog" ? "active" : ""}`}
      >
        Quản lý bài viết
      </Link>
      {/* Chỉ hiển thị cho Doctor */}
      {/* {userRole === "Doctor" && (
        <Link
          to="/Doctor-Patient-Management"
          className={`sidebar-link ${
            activeItem === "patient-management" ? "active" : ""
          }`}
        >
          Quản lý bệnh nhân
        </Link>
      )} */}
    </aside>
  );
};

export default SidebarProfile;
