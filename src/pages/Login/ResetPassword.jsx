import React, { useState, useEffect } from "react";
import axios from "axios";
const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

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

      setMessage(response.data.message || "Password reset successfully!");
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "20px",
        border: "1px solid #ccc",
      }}
    >
      <h2>Reset Password</h2>
      {message && (
        <p
          style={{ color: message.includes("successfully") ? "green" : "red" }}
        >
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>
        <button type="submit" style={{ marginTop: "15px" }}>
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
