import { notificationsService } from './notifications.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

export const notificationsController = {
  async list(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    
    const result = await notificationsService.getNotifications(req.user.id, page, pageSize);
    res.json(apiResponse(result.notifications, { page: result.page, pageSize: result.pageSize, total: result.total }));
  },

  async markAsRead(req, res) {
    const { id } = req.params;
    const notification = await notificationsService.markAsRead(id, req.user.id);
    res.json(apiResponse(notification));
  },
  
  async markAllAsRead(req, res) {
    await notificationsService.markAllAsRead(req.user.id);
    res.json(apiResponse({ success: true }));
  }
};
