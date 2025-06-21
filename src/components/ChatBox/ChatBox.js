import React, { useEffect, useState } from "react";
import { connection, userId } from "../../signalrConnection";
import axios from "axios";

const ChatBox = () => {
    const [toUser, setToUser] = useState("");
    const [message, setMessage] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [availableStaff, setAvailableStaff] = useState([]);

    useEffect(() => {
        connection.start()
            .then(() => {
                console.log(" SignalR connected.");
                setIsConnected(true);
            })
            .catch(console.error);

        connection.on("ReceivePrivateMessage", (from, msg) => {
            setChatLog(prev => [...prev, `${from}: ${msg}`]);
        });

        connection.onclose(() => {
            setIsConnected(false);
        });

        connection.onreconnected(() => {
            setIsConnected(true);
        });

        return () => {
            connection.off("ReceivePrivateMessage");
        };
    }, []);

    useEffect(() => {
    axios.get("https://localhost:7243/api/ChatHub/available-staff")
        .then(res => setAvailableStaff(res.data))
        .catch(err => console.error("Lỗi lấy danh sách staff:", err));
    }, []);

    const username = localStorage.getItem("username"); 

    const sendMessage = async () => {
        if (!isConnected) return alert("Mất kết nối SignalR");
        if (!toUser || !message) return;

        await connection.invoke("SendPrivateMessage", userId, toUser, message);
        setMessage("");
    };

    return (
        <div>
            <h2>Chat 1-1</h2>
                <p>Bạn đang đăng nhập: <b>{username}</b> (ID: {userId})</p>

            <label>Chọn người nhận:</label>
            <select value={toUser} onChange={(e) => setToUser(e.target.value)}>
            <option value="">-- Chọn một người --</option>
            {availableStaff.map((staff) => (
                <option key={staff.userId} value={staff.userId}>
                {staff.name} ({staff.role})
                </option>
            ))}
            </select>
            <input placeholder="Tin nhắn" value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick={sendMessage}>Gửi</button>

            {!isConnected && <p style={{ color: "red" }}> Mất kết nối</p>}

            <div style={{ marginTop: 20 }}>
                {chatLog.map((msg, i) => <div key={i}>{msg}</div>)}
            </div>
        </div>
    );
};

export default ChatBox;
