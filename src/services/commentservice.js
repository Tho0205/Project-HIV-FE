import axios from "axios";
const  API_BASE = "https://localhost:7243/api/Comment";

export const getCommentsByBlogId = async (blogId) => {
  const response = await axios.get(`${API_BASE}/${blogId}`);
  return response.data;
}

export const addComment = async (commentDto) => {
  const response = await axios.post(`${API_BASE}/create`, commentDto);
  return response.data;
}

