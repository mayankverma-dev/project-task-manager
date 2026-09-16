import { axiosInstance } from './axiosInstance';

export const projectsApi = {
  create: async (workspaceId, data, idempotencyKey) => {
    const response = await axiosInstance.post(
      `/workspaces/${workspaceId}/projects`,
      data,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return response.data;
  },

  list: async (workspaceId) => {
    const response = await axiosInstance.get(`/workspaces/${workspaceId}/projects`);
    return response.data;
  },

  get: async (workspaceId, id) => {
    const response = await axiosInstance.get(`/workspaces/${workspaceId}/projects/${id}`);
    return response.data;
  },

  update: async (workspaceId, id, data) => {
    const response = await axiosInstance.patch(`/workspaces/${workspaceId}/projects/${id}`, data);
    return response.data;
  },

  delete: async (workspaceId, id) => {
    const response = await axiosInstance.delete(`/workspaces/${workspaceId}/projects/${id}`);
    return response.data;
  }
};
