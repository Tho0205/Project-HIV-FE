import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { loginApi, tokenManager } from "../../services/account";
import LoadingOverlay from "../../components/Loading/Loading";
import { toast } from "react-toastify";
const backendBaseUrl = "https://localhost:7243";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  //login bằng google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      tokenManager.setToken(token, 60);
      const role = tokenManager.getCurrentUserRole();
      if (role === "Patient") navigate("/");
      else if (role === "Staff" || role === "Manager") navigate("/DashBoard");
      else if (role === "Admin") navigate("/Admin-AccountManagement");
      else if (role === "Doctor") {
        navigate("/Profile-Doctor");
      }
    }
  }, []);

  useEffect(() => {
    if (tokenManager.isAuthenticated()) {
      const role = tokenManager.getCurrentUserRole();
      if (role === "Patient") {
        navigate("/");
      } else if (role === "Staff" || role === "Manager") {
        navigate("/DashBoard");
      } else if (role === "Admin") {
        navigate("/Admin-AccountManagement");
      } else if (role === "Doctor") {
        navigate("/Profile-Doctor");
      }
    }
    const cookies = document.cookie.split(";");
    const usernameCookie = cookies.find((c) =>
      c.trim().startsWith("username=")
    );

    if (usernameCookie) {
      const usernameValue = decodeURIComponent(usernameCookie.split("=")[1]);
      setEmail(usernameValue);
      setRemember(true); // Tự động tích vào checkbox nếu có cookie
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginApi(email, password);

      setTimeout(() => {
        setLoading(false);
      }, 800);

      // Handle remember me cookie
      if (remember) {
        const expires = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toUTCString();
        document.cookie = `username=${encodeURIComponent(
          email
        )}; expires=${expires}; path=/; SameSite=Lax`;
      } else {
        document.cookie =
          "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      }

      if (response.ok) {
        toast.success("Đăng nhập thành công", { autoClose: 1000 });
        const data = await response.json();
        tokenManager.setToken(data.token, 60);

        const role = tokenManager.getCurrentUserRole();
        if (role === "Patient") {
          navigate("/");
        } else if (role === "Staff" || role === "Manager") {
          navigate("/DashBoard");
        } else if (role === "Admin") {
          navigate("/Admin-AccountManagement");
        } else if (role === "Doctor") {
          navigate("/Profile-Doctor");
        }
      } else {
        const error = await response.json().catch(() => null);
        if (error?.errors?.password_hash) {
          toast.error(error.errors.password_hash[0]);
        } else if (error?.title) {
          toast.error(error.title);
        } else {
          toast.error("Đăng nhập lỗi, vui lòng thử lại");
        }
      }
    } catch (error) {
      setLoading(false);
      toast.error("Đăng nhập thất bại, vui lòng thử lại");
      console.error("Login error:", error);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate("/register");
      setLoading(false);
    }, 400);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // Clear any existing authentication data
      tokenManager.removeToken();
      document.cookie =
        "HIV.Auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      document.cookie =
        "Google.Correlation=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      const currentUrl = window.location.origin + window.location.pathname;
      const returnUrl = encodeURIComponent(currentUrl);
      const googleAuthUrl = `${backendBaseUrl}/api/Account/login/google?returnUrl=${returnUrl}`;

      window.location.replace(googleAuthUrl);
    } catch (error) {
      toast.error("Đăng nhập bằng Google thất bại, vui lòng thử lại");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left-section">
        <img
          src="/assets/image/Account/login2.png"
          alt="bg"
          className="login-background-img"
        />
        <div className="login-overlay-1">
          <img
            src="/assets/image/Account/login.png"
            alt="Doctors"
            className="login-doctors-img"
          />
        </div>
      </div>
      <div className="login-right-section">
        <form id="loginForm" onSubmit={handleSubmit}>
          <h1 style={{ textAlign: "center", fontSize: 46 }}> Chào Mừng</h1>
          <p className="login-register-link">
            Bạn không có tài khoản ?{" "}
            <a href="/register" onClick={handleRegister}>
              Đăng ký ngay
            </a>
          </p>

          <h4 style={{ color: "red", marginTop: 4 }}>{result}</h4>

          <label htmlFor="email">Email</label>
          <input
            type="text"
            id="email"
            placeholder="Nhập tên người dùng..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            type="password"
            id="password"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="4"
            maxLength="50"
          />

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Đăng Nhập"}
          </button>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ghi nhớ đăng nhập
            </label>
            {/* <Link to="/forgot-password" className="login-forgot">
              Quên mật khẩu?
            </Link> */}
          </div>

          <div className="login-divider">Đăng nhập bằng</div>

          <button
            type="button"
            className="login-social-btn login-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              width="30px"
            />
            <span>Đăng nhập bằng Google</span>
          </button>

          {/* <button
            type="button"
            className="login-social-btn login-facebook"
            disabled
          >
            <img
              src="https://www.facebook.com/favicon.ico"
              alt="Facebook"
              width="30"
            />
            <span>Đăng nhập bằng Facebook (Coming Soon)</span>
          </button> */}
        </form>
      </div>
      <LoadingOverlay isLoading={loading} />
    </div>
  );
};

export default Login;
