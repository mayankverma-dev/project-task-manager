import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { useAuthInit } from '../features/auth/hooks/useAuthInit.js';
import { useWorkspaces } from '../features/workspaces/hooks/useWorkspaces.js';
import { setActiveWorkspace } from '../features/workspaces/workspaceSlice.js';

const LoginForm = lazy(() => import('../features/auth/components/LoginForm.jsx').then(m => ({ default: m.LoginForm })));
const RegisterForm = lazy(() => import('../features/auth/components/RegisterForm.jsx').then(m => ({ default: m.RegisterForm })));
const WelcomeScreen = lazy(() => import('../features/workspaces/components/WelcomeScreen.jsx').then(m => ({ default: m.WelcomeScreen })));
const AcceptInviteScreen = lazy(() => import('../features/workspaces/components/AcceptInviteScreen.jsx').then(m => ({ default: m.AcceptInviteScreen })));
const ProjectView = lazy(() => import('../features/projects/components/ProjectView.jsx').then(m => ({ default: m.ProjectView })));
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

const AuthenticatedApp = ({ children }) => {
  const dispatch = useDispatch();
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
      {/* Sidebar will go here eventually */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

import { WorkspaceSwitcher } from '../features/workspaces/components/WorkspaceSwitcher.jsx';
import { WorkspaceMembers } from '../features/workspaces/components/WorkspaceMembers.jsx';
import { ProjectList } from '../features/projects/components/ProjectList.jsx';

// Placeholder Dashboard for now
const Dashboard = () => {
  const activeWorkspace = useSelector(state => state.workspaces.activeWorkspace);

  return (
    <div className="flex h-full">
      <aside className="flex flex-col w-64 p-4 text-white bg-gray-800">
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-semibold tracking-wider text-gray-400 uppercase">Workspace</h2>
          <WorkspaceSwitcher />
        </div>
        <nav className="flex-1">
          {activeWorkspace && (
            <ProjectList workspaceId={activeWorkspace.id} />
          )}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto bg-gray-100">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Project Task Manager</p>

        <WorkspaceMembers />
      </main>
    </div>
  );
};

export const AppRoutes = () => {
  const isInitialized = useAuthInit();

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
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
            <AuthenticatedApp>
              <Dashboard />
            </AuthenticatedApp>
          </ProtectedRoute>
        } />
        <Route path="/workspaces/:workspaceId/projects/:projectId" element={
          <ProtectedRoute>
            <AuthenticatedApp>
              <ProjectView />
            </AuthenticatedApp>
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
};
