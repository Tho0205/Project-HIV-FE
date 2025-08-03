import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar-Doctor-Manager-Patient.css";

export default function ManagerPatientNavbar() {
  const location = useLocation();

  const navItems = [
    { path: "/patient/info", label: "Thông tin bệnh nhân" },
    { path: "/patient/appointments", label: "Lịch hẹn khám" },
    { path: "/patient/tests", label: "Kết quả xét nghiệm" },
    { path: "/patient/treatment", label: "Phác đồ điều trị" },
  ];

  return (
    <nav className="manager-patient-navbar">
      <ul>
        {navItems.map((item, index) => (
          <li
            key={index}
            className={location.pathname === item.path ? "active" : ""}
          >
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
