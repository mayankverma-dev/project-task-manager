import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, Users as UsersIcon } from 'lucide-react';
import { useWorkspaces } from '../features/workspaces/hooks/useWorkspaces.js';
import { setActiveWorkspace } from '../features/workspaces/workspaceSlice.js';
import { WorkspaceSwitcher } from '../features/workspaces/components/WorkspaceSwitcher.jsx';
import { ProjectList } from '../features/projects/components/ProjectList.jsx';
import { Topbar } from '../components/Topbar.jsx';
import { WelcomeScreen } from '../features/workspaces/components/WelcomeScreen.jsx';
import { LoadingFallback } from '../components/LoadingFallback.jsx';

export const AppLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { data: workspaces, isLoading, isError } = useWorkspaces();
  const activeWorkspace = useSelector(state => state.workspaces.activeWorkspace);

  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !activeWorkspace) {
      dispatch(setActiveWorkspace(workspaces[0]));
    } else if (workspaces && activeWorkspace) {
      // Optional: Verify activeWorkspace is still in the list, otherwise switch
      const stillExists = workspaces.find(w => w.id === activeWorkspace.id);
      if (!stillExists && workspaces.length > 0) {
        dispatch(setActiveWorkspace(workspaces[0]));
      } else if (stillExists && JSON.stringify(stillExists) !== JSON.stringify(activeWorkspace)) {
        dispatch(setActiveWorkspace(stillExists));
      }
    }
  }, [workspaces, activeWorkspace, dispatch]);

  if (isLoading) return <LoadingFallback />;
  if (isError) return <div>Error loading workspaces</div>; // Better error state needed later

  if (!workspaces || workspaces.length === 0) {
    return <WelcomeScreen />;
  }

  if (!activeWorkspace) {
    return <LoadingFallback />; // Wait for useEffect to set it
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="flex flex-col w-64 p-4 text-white bg-gray-800 shrink-0">
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-semibold tracking-wider text-gray-400 uppercase">Workspace</h2>
          <WorkspaceSwitcher />
        </div>
        
        {activeWorkspace && (
          <nav className="flex-1 flex flex-col gap-1">
            <Link 
              to="/" 
              className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-700 ${location.pathname === '/' ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </Link>
            <Link 
              to="/members" 
              className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-700 ${location.pathname === '/members' ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
            >
              <UsersIcon className="w-4 h-4 mr-3" />
              Members
            </Link>
            
            <div className="mt-6 mb-2 text-sm font-semibold tracking-wider text-gray-400 uppercase">Projects</div>
            <ProjectList workspaceId={activeWorkspace.id} />
          </nav>
        )}
        
      </aside>
      <main className="flex-1 overflow-auto bg-gray-100 dark:bg-neutral-900 relative">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
};
