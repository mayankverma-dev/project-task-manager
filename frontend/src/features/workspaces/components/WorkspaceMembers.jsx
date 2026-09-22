import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  useWorkspaceMembers,
  useInviteMember,
  useUpdateMemberRole,
  usePendingInvites,
  useCancelInvite,
  useRemoveMember,
} from '../hooks/useWorkspaces.js';
import { usePermission } from '../hooks/usePermission.js';
import { MemberRowSkeleton } from './MemberRowSkeleton.jsx';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export const WorkspaceMembers = () => {
  const activeWorkspace = useSelector(state => state.workspaces.activeWorkspace);
  const { canManageMembers } = usePermission();
  const [page, setPage] = useState(1);
  const [cancellingId, setCancellingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  
  const { data, isLoading } = useWorkspaceMembers(activeWorkspace?.id, page);
  const { data: pendingInvites, isLoading: invitesLoading } = usePendingInvites(
    canManageMembers ? activeWorkspace?.id : null
  );
  const inviteMutation = useInviteMember(activeWorkspace?.id);
  const updateRoleMutation = useUpdateMemberRole(activeWorkspace?.id);
  const cancelInviteMutation = useCancelInvite(activeWorkspace?.id);
  const removeMemberMutation = useRemoveMember(activeWorkspace?.id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'member' }
  });

  const onInvite = async (formData) => {
    try {
      const res = await inviteMutation.mutateAsync(formData);
      toast.success(`Invite email sent to ${res?.email ?? formData.email}!`, {
        description: `They'll receive an email with a link to join as ${formData.role}.`,
      });
      reset();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to send invite');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      toast.success('Role updated');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const handleCancelInvite = async (inviteId, email) => {
    setCancellingId(inviteId);
    try {
      await cancelInviteMutation.mutateAsync(inviteId);
      toast.success(`Invite to ${email} cancelled`);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to cancel invite');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRemoveMember = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the workspace?`)) return;
    setRemovingId(userId);
    try {
      await removeMemberMutation.mutateAsync(userId);
      toast.success(`Member ${email} removed`);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  if (!activeWorkspace) return null;

  const invitesList = Array.isArray(pendingInvites) ? pendingInvites : [];

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Workspace Members</h2>
      
      {canManageMembers && (
        <form onSubmit={handleSubmit(onInvite)} className="mb-6 flex gap-4 items-start">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Email address"
              {...register('email')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="w-40">
            <select
              {...register('role')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      )}

      {isLoading ? (
        <MemberRowSkeleton count={3} />
      ) : (
        <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                {canManageMembers && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                      <div className="text-sm text-gray-500 ml-2">({member.user.email})</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canManageMembers && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        className="block w-full py-1 px-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                        disabled={updateRoleMutation.isPending}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  {canManageMembers && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.user.email)}
                          disabled={removingId === member.userId}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
                        >
                          {removingId === member.userId ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pending Invites section (admins/owners only) ── */}
      {canManageMembers && (
        <div className="mt-8">
          <h3 className="text-base font-medium text-gray-800 mb-3">
            Pending Invites
            {invitesList.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {invitesList.length}
              </span>
            )}
          </h3>

          {invitesLoading ? (
            <MemberRowSkeleton count={2} />
          ) : invitesList.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No pending invites.</p>
          ) : (
            <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitesList.map((invite) => (
                    <tr key={invite.id} className={invite.isExpired ? 'opacity-60' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invite.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invite.isExpired ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleCancelInvite(invite.id, invite.email)}
                          disabled={cancellingId === invite.id}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
                        >
                          {cancellingId === invite.id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

