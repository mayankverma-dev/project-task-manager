import { attachmentsService } from './attachments.service.js';
import { apiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

export const attachmentsController = {
  async upload(req, res) {
    if (!req.file) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'No file uploaded');
    }
    
    const { taskId } = req.params;
    
    // Construct base URL for file serving
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const attachment = await attachmentsService.uploadAttachment(taskId, req.user.id, req.file, baseUrl);
    res.status(201).json(apiResponse(attachment));
  },

  async list(req, res) {
    const { taskId } = req.params;
    const attachments = await attachmentsService.getAttachments(taskId);
    res.json(apiResponse(attachments));
  },

  async delete(req, res) {
    const { id, taskId } = req.params;
    await attachmentsService.deleteAttachment(id, taskId, req.user.id, req.userRole);
    res.status(204).send();
  }
};
