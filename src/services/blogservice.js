import { apiRequest } from "./account";
const API_BASE = "https://localhost:7243/api/blog";

export const getAllBlogs = async () => {
  const response = await apiRequest(`${API_BASE}/list`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null); // Tránh lỗi JSON
  return data;
};

export const getBlogById = async (id) => {
  const response = await apiRequest(`${API_BASE}/${id}`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null); // Tránh lỗi JSON
  return data;
};

export const createBlog = async (blogData) => {
  const response = await apiRequest(`${API_BASE}/create`, {
    method: "POST",
    body: JSON.stringify(blogData),
  });
  return await response.json();
};

export const updateBlog = async (id, blogData) => {
  const response = await apiRequest(`${API_BASE}/update?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(blogData),
  });
  return await response.json();
};

export const approveBlog = async (id) => {
  const response = await apiRequest(`${API_BASE}/approve/${id}`, {
    method: "PUT",
  });
  return await response.json();
};

export const deleteBlog = async (id) => {
  const response = await apiRequest(`${API_BASE}/delete/${id}`, {
    method: "DELETE",
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null); // Tránh lỗi JSON
  return data;
};

export const uploadBlogImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiRequest(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!data.imageUrl) throw new Error("Server không trả về đường dẫn ảnh");
  return data.imageUrl;
};
