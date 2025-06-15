import React from "react";
import "./Loading.css"; // file CSS riêng nếu bạn tách style

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="spinner-container">
          <div className="spinner"></div>
          <i className="fas fa-heartbeat heartbeat-icon"></i>
        </div>
        <p className="loading-text">Đang xử lý...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
