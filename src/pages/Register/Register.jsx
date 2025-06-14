import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import { registerAPI } from "../../services/account";
import { toast } from "react-toastify";
import LoadingOverlay from "../../components/Loading/Loading";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    address: "",
    birthdate: "",
    password: "",
    gender: "Male",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await registerAPI(formData);

    try {
      if (res.ok) {
        const json = await res.json();
        toast.success(json.message || "Register Successfully !");
        setLoading(true);
        setTimeout(() => {
          navigate("/login");
          setLoading(false);
        }, 800);
      } else {
        const errorText = await res.text();
        toast.error("Register fail: " + errorText);
      }
    } catch (err) {
      console.error(err);
      toast.error("Can't connect with Server.");
    }
  };

  // Hàm chuyển trang login có loading
  const handleGoToLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate("/login");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="register-container">
      <LoadingOverlay isLoading={loading} />
      {/* Left Section */}
      <div className="register-left-section">
        <img
          src="/assets/image/Account/login2.png"
          alt="Background"
          className="register-background-img"
        />
        <div className="register-overlay">
          <img
            src="/assets/image/Account/login.png"
            alt="Doctors"
            className="register-doctors-img"
          />
          <div className="register-badge">
            <div className="badge-icon">🔍</div>
            <div>
              <strong>Well qualified doctors</strong>
              <br />
              <small>Treat with care</small>
            </div>
          </div>
          <div className="register-appointment-card">
            <div className="register-icon">📅</div>
            <div>
              <strong>Book an appointment</strong>
              <br />
              <small>Online appointment</small>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="register-right-section">
        <form className="register-form" onSubmit={handleSubmit}>
          <h1 style={{ textAlign: "center", fontSize: "38px" }}>Register</h1>
          <p className="register-subtext">
            Do you have account ?{" "}
            <a href="/login" onClick={handleGoToLogin}>
              Log in
            </a>
          </p>

          {/* Form Inputs */}
          <label>FullName</label>
          <input
            type="text"
            name="fullName"
            placeholder="Steve Madden"
            value={formData.fullName}
            onChange={handleChange}
          />

          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="steve.madden"
            value={formData.username}
            onChange={handleChange}
          />

          <label>Phone Number</label>
          <input
            type="text"
            name="phone"
            placeholder="012312332"
            value={formData.phone}
            onChange={handleChange}
          />

          <label>Email address</label>
          <input
            type="email"
            name="email"
            placeholder="stevemadden@abc.com"
            value={formData.email}
            onChange={handleChange}
          />

          <label>Address</label>
          <input
            type="text"
            name="address"
            placeholder="123 Viet Nam"
            value={formData.address}
            onChange={handleChange}
          />

          <label>Birth Date</label>
          <input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
          />

          <label>Your password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />

          {/* Gender */}
          <div className="register-gender-options">
            <label>Gender:</label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={formData.gender === "Male"}
                onChange={handleChange}
              />
              Nam
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={formData.gender === "Female"}
                onChange={handleChange}
              />
              Nữ
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Other"
                checked={formData.gender === "Other"}
                onChange={handleChange}
              />
              Khác
            </label>
          </div>

          <button type="submit" className="register-sign-up-btn">
            Sign Up
          </button>

          <button type="button" className="register-social-btn register-google">
            <img src="https://www.google.com/favicon.ico" alt="Google" />
            <span>Register With Google</span>
          </button>

          <button
            type="button"
            className="register-social-btn register-facebook"
          >
            <img src="https://www.facebook.com/favicon.ico" alt="Facebook" />
            <span>Register With Facebook</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
