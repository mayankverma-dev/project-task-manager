import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../api/axiosInstance';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const useComments = (taskId) => {
  return useInfiniteQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axiosInstance.get(`/tasks/${taskId}/comments`, {
        params: { page: pageParam, pageSize: 20 }
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // Offset pagination meta: { page: 1, pageSize: 20, total: X }
      if (!lastPage.meta) return undefined;
      const { page, pageSize, total } = lastPage.meta;
      const hasMore = page * pageSize < total;
      return hasMore ? page + 1 : undefined;
    },
    enabled: !!taskId,
  });
};

export const useCreateComment = (taskId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body) => {
      const response = await axiosInstance.post(`/tasks/${taskId}/comments`, { body });
      return response.data.data;
    },
    onMutate: async (newCommentBody) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'comments'] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(['tasks', taskId, 'comments']);

      // Optimistically update to the new value
      const optimisticComment = {
        id: `optimistic-${uuidv4()}`,
        taskId,
        body: newCommentBody,
        createdAt: new Date().toISOString(),
        isOptimistic: true // flag to show "sending..." UI
      };

      queryClient.setQueryData(['tasks', taskId, 'comments'], (old) => {
        if (!old) {
          return {
            pages: [{ data: [optimisticComment], meta: { page: 1, pageSize: 20, total: 1 } }],
            pageParams: [1]
          };
        }
        
        // Add to the first page (since we order by desc in backend, new comments are first)
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            data: [optimisticComment, ...newPages[0].data]
          };
        }
        
        return {
          ...old,
          pages: newPages
        };
      });

      // Return a context object with the snapshotted value
      return { previousComments };
    },
    onError: (err, newCommentBody, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['tasks', taskId, 'comments'], context.previousComments);
      toast.error('Failed to post comment. Please try again.');
    },
    onSuccess: () => {
      toast.success('Comment posted.');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure backend state
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
    },
  });
};

export const useDeleteComment = (taskId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId) => {
      await axiosInstance.delete(`/tasks/${taskId}/comments/${commentId}`);
    },
    onSuccess: () => {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
    },
    onError: () => {
      toast.error('Failed to delete comment');
    }
  });
};
