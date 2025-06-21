// signalrConnection.js
import * as signalR from "@microsoft/signalr";

// Xuất ra hàm khởi tạo kết nối (tránh tạo sớm khi userId chưa có)
export const createConnection = (userId) => {
  return new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:7243/chathub?userId=${userId}`)
    .withAutomaticReconnect()
    .build();
};
