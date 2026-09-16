import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export const useTaskFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      priority: searchParams.get('priority') || '',
      assignee: searchParams.get('assignee') || '',
    };
  }, [searchParams]);

  const setFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      return newParams;
    });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Derive the actual filter object to pass to API (ignoring empty strings)
  const apiFilters = useMemo(() => {
    const activeFilters = {};
    if (filters.search) activeFilters.search = filters.search;
    if (filters.status) activeFilters.status = filters.status;
    if (filters.priority) activeFilters.priority = filters.priority;
    if (filters.assignee) activeFilters.assignee = filters.assignee;
    return activeFilters;
  }, [filters]);

  return {
    filters,
    apiFilters,
    setFilter,
    clearFilters,
  };
};
