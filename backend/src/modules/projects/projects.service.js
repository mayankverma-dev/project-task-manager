import { projectsRepository } from './projects.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export const projectsService = {
  async createProject(workspaceId, userId, data) {
    return await projectsRepository.create({
      ...data,
      workspaceId,
      createdBy: userId,
    });
  },

  async getProjects(workspaceId) {
    return await projectsRepository.findAllByWorkspace(workspaceId);
  },

  async getProject(id, workspaceId) {
    const project = await projectsRepository.findByIdAndWorkspace(id, workspaceId);
    if (!project) {
      throw new ApiError(404, 'NOT_FOUND', 'Project not found');
    }
    return project;
  },

  async updateProject(id, workspaceId, data) {
    const project = await projectsRepository.findByIdAndWorkspace(id, workspaceId);
    if (!project) {
      throw new ApiError(404, 'NOT_FOUND', 'Project not found');
    }
    return await projectsRepository.update(id, data);
  },

  async deleteProject(id, workspaceId) {
    const project = await projectsRepository.findByIdAndWorkspace(id, workspaceId);
    if (!project) {
      throw new ApiError(404, 'NOT_FOUND', 'Project not found');
    }
    await projectsRepository.delete(id);
  }
};
