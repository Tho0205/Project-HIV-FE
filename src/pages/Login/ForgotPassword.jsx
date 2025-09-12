import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://localhost:7243/api/Account/forgot-password",
        email,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Đã gửi liên kết đặt lại mật khẩu đến email của bạn.");
      setMessage("Kiểm tra email để tiếp tục.");
    } catch (error) {
      toast.error("Không thể gửi email. Kiểm tra lại email.");
      setMessage("Gửi thất bại.");
    }
  };

  return (
    <div className="forgot-pass-container">
      <h2 className="forgot-pass-title">Quên mật khẩu</h2>
      {message && (
        <p
          className={`forgot-pass-message${
            message === "Gửi thất bại." ? " error" : ""
          }`}
        >
          {message}
        </p>
      )}
      <form className="forgot-pass-form" onSubmit={handleSubmit}>
        <label className="forgot-pass-label">Nhập email:</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="forgot-pass-input"
        />
        <button type="submit" className="forgot-pass-btn">
          Gửi liên kết đặt lại mật khẩu
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
