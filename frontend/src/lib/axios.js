import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  timeout: 15000,
});

axiosInstance.interceptors.request.use((config) => {
  console.log("Request URL:", config.baseURL + config.url);
  return config;
});

export default axiosInstance;