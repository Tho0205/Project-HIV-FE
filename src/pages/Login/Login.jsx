import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { loginApi } from "../../services/account";
const backendBaseUrl = "https://localhost:7243";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [result, setResult] = useState("");
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

    const response = await loginApi(email, password);

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
      const data = await response.json();
      localStorage.setItem("username", data.fullName);
      localStorage.setItem("role", data.role);
      localStorage.setItem("account_id", data.accountid);
      localStorage.setItem("item", JSON.stringify(data.list));
      localStorage.setItem(
        "user_avatar",
        data.user_avatar
          ? `${backendBaseUrl}/api/account/avatar/${data.user_avatar}`
          : "/assets/image/patient/patient.png"
      );
      if (data.role === "Patient") {
        navigate("/");
      } else if (data.role === "staff") {
        navigate("/Staff/ManagerPatient");
      }
    } else {
      const error = await response.json().catch(() => null);
      if (error?.errors?.password_hash) {
        setResult(error.errors.password_hash[0]);
      } else if (error?.title) {
        setResult(error.title);
      } else {
        setResult("Login failed");
      }
    }
  };

  return (
    <div className="container">
      <div className="left-section">
        <img
          src="/assets/image/Account/login2.png"
          alt="bg"
          className="background-img"
        />
        <div className="overlay">
          <img
            src="/assets/image/Account/login.png"
            alt="Doctors"
            className="doctors-img"
          />
          <div className="badge">
            <div className="badge-icon">🔍</div>
            <div>
              <strong>Well qualified doctors</strong>
              <br />
              <small>Treat with care</small>
            </div>
          </div>
          <div className="appointment-card">
            <div className="icon">📅</div>
            <div>
              <strong>Book an appointment</strong>
              <br />
              <small>Online appointment</small>
            </div>
          </div>
        </div>
      </div>
      <div className="right-section">
        <form id="loginForm" onSubmit={handleSubmit}>
          <h1 style={{ textAlign: "center", fontSize: 46 }}>Welcome back</h1>
          <p className="register-link">
            Don’t have an account? <Link to="/register">Register</Link>
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

          <div className="options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot">
              Forgot password?
            </Link>
          </div>

          <div className="divider">Or log in with</div>

          <button type="button" className="social-btn google">
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              width="30px"
            />
            <span>Login With Google</span>
          </button>

          <button type="button" className="social-btn facebook">
            <img
              src="https://www.facebook.com/favicon.ico"
              alt="Facebook"
              width="30"
            />
            <span>Login With Facebook</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
