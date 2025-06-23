import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const shid = localStorage.getItem("shid");

  if (!shid) {
    // Not logged in, redirect to login
    return <Navigate to="/" replace />;
  }

  // Logged in, allow access
  return children;
};

export default ProtectedRoute;
