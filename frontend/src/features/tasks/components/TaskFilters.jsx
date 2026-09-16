import React, { useState, useEffect } from 'react';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { Search, X } from 'lucide-react';

export const TaskFilters = () => {
  const { filters, setFilter, clearFilters } = useTaskFilters();
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync local search with URL search param
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Push debounced search to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== filters.search) {
        setFilter('search', localSearch);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch, filters.search, setFilter]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-col gap-4 p-4 border-b border-neutral-200 dark:border-neutral-800 md:flex-row md:items-center">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-neutral-400" />
        </div>
        <input
          type="text"
          className="block w-full p-2 pl-10 text-sm border rounded-md border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search tasks..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="p-2 text-sm border rounded-md border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value)}
          className="p-2 text-sm border rounded-md border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
