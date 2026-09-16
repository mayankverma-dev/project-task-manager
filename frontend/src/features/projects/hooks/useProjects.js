import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projects.api';

export const useProjects = (workspaceId) => {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => projectsApi.list(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useProject = (workspaceId, projectId) => {
  return useQuery({
    queryKey: ['projects', workspaceId, projectId],
    queryFn: () => projectsApi.get(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, data, idempotencyKey }) => 
      projectsApi.create(workspaceId, data, idempotencyKey),
    onSuccess: (response, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
};
