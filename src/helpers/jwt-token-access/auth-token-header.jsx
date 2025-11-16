import api, { post } from ".././api_helper";

export const login = async (username, password) => {
  console.log("🔐 Starting login process for user:", username);
  console.log("🔐 Using API helper post function");
  try {
    const res = await post("auth/login", { username, password });
    console.log("✅ Login API response:", res);
    
    if (res.token) {
      localStorage.setItem("authToken", res.token);
      localStorage.setItem("UmmahAidUser", JSON.stringify(res.userInfo));
      console.log("💾 Stored authToken and UmmahAidUser in localStorage");
    }
    
    console.log("🚀 Returning login response:", res);
    return res;
  } catch (error) {
    console.error("❌ Login API error:", error);
    throw error;
  }
};

export const logout = () => {
  console.log("🔴 Logging out - clearing all localStorage");
  // Clear ALL localStorage variables
  localStorage.clear();
  console.log("✅ All localStorage cleared");
};
