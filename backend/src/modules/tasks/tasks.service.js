import { tasksRepository } from './tasks.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export const tasksService = {
  async createTask(projectId, userId, data) {
    return await tasksRepository.create({
      ...data,
      projectId,
      createdBy: userId,
    });
  },

  async getTasks(projectId, filters) {
    return await tasksRepository.findAll(projectId, filters);
  },

  async getTask(id, projectId) {
    const task = await tasksRepository.findByIdAndProject(id, projectId);
    if (!task) {
      throw new ApiError(404, 'NOT_FOUND', 'Task not found');
    }
    return task;
  },

  async updateTask(id, projectId, data) {
    const task = await tasksRepository.findByIdAndProject(id, projectId);
    if (!task) {
      throw new ApiError(404, 'NOT_FOUND', 'Task not found');
    }
    return await tasksRepository.update(id, data);
  },

  async deleteTask(id, projectId) {
    const task = await tasksRepository.findByIdAndProject(id, projectId);
    if (!task) {
      throw new ApiError(404, 'NOT_FOUND', 'Task not found');
    }
    await tasksRepository.delete(id);
  }
};
