import { useSelector } from 'react-redux';

const ROLE_HIERARCHY = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export const usePermission = () => {
  const activeWorkspace = useSelector((state) => state.workspaces.activeWorkspace);
  const role = activeWorkspace?.role;

  const hasRole = (minRole) => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
  };

  return {
    canView: hasRole('viewer'),
    canEdit: hasRole('member'),
    canManageProjects: hasRole('member'), // members can create projects per PRD
    canManageMembers: hasRole('admin'), // admins can invite/change roles
    canDeleteWorkspace: hasRole('admin'), // admins can delete projects/workspaces
    isOwner: hasRole('owner'),
  };
};
