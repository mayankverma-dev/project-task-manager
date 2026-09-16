import crypto from 'crypto';
import { tasksRepository } from './tasks.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { getOrSetCache, invalidateCache } from '../../utils/cache.js';

export const tasksService = {
  async createTask(projectId, userId, data) {
    const task = await tasksRepository.create({
      ...data,
      projectId,
      createdBy: userId,
    });
    
    await invalidateCache(`cache:project:${projectId}:tasks:*`);
    await invalidateCache(`cache:workspace:*:dashboard`);
    
    return task;
  },

  async getTasks(projectId, filters) {
    // Sort filter keys to ensure stable cache keys regardless of object key order
    const sortedFilters = filters ? Object.keys(filters).sort().reduce((acc, key) => {
      acc[key] = filters[key];
      return acc;
    }, {}) : {};
    
    const filterHash = crypto.createHash('md5').update(JSON.stringify(sortedFilters)).digest('hex');
    const cacheKey = `cache:project:${projectId}:tasks:${filterHash}`;
    const ttl = 60 * 5; // 5 minutes

    return await getOrSetCache(cacheKey, ttl, async () => {
      return await tasksRepository.findAll(projectId, filters);
    });
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
    const updatedTask = await tasksRepository.update(id, data);
    
    await invalidateCache(`cache:project:${projectId}:tasks:*`);
    await invalidateCache(`cache:workspace:*:dashboard`);
    
    return updatedTask;
  },

  async deleteTask(id, projectId) {
    const task = await tasksRepository.findByIdAndProject(id, projectId);
    if (!task) {
      throw new ApiError(404, 'NOT_FOUND', 'Task not found');
    }
    await tasksRepository.delete(id);
    
    await invalidateCache(`cache:project:${projectId}:tasks:*`);
    await invalidateCache(`cache:workspace:*:dashboard`);
  }
};
