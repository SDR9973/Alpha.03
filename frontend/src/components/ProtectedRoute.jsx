// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

/**
 * Protected Route component that checks for authentication
 * If user is authenticated, renders the child routes (Outlet)
 * If not, redirects to the login page
 */
const ProtectedRoute = () => {
  const { isAuthenticated, token } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to login page with return path
  if (!isAuthenticated || !token) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  // Render child routes
  return <Outlet />;
};

export default ProtectedRoute;