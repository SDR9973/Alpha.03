// src/utils/api.js

// Base URL for API requests
const API_BASE_URL = 'http://localhost:8000';

/**
 * Get the authentication token from local storage
 * @returns {string|null} The authentication token or null if not found
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Make an API request with the proper headers
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise} Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
};

/**
 * Upload a file to the API
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - Form data containing the file
 * @param {function} onProgress - Optional progress callback
 * @returns {Promise} Upload promise
 */
export const uploadFile = (endpoint, formData, onProgress = null) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${endpoint}`);

    // Add token to request headers
    const token = getToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Add progress handler
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject({
          status: xhr.status,
          data: xhr.responseText ? JSON.parse(xhr.responseText) : { error: 'Upload failed' },
        });
      }
    };

    xhr.onerror = () => {
      reject({
        status: xhr.status || 500,
        data: { error: 'Network error' }
      });
    };

    xhr.send(formData);
  });
};

// API utility functions for common operations
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials) => apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    register: (userData) => apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    googleAuth: (userData) => apiRequest('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  },

  // User endpoints
  users: {
    getAll: () => apiRequest('/users'),
    update: (userId, userData) => apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
    delete: (userId) => apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    }),
    uploadAvatar: (formData, onProgress) => uploadFile('/upload-avatar', formData, onProgress),
  },

  // Research endpoints
  research: {
    getAll: () => apiRequest('/research'),
    getById: (researchId) => apiRequest(`/research/${researchId}`),
    getAnalyses: (researchId) => apiRequest(`/research/${researchId}/analyses`),
    save: (formData) => apiRequest('/save-form', {
      method: 'POST',
      body: JSON.stringify(formData),
    }),
    delete: (researchId) => apiRequest(`/research/${researchId}`, {
      method: 'DELETE',
    }),
  },

  // File endpoints
  files: {
    upload: (formData, onProgress) => uploadFile('/upload', formData, onProgress),
    delete: (filename) => apiRequest(`/delete/${filename}`, {
      method: 'DELETE',
    }),
    uploadChats: (formData, onProgress) => uploadFile('/upload-chats', formData, onProgress),
  },

  // Network analysis endpoints
  network: {
    analyze: (filename, params) => apiRequest(`/analyze/network/${filename}?${params}`),
    analyzeCommunities: (filename, params) => apiRequest(`/analyze/communities/${filename}?${params}`),
    analyzeComparison: (filename, params) => apiRequest(`/analyze/comparison/${filename}?${params}`),
    compareNetworks: (params) => apiRequest(`/analyze/compare-networks?${params}`),
    getAnalysis: (analysisId) => apiRequest(`/analyses/${analysisId}`),
    getAnalysisCommunities: (analysisId) => apiRequest(`/analyses/${analysisId}/communities`),
  },

  // Wikipedia data endpoints
  wikipedia: {
    fetchData: (url) => apiRequest('/fetch-wikipedia-data', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  },
};