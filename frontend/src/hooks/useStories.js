import { useState, useEffect, useCallback } from 'react';
import { storiesApi } from '../api/storiesApi';

export function useStories(isAdmin = false) {
  const [stories, setStories] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    category: '',
    status: '',
    sortBy: '',
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
      setStories(res.data.stories);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stories');
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