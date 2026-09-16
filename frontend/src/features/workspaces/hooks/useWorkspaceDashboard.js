import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../api/axiosInstance.js';

export const useWorkspaceDashboard = (workspaceId) => {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'dashboard'],
    queryFn: async () => {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/dashboard`);
      return response.data.data;
    },
    enabled: !!workspaceId,
  });
};
