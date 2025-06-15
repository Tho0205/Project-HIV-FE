const BASE_URL = "https://localhost:7243/api/arv";

export const getAllARVs = async () => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Lấy danh sách ARV thất bại");
  return await res.json();
};

export const createARV = async (arvData) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arvData),
  });
  if (!res.ok) throw new Error("Tạo ARV thất bại");
  return await res.json();
};

export const updateARV = async (id, arvData) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arvData),
  });
  if (!res.ok) throw new Error("Cập nhật ARV thất bại");
  return true;
};

export const deleteARV = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Xoá ARV thất bại");
  return true;
};

// Không cần export default