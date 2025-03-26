// src/redux/features/network/networkApiSlice.js
import { apiSlice } from '../../api/apiSlice';
import {
  setNetworkData,
  setOriginalNetworkData,
  setCommunities,
  setComparisonNetworkData,
  setNetworkStatus,
  setNetworkError,
  setFilterParams,
} from './networkSlice';

// Helper function to build network filter parameters
const buildNetworkFilterParams = (filters) => {
  const params = new URLSearchParams();

  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.messageLimit) params.append('limit', filters.messageLimit);
  if (filters.minMessageLength) params.append('min_length', filters.minMessageLength);
  if (filters.maxMessageLength) params.append('max_length', filters.maxMessageLength);
  if (filters.keywords) params.append('keywords', filters.keywords);
  if (filters.usernameFilter) params.append('username', filters.usernameFilter);
  if (filters.minMessages) params.append('min_messages', filters.minMessages);
  if (filters.maxMessages) params.append('max_messages', filters.maxMessages);
  if (filters.activeUsers) params.append('active_users', filters.activeUsers);
  if (filters.selectedUsers) params.append('selected_users', filters.selectedUsers);

  // Format time if needed
  const formatTime = (time) => {
    return time && time.length === 5 ? `${time}:00` : time;
  };

  if (filters.startTime) params.append('start_time', formatTime(filters.startTime));
  if (filters.endTime) params.append('end_time', formatTime(filters.endTime));
  if (filters.limitType) params.append('limit_type', filters.limitType);

  params.append('anonymize', filters.isAnonymized ? 'true' : 'false');

  return params.toString();
};

export const networkApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    analyzeNetwork: builder.query({
      query: ({ filename, filters }) => {
        const params = buildNetworkFilterParams(filters);
        return `/analyze/network/${filename}?${params}`;
      },
      async onQueryStarted({ filename, filters }, { dispatch, queryFulfilled }) {
        dispatch(setNetworkStatus('loading'));
        try {
          const { data } = await queryFulfilled;

          if (data.nodes && data.links) {
            // Process nodes to ensure all IDs are strings
            const processedData = {
              nodes: data.nodes.map(node => ({
                ...node,
                id: String(node.id),
              })),
              links: data.links.map(link => ({
                ...link,
                source: typeof link.source === 'object' ? String(link.source.id) : String(link.source),
                target: typeof link.target === 'object' ? String(link.target.id) : String(link.target),
              })),
              analysis_id: data.analysis_id,
            };

            dispatch(setNetworkData(processedData));
            dispatch(setOriginalNetworkData(processedData));
            dispatch(setNetworkStatus('succeeded'));

            // Save the filter parameters used
            const paramsString = buildNetworkFilterParams(filters);
            dispatch(setFilterParams(paramsString));
          } else {
            dispatch(setNetworkError('Invalid network data returned'));
          }
        } catch (error) {
          dispatch(setNetworkError(error.error?.data?.error || 'Network analysis failed'));
        }
      },
    }),

    analyzeCommunities: builder.query({
      query: ({ filename, filters }) => {
        const params = buildNetworkFilterParams(filters);
        return `/analyze/communities/${filename}?${params}`;
      },
      async onQueryStarted({ filename, filters }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data.communities) {
            dispatch(setCommunities(data.communities));

            // If there are nodes with community assignments, update network data
            if (data.nodes && data.nodes.length > 0 && data.nodes[0].community !== undefined) {
              dispatch(setNetworkData({
                nodes: data.nodes.map(node => ({
                  ...node,
                  id: String(node.id),
                })),
                links: data.links.map(link => ({
                  ...link,
                  source: typeof link.source === 'object' ? String(link.source.id) : String(link.source),
                  target: typeof link.target === 'object' ? String(link.target.id) : String(link.target),
                })),
              }));
            }
          }
        } catch (error) {
          dispatch(setNetworkError(error.error?.data?.error || 'Community analysis failed'));
        }
      },
    }),

    compareNetworks: builder.query({
      query: ({ originalFilename, comparisonFilename, filters, comparisonSettings }) => {
        const params = new URLSearchParams(buildNetworkFilterParams(filters));

        params.append('original_filename', originalFilename);
        params.append('comparison_filename', comparisonFilename);

        if (comparisonSettings) {
          if (comparisonSettings.nodeFilter) params.append('node_filter', comparisonSettings.nodeFilter);
          if (comparisonSettings.minWeight) params.append('min_weight', comparisonSettings.minWeight);
          if (comparisonSettings.highlightCommon) params.append('highlight_common', comparisonSettings.highlightCommon);
          if (comparisonSettings.metrics && comparisonSettings.metrics.length > 0) {
            params.append('metrics', comparisonSettings.metrics.join(','));
          }
        }

        return `/analyze/compare-networks?${params.toString()}`;
      },
    }),

    analyzeComparison: builder.query({
      query: ({ filename, filters }) => {
        const params = buildNetworkFilterParams(filters);
        return `/analyze/comparison/${filename}?${params}`;
      },
      async onQueryStarted({ filename, filters, index }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data.nodes && data.links) {
            const processedData = {
              nodes: data.nodes.map(node => ({
                ...node,
                id: String(node.id),
              })),
              links: data.links.map(link => ({
                ...link,
                source: typeof link.source === 'object' ? String(link.source.id) : String(link.source),
                target: typeof link.target === 'object' ? String(link.target.id) : String(link.target),
              })),
              filename: data.filename,
            };

            dispatch(setComparisonNetworkData({ index, data: processedData }));
          }
        } catch (error) {
          dispatch(setNetworkError(error.error?.data?.error || 'Comparison analysis failed'));
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useAnalyzeNetworkQuery,
  useLazyAnalyzeNetworkQuery,
  useAnalyzeCommunitiesQuery,
  useLazyAnalyzeCommunitiesQuery,
  useCompareNetworksQuery,
  useLazyCompareNetworksQuery,
  useAnalyzeComparisonQuery,
  useLazyAnalyzeComparisonQuery,
} = networkApiSlice;