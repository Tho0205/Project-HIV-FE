import axios from "axios";

const API_BASE = "https://localhost:7243/api/blog";

export const getAllBlogs = async () => {
  const response = await axios.get(`${API_BASE}/list`);
  return response.data;
};

export const getBlogById = async (id) => {
  const response = await axios.get(`${API_BASE}/${id}`);
  return response.data;
};

export const createBlog = async (blogData) => {
  const responce = await axios.post(`${API_BASE}/create`, blogData)
  return responce.data;
}
export const updateBlog = async (id, blogData) => {
  const response = await axios.put(`${API_BASE}/update?id=${id}`, blogData);
  return response.data;
};

export const approveBlog = async (id) => {
  const response = await axios.put(`${API_BASE}/approve/${id}`);
  return response.data;
};

export const deleteBlog = async (id) => {
  const response = await axios.delete(`${API_BASE}/delete/${id}`);
  return response.data;
};
export const uploadBlogImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.data.imageUrl) {
      throw new Error('Server không trả về đường dẫn ảnh');
    }
    
    return response.data.imageUrl;
  } catch (error) {
    console.error('Chi tiết lỗi upload:', {
      config: error.config,
      response: error.response?.data
    });
    throw error;
  }
};