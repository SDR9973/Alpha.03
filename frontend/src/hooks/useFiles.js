// src/hooks/useFiles.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectUploadedFiles,
  selectCurrentFile,
  selectFileStatus,
  selectFileError,
  selectUploadProgress,
  setCurrentFile,
  setFileStatus,
  setFileError,
  clearFileError,
  setUploadProgress,
} from '../redux/features/files/filesSlice';

import {
  useUploadFileMutation,
  useDeleteFileMutation,
  useUploadChatFileMutation,
} from '../redux/features/files/filesApiSlice';

/**
 * Custom hook for working with file uploads and management
 */
export const useFiles = () => {
  const dispatch = useDispatch();

  // Selectors
  const uploadedFiles = useSelector(selectUploadedFiles);
  const currentFile = useSelector(selectCurrentFile);
  const status = useSelector(selectFileStatus);
  const error = useSelector(selectFileError);
  const uploadProgress = useSelector(selectUploadProgress);

  // RTK Query hooks
  const [uploadFileMutation, { isLoading: isUploading }] = useUploadFileMutation();
  const [deleteFileMutation, { isLoading: isDeleting }] = useDeleteFileMutation();
  const [uploadChatFileMutation, { isLoading: isUploadingChat }] = useUploadChatFileMutation();

  // Action handlers
  const handleUploadFile = useCallback(async (file) => {
    try {
      dispatch(setFileStatus('loading'));
      dispatch(setUploadProgress(0));

      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadFileMutation(formData).unwrap();

      dispatch(setFileStatus('succeeded'));
      dispatch(setCurrentFile(result));

      return result;
    } catch (error) {
      dispatch(setFileStatus('failed'));
      dispatch(setFileError(error.error?.data?.error || 'Upload failed'));
      return Promise.reject(error);
    }
  }, [dispatch, uploadFileMutation]);

  const handleDeleteFile = useCallback(async (filename) => {
    try {
      dispatch(setFileStatus('loading'));

      await deleteFileMutation(filename).unwrap();

      dispatch(setFileStatus('succeeded'));
      if (currentFile?.filename === filename) {
        dispatch(setCurrentFile(null));
      }

      return { success: true };
    } catch (error) {
      dispatch(setFileStatus('failed'));
      dispatch(setFileError(error.error?.data?.error || 'Delete failed'));
      return Promise.reject(error);
    }
  }, [dispatch, deleteFileMutation, currentFile]);

  const handleUploadChatFile = useCallback(async (file) => {
    try {
      dispatch(setFileStatus('loading'));
      dispatch(setUploadProgress(0));

      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadChatFileMutation(formData).unwrap();

      dispatch(setFileStatus('succeeded'));
      dispatch(setCurrentFile(result));

      return result;
    } catch (error) {
      dispatch(setFileStatus('failed'));
      dispatch(setFileError(error.error?.data?.error || 'Chat upload failed'));
      return Promise.reject(error);
    }
  }, [dispatch, uploadChatFileMutation]);

  return {
    // State
    uploadedFiles,
    currentFile,
    status,
    error,
    uploadProgress,
    isUploading,
    isDeleting,
    isUploadingChat,

    // Actions
    uploadFile: handleUploadFile,
    deleteFile: handleDeleteFile,
    uploadChatFile: handleUploadChatFile,

    // Dispatch wrappers
    setCurrentFile: (file) => dispatch(setCurrentFile(file)),
    clearError: () => dispatch(clearFileError()),
  };
};