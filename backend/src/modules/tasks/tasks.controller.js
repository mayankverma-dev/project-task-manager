import { tasksService } from './tasks.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

export const tasksController = {
  async create(req, res) {
    const { projectId } = req.params;
    const task = await tasksService.createTask(projectId, req.user.id, req.body);
    return res.status(201).json(apiResponse(task));
  },

  async list(req, res) {
    const { projectId } = req.params;
    const result = await tasksService.getTasks(projectId, req.query);
    return res.json(apiResponse(result.tasks, { nextCursor: result.nextCursor, hasMore: result.hasMore }));
  },

  async get(req, res) {
    const { id, projectId } = req.params;
    const task = await tasksService.getTask(id, projectId);
    return res.json(apiResponse(task));
  },

  async update(req, res) {
    const { id, projectId } = req.params;
    const task = await tasksService.updateTask(id, projectId, req.body, req.user.id);
    return res.json(apiResponse(task));
  },

  async delete(req, res) {
    const { id, projectId } = req.params;
    await tasksService.deleteTask(id, projectId);
    return res.json(apiResponse({ success: true }));
  }
};
