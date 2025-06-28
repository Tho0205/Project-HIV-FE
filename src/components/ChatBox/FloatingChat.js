import React, { useEffect, useRef, useState, useMemo } from "react";
import { createConnection } from "../../signalrConnection";
import { tokenManager } from "../../services/account";
import axios from "axios";
import "./FloatingChat.css";

const FloatingChat = () => {
  const [showChat, setShowChat] = useState(false);
  const [toUser, setToUser] = useState("");
  const [message, setMessage] = useState("");
  const [chatLogs, setChatLogs] = useState({}); // 👈 Mỗi người một log
  const [isConnected, setIsConnected] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [connection, setConnection] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const chatEndRef = useRef();

  const username = tokenManager.getCurrentUserName();
  const currentUserId = tokenManager.getCurrentUserId();

  const userMap = useMemo(() => {
    const map = {};
    availableStaff.forEach((s) => {
      map[s.userId] = s.name;
    });
    return map;
  }, [availableStaff]);

  const currentChatLog = chatLogs[toUser] || [];

  useEffect(() => {
    axios
      .get("https://localhost:7243/api/ChatHub/available-staff")
      .then((res) => setAvailableStaff(res.data))
      .catch((err) => console.error("Lỗi lấy danh sách staff:", err));
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const conn = createConnection(currentUserId);
    setConnection(conn);

    conn
      .start()
      .then(() => {
        console.log("SignalR connected.");
        setIsConnected(true);
      })
      .catch(console.error);

    conn.on("ReceivePrivateMessage", (from, msg, to) => {
      const isMe = from === currentUserId;
      const otherUser = isMe ? to : from;
      const senderName = isMe ? "Bạn" : userMap[from] || from;

      if (!isMe && !showChat) {
        setHasNewMessage(true);
      }

      setChatLogs((prev) => {
        const updated = { ...prev };
        const entry = { from: senderName, message: msg, isMe };
        updated[otherUser] = [...(updated[otherUser] || []), entry];
        return updated;
      });
    });

    conn.onclose(() => setIsConnected(false));
    conn.onreconnected(() => setIsConnected(true));

    return () => {
      conn.stop();
    };
  }, [currentUserId, userMap, showChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChatLog]);

  useEffect(() => {
    if (showChat) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [showChat]);

  const sendMessage = async () => {
    if (!isConnected) return alert("Mất kết nối SignalR");
    if (!toUser || !message) return;
    if (toUser === currentUserId)
      return alert("Không thể gửi tin cho chính bạn");
    try {
      await connection.invoke(
        "SendPrivateMessage",
        currentUserId,
        toUser,
        message
      );
      setMessage("");
    } catch (err) {
      console.error("Lỗi gửi tin:", err);
    }
  };

  return (
    <>
      <button
        className="chat-toggle-btn"
        onClick={() => {
          const willShow = !showChat;
          setShowChat(willShow);
          if (willShow) setHasNewMessage(false);
        }}
      >
        💬
        {hasNewMessage && <span className="chat-badge" />}
      </button>

      {showChat && (
        <div className="chat-popup">
          <div className="chat-popup-header">
            <span>💬 Chat trực tiếp</span>
            <button className="close-btn" onClick={() => setShowChat(false)}>
              ✖
            </button>
          </div>

          <div className="chat-popup-body">
            <p>
              <b>{username}</b> (ID: {currentUserId})
            </p>

            <label>Người nhận:</label>
            <select value={toUser} onChange={(e) => setToUser(e.target.value)}>
              <option value="">-- Chọn --</option>
              {availableStaff
                .filter((s) => s.userId !== currentUserId)
                .map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.name} ({s.role})
                  </option>
                ))}
            </select>

            <div className="chat-log">
              {currentChatLog.map((msg, i) => (
                <div
                  key={i}
                  className={msg.isMe ? "msg-from-me" : "msg-from-them"}
                >
                  <b>{msg.from}:</b> {msg.message}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="chat-popup-input">
            <input
              placeholder="Nhập tin..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onClick={() => setHasNewMessage(false)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Gửi</button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
