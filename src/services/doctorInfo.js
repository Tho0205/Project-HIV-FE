const API_BASE = 'https://localhost:7243/api/DoctorInfo';

export const getDotorInfo = async () => {
  try {
    const response = await fetch(API_BASE, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);
    return data;
  } catch (error) {
    console.error("Lỗi khi gọi API DoctorInfo:", error);
    return null;
  }
};
