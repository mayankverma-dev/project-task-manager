import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../../api/tasks.api';

export const useOptimisticTaskUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId, data }) => tasksApi.update(projectId, taskId, data),
    onMutate: async ({ projectId, taskId, data }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({ queryKey: ['tasks', projectId] });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ['tasks', projectId] }, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((task) =>
              task.id === taskId ? { ...task, ...data } : task
            ),
          })),
        };
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTodo, context) => {
      context.previousTasks.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    // Always refetch after error or success to ensure server state is in sync
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
    },
  });
};
