import * as signalR from "@microsoft/signalr";

// Lấy user_id từ localStorage
const userId = localStorage.getItem("user_id");

export const connection = new signalR.HubConnectionBuilder()
  .withUrl(`https://structural-posts-member-huntington.trycloudflare.com/chathub?userId=${userId}`, {
    withCredentials: true
  })
  .withAutomaticReconnect()
  .build();

export { userId };
