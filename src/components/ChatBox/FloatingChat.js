import React, { useEffect, useRef, useState } from "react";
import { connection, userId } from "../../signalrConnection";
import axios from "axios";
import "./FloatingChat.css"; // Nhớ tạo file CSS

const FloatingChat = () => {
  const [showChat, setShowChat] = useState(false);
  const [toUser, setToUser] = useState("");
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const chatEndRef = useRef();

  const username = localStorage.getItem("username");
  const currentUserId = userId || localStorage.getItem("user_id");

  useEffect(() => {
    connection
      .start()
      .then(() => {
        console.log(" SignalR connected.");
        setIsConnected(true);
      })
      .catch(console.error);

    connection.on("ReceivePrivateMessage", (from, msg) => {
      setChatLog((prev) => [...prev, `${from}: ${msg}`]);
    });

    connection.onclose(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));

    return () => {
      connection.off("ReceivePrivateMessage");
    };
  }, []);

  useEffect(() => {
    axios
      .get("https://localhost:7243/api/ChatHub/available-staff")
      .then((res) => setAvailableStaff(res.data))
      .catch((err) => console.error("Lỗi lấy danh sách staff:", err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  const sendMessage = async () => {
    if (!isConnected) return alert(" Mất kết nối SignalR");
    if (!toUser || !message) return;
    try {
      await connection.invoke("SendPrivateMessage", currentUserId, toUser, message);
      setMessage("");
    } catch (err) {
      console.error("Lỗi gửi tin:", err);
    }
  };

  return (
    <>
      {/* Nút tròn góc phải */}
      <button className="chat-toggle-btn" onClick={() => setShowChat(!showChat)}>
        💬
      </button>

      {/* Popup khung chat */}
      {showChat && (
        <div className="chat-popup">
          <div className="chat-popup-header">
            <span>💬 Chat trực tiếp</span>
            <button className="close-btn" onClick={() => setShowChat(false)}>✖</button>
          </div>

          <div className="chat-popup-body">
            <p>
              <b>{username}</b> (ID: {currentUserId})
            </p>

            <label>Người nhận:</label>
            <select value={toUser} onChange={(e) => setToUser(e.target.value)}>
              <option value="">-- Chọn --</option>
              {availableStaff.map((s) => (
                <option key={s.userId} value={s.userId}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>

            <div className="chat-log">
              {chatLog.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="chat-popup-input">
            <input
              placeholder="Nhập tin..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Gửi</button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
