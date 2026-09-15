import { useSelector, useDispatch } from 'react-redux';
import { useWorkspaces } from '../hooks/useWorkspaces.js';
import { setActiveWorkspace } from '../workspaceSlice.js';
import { ChevronDown } from 'lucide-react';

export const WorkspaceSwitcher = () => {
  const dispatch = useDispatch();
  const { data: workspaces, isLoading } = useWorkspaces();
  const activeWorkspace = useSelector(state => state.workspaces.activeWorkspace);

  if (isLoading || !workspaces) {
    return <div className="h-10 w-full bg-gray-200 animate-pulse rounded-md" />;
  }

  const handleSwitch = (e) => {
    const ws = workspaces.find(w => w.id === e.target.value);
    if (ws) {
      dispatch(setActiveWorkspace(ws));
    }
  };

  return (
    <div className="relative inline-block w-full">
      <select
        value={activeWorkspace?.id || ''}
        onChange={handleSwitch}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none bg-white font-medium"
      >
        {workspaces.map(ws => (
          <option key={ws.id} value={ws.id}>
            {ws.name} ({ws.role})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
};
