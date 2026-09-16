import { projectsService } from './projects.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

export const projectsController = {
  async create(req, res) {
    const { workspaceId } = req.params;
    const project = await projectsService.createProject(workspaceId, req.user.id, req.body);
    return res.status(201).json(apiResponse(project));
  },

  async list(req, res) {
    const { workspaceId } = req.params;
    const projects = await projectsService.getProjects(workspaceId);
    return res.json(apiResponse(projects));
  },

  async get(req, res) {
    const { id, workspaceId } = req.params;
    const project = await projectsService.getProject(id, workspaceId);
    return res.json(apiResponse(project));
  },

  async update(req, res) {
    const { id, workspaceId } = req.params;
    const project = await projectsService.updateProject(id, workspaceId, req.body);
    return res.json(apiResponse(project));
  },

  async delete(req, res) {
    const { id, workspaceId } = req.params;
    await projectsService.deleteProject(id, workspaceId);
    return res.json(apiResponse({ success: true }));
  }
};
