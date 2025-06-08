import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './StaffSidebar.css';

const StaffSidebar = () => {
  const [showSubmenu, setShowSubmenu] = useState(true);
  const location = useLocation();

  const toggleSubmenu = () => {
    setShowSubmenu(!showSubmenu);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="staff-sidebar">
      <div className="sidebar-content">
        <h2 className="sidebar-welcome">Chào Mừng Nhân Viên</h2>
        
        <nav className="sidebar-nav">
          <Link 
            to="/staff/appointments" 
            className={`sidebar-item ${isActive('/staff/appointments') ? 'active' : ''}`}
          >
            <i className="fas fa-calendar-alt"></i>
            <span>Quản Lý Lịch Khám</span>
          </Link>
          
          <Link 
            to="/staff/patients" 
            className={`sidebar-item ${isActive('/staff/patients') ? 'active' : ''}`}
          >
            <i className="fas fa-users"></i>
            <span>Quản Lý Thông Tin</span>
          </Link>
          
          <div className="sidebar-submenu-container">
            <button 
              onClick={toggleSubmenu} 
              className="sidebar-item sidebar-submenu-toggle"
            >
              <div className="sidebar-item-content">
                <i className="fas fa-clipboard-list"></i>
                <span>Quản Lý Danh Sách</span>
              </div>
              <i className={`fas fa-chevron-down chevron ${showSubmenu ? 'rotate' : ''}`}></i>
            </button>
            
            {showSubmenu && (
              <div className="sidebar-submenu">
                <Link 
                  to="/staff/test-results" 
                  className={`sidebar-submenu-item ${isActive('/staff/test-results') ? 'active' : ''}`}
                >
                  <i className="fas fa-flask"></i>
                  <span>Thêm Kết Quả</span>
                </Link>
              </div>
            )}
          </div>
          
          <Link 
            to="/staff/help" 
            className={`sidebar-item ${isActive('/staff/help') ? 'active' : ''}`}
          >
            <i className="fas fa-question-circle"></i>
            <span>Trợ Giúp</span>
          </Link>
        </nav>
        
        <div className="sidebar-footer">
          <Link to="/logout" className="sidebar-item logout">
            <i className="fas fa-sign-out-alt"></i>
            <span>Đăng Xuất</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default StaffSidebar;