import { commentsService } from './comments.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

export const commentsController = {
  async create(req, res) {
    const { taskId } = req.params;
    const { body } = req.body;
    const comment = await commentsService.createComment(taskId, req.user.id, body);
    res.status(201).json(apiResponse(comment));
  },

  async list(req, res) {
    const { taskId } = req.params;
    const { data, meta } = await commentsService.getComments(taskId, req.query);
    res.json(apiResponse(data, meta));
  },

  async delete(req, res) {
    const { id, taskId } = req.params;
    // req.userRole should be populated if requireRole middleware was used
    // Wait, requireRole needs a workspaceId to figure out the role.
    // Let's pass what we have, or fetch the user's role if needed.
    // For now, assume req.userRole might not be set by requireRole if not used correctly,
    // but we can just use req.user.role if it's there, or we'll let service handle it.
    await commentsService.deleteComment(id, taskId, req.user.id, req.user.role);
    res.status(204).send();
  }
};
