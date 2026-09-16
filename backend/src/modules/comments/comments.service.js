import { commentsRepository } from './comments.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export const commentsService = {
  async createComment(taskId, userId, body) {
    return commentsRepository.create({
      taskId,
      userId,
      body
    });
  },

  async getComments(taskId, filters) {
    const { page, pageSize } = filters;
    const { comments, total } = await commentsRepository.findAll(taskId, { page, pageSize });
    return {
      data: comments,
      meta: { page, pageSize, total }
    };
  },

  async deleteComment(id, taskId, userId, userRole) {
    const comment = await commentsRepository.findById(id);
    if (!comment || comment.taskId !== taskId) {
      throw new ApiError(404, 'NOT_FOUND', 'Comment not found');
    }
    
    // Only the author or an admin/owner can delete the comment
    if (comment.userId !== userId && userRole !== 'admin' && userRole !== 'owner') {
      throw new ApiError(403, 'FORBIDDEN', 'Not authorized to delete this comment');
    }
    
    await commentsRepository.delete(id);
  }
};
