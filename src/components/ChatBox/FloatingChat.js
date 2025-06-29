import React, { useEffect, useRef, useState, useMemo } from "react";
import { tokenManager } from "../../services/account";
import { createConnection } from "../../signalrConnection";
import axios from "axios";
import "./FloatingChat.css";

const FloatingChat = () => {
  const [showChat, setShowChat] = useState(false);
  const [toUser, setToUser] = useState("");
  const [message, setMessage] = useState("");
  const [chatLogs, setChatLogs] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [availablePatient, setAvailablePatient] = useState([]);
  const [connection, setConnection] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [userNames, setUserNames] = useState({});
  const chatEndRef = useRef();

  const username = tokenManager.getCurrentUserName();
  const currentUserId = tokenManager.getCurrentUserId();
  const role = tokenManager.getCurrentUserRole();

  const userMap = useMemo(() => {
    const map = {};
    [...availableStaff, ...availablePatient].forEach((user) => {
      map[user.userId] = user.name;
    });
    return map;
  }, [availableStaff, availablePatient]);


  const currentChatLog = chatLogs[toUser] || [];



  useEffect(() => {
    axios.get("https://localhost:7243/api/ChatHub/available-staff", {
      headers: {
        Authorization: `Bearer ${tokenManager.getToken()}`
      }
    })
    .then((res) => setAvailableStaff(res.data))
    .catch((err) => console.error("Lỗi lấy danh sách staff:", err));
  }, []);

  useEffect(() => {
    axios.get("https://localhost:7243/api/ChatHub/available-patient", {
      headers: {
        Authorization: `Bearer ${tokenManager.getToken()}`
      }
    })
    .then((res) => setAvailablePatient(res.data))
    .catch((err) => console.error("Lỗi lấy danh sách staff:", err));
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    let conn = createConnection(currentUserId);
    let cancelled = false;
    let isMounted = true;

    const setupConnection = async () => {
      try {
        // Nếu có kết nối cũ → dừng lại hoàn toàn trước khi tạo mới
        if (connection) {
          console.log("Đang dừng kết nối cũ...");
          await connection.stop();
          console.log(" Kết nối cũ đã dừng.");
        }

        await conn.start();
        if (!isMounted || cancelled) return;

        console.log("SignalR đã kết nối.");
        setConnection(conn);
        setIsConnected(true);

        conn.on("ReceivePrivateMessage", async (from, msg, to) => {
          console.log("Nhận tin:", { from, msg, to });

          const isMe = from === currentUserId;
          const otherUser = isMe ? to : from;
          const senderName = isMe ? "Bạn" : userMap[from] || from;

          // Nếu chưa có tên trong userMap → fetch tên từ API

          if (!isMe && role === "Staff" && !toUser) {
            setToUser(from);
          }

          if (!isMe && role === "Patient" && !toUser) {
            setToUser(from); 
          }

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



        conn.onclose(() => {
          console.warn("SignalR đã ngắt kết nối.");
          setIsConnected(false);
        });

        conn.onreconnected(() => {
          console.log("SignalR đã kết nối lại.");
          setIsConnected(true);
        });

      } catch (err) {
        console.error("Lỗi kết nối SignalR:", err);
      }
    };

    setupConnection();

    return () => {
      cancelled = true;
      isMounted = false;

      if (conn) {
        conn.stop()
          .then(() => console.log(" Đã ngắt kết nối SignalR."))
          .catch((err) => console.error(" Lỗi ngắt kết nối:", err));
      }
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
    if (!message) return;
    if (role !== "Patient" && !toUser)
      return alert("Vui lòng chọn người nhận.");
    if (toUser === currentUserId)
      return alert("Không thể gửi tin cho chính bạn");
    try {
      await connection.invoke("SendPrivateMessage", currentUserId, toUser, message);
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

          {role === "Patient" && !toUser && (
            <>
              <label>Chọn nhân viên hỗ trợ:</label>
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
            </>
          )}

          {role === "Staff" && !toUser && (
            <>
              <label>Chọn bệnh nhân:</label>
              <select value={toUser} onChange={(e) => setToUser(e.target.value)}>
                <option value="">-- Chọn --</option>
                {availablePatient
                  .filter((s) => s.userId !== currentUserId)
                  .map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.role})
                    </option>
                  ))}
              </select>
            </>
          )}

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
