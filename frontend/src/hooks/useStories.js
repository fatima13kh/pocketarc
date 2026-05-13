import { useState, useEffect, useCallback } from 'react';
import { storiesApi } from '../api/storiesApi';

export function useStories(isAdmin = false) {
  const [stories, setStories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    category: '',
    status: '',
    rewardSort: '',
    titleSort: '',
    dateSort: '',
    page: 0,
  });

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fn = isAdmin
        ? storiesApi.getAdminStories
        : storiesApi.getStories;
      const res = await fn(filters);
      
      let storiesArray = res.data || [];
      
      // Apply sorting on the frontend
      storiesArray = [...storiesArray];
      
      // Apply Reward sorting
      if (filters.rewardSort === 'reward_high_to_low') {
        storiesArray.sort((a, b) => (b.rewardPerCorrect || 0) - (a.rewardPerCorrect || 0));
      } else if (filters.rewardSort === 'reward_low_to_high') {
        storiesArray.sort((a, b) => (a.rewardPerCorrect || 0) - (b.rewardPerCorrect || 0));
      }
      
      // Apply Title sorting (overrides previous sort if set)
      if (filters.titleSort === 'title_atoz') {
        storiesArray.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else if (filters.titleSort === 'title_ztoa') {
        storiesArray.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      }
      
      // Apply Date sorting (overrides previous sort if set)
      if (filters.dateSort === 'newest_first') {
        storiesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (filters.dateSort === 'oldest_first') {
        storiesArray.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      
      setStories(storiesArray);
      setTotalElements(storiesArray.length);
      setTotalPages(1);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stories');
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
  };

  const setPage = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return {
    stories, totalPages, totalElements,
    loading, error, filters,
    updateFilter, setPage, refetch: fetchStories,
  };
}