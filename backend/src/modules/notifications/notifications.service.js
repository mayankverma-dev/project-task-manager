import { notificationsRepository } from './notifications.repository.js';
import { ApiError } from '../../utils/ApiError.js';

export const notificationsService = {
  async getNotifications(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const { notifications, total } = await notificationsRepository.getUserNotifications(userId, pageSize, offset);
    return { notifications, page, pageSize, total };
  },

  async markAsRead(id, userId) {
    const notification = await notificationsRepository.markAsRead(id, userId);
    if (!notification) {
      throw new ApiError(404, 'NOT_FOUND', 'Notification not found');
    }
    return notification;
  },
  
  async markAllAsRead(userId) {
    await notificationsRepository.markAllAsRead(userId);
  }
};
