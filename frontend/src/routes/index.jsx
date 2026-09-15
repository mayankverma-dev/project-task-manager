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

// Placeholder Dashboard for now
const Dashboard = () => (
  <div className="flex h-full">
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace</h2>
        <WorkspaceSwitcher />
      </div>
      <nav className="flex-1">
        {/* Navigation items will go here */}
      </nav>
    </aside>
    <main className="flex-1 p-8 overflow-y-auto bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-gray-600">Welcome to Project Task Manager</p>
      
      <WorkspaceMembers />
    </main>
  </div>
);

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
      </Routes>
    </Suspense>
  );
};
