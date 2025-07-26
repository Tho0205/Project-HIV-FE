import { apiRequest } from "./account";
const API_BASE = "https://localhost:7243/api/DashBoard";

export const getAllPatient = async () => {
  const response = await apiRequest(`${API_BASE}/TotalUsers`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  return data;
};
export const getAllExam = async () => {
  const response = await apiRequest(`${API_BASE}/TotalExams`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  return data;
};
export const getAllMedicalRecord = async () => {
  const response = await apiRequest(`${API_BASE}/TotalMedicalRecords`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  return data;
};
export const getAllArvProtocol = async () => {
  const response = await apiRequest(`${API_BASE}/TotalARVProtocols`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  return data;
};
export const getPatietnByGender = async () => {
  const response = await apiRequest(`${API_BASE}/PatientsByGender`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  return data;
};
export const getProtocolStat = async () => {
  const response = await apiRequest(`${API_BASE}/ARVProtocolStats`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  return data;
};
export const getNewUsermonthly = async () => {
  const response = await apiRequest(`${API_BASE}/NewUsersPerMonth`);
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  return data;
};
