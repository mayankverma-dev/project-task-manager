import { attachmentsRepository } from './attachments.repository.js';
import { tasksRepository } from '../tasks/tasks.repository.js';
import { projectsRepository } from '../projects/projects.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { emitToWorkspace } from '../../sockets/index.js';
import fs from 'fs';
import path from 'path';

export const attachmentsService = {
  async uploadAttachment(taskId, userId, file, baseUrl) {
    const task = await tasksRepository.findById(taskId);
    if (!task) {
      // Clean up uploaded file if task not found
      if (file && file.path) {
        fs.unlinkSync(file.path);
      }
      throw new ApiError(404, 'NOT_FOUND', 'Task not found');
    }

    const url = `${baseUrl}/uploads/${file.filename}`;

    const attachment = await attachmentsRepository.create({
      taskId,
      uploadedBy: userId,
      url,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    const project = await projectsRepository.findById(task.projectId);
    if (project) {
      emitToWorkspace(project.workspaceId, 'attachment.created', { attachment });
    }

    return attachment;
  },

  async getAttachments(taskId) {
    return await attachmentsRepository.findAllByTask(taskId);
  },

  async deleteAttachment(id, taskId, userId, userRole) {
    const attachment = await attachmentsRepository.findById(id);
    if (!attachment || attachment.taskId !== taskId) {
      throw new ApiError(404, 'NOT_FOUND', 'Attachment not found');
    }
    
    // Only the uploader or an admin/owner can delete the attachment
    if (attachment.uploadedBy !== userId && userRole !== 'admin' && userRole !== 'owner') {
      throw new ApiError(403, 'FORBIDDEN', 'Not authorized to delete this attachment');
    }
    
    // Delete file from disk
    const filename = attachment.url.split('/').pop();
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await attachmentsRepository.delete(id);
    
    const task = await tasksRepository.findById(taskId);
    if (task) {
      const project = await projectsRepository.findById(task.projectId);
      if (project) {
        emitToWorkspace(project.workspaceId, 'attachment.deleted', { attachmentId: id, taskId });
      }
    }
  }
};
