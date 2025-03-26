// src/redux/features/auth/authApiSlice.js
import { apiSlice } from '../../api/apiSlice';
import { setCredentials, logoutUser, setAuthError } from './authSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (error) {
          dispatch(setAuthError(error.error?.data?.detail || 'Login failed'));
        }
      },
    }),

    register: builder.mutation({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
    }),

    googleAuth: builder.mutation({
      query: (userData) => ({
        url: '/api/auth/google',
        method: 'POST',
        body: userData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (error) {
          dispatch(setAuthError(error.error?.data?.detail || 'Google authentication failed'));
        }
      },
    }),

    updateProfile: builder.mutation({
      query: ({ userId, userData }) => ({
        url: `/users/${userId}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    uploadAvatar: builder.mutation({
      query: (formData) => ({
        url: '/upload-avatar',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['User'],
    }),

    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logoutUser());
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      },
    }),

    getAllUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleAuthMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteUserMutation,
  useGetAllUsersQuery,
} = authApiSlice;