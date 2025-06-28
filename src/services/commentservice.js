import { apiRequest } from "./account";
import axios from "axios";
const API_BASE = "https://localhost:7243/api/Comment";

export const getCommentsByBlogId = async (blogId) => {
  const response = await axios.get(`${API_BASE}/${blogId}`);
  return response.data;
};

export const addComment = async (commentDto) => {
  const response = await apiRequest(`${API_BASE}/create`, {
    method: "POST",
    body: JSON.stringify(commentDto), // <-- chuyển DTO thành JSON string
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null); // Tránh lỗi JSON
  return data;
};
