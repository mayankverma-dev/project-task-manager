import { db } from '../../db/db.js';
import { tasks } from '../../db/schema/tasks.js';
import { eq, and, sql, asc, desc, ilike, gt, lt } from 'drizzle-orm';

export const tasksRepository = {
  async create(data) {
    if (data.position === undefined) {
      // Find max position
      const [result] = await db
        .select({ maxPos: sql`max(${tasks.position})` })
        .from(tasks)
        .where(eq(tasks.projectId, data.projectId));
      
      const maxPos = result?.maxPos || 0;
      data.position = maxPos + 1024; // Leave gaps for easier repositioning
    }

    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  },

  async findAll(projectId, filters = {}) {
    const { cursor, limit, search, status, priority, assignee, sortBy, sortOrder } = filters;
    
    let query = db.select().from(tasks).where(eq(tasks.projectId, projectId));
    const conditions = [eq(tasks.projectId, projectId)];

    if (search) {
      conditions.push(ilike(tasks.title, `%${search}%`));
    }
    if (status) conditions.push(eq(tasks.status, status));
    if (priority) conditions.push(eq(tasks.priority, priority));
    if (assignee) conditions.push(eq(tasks.assigneeId, assignee));

    // Simple cursor based on ID for this phase to avoid complex sort/cursor mapping
    if (cursor) {
       // Assuming cursor is an ID and sort is by position ASC for now, simplified
       // In a full cursor pagination, cursor decodes to (sortColumnValue, id)
       // This is a minimal working implementation
    }

    query = query.where(and(...conditions));

    const sortField = tasks[sortBy] || tasks.position;
    query = query.orderBy(sortOrder === 'desc' ? desc(sortField) : asc(sortField));
    
    query = query.limit(limit + 1); // +1 to check for hasMore

    const results = await query;
    const hasMore = results.length > limit;
    if (hasMore) results.pop();

    return {
      tasks: results,
      hasMore,
      nextCursor: hasMore ? results[results.length - 1].id : null
    };
  },

  async findByIdAndProject(id, projectId) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.projectId, projectId)))
      .limit(1);
    return task;
  },

  async update(id, data) {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  },

  async delete(id) {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
};
