// src/redux/features/research/researchApiSlice.js
import { apiSlice } from '../../api/apiSlice';
import {
  setResearchProjects,
  setCurrentResearch,
  setResearchAnalyses,
  setResearchError,
  addResearchProject,
  removeResearchProject,
} from './researchSlice';

export const researchApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllResearch: builder.query({
      query: () => '/research',
      providesTags: ['Research'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setResearchProjects(data));
        } catch (error) {
          dispatch(setResearchError(error.error?.data?.detail || 'Error fetching research projects'));
        }
      },
    }),

    getResearchById: builder.query({
      query: (researchId) => `/research/${researchId}`,
      providesTags: (result, error, id) => [{ type: 'Research', id }],
      async onQueryStarted(researchId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCurrentResearch(data));
        } catch (error) {
          dispatch(setResearchError(error.error?.data?.detail || 'Error fetching research details'));
        }
      },
    }),

    getResearchAnalyses: builder.query({
      query: (researchId) => `/research/${researchId}/analyses`,
      providesTags: (result, error, id) => [
        { type: 'Analysis', id: `Research-${id}` },
      ],
      async onQueryStarted(researchId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setResearchAnalyses(data));
        } catch (error) {
          dispatch(setResearchError(error.error?.data?.detail || 'Error fetching research analyses'));
        }
      },
    }),

    saveResearchForm: builder.mutation({
      query: (formData) => ({
        url: '/save-form',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Research'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Add the new research with the returned ID to the store
          dispatch(addResearchProject({ ...arg, id: data.id }));
        } catch (error) {
          dispatch(setResearchError(error.error?.data?.detail || 'Error saving research'));
        }
      },
    }),

    deleteResearch: builder.mutation({
      query: (researchId) => ({
        url: `/research/${researchId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Research'],
      async onQueryStarted(researchId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(removeResearchProject(researchId));
        } catch (error) {
          dispatch(setResearchError(error.error?.data?.detail || 'Error deleting research'));
        }
      },
    }),

    // Analysis specific endpoints
    getAnalysisById: builder.query({
      query: (analysisId) => `/analyses/${analysisId}`,
      providesTags: (result, error, id) => [{ type: 'Analysis', id }],
    }),

    getAnalysisCommunities: builder.query({
      query: (analysisId) => `/analyses/${analysisId}/communities`,
      providesTags: (result, error, id) => [{ type: 'Analysis', id: `Communities-${id}` }],
    }),
  }),
});

export const {
  useGetAllResearchQuery,
  useGetResearchByIdQuery,
  useGetResearchAnalysesQuery,
  useSaveResearchFormMutation,
  useDeleteResearchMutation,
  useGetAnalysisByIdQuery,
  useGetAnalysisCommunitiesQuery,
} = researchApiSlice;