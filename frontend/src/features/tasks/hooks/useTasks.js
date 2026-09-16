import { useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { tasksApi } from '../../../api/tasks.api';

export const useTasks = (projectId, filters = {}) => {
  return useInfiniteQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: async ({ pageParam = null }) => {
      const response = await tasksApi.list(projectId, { ...filters, cursor: pageParam });
      return response;
    },
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor || undefined,
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data, idempotencyKey }) => 
      tasksApi.create(projectId, data, idempotencyKey),
    onSuccess: (response, { projectId }) => {
      // Invalidate to fetch new data. In an optimistic scenario, we could add it manually.
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
};
