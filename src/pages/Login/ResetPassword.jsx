import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./ResetPassword.css";
const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Lấy email và token từ URL query string
  useEffect(() => {
    console.log("ResetPassword page loaded");
    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get("email");
    const tokenFromUrl = params.get("token");

    if (emailFromUrl && tokenFromUrl) {
      setEmail(emailFromUrl);
      setToken(tokenFromUrl);
    } else {
      setMessage("Invalid reset link.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(
        "https://localhost:7243/api/Account/reset-password",
        {
          email,
          token,
          newPassword,
        }
      );
      navigate("/login");
      toast.success("Đổi Mật Khẩu Thành Công");
    } catch (error) {
      console.error(error);
      toast.success(
        error.response?.data?.message || "Failed to reset password."
      );
    }
  };

  return (
    <div className="reset-pass-container">
      <h2 className="reset-pass-title">Đặt lại mật khẩu</h2>
      {message && (
        <p
          className={`reset-pass-message${
            message !== "" && message !== "Kiểm tra email để tiếp tục." ? " error" : ""
          }`}
        >
          {message}
        </p>
      )}
      <form className="reset-pass-form" onSubmit={handleSubmit}>
        <label className="reset-pass-label">Mật khẩu mới:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="reset-pass-input"
        />
        <label className="reset-pass-label">Xác nhận mật khẩu:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="reset-pass-input"
        />
        <button type="submit" className="reset-pass-btn">
          Đặt lại mật khẩu
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
