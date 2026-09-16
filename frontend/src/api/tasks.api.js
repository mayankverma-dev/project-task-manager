import { axiosInstance } from './axiosInstance';

export const tasksApi = {
  create: async (projectId, data, idempotencyKey) => {
    const response = await axiosInstance.post(
      `/projects/${projectId}/tasks`,
      data,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return response.data;
  },

  list: async (projectId, params = {}) => {
    const response = await axiosInstance.get(`/projects/${projectId}/tasks`, { params });
    return response.data; // { data: [...], meta: { nextCursor, hasMore } }
  },

  get: async (projectId, id) => {
    const response = await axiosInstance.get(`/projects/${projectId}/tasks/${id}`);
    return response.data;
  },

  update: async (projectId, id, data) => {
    const response = await axiosInstance.patch(`/projects/${projectId}/tasks/${id}`, data);
    return response.data;
  },

  delete: async (projectId, id) => {
    const response = await axiosInstance.delete(`/projects/${projectId}/tasks/${id}`);
    return response.data;
  }
};
