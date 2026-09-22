import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthInit } from '../features/auth/hooks/useAuthInit.js';
import { WebSocketProvider } from '../context/WebSocketContext.jsx';

import { PageLoadingSkeleton } from '../components/PageLoadingSkeleton.jsx';
import { LoadingFallback } from '../components/LoadingFallback.jsx';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute.jsx';
import { RealTimeWrapper } from '../components/RealTimeWrapper.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';

const LoginForm = lazy(() => import('../features/auth/components/LoginForm.jsx').then(m => ({ default: m.LoginForm })));
const RegisterForm = lazy(() => import('../features/auth/components/RegisterForm.jsx').then(m => ({ default: m.RegisterForm })));
const AcceptInviteScreen = lazy(() => import('../features/workspaces/components/AcceptInviteScreen.jsx').then(m => ({ default: m.AcceptInviteScreen })));
const ProjectView = lazy(() => import('../features/projects/components/ProjectView.jsx').then(m => ({ default: m.ProjectView })));
const WorkspaceDashboard = lazy(() => import('../features/workspaces/components/WorkspaceDashboard.jsx').then(m => ({ default: m.WorkspaceDashboard })));
const WorkspaceMembers = lazy(() => import('../features/workspaces/components/WorkspaceMembers.jsx').then(m => ({ default: m.WorkspaceMembers })));

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
                <AppLayout />
              </RealTimeWrapper>
            </WebSocketProvider>
          </ProtectedRoute>
        }>
          <Route index element={<WorkspaceDashboard />} />
          <Route path="members" element={
            <div className="p-8 max-w-6xl mx-auto w-full">
              <WorkspaceMembers />
            </div>
          } />
          <Route path="workspaces/:workspaceId/projects/:projectId" element={<ProjectView />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
