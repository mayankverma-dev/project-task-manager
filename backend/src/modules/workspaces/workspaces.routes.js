import { Router } from 'express';
import { workspacesController } from './workspaces.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createWorkspaceSchema, inviteMemberSchema, updateRoleSchema } from './workspaces.validators.js';
import { generalRateLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();

// Get invite details (Public route, doesn't need auth)
router.get(
  '/invites/:token',
  asyncHandler(workspacesController.getInviteDetails)
);

// All other workspace routes require authentication
router.use(authenticate);

// Create workspace
router.post(
  '/',
  generalRateLimiter,
  validate(createWorkspaceSchema),
  asyncHandler(workspacesController.createWorkspace)
);

// Get user's workspaces
router.get(
  '/',
  asyncHandler(workspacesController.getWorkspaces)
);

// Accept invite (doesn't need workspace ID in path, just the token)
router.post(
  '/invites/:token/accept',
  generalRateLimiter,
  asyncHandler(workspacesController.acceptInvite)
);

// Get specific workspace (requires member role)
router.get(
  '/:id',
  requireRole('viewer'),
  asyncHandler(workspacesController.getWorkspace)
);

// Invite a member (requires admin role)
router.post(
  '/:id/invite',
  requireRole('admin'),
  generalRateLimiter,
  validate(inviteMemberSchema),
  asyncHandler(workspacesController.inviteMember)
);

// Get workspace members
router.get(
  '/:id/members',
  requireRole('viewer'),
  asyncHandler(workspacesController.getMembers)
);

// Update member role (requires admin role)
router.patch(
  '/:id/members/:userId',
  requireRole('admin'),
  validate(updateRoleSchema),
  asyncHandler(workspacesController.updateMemberRole)
);

export default router;
