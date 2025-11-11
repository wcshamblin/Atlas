import React from "react";
import { Navigate } from "react-router-dom";

export const HomePage = () => {
  // Always redirect to map page - let it handle authentication
  return <Navigate to="/map" replace />;
};
