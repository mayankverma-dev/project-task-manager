import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db/db.js';
import { workspaces, workspaceMembers, workspaceInvites, users, projects, tasks } from '../../db/schema/index.js';

export const workspacesRepository = {
  async createWorkspace(workspaceData, ownerId) {
    return await db.transaction(async (tx) => {
      const [workspace] = await tx.insert(workspaces).values({
        ...workspaceData,
        ownerId,
      }).returning();

      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: ownerId,
        role: 'owner',
      });

      return workspace;
    });
  },

  async getWorkspacesByUserId(userId) {
    const records = await db.select({
      workspace: workspaces,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(desc(workspaces.createdAt));

    return records.map(r => ({ ...r.workspace, role: r.role }));
  },

  async getWorkspaceById(id) {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  },

  async getWorkspaceBySlug(slug) {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, slug));
    return workspace;
  },

  async getMembers(workspaceId, limit, offset) {
    const records = await db.select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      }
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(workspaceMembers.joinedAt));
    
    return records;
  },

  async getMemberCount(workspaceId) {
    const result = await db.select({ count: sql`count(*)` })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    return Number(result[0].count);
  },

  async getMember(workspaceId, userId) {
    const [member] = await db.select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
    return member;
  },

  async updateMemberRole(workspaceId, userId, role) {
    const [updated] = await db.update(workspaceMembers)
      .set({ role })
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
      .returning();
    return updated;
  },

  async createInvite(inviteData) {
    const [invite] = await db.insert(workspaceInvites).values(inviteData).returning();
    return invite;
  },

  async getInviteByToken(token) {
    const [invite] = await db.select().from(workspaceInvites).where(eq(workspaceInvites.token, token));
    return invite;
  },

  async getInviteDetails(token) {
    const [result] = await db.select({
      invite: workspaceInvites,
      workspaceName: workspaces.name,
    })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaceInvites.workspaceId, workspaces.id))
    .where(eq(workspaceInvites.token, token));
    
    if (!result) return null;
    return { ...result.invite, workspaceName: result.workspaceName };
  },

  async getInviteByEmailAndWorkspace(email, workspaceId) {
    const [invite] = await db.select()
      .from(workspaceInvites)
      .where(and(eq(workspaceInvites.email, email), eq(workspaceInvites.workspaceId, workspaceId)));
    return invite;
  },

  async deleteInvite(id) {
    await db.delete(workspaceInvites).where(eq(workspaceInvites.id, id));
  },

  async addMember(workspaceId, userId, role) {
    const [member] = await db.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role,
    }).returning();
    return member;
  },

  async getDashboardStats(workspaceId) {
    const memberCount = await db.select({ count: sql`count(*)` })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    const projectCount = await db.select({ count: sql`count(*)` })
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));

    const tasksStats = await db.select({
      status: tasks.status,
      count: sql`count(*)`
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(projects.workspaceId, workspaceId))
    .groupBy(tasks.status);

    return {
      totalMembers: Number(memberCount[0].count),
      totalProjects: Number(projectCount[0].count),
      tasksByStatus: tasksStats.reduce((acc, curr) => {
        acc[curr.status] = Number(curr.count);
        return acc;
      }, {}),
    };
  }
};
