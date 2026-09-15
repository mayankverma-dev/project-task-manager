import { and, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { workspaceMembers } from '../db/schema/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ROLE_HIERARCHY = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export const requireRole = (minRole) => {
  return asyncHandler(async (req, res, next) => {
    // The workspace ID could be in req.params.workspaceId (e.g. nested routes like /workspaces/:workspaceId/projects)
    // or req.params.id (e.g. /workspaces/:id)
    const workspaceId = req.params.workspaceId || req.params.id;
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
    const minRoleWeight = ROLE_HIERARCHY[minRole];

    if (userRoleWeight < minRoleWeight) {
      throw new ApiError(403, 'FORBIDDEN', `Requires at least ${minRole} role`);
    }

    // Attach role to request for downstream handlers if they need it
    req.userRole = membership.role;
    next();
  });
};
