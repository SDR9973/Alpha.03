// src/redux/features/network/networkSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  networkData: null,
  originalNetworkData: null,
  communities: [],
  comparisonData: [],
  activeComparisonIndices: [],
  comparisonNetworkData: [],
  visualizationSettings: {
    colorBy: 'default',
    sizeBy: 'default',
    highlightUsers: [],
    highlightCommunities: [],
    communityNames: {},
    communityColors: {},
    customColors: {
      defaultNodeColor: '#050d2d',
      highlightNodeColor: '#00c6c2',
      communityColors: ['#313659', '#5f6289', '#324b4a', '#158582', '#9092bc', '#c4c6f1'],
      edgeColor: 'rgba(128, 128, 128, 0.6)',
    },
    nodeSizes: {
      min: 15,
      max: 40,
    },
    colorScheme: 'default',
    showImportantNodes: false,
    importantNodesThreshold: 0.5,
  },
  filters: {
    startDate: '',
    endDate: '',
    messageLimit: 50,
    limitType: 'first',
    minMessageLength: 10,
    maxMessageLength: 100,
    keywords: '',
    usernameFilter: '',
    minMessages: '',
    maxMessages: '',
    activeUsers: '',
    selectedUsers: '',
    isAnonymized: false,
    startTime: '',
    endTime: '',
  },
  filterParams: '',
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkData: (state, action) => {
      state.networkData = action.payload;
    },
    setOriginalNetworkData: (state, action) => {
      state.originalNetworkData = action.payload;
    },
    restoreOriginalNetworkData: (state) => {
      if (state.originalNetworkData) {
        state.networkData = { ...state.originalNetworkData };
      }
    },
    setCommunities: (state, action) => {
      state.communities = action.payload;
    },
    addComparisonData: (state, action) => {
      const { index, data } = action.payload;
      state.comparisonData[index] = data;
    },
    setActiveComparisonIndices: (state, action) => {
      state.activeComparisonIndices = action.payload;
    },
    toggleComparisonActive: (state, action) => {
      const index = action.payload;
      if (state.activeComparisonIndices.includes(index)) {
        state.activeComparisonIndices = state.activeComparisonIndices.filter(i => i !== index);
      } else {
        state.activeComparisonIndices.push(index);
      }
    },
    setComparisonNetworkData: (state, action) => {
      const { index, data } = action.payload;
      state.comparisonNetworkData[index] = data;
    },
    updateVisualizationSettings: (state, action) => {
      state.visualizationSettings = {
        ...state.visualizationSettings,
        ...action.payload,
      };
    },
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    setFilterParams: (state, action) => {
      state.filterParams = action.payload;
    },
    setNetworkStatus: (state, action) => {
      state.status = action.payload;
    },
    setNetworkError: (state, action) => {
      state.error = action.payload;
      state.status = 'failed';
    },
    clearNetworkError: (state) => {
      state.error = null;
    },
    resetNetworkState: (state) => {
      return {
        ...initialState,
        filters: state.filters, // Preserve filters
        visualizationSettings: state.visualizationSettings, // Preserve visualization settings
      };
    },
  },
});

export const {
  setNetworkData,
  setOriginalNetworkData,
  restoreOriginalNetworkData,
  setCommunities,
  addComparisonData,
  setActiveComparisonIndices,
  toggleComparisonActive,
  setComparisonNetworkData,
  updateVisualizationSettings,
  updateFilters,
  setFilterParams,
  setNetworkStatus,
  setNetworkError,
  clearNetworkError,
  resetNetworkState,
} = networkSlice.actions;

// Selectors
export const selectNetworkData = (state) => state.network.networkData;
export const selectOriginalNetworkData = (state) => state.network.originalNetworkData;
export const selectCommunities = (state) => state.network.communities;
export const selectComparisonData = (state) => state.network.comparisonData;
export const selectActiveComparisonIndices = (state) => state.network.activeComparisonIndices;
export const selectComparisonNetworkData = (state) => state.network.comparisonNetworkData;
export const selectVisualizationSettings = (state) => state.network.visualizationSettings;
export const selectFilters = (state) => state.network.filters;
export const selectFilterParams = (state) => state.network.filterParams;
export const selectNetworkStatus = (state) => state.network.status;
export const selectNetworkError = (state) => state.network.error;

export default networkSlice.reducer;