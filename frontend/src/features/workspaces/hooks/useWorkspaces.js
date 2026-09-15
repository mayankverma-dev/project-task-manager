import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '../../../api/workspaces.api.js';

export const useWorkspaces = () => {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.getWorkspaces,
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workspacesApi.createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

export const useWorkspaceMembers = (workspaceId, page) => {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'members', page],
    queryFn: () => workspacesApi.getWorkspaceMembers(workspaceId, page),
    enabled: !!workspaceId,
  });
};

export const useInviteMember = (workspaceId) => {
  return useMutation({
    mutationFn: (data) => workspacesApi.inviteMember(workspaceId, data),
  });
};

export const useInviteDetails = (token) => {
  return useQuery({
    queryKey: ['invites', token],
    queryFn: () => workspacesApi.getInviteDetails(token),
    enabled: !!token,
    retry: false // Don't retry if invite is invalid
  });
};

export const useAcceptInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token) => workspacesApi.acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

export const useUpdateMemberRole = (workspaceId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) => workspacesApi.updateMemberRole(workspaceId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] });
    },
  });
};
