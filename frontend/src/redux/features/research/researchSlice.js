// src/redux/features/research/researchSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  researchProjects: [],
  currentResearch: null,
  researchAnalyses: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const researchSlice = createSlice({
  name: 'research',
  initialState,
  reducers: {
    setResearchProjects: (state, action) => {
      state.researchProjects = action.payload;
    },
    setCurrentResearch: (state, action) => {
      state.currentResearch = action.payload;
    },
    addResearchProject: (state, action) => {
      state.researchProjects.push(action.payload);
    },
    updateResearchProject: (state, action) => {
      const index = state.researchProjects.findIndex(
        (project) => project.id === action.payload.id
      );
      if (index !== -1) {
        state.researchProjects[index] = {
          ...state.researchProjects[index],
          ...action.payload,
        };
      }
    },
    removeResearchProject: (state, action) => {
      state.researchProjects = state.researchProjects.filter(
        (project) => project.id !== action.payload
      );
      if (state.currentResearch?.id === action.payload) {
        state.currentResearch = null;
      }
    },
    setResearchAnalyses: (state, action) => {
      state.researchAnalyses = action.payload;
    },
    setResearchStatus: (state, action) => {
      state.status = action.payload;
    },
    setResearchError: (state, action) => {
      state.error = action.payload;
      state.status = 'failed';
    },
    clearResearchError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setResearchProjects,
  setCurrentResearch,
  addResearchProject,
  updateResearchProject,
  removeResearchProject,
  setResearchAnalyses,
  setResearchStatus,
  setResearchError,
  clearResearchError,
} = researchSlice.actions;

// Selectors
export const selectAllResearchProjects = (state) => state.research.researchProjects;
export const selectCurrentResearch = (state) => state.research.currentResearch;
export const selectResearchAnalyses = (state) => state.research.researchAnalyses;
export const selectResearchStatus = (state) => state.research.status;
export const selectResearchError = (state) => state.research.error;

export default researchSlice.reducer;