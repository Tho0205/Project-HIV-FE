"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { tokenManager } from "../../services/account"
import { createConnection } from "../../signalrConnection"
import axios from "axios"
import "./FloatingChat.css"

const FloatingChat = () => {
  const [showChat, setShowChat] = useState(false)
  const [toUser, setToUser] = useState("")
  const [message, setMessage] = useState("")
  const [chatLogs, setChatLogs] = useState({})
  const [isConnected, setIsConnected] = useState(false)
  const [availableStaff, setAvailableStaff] = useState([])
  const [availablePatient, setAvailablePatient] = useState([])
  const [connection, setConnection] = useState(null)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [userNames, setUserNames] = useState({})
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef()

  const username = tokenManager.getCurrentUserName()
  const currentUserId = tokenManager.getCurrentUserId()
  const role = tokenManager.getCurrentUserRole()

  const userMap = useMemo(() => {
    const map = {}
    ;[...availableStaff, ...availablePatient].forEach((user) => {
      map[user.userId] = user.name
    })
    return map
  }, [availableStaff, availablePatient])

  const currentChatLog = chatLogs[toUser] || []

  // Get current chat partner info
  const getCurrentChatPartner = () => {
    if (!toUser) return null
    const allUsers = [...availableStaff, ...availablePatient]
    return allUsers.find((user) => user.userId === toUser)
  }

  const chatPartner = getCurrentChatPartner()

  useEffect(() => {
    axios
      .get("https://localhost:7243/api/ChatHub/available-staff", {
        headers: {
          Authorization: `Bearer ${tokenManager.getToken()}`,
        },
      })
      .then((res) => setAvailableStaff(res.data))
      .catch((err) => console.error("Lỗi lấy danh sách staff:", err))
  }, [])

  useEffect(() => {
    axios
      .get("https://localhost:7243/api/ChatHub/available-patient", {
        headers: {
          Authorization: `Bearer ${tokenManager.getToken()}`,
        },
      })
      .then((res) => setAvailablePatient(res.data))
      .catch((err) => console.error("Lỗi lấy danh sách patient:", err))
  }, [])

  useEffect(() => {
    if (!currentUserId) return

    const conn = createConnection(currentUserId)
    let cancelled = false
    let isMounted = true

    const setupConnection = async () => {
      try {
        if (connection) {
          console.log("Đang dừng kết nối cũ...")
          await connection.stop()
          console.log("Kết nối cũ đã dừng.")
        }

        await conn.start()

        if (!isMounted || cancelled) return

        console.log("SignalR đã kết nối.")
        setConnection(conn)
        setIsConnected(true)

        conn.on("ReceivePrivateMessage", async (from, msg, to) => {
          console.log("Nhận tin:", { from, msg, to })
          const isMe = from === currentUserId
          const otherUser = isMe ? to : from
          const senderName = isMe ? "Bạn" : userMap[from] || from

          if (!isMe && role === "Staff" && !toUser) {
            setToUser(from)
          }

          if (!isMe && role === "Patient" && !toUser) {
            setToUser(from)
          }

          if (!isMe && !showChat) {
            setHasNewMessage(true)
          }

          setChatLogs((prev) => {
            const updated = { ...prev }
            const entry = {
              from: senderName,
              message: msg,
              isMe,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
            updated[otherUser] = [...(updated[otherUser] || []), entry]
            return updated
          })
        })

        conn.onclose(() => {
          console.warn("SignalR đã ngắt kết nối.")
          setIsConnected(false)
        })

        conn.onreconnected(() => {
          console.log("SignalR đã kết nối lại.")
          setIsConnected(true)
        })
      } catch (err) {
        console.error("Lỗi kết nối SignalR:", err)
      }
    }

    setupConnection()

    return () => {
      cancelled = true
      isMounted = false
      if (conn) {
        conn
          .stop()
          .then(() => console.log("Đã ngắt kết nối SignalR."))
          .catch((err) => console.error("Lỗi ngắt kết nối:", err))
      }
    }
  }, [currentUserId, userMap, showChat])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentChatLog])

  useEffect(() => {
    if (showChat) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 0)
    }
  }, [showChat])

  const sendMessage = async () => {
    if (!isConnected) return alert("Mất kết nối SignalR")
    if (!message.trim()) return

    if (role !== "Patient" && !toUser) return alert("Vui lòng chọn người nhận.")

    if (toUser === currentUserId) return alert("Không thể gửi tin cho chính bạn")

    try {
      await connection.invoke("SendPrivateMessage", currentUserId, toUser, message)
      setMessage("")
    } catch (err) {
      console.error("Lỗi gửi tin:", err)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className="hiv-chat-toggle-btn"
        onClick={() => {
          const willShow = !showChat
          setShowChat(willShow)
          if (willShow) setHasNewMessage(false)
        }}
        aria-label="Mở chat"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="hiv-chat-icon">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {hasNewMessage && <span className="hiv-chat-badge" />}
      </button>

      {/* Chat Popup */}
      {showChat && (
        <div className="hiv-chat-popup">
          {/* Header */}
          <div className="hiv-chat-header">
            <div className="hiv-chat-header-info">
              {chatPartner ? (
                <>
                  <div className="hiv-chat-avatar">
                    <span>{chatPartner.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="hiv-chat-user-info">
                    <h4>{chatPartner.name}</h4>
                    <span className="hiv-chat-status">
                      <span className="hiv-status-dot"></span>
                      {isConnected ? "Đang hoạt động" : "Offline"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="hiv-chat-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="hiv-chat-user-info">
                    <h4>Tư vấn HIV/AIDS</h4>
                    <span className="hiv-chat-status">
                      <span className="hiv-status-dot"></span>
                      Hỗ trợ 24/7
                    </span>
                  </div>
                </>
              )}
            </div>
            <button className="hiv-chat-close-btn" onClick={() => setShowChat(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="hiv-chat-body">
            {/* User Selection */}
            {!toUser && (
              <div className="hiv-chat-user-selection">
                {role === "Patient" && (
                  <>
                    <div className="hiv-chat-welcome">
                      <h3>Chào mừng bạn đến với dịch vụ tư vấn HIV/AIDS</h3>
                      <p>Vui lòng chọn chuyên gia để bắt đầu cuộc trò chuyện</p>
                    </div>
                    <div className="hiv-staff-list">
                      {availableStaff
                        .filter((s) => s.userId !== currentUserId)
                        .map((staff) => (
                          <div key={staff.userId} className="hiv-staff-item" onClick={() => setToUser(staff.userId)}>
                            <div className="hiv-staff-avatar">
                              <span>{staff.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="hiv-staff-info">
                              <h4>{staff.name}</h4>
                              <span>{staff.role}</span>
                            </div>
                            <div className="hiv-staff-status">
                              <span className="hiv-status-dot active"></span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {role === "Staff" && (
                  <>
                    <div className="hiv-chat-welcome">
                      <h3>Danh sách bệnh nhân</h3>
                      <p>Chọn bệnh nhân để bắt đầu tư vấn</p>
                    </div>
                    <div className="hiv-staff-list">
                      {availablePatient
                        .filter((p) => p.userId !== currentUserId)
                        .map((patient) => (
                          <div
                            key={patient.userId}
                            className="hiv-staff-item"
                            onClick={() => setToUser(patient.userId)}
                          >
                            <div className="hiv-staff-avatar">
                              <span>{patient.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="hiv-staff-info">
                              <h4>{patient.name}</h4>
                              <span>Bệnh nhân</span>
                            </div>
                            <div className="hiv-staff-status">
                              <span className="hiv-status-dot active"></span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Chat Messages */}
            {toUser && (
              <div className="hiv-chat-messages">
                {currentChatLog.length === 0 && (
                  <div className="hiv-chat-empty">
                    <div className="hiv-chat-empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p>Bắt đầu cuộc trò chuyện</p>
                    <span>Tin nhắn của bạn được mã hóa end-to-end</span>
                  </div>
                )}

                {currentChatLog.map((msg, i) => (
                  <div key={i} className={`hiv-message ${msg.isMe ? "hiv-message-sent" : "hiv-message-received"}`}>
                    <div className="hiv-message-content">
                      <p>{msg.message}</p>
                      <span className="hiv-message-time">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="hiv-message hiv-message-received">
                    <div className="hiv-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {toUser && (
            <div className="hiv-chat-input">
              <div className="hiv-chat-input-container">
                <textarea
                  placeholder="Nhập tin nhắn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onClick={() => setHasNewMessage(false)}
                  rows={1}
                />
                <button onClick={sendMessage} disabled={!message.trim() || !isConnected} className="hiv-send-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22,2 15,22 11,13 2,9 22,2" />
                  </svg>
                </button>
              </div>
              {toUser && (
                <button className="hiv-back-btn" onClick={() => setToUser("")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  Quay lại
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default FloatingChat
