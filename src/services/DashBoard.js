import { apiRequest } from "./account";
const API_BASE = "https://localhost:7243/api/DashBoard";

// Tổng số bệnh nhân
export const getAllPatient = async () => {
  const response = await apiRequest(`${API_BASE}/TotalUsers`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Tổng số lượt khám
export const getAllExam = async () => {
  const response = await apiRequest(`${API_BASE}/TotalExams`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Tổng số hồ sơ bệnh án
export const getAllMedicalRecord = async () => {
  const response = await apiRequest(`${API_BASE}/TotalMedicalRecords`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Tổng số phác đồ ARV
export const getAllArvProtocol = async () => {
  const response = await apiRequest(`${API_BASE}/TotalARVProtocols`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Bệnh nhân theo giới tính
export const getPatietnByGender = async () => {
  const response = await apiRequest(`${API_BASE}/PatientsByGender`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Bệnh nhân theo nhóm tuổi
export const getPatientByAgeGroup = async () => {
  const response = await apiRequest(`${API_BASE}/PatientsByAgeGroup`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Thống kê phác đồ ARV
export const getProtocolStat = async () => {
  const response = await apiRequest(`${API_BASE}/ARVProtocolStats`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Tiếp nhận bệnh nhân mới theo tháng
export const getNewUserMonthly = async () => {
  const response = await apiRequest(`${API_BASE}/NewUsersPerMonth`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Lịch hẹn theo tháng
export const getAppointmentPerMonth = async () => {
  const response = await apiRequest(`${API_BASE}/AppointmentsPerMonth`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};

// Lịch hẹn theo bác sĩ
export const getAppointmentByDoctor = async () => {
  const response = await apiRequest(`${API_BASE}/AppointmentsByDoctor`);
  if (response.status === 204) return null;
  return await response.json().catch(() => null);
};
