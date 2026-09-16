import crypto from 'crypto';
import { workspacesRepository } from './workspaces.repository.js';
import { authRepository } from '../auth/auth.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { getOrSetCache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';
import { emailQueue } from '../../jobs/queue.js';

export const workspacesService = {
  async createWorkspace(data, userId) {
    if (data.slug) {
      const existing = await workspacesRepository.getWorkspaceBySlug(data.slug);
      if (existing) {
        throw new ApiError(409, 'CONFLICT', 'Workspace with this slug already exists');
      }
    } else {
      // Auto-generate slug if not provided
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(3).toString('hex');
    }
    
    return await workspacesRepository.createWorkspace(data, userId);
  },

  async getUserWorkspaces(userId) {
    return await workspacesRepository.getWorkspacesByUserId(userId);
  },

  async getWorkspaceById(id) {
    const workspace = await workspacesRepository.getWorkspaceById(id);
    if (!workspace) {
      throw new ApiError(404, 'NOT_FOUND', 'Workspace not found');
    }
    return workspace;
  },

  async inviteMember(workspaceId, inviteData, inviterId) {
    // Check if user is already a member
    const targetUser = await authRepository.getUserByEmail(inviteData.email);
    if (targetUser) {
      const existingMember = await workspacesRepository.getMember(workspaceId, targetUser.id);
      if (existingMember) {
        throw new ApiError(409, 'CONFLICT', 'User is already a member of this workspace');
      }
    }

    // Check if invite already exists
    const existingInvite = await workspacesRepository.getInviteByEmailAndWorkspace(inviteData.email, workspaceId);
    if (existingInvite) {
      // Could resend, but for now just throw or update
      throw new ApiError(409, 'CONFLICT', 'Invite already sent to this email');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const invite = await workspacesRepository.createInvite({
      workspaceId,
      email: inviteData.email,
      role: inviteData.role,
      token,
      expiresAt,
    });

    // Enqueue invite email via BullMQ — best-effort, never fails the invite response
    try {
      // Fetch workspace name and inviter name for the email
      const [workspace, inviter] = await Promise.all([
        workspacesRepository.getWorkspaceById(workspaceId),
        authRepository.getUserById(inviterId),
      ]);

      await emailQueue.add(
        'workspace_invite_email',
        {
          email: inviteData.email,
          inviteeName: targetUser?.name ?? null, // null if invitee is not yet registered
          inviterName: inviter?.name ?? 'A team member',
          workspaceName: workspace?.name ?? 'a workspace',
          role: inviteData.role,
          token,
        },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );

      logger.info({ workspaceId, inviteeEmail: inviteData.email }, 'workspace_invite_email job enqueued');
    } catch (queueErr) {
      logger.warn(
        { err: queueErr, workspaceId, inviteeEmail: inviteData.email },
        'Failed to enqueue workspace_invite_email — continuing without email'
      );
    }

    return invite;
  },

  async getInviteDetails(token) {
    const invite = await workspacesRepository.getInviteDetails(token);
    if (!invite) {
      throw new ApiError(404, 'NOT_FOUND', 'Invite not found or invalid');
    }
    if (new Date() > invite.expiresAt) {
      throw new ApiError(400, 'BAD_REQUEST', 'Invite has expired');
    }
    return {
      workspaceName: invite.workspaceName,
      role: invite.role,
      email: invite.email
    };
  },

  async acceptInvite(token, userId) {
    const invite = await workspacesRepository.getInviteByToken(token);
    if (!invite) {
      throw new ApiError(404, 'NOT_FOUND', 'Invalid or expired invite token');
    }

    if (new Date() > new Date(invite.expiresAt)) {
      await workspacesRepository.deleteInvite(invite.id);
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invite token has expired');
    }

    const user = await authRepository.getUserById(userId);
    if (user.email !== invite.email) {
      throw new ApiError(403, 'FORBIDDEN', 'This invite was sent to a different email address');
    }

    // Check if already a member somehow
    const existingMember = await workspacesRepository.getMember(invite.workspaceId, userId);
    if (existingMember) {
      await workspacesRepository.deleteInvite(invite.id);
      throw new ApiError(409, 'CONFLICT', 'You are already a member of this workspace');
    }

    const member = await workspacesRepository.addMember(invite.workspaceId, userId, invite.role);
    await workspacesRepository.deleteInvite(invite.id);

    return { workspaceId: invite.workspaceId, role: member.role };
  },

  async getWorkspaceMembers(workspaceId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const members = await workspacesRepository.getMembers(workspaceId, pageSize, offset);
    const total = await workspacesRepository.getMemberCount(workspaceId);

    return {
      members,
      total,
      page,
      pageSize,
    };
  },

  async updateMemberRole(workspaceId, targetUserId, newRole, requesterRole) {
    // Basic hierarchy validation
    const ROLE_HIERARCHY = { viewer: 1, member: 2, admin: 3, owner: 4 };
    
    const targetMember = await workspacesRepository.getMember(workspaceId, targetUserId);
    if (!targetMember) {
      throw new ApiError(404, 'NOT_FOUND', 'Member not found');
    }

    if (targetMember.role === 'owner') {
      throw new ApiError(403, 'FORBIDDEN', 'Cannot change the role of the workspace owner');
    }

    if (newRole === 'owner') {
      throw new ApiError(403, 'FORBIDDEN', 'Cannot assign owner role');
    }

    // A requester cannot assign a role higher than their own (unless owner), handled mostly by requireRole middleware
    // but good to double check
    if (ROLE_HIERARCHY[requesterRole] < ROLE_HIERARCHY[newRole]) {
      throw new ApiError(403, 'FORBIDDEN', 'Cannot assign a role higher than your own');
    }

    return await workspacesRepository.updateMemberRole(workspaceId, targetUserId, newRole);
  },

  async getDashboardStats(workspaceId) {
    const cacheKey = `cache:workspace:${workspaceId}:dashboard`;
    const ttl = 60; // 60 seconds cache

    return await getOrSetCache(cacheKey, ttl, async () => {
      return await workspacesRepository.getDashboardStats(workspaceId);
    });
  }
};
