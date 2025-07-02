// signalrConnection.js
import * as signalR from "@microsoft/signalr";
import { tokenManager } from "./services/account";

export const createConnection = (userId) => {
  return new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:7243/chathub?userId=${userId}`, {
      accessTokenFactory: () => tokenManager.getToken() 
    })
    .withAutomaticReconnect()
    .build();
};
