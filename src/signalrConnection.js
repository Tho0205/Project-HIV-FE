import * as signalR from "@microsoft/signalr";

// Lấy user_id từ localStorage
const userId = localStorage.getItem("user_id");

export const connection = new signalR.HubConnectionBuilder()
  .withUrl(`https://localhost:7243/chathub?userId=${userId}`, {
    withCredentials: true,
  })
  .withAutomaticReconnect()
  .build();

export { userId };
