import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { loginApi, tokenManager } from "../../services/account";
import LoadingOverlay from "../../components/Loading/Loading";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    if (tokenManager.isAuthenticated()) {
      const role = tokenManager.getCurrentUserRole();
      if (role === "Patient" || role === "Doctor") {
        navigate("/");
      } else if (role === "Staff") {
        navigate("/Staff-ManagerPatient");
      } else if (role === "Admin" || role === "Manager") {
        navigate("/Admin-AccountManagement");
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
        toast.success("Login Successfully", { autoClose: 1000 });
        const data = await response.json();
        tokenManager.setToken(data.token, 60);

        const role = tokenManager.getCurrentUserRole();
        if (role === "Patient" || role === "Doctor") {
          navigate("/");
        } else if (role === "Staff") {
          navigate("/Staff-ManagerPatient");
        } else if (role === "Admin" || role === "Manager") {
          navigate("/Admin-AccountManagement");
        }
      } else {
        const error = await response.json().catch(() => null);
        if (error?.errors?.password_hash) {
          toast.error(error.errors.password_hash[0]);
        } else if (error?.title) {
          toast.error(error.title);
        } else {
          toast.error("Login Failed");
        }
      }
    } catch (error) {
      setLoading(false);
      toast.error("Network error occurred");
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

  // const handleGoogleLogin = async () => {
  //   try {
  //     setLoading(true);

  //     // Clear any existing authentication data
  //     tokenManager.removeToken();
  //     document.cookie =
  //       "HIV.Auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
  //     document.cookie =

  //       "Google.Correlation=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
  //     const currentUrl = window.location.origin + window.location.pathname;
  //     const returnUrl = encodeURIComponent(currentUrl);
  //     const googleAuthUrl = `${backendBaseUrl}/api/Account/login/google?returnUrl=${returnUrl}`;

  //     console.log("Starting Google OAuth...", googleAuthUrl);
  //     window.location.replace(googleAuthUrl);
  //   } catch (error) {
  //     console.error("Error starting Google login:", error);
  //     toast.error("Failed to start Google login. Please try again.");
  //     setLoading(false);
  //   }
  // };

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
            Don't have an account?{" "}
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
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

          <button
            type="button"
            className="login-social-btn login-google"
            // onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              width="30px"
            />
            <span>Login With Google</span>
          </button>

          <button
            type="button"
            className="login-social-btn login-facebook"
            disabled
          >
            <img
              src="https://www.facebook.com/favicon.ico"
              alt="Facebook"
              width="30"
            />
            <span>Login With Facebook (Coming Soon)</span>
          </button>
        </form>
      </div>
      <LoadingOverlay isLoading={loading} />
    </div>
  );
};

export default Login;
