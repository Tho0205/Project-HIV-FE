import React from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from './StaffSidebar';
import './StaffLayout.css';

const StaffLayout = () => {
  return (
    <div className="staff-layout">
      <StaffSidebar />
      <main className="staff-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout;