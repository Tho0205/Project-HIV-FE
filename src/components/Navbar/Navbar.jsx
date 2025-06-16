import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./nav-bar.css";
import { toast } from "react-toastify";
import LoadingOverlay from "../Loading/Loading";

const Header = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState(localStorage.getItem("role"));
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedAvatar = localStorage.getItem("user_avatar");
    if (storedAvatar) {
      setAvatarUrl(`${storedAvatar}?t=${new Date().getTime()}`);
    } else {
      setAvatarUrl("/assets/image/patient/patient.png");
    }
  }, []);

  const Logout = () => {
    setLoading(true);
    setTimeout(() => {
      sessionStorage.clear();
      localStorage.clear();
      setRole(null);
      setLoading(false);
      navigate("/");
      toast.success("Logout Successfully", { autoClose: 1000 });
    }, 800);
  };

  return (
    <>
      <LoadingOverlay isLoading={loading} />
      <header className="custom-header">
        <div className="logo">
          <Link to="/">Logo HIV</Link>
        </div>

        <nav className="nav-links">
          <Link to="/">Trang Chủ</Link>
          <Link to="/appointment">Đặt Lịch Hẹn</Link>
          <Link to="/blog">Blog</Link>
          <a href="/Pages/ViewPage/ResourcesPage.html">Tài Liệu Giáo Dục</a>
        </nav>

        <div className="header-buttons">
          <span className="lang-switch">🌐</span>
          <button
            className="btn-outline"
            onClick={() => navigate("/appointment")}
          >
            Booking Now
          </button>
          {!role ? (
            <button
              className="btn-primary login"
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  navigate("/login");
                  setLoading(false);
                }, 800);
              }}
            >
              Login
            </button>
          ) : (
            <>
              <button className="btn-primary logout" onClick={Logout}>
                Logout
              </button>
              <button
                className="avatar-btn profile"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    navigate("/Profile-Patient");
                    setLoading(false);
                  }, 800);
                }}
              >
                <img src={avatarUrl} alt="Avatar" />
              </button>
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;