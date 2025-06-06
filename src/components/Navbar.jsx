import React from "react";
import "./nav-bar.css";

const Navbar = () => {
  return (
    <div className="nav-bar">
      <div className="header-nav">
        <div className="heading">
          <div className="logo">
            <img src="/img/logo.png" alt="Logo" />
          </div>
          <div className="heading-title">TSDZ</div>
        </div>
        <div className="list">
          <a href="#" className="menu-item">Trang chủ</a>
          <a href="#" className="menu-item">Đặt Lịch Hẹn</a>
          <a href="#" className="menu-item">Blog</a>
          <a href="#" className="menu-item">Tài Liệu Giáo Dục</a>
          <div className="menu-item menu-lang">
            <div className="vi-png">
              <img src="" alt="Flag" />
            </div>
            <span>Vi</span>
          </div>
        </div>
        <div className="header-btn-group">
          <div className="header-btn"><a href="#">Đặt hẹn khám ngay</a></div>
          <div className="header-btn"><a href="#">Đăng nhập</a></div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
