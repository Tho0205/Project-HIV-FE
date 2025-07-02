import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./nav-bar.css";
import { toast } from "react-toastify";
import { apiRequest, tokenManager } from "../../services/account";

const backendBaseUrl = "https://localhost:7243";
const Header = () => {
  const navigate = useNavigate();
  const Userrole = tokenManager.getCurrentUserRole();

  const [role, setRole] = useState(tokenManager.getCurrentUserRole());
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedAvatar =
      localStorage.getItem("user_avatar") || tokenManager.getUserAvatarUrl();

    if (storedAvatar) {
      const isFullUrl = storedAvatar.startsWith("http");

      setAvatarUrl(
        isFullUrl
          ? `${storedAvatar}?t=${Date.now()}`
          : `${backendBaseUrl}/api/Account/avatar/${storedAvatar}?t=${Date.now()}`
      );
    } else {
      setAvatarUrl("/assets/image/patient/patient.png");
    }
  }, []);

  const Logout = async () => {
    setLoading(true);
    sessionStorage.clear();
    localStorage.clear();

    try {
      await fetch("https://localhost:7243/api/account/logout", {
        method: "POST",
        credentials: "include", // bắt buộc để gửi cookie
      });
    } catch (error) {
      console.error("Logout error", error);
    }

    setRole(null);
    setLoading(false);
    navigate("/");
    toast.success("Đăng xuất thành công", { autoClose: 1000 });
  };

  return (
    <>
      <header className="custom-header">
        <div className="logo">
          <Link to="/">
            <img
              src="/assets/image/Logo/LogoHIV.jpg"
              width={"90px"}
              height={"70px"}
            />
          </Link>
        </div>

        <nav className="nav-links">
          <Link to="/">Trang Chủ</Link>
          <Link to="/appointment">Đặt Lịch Hẹn</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/education">Tài Liệu giáo dục</Link>
          {Userrole === "Doctor" && (
            <Link Link to="/Doctor-Patient-Management">
              Làm Việc
            </Link>
          )}
        </nav>

        <div className="header-buttons">
          <span className="lang-switch">🌐</span>
          <button
            className="btn-outline"
            onClick={() => navigate("/appointment")}
          >
            Đặt Lịch Hẹn
          </button>
          {!role ? (
            <button
              className="btn-primary login"
              onClick={() => {
                setLoading(true);
                navigate("/login");
                setLoading(false);
              }}
            >
              Đăng Nhập
            </button>
          ) : (
            <>
              <button className="btn-primary logout" onClick={Logout}>
                Đăng Xuất
              </button>
              <button
                className="avatar-btn profile"
                onClick={() => {
                  setLoading(true);
                  navigate("/Profile-Patient");
                  setLoading(false);
                }}
              >
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/assets/image/patient/patient.png";
                  }}
                />
              </button>
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
