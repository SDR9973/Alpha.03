// src/providers/ResearchProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectAllResearchProjects,
  selectCurrentResearch,
  selectResearchAnalyses,
  selectResearchStatus,
  selectResearchError,
  setResearchProjects,
  setCurrentResearch,
  setResearchAnalyses,
  setResearchStatus,
  setResearchError,
  clearResearchError,
} from '../redux/features/research/researchSlice';

import {
  useGetAllResearchQuery,
  useGetResearchByIdQuery,
  useGetResearchAnalysesQuery,
  useSaveResearchFormMutation,
  useDeleteResearchMutation,
} from '../redux/features/research/researchApiSlice';

// Create context
const ResearchContext = createContext(null);

// Hook for consuming the research context
export const useResearch = () => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
};

// Research provider component
export const ResearchProvider = ({ children }) => {
  const dispatch = useDispatch();

  // Get research state from Redux store
  const researchProjects = useSelector(selectAllResearchProjects);
  const currentResearch = useSelector(selectCurrentResearch);
  const researchAnalyses = useSelector(selectResearchAnalyses);
  const status = useSelector(selectResearchStatus);
  const error = useSelector(selectResearchError);

  // Local state for loading status
  const [isLoading, setIsLoading] = useState(false);

  // RTK Query hooks
  const { refetch: refetchAllResearch } = useGetAllResearchQuery();
  const [saveResearchForm] = useSaveResearchFormMutation();
  const [deleteResearch] = useDeleteResearchMutation();

  // Load research projects on initial render
  useEffect(() => {
    const loadResearchProjects = async () => {
      try {
        dispatch(setResearchStatus('loading'));
        await refetchAllResearch();
        dispatch(setResearchStatus('succeeded'));
      } catch (error) {
        dispatch(setResearchError(error.message || 'Failed to load research projects'));
      }
    };

    loadResearchProjects();
  }, [dispatch, refetchAllResearch]);

  // Handler for loading research by ID
  const handleLoadResearch = async (researchId) => {
    if (!researchId) return;

    setIsLoading(true);
    dispatch(setResearchStatus('loading'));

    try {
      // Use a direct query rather than RTK Query hook for dynamic IDs
      const response = await fetch(`http://localhost:8000/research/${researchId}`);
      if (!response.ok) {
        throw new Error('Failed to load research project');
      }

      const data = await response.json();
      dispatch(setCurrentResearch(data));
      dispatch(setResearchStatus('succeeded'));

      return data;
    } catch (error) {
      dispatch(setResearchError(error.message || 'Failed to load research project'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for loading research analyses
  const handleLoadResearchAnalyses = async (researchId) => {
    if (!researchId) return;

    setIsLoading(true);

    try {
      // Use a direct query rather than RTK Query hook for dynamic IDs
      const response = await fetch(`http://localhost:8000/research/${researchId}/analyses`);
      if (!response.ok) {
        throw new Error('Failed to load analyses');
      }

      const data = await response.json();
      dispatch(setResearchAnalyses(data));

      return data;
    } catch (error) {
      dispatch(setResearchError(error.message || 'Failed to load research analyses'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for saving research form
  const handleSaveResearchForm = async (formData) => {
    setIsLoading(true);

    try {
      const result = await saveResearchForm(formData).unwrap();
      // Refresh the research list
      await refetchAllResearch();
      return result;
    } catch (error) {
      dispatch(setResearchError(error.message || 'Failed to save research form'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for deleting research
  const handleDeleteResearch = async (researchId) => {
    setIsLoading(true);

    try {
      const result = await deleteResearch(researchId).unwrap();
      // Refresh the research list
      await refetchAllResearch();
      return result;
    } catch (error) {
      dispatch(setResearchError(error.message || 'Failed to delete research'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    researchProjects,
    currentResearch,
    researchAnalyses,
    status,
    error,
    isLoading,

    // Actions
    loadResearch: handleLoadResearch,
    loadResearchAnalyses: handleLoadResearchAnalyses,
    saveResearchForm: handleSaveResearchForm,
    deleteResearch: handleDeleteResearch,
    clearError: () => dispatch(clearResearchError()),
  };

  return (
    <ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>
  );
};