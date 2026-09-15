import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useWorkspaceMembers, useInviteMember, useUpdateMemberRole } from '../hooks/useWorkspaces.js';
import { usePermission } from '../hooks/usePermission.js';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export const WorkspaceMembers = () => {
  const activeWorkspace = useSelector(state => state.workspaces.activeWorkspace);
  const { canManageMembers } = usePermission();
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useWorkspaceMembers(activeWorkspace?.id, page);
  const inviteMutation = useInviteMember(activeWorkspace?.id);
  const updateRoleMutation = useUpdateMemberRole(activeWorkspace?.id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'member' }
  });

  const onInvite = async (data) => {
    try {
      const res = await inviteMutation.mutateAsync(data);
      toast.success('Invite created!');
      // In a real app we wouldn't show this, but for dev:
      toast.info(`Invite Link: ${res.inviteUrl}`, { duration: 10000 });
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

  if (!activeWorkspace) return null;

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
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-md"></div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
