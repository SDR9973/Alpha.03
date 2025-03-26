// src/redux/features/files/filesSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uploadedFiles: [],
  currentFile: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  uploadProgress: 0,
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setUploadedFiles: (state, action) => {
      state.uploadedFiles = action.payload;
    },
    setCurrentFile: (state, action) => {
      state.currentFile = action.payload;
    },
    addUploadedFile: (state, action) => {
      state.uploadedFiles.push(action.payload);
    },
    removeUploadedFile: (state, action) => {
      state.uploadedFiles = state.uploadedFiles.filter(
        (file) => file.filename !== action.payload
      );
      if (state.currentFile?.filename === action.payload) {
        state.currentFile = null;
      }
    },
    setFileStatus: (state, action) => {
      state.status = action.payload;
    },
    setFileError: (state, action) => {
      state.error = action.payload;
      state.status = 'failed';
    },
    clearFileError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
  },
});

export const {
  setUploadedFiles,
  setCurrentFile,
  addUploadedFile,
  removeUploadedFile,
  setFileStatus,
  setFileError,
  clearFileError,
  setUploadProgress,
} = filesSlice.actions;

// Selectors
export const selectUploadedFiles = (state) => state.files.uploadedFiles;
export const selectCurrentFile = (state) => state.files.currentFile;
export const selectFileStatus = (state) => state.files.status;
export const selectFileError = (state) => state.files.error;
export const selectUploadProgress = (state) => state.files.uploadProgress;

export default filesSlice.reducer;