import { db } from '../../db/db.js';
import { tasks } from '../../db/schema/tasks.js';
import { eq, and, sql, asc, desc, ilike, gt, lt, getTableColumns } from 'drizzle-orm';
import { users } from '../../db/schema/auth.js';

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
    const { cursor, limit = 50, search, status, priority, assignee, sortBy = 'position', sortOrder = 'asc' } = filters;
    
    let query = db
      .select({
        ...getTableColumns(tasks),
        commentCount: sql`(SELECT COUNT(*)::int FROM comments WHERE comments.task_id = tasks.id)`.as('commentCount'),
        createdByName: users.name,
        createdByEmail: users.email
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.createdBy, users.id))
      .where(eq(tasks.projectId, projectId));
    const conditions = [eq(tasks.projectId, projectId)];

    if (search) {
      conditions.push(sql`to_tsvector('english', coalesce(${tasks.title}, '') || ' ' || coalesce(${tasks.description}, '')) @@ plainto_tsquery('english', ${search})`);
    }
    if (status) conditions.push(eq(tasks.status, status));
    if (priority) conditions.push(eq(tasks.priority, priority));
    if (assignee) conditions.push(eq(tasks.assigneeId, assignee));

    const sortField = tasks[sortBy] || tasks.position;

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        const cursorValue = decoded.sortValue;
        const cursorId = decoded.id;

        if (sortOrder === 'desc') {
          conditions.push(sql`(${sortField} < ${cursorValue} OR (${sortField} = ${cursorValue} AND ${tasks.id} > ${cursorId}))`);
        } else {
          conditions.push(sql`(${sortField} > ${cursorValue} OR (${sortField} = ${cursorValue} AND ${tasks.id} > ${cursorId}))`);
        }
      } catch (e) {
        // ignore invalid cursor
      }
    }

    query = query.where(and(...conditions));

    query = query.orderBy(
      sortOrder === 'desc' ? desc(sortField) : asc(sortField),
      asc(tasks.id)
    );
    
    query = query.limit(limit + 1);

    const results = await query;
    const hasMore = results.length > limit;
    if (hasMore) results.pop();

    let nextCursor = null;
    if (hasMore && results.length > 0) {
      const lastTask = results[results.length - 1];
      let sortValue = lastTask[sortBy];
      if (sortValue instanceof Date) {
        sortValue = sortValue.toISOString();
      }
      nextCursor = Buffer.from(JSON.stringify({ sortValue, id: lastTask.id })).toString('base64');
    }

    return {
      tasks: results,
      hasMore,
      nextCursor
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

  async findById(id) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
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
