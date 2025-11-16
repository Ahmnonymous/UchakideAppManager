import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const Authmiddleware = (props) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem("authToken"));
  
  useEffect(() => {
    // Check token on mount and periodically
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      setAuthToken(token);
    };

    // Check immediately
    checkAuth();

    // Listen for storage events (when token is removed by interceptor or other tabs)
    const handleStorageChange = (e) => {
      if (e.key === "authToken" || e.key === null) {
        checkAuth();
      }
    };

    // Listen for custom event dispatched by API interceptor
    const handleAuthTokenRemoved = () => {
      console.log("🔴 Auth token removed event detected");
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authTokenRemoved", handleAuthTokenRemoved);

    // Also check periodically in case the interceptor removes the token
    const interval = setInterval(checkAuth, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authTokenRemoved", handleAuthTokenRemoved);
      clearInterval(interval);
    };
  }, []);
  
  if (!authToken) {
    console.log("🔒 No auth token found, redirecting to login...");
    return (
      <Navigate to={{ pathname: "/login", state: { from: props.location } }} replace />
    );
  }
  
  return <React.Fragment>{props.children}</React.Fragment>;
};

export default Authmiddleware;
