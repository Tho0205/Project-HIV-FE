import axios from 'axios';

const API_BASE = 'https://localhost:7243/api/blog'; 

export const getAllBlogs = async () => {
  const response = await axios.get(`${API_BASE}/list`);
  return response.data;
};
