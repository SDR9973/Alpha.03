// src/providers/AuthProvider.jsx
import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectCurrentUser,
  selectToken,
  selectIsAuthenticated,
  selectAuthStatus,
  selectAuthError,
  setCredentials,
  logoutUser
} from '../redux/features/auth/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
  useGoogleAuthMutation,
  useUpdateProfileMutation,
  useDeleteUserMutation
} from '../redux/features/auth/authApiSlice';

// Create context
const AuthContext = createContext(null);

// Hook for consuming the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get auth state from Redux store
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  // RTK Query mutation hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [googleAuth, { isLoading: isGoogleAuthLoading }] = useGoogleAuthMutation();
  const [updateProfile, { isLoading: isUpdateProfileLoading }] = useUpdateProfileMutation();
  const [deleteAccount, { isLoading: isDeleteAccountLoading }] = useDeleteUserMutation();

  // Check token on initial load
  useEffect(() => {
    // If token exists in localStorage but not in Redux, set it
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser && !token) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch(setCredentials({
          user: userData,
          access_token: storedToken
        }));
      } catch (error) {
        console.error('Error parsing stored user data', error);
        // Clear invalid user data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, [dispatch, token]);

  // Login handler
  const handleLogin = async (credentials) => {
    try {
      const userData = await login(credentials).unwrap();
      dispatch(setCredentials(userData));
      navigate('/profile');
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Register handler
  const handleRegister = async (userData) => {
    try {
      const result = await register(userData).unwrap();
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // Google login handler
  const handleGoogleLogin = async (userData) => {
    try {
      const result = await googleAuth(userData).unwrap();
      dispatch(setCredentials(result));
      navigate('/profile');
      return result;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  // Update profile handler
  const handleUpdateProfile = async (userId, userData) => {
    try {
      const result = await updateProfile({ userId, userData }).unwrap();
      // Update the user in Redux store
      if (result) {
        dispatch(setCredentials({
          user: { ...user, ...result },
          access_token: token
        }));
      }
      return result;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  // Delete account handler
  const handleDeleteAccount = async (userId) => {
    try {
      await deleteAccount(userId).unwrap();
      dispatch(logoutUser());
      navigate('/sign-in');
      return { success: true };
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  };

  // Logout handler
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/sign-in');
  };

  // Context value
  const value = {
    user,
    token,
    isAuthenticated,
    status,
    error,
    isLoading: isLoginLoading || isRegisterLoading || isGoogleAuthLoading ||
               isUpdateProfileLoading || isDeleteAccountLoading,
    login: handleLogin,
    register: handleRegister,
    googleLogin: handleGoogleLogin,
    updateProfile: handleUpdateProfile,
    deleteAccount: handleDeleteAccount,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};