// src/redux/features/files/filesApiSlice.js
import { apiSlice } from '../../api/apiSlice';
import {
  addUploadedFile,
  removeUploadedFile,
  setFileStatus,
  setFileError,
  setUploadProgress,
} from './filesSlice';

// Custom fetch base query with upload progress
const customFetchBaseQuery = ({ baseUrl }) => async (args, api, extraOptions) => {
  const { dispatch } = api;
  const { url, method, body } = args;

  if (body instanceof FormData && method === 'POST') {
    dispatch(setFileStatus('loading'));
    dispatch(setUploadProgress(0));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, baseUrl + url);

      // Add headers from the current request (including auth token)
      const token = api.getState().auth.token;
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          dispatch(setUploadProgress(progress));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          dispatch(setFileStatus('succeeded'));
          resolve({ data: JSON.parse(xhr.responseText) });
        } else {
          dispatch(setFileStatus('failed'));
          reject({
            status: xhr.status,
            data: xhr.responseText ? JSON.parse(xhr.responseText) : { error: 'Upload failed' },
          });
        }
      };

      xhr.onerror = () => {
        dispatch(setFileStatus('failed'));
        reject({
          status: xhr.status || 500,
          data: { error: 'Network error' }
        });
      };

      xhr.send(body);
    });
  }

  // For non-file uploads, use the regular fetch
  return api.baseQuery(args, api, extraOptions);
};

export const filesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(addUploadedFile({
            filename: data.filename,
            originalName: arg.get('file').name,
            id: data.id
          }));
        } catch (error) {
          dispatch(setFileError(error.error?.data?.error || 'Upload failed'));
        }
      },
    }),

    deleteFile: builder.mutation({
      query: (filename) => ({
        url: `/delete/${filename}`,
        method: 'DELETE',
      }),
      async onQueryStarted(filename, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(removeUploadedFile(filename));
        } catch (error) {
          dispatch(setFileError(error.error?.data?.error || 'Delete failed'));
        }
      },
    }),

    uploadChatFile: builder.mutation({
      query: (formData) => ({
        url: '/upload-chats',
        method: 'POST',
        body: formData,
        formData: true,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadFileMutation,
  useDeleteFileMutation,
  useUploadChatFileMutation,
} = filesApiSlice;