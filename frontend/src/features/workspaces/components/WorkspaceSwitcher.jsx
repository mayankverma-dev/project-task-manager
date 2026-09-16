import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useWorkspaces } from '../hooks/useWorkspaces.js';
import { setActiveWorkspace } from '../workspaceSlice.js';
import { ChevronDown, Plus } from 'lucide-react';
import { CreateWorkspaceModal } from './CreateWorkspaceModal.jsx';

export const WorkspaceSwitcher = () => {
  const dispatch = useDispatch();
  const { data: workspaces, isLoading } = useWorkspaces();
  const activeWorkspace = useSelector(state => state.workspaces.activeWorkspace);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading || !workspaces) {
    return <div className="h-10 w-full bg-gray-700 animate-pulse rounded-md" />;
  }

  const handleSwitch = (e) => {
    const ws = workspaces.find(w => w.id === e.target.value);
    if (ws) {
      dispatch(setActiveWorkspace(ws));
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Workspace select dropdown */}
        <div className="relative">
          <select
            value={activeWorkspace?.id || ''}
            onChange={handleSwitch}
            className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md appearance-none bg-gray-700 text-white font-medium cursor-pointer"
          >
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id} className="bg-gray-800 text-white">
                {ws.name} ({ws.role})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        {/* New Workspace button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Workspace
        </button>
      </div>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
