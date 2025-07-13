import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./nav-bar.css";
import { toast } from "react-toastify";
import { apiRequest, tokenManager } from "../../services/account";
import { notificationService } from "../../services/notificationService";

const backendBaseUrl = "https://localhost:7243";

const Header = () => {
  const navigate = useNavigate();
  const Userrole = tokenManager.getCurrentUserRole();

  const [role, setRole] = useState(tokenManager.getCurrentUserRole());
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

    if (role) {
      console.log("abvadsadd" + fetchNotifications());
    }
  }, [role]);

  const fetchNotifications = async () => {
    try {
      const userId = tokenManager.getCurrentUserId();
      if (!userId) return;

      const data = await notificationService.getNotifications(userId);
      setNotifications(data);

      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = tokenManager.getCurrentUserId();
      if (!userId) return;

      await notificationService.markAllAsRead(userId);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const Logout = async () => {
    setLoading(true);
    sessionStorage.clear();
    localStorage.clear();

    try {
      await fetch(`${backendBaseUrl}/api/account/logout`, {
        method: "POST",
        credentials: "include",
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
          {Userrole === "Patient" && (
            <Link Link to="/appointment">
              Đặt Lịch Hẹn
            </Link>
          )}
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

        {role && (
          <div className="notification-container">
            <button
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>Thông báo</h4>
                  {unreadCount > 0 && (
                    <button
                      className="mark-all-read"
                      onClick={handleMarkAllAsRead}
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">Không có thông báo</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.notificationId}
                        className={`notification-item ${!notification.isRead ? "unread" : ""}`}
                        onClick={() => handleMarkAsRead(notification.notificationId)}
                      >
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{notification.timeAgo}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
