import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20 }}>
      <h2>Quên mật khẩu</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Nhập email:</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <button type="submit">Gửi liên kết đặt lại mật khẩu</button>
      </form>
    </div>
  );
};

export default ForgotPassword;
