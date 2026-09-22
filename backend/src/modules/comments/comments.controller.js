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
    // req.userRole is populated by requireRole middleware
    await commentsService.deleteComment(id, taskId, req.user.id, req.userRole);
    res.status(204).send();
  }
};
