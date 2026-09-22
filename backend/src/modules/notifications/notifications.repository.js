import { db } from '../../db/db.js';
import { notifications, activityLogs } from '../../db/schema/notifications.js';
import { eq, and, desc, sql } from 'drizzle-orm';

export const notificationsRepository = {
  async getUserNotifications(userId, limit = 20, offset = 0) {
    const data = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
      
    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(eq(notifications.userId, userId));
      
    return { notifications: data, total: count };
  },

  async markAsRead(id, userId) {
    const [notification] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification;
  },
  
  async markAllAsRead(userId) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), sql`read_at IS NULL`));
  },

  async createNotification(data) {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  },

  async createActivityLog(data) {
    const [log] = await db.insert(activityLogs).values(data).returning();
    return log;
  }
};
