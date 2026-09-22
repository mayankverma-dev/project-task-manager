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

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId, data }) => 
      projectsApi.update(workspaceId, projectId, data),
    onSuccess: (response, { workspaceId, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId, projectId] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId }) => 
      projectsApi.delete(workspaceId, projectId),
    onSuccess: (response, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
};
