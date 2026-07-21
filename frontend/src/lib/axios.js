import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  timeout: 45000, // increased from 15000 to cover backend's full retry chain (~37s worst case)
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log("Request:", config.method?.toUpperCase(), config.baseURL + config.url);
    }
    return config;
  },
  (error) => {
    console.error("Request setup error:", error.message);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, config } = error.response;
      const url = (config?.baseURL || "") + (config?.url || "");

      if (status === 404) {
        console.error(
          `404 Not Found: ${url}\nThis route does not exist on the server. Check that the backend has this route registered and deployed.`
        );
      } else if (status === 401) {
        console.error(`401 Unauthorized: ${url}\nAuth token missing or invalid.`);
      } else if (status === 503) {
        console.error(
          `503 Service Unavailable: ${url}\nAI service failed after all retries. Check backend logs for the root cause (invalid API key, model errors, or JSON parse failures).`
        );
      } else if (status >= 500) {
        console.error(`${status} Server Error: ${url}\nCheck backend logs.`);
      } else {
        console.error(`${status} error on ${url}`);
      }
    } else if (error.request) {
      console.error("No response received. Server may be down, unreachable, or too slow:", error.message);
    } else {
      console.error("Axios error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
