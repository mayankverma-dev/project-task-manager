import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../api/axiosInstance';
import { toast } from 'sonner';

export const useAttachments = (taskId) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'attachments'],
    queryFn: async () => {
      const response = await axiosInstance.get(`/tasks/${taskId}/attachments`);
      return response.data;
    },
    enabled: !!taskId,
  });
};

export const useUploadAttachment = (taskId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosInstance.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Attachment uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'attachments'] });
    },
    onError: () => {
      toast.error('Failed to upload attachment');
    }
  });
};

export const useDeleteAttachment = (taskId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId) => {
      await axiosInstance.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      toast.success('Attachment deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'attachments'] });
    },
    onError: () => {
      toast.error('Failed to delete attachment');
    }
  });
};
