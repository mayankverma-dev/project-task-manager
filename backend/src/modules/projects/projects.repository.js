import { db } from '../../db/db.js';
import { projects } from '../../db/schema/projects.js';
import { eq, and } from 'drizzle-orm';

export const projectsRepository = {
  async create(data) {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  },

  async findAllByWorkspace(workspaceId) {
    return await db.select().from(projects).where(eq(projects.workspaceId, workspaceId));
  },

  async findById(id) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return project;
  },

  async findByIdAndWorkspace(id, workspaceId) {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
      .limit(1);
    return project;
  },

  async update(id, data) {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  },

  async delete(id) {
    await db.delete(projects).where(eq(projects.id, id));
  }
};
