import axios from "axios";
import accessToken from "./jwt-token-access/accessToken";
import { toast } from "react-toastify";

// base URL from .env with fallback
// Dev: default to http://localhost:5000/api if not provided
// Prod: default to same-origin /api to avoid mixed-content
const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const axiosApi = axios.create({
  baseURL: API_URL,
});

// default headers
axiosApi.defaults.headers.common["Authorization"] = accessToken;

// Add Authorization header automatically if token exists
axiosApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Normalize URL: if it's a relative path starting with "/",
  // remove the leading slash so axios correctly appends to baseURL path (e.g., /api)
  if (typeof config.url === "string") {
    const isAbsolute = /^https?:\/\//i.test(config.url);
    if (!isAbsolute && config.url.startsWith("/")) {
      config.url = config.url.slice(1);
    }
  }
  return config;
});

// Track if we're already showing the session expiry alert to prevent multiple toasts
let isSessionExpiredAlertShowing = false;

// Response interceptor
axiosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      
      // Check both 'message' and 'msg' fields (backend uses both)
      const errorMsg = (errorData?.message || errorData?.msg || error?.message || "").toString().toLowerCase();

      const looksExpired =
        errorMsg.includes("jwt exp") ||
        errorMsg.includes("jwt expired") ||
        errorMsg.includes("token expired") ||
        errorMsg.includes("token is not valid") ||
        errorMsg.includes("not valid") ||
        errorMsg.includes("unauthorized") ||
        errorMsg.includes("invalid token");

      // Trigger logout on 401 OR any token-related error message
      if (status === 401 || looksExpired) {
        // Show alert only if not already showing
        if (!isSessionExpiredAlertShowing) {
          isSessionExpiredAlertShowing = true;
          
          // Show session expired alert
          toast.error("Your session has expired. Please login again.");
          
          console.log("🔴 JWT expired or unauthorized detected!");
          console.log("🔴 Status:", status, "| Message:", errorMsg);
        }
        
        // Clear ALL localStorage and force navigation to login after a short delay
        try {
          // Reset the flag after a delay
          setTimeout(() => {
            isSessionExpiredAlertShowing = false;
          }, 4000);
          
          localStorage.clear();
          console.log("🗑️ Cleared all localStorage");
          
          // Dispatch custom event to notify auth middleware immediately
          window.dispatchEvent(new Event("authTokenRemoved"));
          console.log("📢 Dispatched authTokenRemoved event");
        } catch (e) {
          console.error("Error clearing storage:", e);
        }

        // Avoid redirect loops if we're already on the login page
        const isOnLogin = typeof window !== "undefined" && window.location.pathname.startsWith("/login");
        if (!isOnLogin && typeof window !== "undefined") {
          // Delay redirect slightly to let the alert be visible
          setTimeout(() => {
            console.log("🔄 Redirecting to login page...");
            window.location.replace("/login");
          }, 1500);
        } else {
          console.log("⚠️ Already on login page, skipping redirect");
        }
      }
    } catch (e) {
      console.error("Error in response interceptor:", e);
    }

    return Promise.reject(error);
  }
);

export async function get(url, config = {}) {
  return axiosApi.get(url, { ...config }).then((res) => res.data);
}

export async function post(url, data, config = {}) {
  console.log("📤 POST request to:", url);
  const isAbsolute = /^https?:\/\//i.test(url);
  const fullUrl = isAbsolute ? url : `${API_URL}${url}`;
  console.log("📤 Full URL will be:", fullUrl);
  return axiosApi.post(url, data, { ...config }).then((res) => res.data);
}

export async function put(url, data, config = {}) {
  return axiosApi.put(url, data, { ...config }).then((res) => res.data);
}

export async function del(url, config = {}) {
  return axiosApi.delete(url, { ...config }).then((res) => res.data);
}

// ✅ Add this to fix the "default export" issue
export default axiosApi;

