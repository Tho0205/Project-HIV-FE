import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarProfile.css';

const SidebarProfile = () => {
  const location = useLocation();
  
  // Xác định active item dựa trên pathname
  const getActiveItem = () => {
    if (location.pathname === '/Profile-Patient') return 'general';
    if (location.pathname === '/Blog-Management') return 'blog';
    return '';
  };

  const activeItem = getActiveItem();

  return (
    <aside className="sidebar-profile">
      <Link 
        to="/Profile-Patient" 
        className={`sidebar-link ${activeItem === 'general' ? 'active' : ''}`}
      >
        Thông tin chung
      </Link>
      <Link 
        to="#" 
        className={`sidebar-link ${activeItem === 'consultation' ? 'active' : ''}`}
      >
        Lịch tư vấn
      </Link>
      <Link 
        to="#" 
        className={`sidebar-link ${activeItem === 'documents' ? 'active' : ''}`}
      >
        Tài liệu
      </Link>
      <Link 
        to="/Blog-Management" 
        className={`sidebar-link ${activeItem === 'blog' ? 'active' : ''}`}
      >
        Quản lý bài viết
      </Link>
    </aside>
  );
};

export default SidebarProfile;