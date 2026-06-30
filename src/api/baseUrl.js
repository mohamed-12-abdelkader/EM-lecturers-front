import axios from "axios";
import { clearAuthSession } from "../utils/authStorage";
import { getApiBaseURL } from "./apiConfig";

const baseUrl = axios.create({
  baseURL: getApiBaseURL(),
});

// Response interceptor to handle token expiration globally
baseUrl.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const apiMessage = error?.response?.data?.message;

      if (
        apiMessage === "Session expired or replaced" ||
        apiMessage?.includes("expired") ||
        apiMessage?.includes("انتهت") ||
        apiMessage?.includes("غير صالح")
      ) {
        try {
          clearAuthSession();
          localStorage.removeItem("examAnswers");
          localStorage.removeItem("examTimeLeft");
        } catch (e) {
          console.error("Error clearing localStorage:", e);
        }

        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/signup"
        ) {
          error.sessionExpired = true;
        }
      }
    }

    return Promise.reject(error);
  },
);

export default baseUrl;
