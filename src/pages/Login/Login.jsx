import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { loginApi } from "../../services/account";
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

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const cookieObj = {};
    cookies.forEach((cookie) => {
      const [key, value] = cookie.split("=");
      cookieObj[key] = value;
    });

    if (cookieObj.username) {
      setEmail(decodeURIComponent(cookieObj.username));
      setRemember(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Bật loading

    const response = await loginApi(email, password);

    // Đảm bảo loading hiển thị ít nhất 1 giây (1000ms)
    setTimeout(() => {
      setLoading(false);
    }, 800);

    if (remember) {
      document.cookie =
        "username=" +
        encodeURIComponent(email) +
        "; expires=" +
        new Date(Date.now() + 120000).toUTCString() +
        "; path=/";
    } else {
      document.cookie =
        "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    if (response.ok) {
      toast.success("Login Successfully", { autoClose: 1000 });
      const data = await response.json();
      localStorage.setItem("username", data.fullName);
      localStorage.setItem("role", data.role);
      localStorage.setItem("account_id", data.accountid);
      localStorage.setItem("user_id", data.userid);
      console.log("user_id", data.userid);
      localStorage.setItem("item", JSON.stringify(data.list));
      localStorage.setItem(
        "user_avatar",
        data.user_avatar
          ? `${backendBaseUrl}/api/account/avatar/${data.user_avatar}`
          : "./assets/image/patient/patient.png"
      );

      if (data.role === "Patient" || data.role === "Doctor") {
        navigate("/");
      } else if (data.role === "Staff" || data.role === "Manager") {
        navigate("/Staff-ManagerPatient");
      }
    } else {
      const error = await response.json().catch(() => null);
      if (error?.errors?.password_hash) {
        toast.error(error.errors.password_hash[0]);
      } else if (error?.title) {
        toast.error(error.title);
      } else {
        toast.error("Login Fail");
      }
    }
  };

  // Thêm hàm chuyển trang Register có loading
  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate("/register");
      setLoading(false);
    }, 400);
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
          <div className="login-badge">
            <div className="badge-icon">🔍</div>
            <div>
              <strong>Well qualified doctors</strong>
              <br />
              <small>Treat with care</small>
            </div>
          </div>
          <div className="login-appointment-card">
            <div className="login-icon">📅</div>
            <div>
              <strong>Book an appointment</strong>
              <br />
              <small>Online appointment</small>
            </div>
          </div>
        </div>
      </div>
      <div className="login-right-section">
        <form id="loginForm" onSubmit={handleSubmit}>
          <h1 style={{ textAlign: "center", fontSize: 46 }}>Welcome back</h1>
          <p className="login-register-link">
            Don’t have an account?{" "}
            <a href="/register" onClick={handleRegister}>
              Register
            </a>
          </p>

          <h4 style={{ color: "red", marginTop: 4 }}>{result}</h4>

          <label htmlFor="email">Email</label>
          <input
            type="text"
            id="email"
            placeholder="Input Username..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Your password</label>
          <input
            type="password"
            id="password"
            placeholder="Input Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="4"
            maxLength="50"
          />

          <button type="submit" className="login-btn">
            Log in
          </button>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="login-forgot">
              Forgot password?
            </Link>
          </div>

          <div className="login-divider">Or log in with</div>

          <button type="button" className="login-social-btn login-google">
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              width="30px"
            />
            <span>Login With Google</span>
          </button>

          <button type="button" className="login-social-btn login-facebook">
            <img
              src="https://www.facebook.com/favicon.ico"
              alt="Facebook"
              width="30"
            />
            <span>Login With Facebook</span>
          </button>
        </form>
      </div>
      <LoadingOverlay isLoading={loading} />
    </div>
  );
};

export default Login;
