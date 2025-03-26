// src/redux/features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Try to load user from localStorage if available
const getUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error loading user from localStorage', error);
    return null;
  }
};

const getTokenFromStorage = () => {
  try {
    return localStorage.getItem('token') || null;
  } catch (error) {
    console.error('Error loading token from localStorage', error);
    return null;
  }
};

const initialState = {
  user: getUserFromStorage(),
  token: getTokenFromStorage(),
  isAuthenticated: !!getTokenFromStorage(),
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, access_token } = action.payload;
      state.user = user;
      state.token = access_token;
      state.isAuthenticated = true;

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', access_token);
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';

      // Remove from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    setAuthStatus: (state, action) => {
      state.status = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.status = 'failed';
    },
  },
});

export const {
  setCredentials,
  updateUser,
  logoutUser,
  setAuthStatus,
  setAuthError
} = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;