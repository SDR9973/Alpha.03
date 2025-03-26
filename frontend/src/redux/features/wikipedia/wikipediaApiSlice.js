// src/redux/features/wikipedia/wikipediaApiSlice.js
import { apiSlice } from '../../api/apiSlice';
import { setNetworkData, setOriginalNetworkData, setNetworkStatus, setNetworkError } from '../network/networkSlice';

export const wikipediaApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    fetchWikipediaData: builder.mutation({
      query: (wikiUrl) => ({
        url: '/fetch-wikipedia-data',
        method: 'POST',
        body: { url: wikiUrl },
      }),
      async onQueryStarted(wikiUrl, { dispatch, queryFulfilled }) {
        dispatch(setNetworkStatus('loading'));
        try {
          const { data } = await queryFulfilled;

          if (data.nodes && data.links) {
            // Process the data to ensure all IDs are strings
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
              file_id: data.file_id,
            };

            dispatch(setNetworkData(processedData));
            dispatch(setOriginalNetworkData(processedData));
            dispatch(setNetworkStatus('succeeded'));
          } else {
            dispatch(setNetworkError('No valid network data found on this Wikipedia page'));
          }
        } catch (error) {
          dispatch(setNetworkError(error.error?.data?.error || 'Error fetching Wikipedia data'));
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useFetchWikipediaDataMutation,
} = wikipediaApiSlice;