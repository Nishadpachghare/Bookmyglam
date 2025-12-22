import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // If no token → show toast and redirect to login immediately (no render)
  if (!token) {
    // Show toast once (check if already shown to avoid duplicates on re-render)
    if (!sessionStorage.getItem("loginToastShown")) {
      toast("Please log in to continue", { icon: "🔒" });
      sessionStorage.setItem("loginToastShown", "true");
    }
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Clear the flag when user is authenticated
  sessionStorage.removeItem("loginToastShown");

  // If logged in → render the page
  return children;
};

export default ProtectedRoute;
