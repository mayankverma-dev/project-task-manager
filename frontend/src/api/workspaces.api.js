import { axiosInstance } from './axiosInstance.js';

export const workspacesApi = {
  getWorkspaces: async () => {
    const res = await axiosInstance.get('/workspaces');
    return res.data.data;
  },
  createWorkspace: async (data) => {
    const res = await axiosInstance.post('/workspaces', data);
    return res.data.data;
  },
  getWorkspaceMembers: async (workspaceId, page = 1) => {
    const res = await axiosInstance.get(`/workspaces/${workspaceId}/members`, { params: { page } });
    return res.data; // Includes meta
  },
  inviteMember: async (workspaceId, data) => {
    const res = await axiosInstance.post(`/workspaces/${workspaceId}/invite`, data);
    return res.data.data;
  },
  getInviteDetails: async (token) => {
    // This is a public route
    const res = await axiosInstance.get(`/workspaces/invites/${token}`);
    return res.data.data;
  },
  acceptInvite: async (token) => {
    const res = await axiosInstance.post(`/workspaces/invites/${token}/accept`);
    return res.data.data;
  },
  updateMemberRole: async (workspaceId, userId, role) => {
    const res = await axiosInstance.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
    return res.data.data;
  },
  getPendingInvites: async (workspaceId) => {
    const res = await axiosInstance.get(`/workspaces/${workspaceId}/invites`);
    return res.data.data;
  },
  cancelInvite: async (workspaceId, inviteId) => {
    const res = await axiosInstance.delete(`/workspaces/${workspaceId}/invites/${inviteId}`);
    return res.data.data;
  },
  removeMember: async (workspaceId, userId) => {
    const res = await axiosInstance.delete(`/workspaces/${workspaceId}/members/${userId}`);
    return res.data.data;
  },
};
