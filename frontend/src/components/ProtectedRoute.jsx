import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useUser();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role_name !== role && user.role !== role)
    return <Navigate to="/profile" replace />;
  return children;
};

export default ProtectedRoute;
