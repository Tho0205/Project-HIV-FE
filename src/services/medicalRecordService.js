import { apiRequest } from "./account";

const API_BASE = "https://localhost:7243/api/MedicalRecord";

export const getAllMedicalRecords = async () => {
  const response = await apiRequest(`${API_BASE}`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

export const getMedicalRecordById = async (id) => {
  const response = await apiRequest(`${API_BASE}/${id}`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Hàm mới để lấy thông tin chi tiết của medical record
export const getMedicalRecordDetail = async (id) => {
  const response = await apiRequest(`${API_BASE}/${id}/detail`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

export const createMedicalRecord = async (data) => {
  const response = await apiRequest(`${API_BASE}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return await response.json();
};

// Tạo medical record từ appointmentId
export const createMedicalRecordByAppointment = async (data) => {
  const response = await apiRequest(`${API_BASE}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return await response.json();
};

export const updateMedicalRecord = async (id, data) => {
  const response = await apiRequest(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.status === 204 ? true : await response.json();
};

export const deleteMedicalRecord = async (id) => {
  const response = await apiRequest(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (response.status === 204) return true;
  return await response.json().catch(() => null);
};

export const getMedicalRecordsByDoctor = async (doctorId) => {
  const response = await apiRequest(`${API_BASE}/doctor/${doctorId}`);
  if (response.status === 204) return [];
  return await response.json().catch(() => []);
};

export const getMedicalRecordsByPatient = async (patientId) => {
  const response = await apiRequest(`${API_BASE}/patient/${patientId}`);
  if (response.status === 204) return [];
  return await response.json().catch(() => []);
};

// Lấy danh sách bệnh nhân của doctor
export const getDoctorPatients = async (doctorId) => {
  const response = await apiRequest(`${API_BASE}/doctor/${doctorId}/patients`);
  if (response.status === 204) return [];
  return await response.json().catch(() => []);
};

// Lấy medical records của 1 bệnh nhân cho doctor
export const getPatientRecordsForDoctor = async (doctorId, patientId) => {
  const response = await apiRequest(`${API_BASE}/doctor/${doctorId}/patient/${patientId}`);
  if (response.status === 204) return [];
  return await response.json().catch(() => []);
};