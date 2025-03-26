// src/hooks/useNetwork.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectNetworkData,
  selectOriginalNetworkData,
  selectCommunities,
  selectComparisonData,
  selectActiveComparisonIndices,
  selectVisualizationSettings,
  selectFilters,
  selectNetworkStatus,
  selectNetworkError,
  setNetworkData,
  setOriginalNetworkData,
  restoreOriginalNetworkData,
  setCommunities,
  toggleComparisonActive,
  updateVisualizationSettings,
  updateFilters,
  setNetworkStatus,
  setNetworkError,
  resetNetworkState,
} from '../redux/features/network/networkSlice';

import {
  useAnalyzeNetworkQuery,
  useLazyAnalyzeNetworkQuery,
  useAnalyzeCommunitiesQuery,
  useLazyAnalyzeCommunitiesQuery,
} from '../redux/features/network/networkApiSlice';

import { useFetchWikipediaDataMutation } from '../redux/features/wikipedia/wikipediaApiSlice';

import {
  standardizeGraphData,
  applyVisualizationSettings,
  filterNetworkData,
} from '../utils/networkUtils';

/**
 * Custom hook for working with network data and analysis
 */
export const useNetwork = () => {
  const dispatch = useDispatch();

  // Selectors
  const networkData = useSelector(selectNetworkData);
  const originalNetworkData = useSelector(selectOriginalNetworkData);
  const communities = useSelector(selectCommunities);
  const comparisonData = useSelector(selectComparisonData);
  const activeComparisonIndices = useSelector(selectActiveComparisonIndices);
  const visualizationSettings = useSelector(selectVisualizationSettings);
  const filters = useSelector(selectFilters);
  const status = useSelector(selectNetworkStatus);
  const error = useSelector(selectNetworkError);

  // RTK Query hooks
  const [analyzeNetwork] = useLazyAnalyzeNetworkQuery();
  const [analyzeCommunities] = useLazyAnalyzeCommunitiesQuery();
  const [fetchWikipediaData] = useFetchWikipediaDataMutation();

  // Action handlers
  const handleAnalyzeNetwork = useCallback((filename) => {
    return analyzeNetwork({ filename, filters });
  }, [analyzeNetwork, filters]);

  const handleAnalyzeCommunities = useCallback((filename) => {
    return analyzeCommunities({ filename, filters });
  }, [analyzeCommunities, filters]);

  const handleFetchWikipediaData = useCallback((url) => {
    return fetchWikipediaData(url);
  }, [fetchWikipediaData]);

  const handleUpdateVisualizationSettings = useCallback((settings) => {
    dispatch(updateVisualizationSettings(settings));

    // Apply visualization settings to the network data
    if (networkData) {
      const customizedData = applyVisualizationSettings(networkData, {
        ...visualizationSettings,
        ...settings,
      });
      dispatch(setNetworkData(customizedData));
    }
  }, [dispatch, networkData, visualizationSettings]);

  const handleUpdateFilters = useCallback((newFilters) => {
    dispatch(updateFilters(newFilters));
  }, [dispatch]);

  const handleRestoreOriginalNetwork = useCallback(() => {
    dispatch(restoreOriginalNetworkData());
  }, [dispatch]);

  const handleFilterNetwork = useCallback((filterCriteria) => {
    if (originalNetworkData) {
      const filteredData = filterNetworkData(originalNetworkData, filterCriteria);
      dispatch(setNetworkData(filteredData));
    }
  }, [dispatch, originalNetworkData]);

  const handleToggleComparison = useCallback((index) => {
    dispatch(toggleComparisonActive(index));
  }, [dispatch]);

  const handleResetNetworkState = useCallback(() => {
    dispatch(resetNetworkState());
  }, [dispatch]);

  return {
    // State
    networkData,
    originalNetworkData,
    communities,
    comparisonData,
    activeComparisonIndices,
    visualizationSettings,
    filters,
    status,
    error,

    // Actions
    analyzeNetwork: handleAnalyzeNetwork,
    analyzeCommunities: handleAnalyzeCommunities,
    fetchWikipediaData: handleFetchWikipediaData,
    updateVisualizationSettings: handleUpdateVisualizationSettings,
    updateFilters: handleUpdateFilters,
    restoreOriginalNetwork: handleRestoreOriginalNetwork,
    filterNetwork: handleFilterNetwork,
    toggleComparison: handleToggleComparison,
    resetNetworkState: handleResetNetworkState,

    // Dispatch wrappers
    setNetworkData: (data) => dispatch(setNetworkData(standardizeGraphData(data))),
    setOriginalNetworkData: (data) => dispatch(setOriginalNetworkData(standardizeGraphData(data))),
    setCommunities: (data) => dispatch(setCommunities(data)),
    setNetworkStatus: (status) => dispatch(setNetworkStatus(status)),
    setNetworkError: (error) => dispatch(setNetworkError(error)),
  };
};