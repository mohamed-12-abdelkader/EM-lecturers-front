import axios from "axios";
import { clearAuthSession } from "../utils/authStorage";

/**
 * في التطوير: base نسبي → الطلبات إلى نفس host الصفحة (مثل mohamed.localhost:3000)
 * فيمرّ الـ Vite proxy (/api → 8000) ولا يحدث CORS بين النطاق الفرعي والباكند.
 * للإنتاج: عيّن VITE_API_BASE_URL لعنوان الـ API الحقيقي واضبط CORS على السيرفر.
 */
function getApiBaseURL() {
  if (import.meta.env.DEV) {
    return "/";
  }
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/?$/, "/");
  }
  return "http://api.em-online.online/";
}

const baseUrl = axios.create({
  baseURL: getApiBaseURL(),
});

// Response interceptor to handle token expiration globally
baseUrl.interceptors.response.use(
  (response) => {
    // If the request succeeds, return the response
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      const apiMessage = error?.response?.data?.message;

      // Check if it's a session expired error
      if (
        apiMessage === "Session expired or replaced" ||
        apiMessage?.includes("expired") ||
        apiMessage?.includes("انتهت") ||
        apiMessage?.includes("غير صالح")
      ) {
        // Clear local storage
        try {
          clearAuthSession();
          localStorage.removeItem("examAnswers");
          localStorage.removeItem("examTimeLeft");
        } catch (e) {
          console.error("Error clearing localStorage:", e);
        }

        // Only redirect if we're not already on the login page
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/signup"
        ) {
          // Store the error message in the error response so components can handle it
          error.sessionExpired = true;
        }
      }
    }

    // Return the error so components can still handle it
    return Promise.reject(error);
  },
);

export default baseUrl;
