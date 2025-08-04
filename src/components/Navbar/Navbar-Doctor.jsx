import React from "react";
import "./Navbar-Doctor-Manager-Patient.css";

export default function ManagerPatientNavbar({ activeTab, onTabChange }) {
  const navItems = [
    { key: "info", label: "Thông tin bệnh nhân" },
    // { key: "appointments", label: "Lịch hẹn khám" },
    { key: "tests", label: "Kết quả xét nghiệm" },
    { key: "treatment", label: "Phác đồ điều trị" },
    { key: "medicalhistorys", label: "Hồ Sơ Bệnh Án" },
  ];

  return (
    <nav className="manager-patient-navbar">
      <ul>
        {navItems.map((item) => (
          <li key={item.key} className={activeTab === item.key ? "active" : ""}>
            <button
              type="button"
              onClick={() => onTabChange(item.key)}
              className="nav-tab-btn"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
