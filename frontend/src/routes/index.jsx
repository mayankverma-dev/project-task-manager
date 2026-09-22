import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2, LayoutDashboard, Users as UsersIcon } from 'lucide-react';
import { useAuthInit } from '../features/auth/hooks/useAuthInit.js';
import { useWorkspaces } from '../features/workspaces/hooks/useWorkspaces.js';
import { setActiveWorkspace } from '../features/workspaces/workspaceSlice.js';
import { WebSocketProvider } from '../context/WebSocketContext.jsx';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates.js';

import { WorkspaceSwitcher } from '../features/workspaces/components/WorkspaceSwitcher.jsx';
import { ProjectList } from '../features/projects/components/ProjectList.jsx';
import { PageLoadingSkeleton } from '../components/PageLoadingSkeleton.jsx';
import { Topbar } from '../components/Topbar.jsx';

const LoginForm = lazy(() => import('../features/auth/components/LoginForm.jsx').then(m => ({ default: m.LoginForm })));
const RegisterForm = lazy(() => import('../features/auth/components/RegisterForm.jsx').then(m => ({ default: m.RegisterForm })));
const WelcomeScreen = lazy(() => import('../features/workspaces/components/WelcomeScreen.jsx').then(m => ({ default: m.WelcomeScreen })));
const AcceptInviteScreen = lazy(() => import('../features/workspaces/components/AcceptInviteScreen.jsx').then(m => ({ default: m.AcceptInviteScreen })));
const ProjectView = lazy(() => import('../features/projects/components/ProjectView.jsx').then(m => ({ default: m.ProjectView })));
const WorkspaceDashboard = lazy(() => import('../features/workspaces/components/WorkspaceDashboard.jsx').then(m => ({ default: m.WorkspaceDashboard })));
const WorkspaceMembers = lazy(() => import('../features/workspaces/components/WorkspaceMembers.jsx').then(m => ({ default: m.WorkspaceMembers })));
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RealTimeWrapper = ({ children }) => {
  useRealTimeUpdates();
  return children;
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

const AuthenticatedApp = () => {
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

// Dashboard component removed as it is now part of AuthenticatedApp layout

export const AppRoutes = () => {
  const isInitialized = useAuthInit();

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <Routes>
        <Route path="/login" element={
          <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 items-center">
            <LoginForm />
          </div>
        } />
        <Route path="/register" element={
          <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 items-center">
            <RegisterForm />
          </div>
        } />
        <Route path="/accept-invite" element={<AcceptInviteScreen />} />

        <Route path="/" element={
          <ProtectedRoute>
            <WebSocketProvider>
              <RealTimeWrapper>
                <AuthenticatedApp />
              </RealTimeWrapper>
            </WebSocketProvider>
          </ProtectedRoute>
        }>
          <Route index element={<WorkspaceDashboard />} />
          <Route path="members" element={
            <div className="p-8 max-w-6xl mx-auto w-full">
              <WorkspaceMembers />
            </div>
          } /><Route path="workspaces/:workspaceId/projects/:projectId" element={<ProjectView />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
