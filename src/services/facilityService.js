import axios from "axios";

const API = "https://localhost:7243/api/facility/list";

export const getFacilityInfo = async () => {
  try {
    const response = await axios.get(API);
    return response.data;
  } catch (error) {
    console.error("Error fetching facility data:", error);
    throw error; // Rethrow the error to handle it in the component
  }
}