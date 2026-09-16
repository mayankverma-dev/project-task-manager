import { commentsRepository } from './comments.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { tasksRepository } from '../tasks/tasks.repository.js';
import { projectsRepository } from '../projects/projects.repository.js';
import { emitToWorkspace } from '../../sockets/index.js';

export const commentsService = {
  async createComment(taskId, userId, body) {
    const comment = await commentsRepository.create({
      taskId,
      userId,
      body
    });

    const task = await tasksRepository.findById(taskId);
    if (task) {
      const project = await projectsRepository.findById(task.projectId);
      if (project) {
        emitToWorkspace(project.workspaceId, 'comment.created', { comment });
      }
    }
    return comment;
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
    
    const task = await tasksRepository.findById(taskId);
    if (task) {
      const project = await projectsRepository.findById(task.projectId);
      if (project) {
        emitToWorkspace(project.workspaceId, 'comment.deleted', { commentId: id, taskId });
      }
    }
  }
};
