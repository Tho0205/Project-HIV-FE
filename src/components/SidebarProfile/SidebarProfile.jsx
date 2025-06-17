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
        General
      </Link>
      <Link 
        to="#" 
        className={`sidebar-link ${activeItem === 'consultation' ? 'active' : ''}`}
      >
        Consultation History
      </Link>
      <Link 
        to="#" 
        className={`sidebar-link ${activeItem === 'documents' ? 'active' : ''}`}
      >
        Patient Documents
      </Link>
      <Link 
        to="/Blog-Management" 
        className={`sidebar-link ${activeItem === 'blog' ? 'active' : ''}`}
      >
        Blog Manager
      </Link>
    </aside>
  );
};

export default SidebarProfile;