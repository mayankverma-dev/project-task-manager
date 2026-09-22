import { db } from '../../db/db.js';
import { attachments } from '../../db/schema/attachments.js';
import { eq, getTableColumns } from 'drizzle-orm';
import { users } from '../../db/schema/auth.js';

export const attachmentsRepository = {
  async create(data) {
    const [attachment] = await db.insert(attachments).values(data).returning();
    return attachment;
  },

  async findAllByTask(taskId) {
    return await db
      .select({
        ...getTableColumns(attachments),
        uploadedByName: users.name,
      })
      .from(attachments)
      .leftJoin(users, eq(attachments.uploadedBy, users.id))
      .where(eq(attachments.taskId, taskId))
      .orderBy(attachments.createdAt);
  },

  async findById(id) {
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);
    return attachment;
  },

  async delete(id) {
    await db.delete(attachments).where(eq(attachments.id, id));
  }
};
