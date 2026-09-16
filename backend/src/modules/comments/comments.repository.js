import { db } from '../../db/db.js';
import { comments } from '../../db/schema/comments.js';
import { eq, desc, sql, getTableColumns } from 'drizzle-orm';
import { users } from '../../db/schema/auth.js';

export const commentsRepository = {
  async create(data) {
    const [comment] = await db.insert(comments).values(data).returning();
    return comment;
  },

  async findAll(taskId, { page, pageSize }) {
    const offset = (page - 1) * pageSize;
    
    const results = await db
      .select({
        ...getTableColumns(comments),
        userName: users.name,
        userEmail: users.email
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.taskId, taskId))
      .orderBy(desc(comments.createdAt))
      .limit(pageSize)
      .offset(offset);
      
    const [countResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(comments)
      .where(eq(comments.taskId, taskId));
      
    return { 
      comments: results, 
      total: countResult?.count || 0 
    };
  },

  async findById(id) {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return comment;
  },

  async delete(id) {
    await db.delete(comments).where(eq(comments.id, id));
  }
};
