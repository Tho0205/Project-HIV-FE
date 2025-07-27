import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import { registerAPI } from "../../services/account";
import { toast } from "react-toastify";
import LoadingOverlay from "../../components/Loading/Loading";

const today = new Date().toISOString().split("T")[0];
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
    setLoading(true);
    try {
      const res = await registerAPI(formData);

      if (res.ok) {
        const json = await res.json();
        toast.success(json.message || "Register Successfully !");
        setTimeout(() => {
          navigate("/login");
          setLoading(false);
        }, 800);
      } else {
        const result = await res.json();
        const errorMsg =
          result?.errors?.password_hash?.[0] ||
          result?.errors?.email?.[0] ||
          result?.message ||
          "Đăng ký thất bại.";
        toast.error(errorMsg, { autoClose: 2000 });
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Can't connect with Server.");
      setLoading(false);
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
        </div>
      </div>

      {/* Right Section */}
      <div className="register-right-section">
        <form className="register-form" onSubmit={handleSubmit}>
          <h1 style={{ textAlign: "center", fontSize: "38px" }}>Đăng ký</h1>
          <p className="register-subtext">
            Bạn đã có tài khoản ?{" "}
            <a href="/login" onClick={handleGoToLogin}>
              Đăng nhập ngay
            </a>
          </p>

          {/* Form Inputs */}
          <label>Họ và tên</label>
          <input
            type="text"
            name="fullName"
            placeholder="Nguyễn Văn A"
            value={formData.fullName}
            onChange={handleChange}
          />

          <label>Tên tài khoản</label>
          <input
            type="text"
            name="username"
            placeholder="ANguyen"
            value={formData.username}
            onChange={handleChange}
          />

          <label>Số điện thoại</label>
          <input
            type="text"
            name="phone"
            placeholder="012312332"
            value={formData.phone}
            onChange={handleChange}
          />

          <label>Địa chỉ Email</label>
          <input
            type="email"
            name="email"
            placeholder="ANguyenVan@abc.com"
            value={formData.email}
            onChange={handleChange}
          />

          <label>Đại chỉ</label>
          <input
            type="text"
            name="address"
            placeholder="123 Viet Nam"
            value={formData.address}
            onChange={handleChange}
          />

          <label>Ngày sinh</label>
          <input
            type="date"
            name="birthdate"
            max={today}
            min="1900-01-01"
            value={formData.birthdate}
            onChange={handleChange}
          />

          <label>Your password</label>
          <input
            type="password"
            name="password"
            minLength={4}
            maxLength={50}
            value={formData.password}
            onChange={handleChange}
          />

          {/* Gender */}
          <div className="register-gender-options">
            <label>Giới tính:</label>
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
            Đăng ký
          </button>

          <button type="button" className="register-social-btn register-google">
            <img src="https://www.google.com/favicon.ico" alt="Google" />
            <span>Đăng ký bằng Google</span>
          </button>

          {/* <button
            type="button"
            className="register-social-btn register-facebook"
          >
            <img src="https://www.facebook.com/favicon.ico" alt="Facebook" />
            <span>Đăng ký bằng Facebook</span>
          </button> */}
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
