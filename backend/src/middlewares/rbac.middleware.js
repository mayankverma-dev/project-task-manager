import { and, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { workspaceMembers, projects } from '../db/schema/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ROLE_HIERARCHY = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export const requireRole = (allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    // Resolve workspaceId from params:
    // - Direct workspace routes:  req.params.workspaceId  or  req.params.id  (for /workspaces/:id)
    // - Project-nested routes:    req.params.workspaceId propagated via mergeParams
    // - Task routes under /projects/:projectId/tasks: look up project to get workspaceId
    let workspaceId = req.params.workspaceId || (req.params.id && !req.params.projectId ? req.params.id : null);

    if (!workspaceId && req.params.projectId) {
      // Resolve workspace from the project
      const [project] = await db.select({ workspaceId: projects.workspaceId })
        .from(projects)
        .where(eq(projects.id, req.params.projectId));

      if (!project) {
        throw new ApiError(404, 'NOT_FOUND', 'Project not found');
      }
      workspaceId = project.workspaceId;
    }

    if (!workspaceId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Workspace ID is required for role check');
    }

    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User is not authenticated');
    }

    const [membership] = await db.select()
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ));

    if (!membership) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a member of this workspace');
    }

    const userRoleWeight = ROLE_HIERARCHY[membership.role];
    // allowedRoles can be a string (min role) or an array of allowed roles
    const minRole = Array.isArray(allowedRoles)
      ? allowedRoles.reduce((min, r) => (ROLE_HIERARCHY[r] < ROLE_HIERARCHY[min] ? r : min), allowedRoles[0])
      : allowedRoles;
    const minRoleWeight = ROLE_HIERARCHY[minRole];

    if (userRoleWeight < minRoleWeight) {
      throw new ApiError(403, 'FORBIDDEN', `Requires at least ${minRole} role`);
    }

    // Attach role and resolved workspaceId to request for downstream handlers
    req.userRole = membership.role;
    req.workspaceId = workspaceId;
    next();
  });
};
