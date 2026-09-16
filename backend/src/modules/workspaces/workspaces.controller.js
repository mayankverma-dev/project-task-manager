import { workspacesService } from './workspaces.service.js';
import { apiResponse } from '../../utils/apiResponse.js';

export const workspacesController = {
  async createWorkspace(req, res) {
    const workspace = await workspacesService.createWorkspace(req.body, req.user.userId);
    res.status(201).json(apiResponse(workspace));
  },

  async getWorkspaces(req, res) {
    const workspaces = await workspacesService.getUserWorkspaces(req.user.userId);
    res.json(apiResponse(workspaces));
  },

  async getWorkspace(req, res) {
    // requireRole middleware ensures they are a member
    const workspace = await workspacesService.getWorkspaceById(req.params.id);
    res.json(apiResponse(workspace));
  },

  async getDashboardStats(req, res) {
    const stats = await workspacesService.getDashboardStats(req.params.id);
    res.json(apiResponse(stats));
  },

  async inviteMember(req, res) {
    const invite = await workspacesService.inviteMember(req.params.id, req.body);
    // Returning the invite (and token) directly so we can simulate email flow in UI
    res.status(201).json(apiResponse({ inviteUrl: `/accept-invite?token=${invite.token}`, invite }));
  },

  async getInviteDetails(req, res) {
    const details = await workspacesService.getInviteDetails(req.params.token);
    res.json(apiResponse(details));
  },

  async acceptInvite(req, res) {
    const result = await workspacesService.acceptInvite(req.params.token, req.user.userId);
    res.json(apiResponse(result));
  },

  async getMembers(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    
    const result = await workspacesService.getWorkspaceMembers(req.params.id, page, pageSize);
    res.json(apiResponse(result.members, { page: result.page, pageSize: result.pageSize, total: result.total }));
  },

  async updateMemberRole(req, res) {
    const updated = await workspacesService.updateMemberRole(
      req.params.id,
      req.params.userId,
      req.body.role,
      req.userRole // Set by requireRole middleware
    );
    res.json(apiResponse(updated));
  }
};
