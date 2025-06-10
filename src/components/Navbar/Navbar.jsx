import "./nav-bar.css";
import { Link } from "react-router-dom";

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
          <Link to="/" className="menu-item">
            Trang chủ
          </Link>
          <Link to="" className="menu-item">
            Đặt lịch hẹn
          </Link>
          <Link to="/blog" className="menu-item">
            Blog
          </Link>
          <Link to="" className="menu-item">
            Tài liệu giáo dúc
          </Link>
          <div className="menu-item menu-lang">
            <div className="vi-png">
              <img src="" alt="Flag" />
            </div>
            <span>Vi</span>
          </div>
        </div>
        <div className="header-btn-group">
          <div className="header-btn">
            <a href="#">Đặt hẹn khám ngay</a>
          </div>
          <div className="header-btn">
            <Link to="/login">Đăng Nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
