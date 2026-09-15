import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { useAuthInit } from '../features/auth/hooks/useAuthInit.js';

const LoginForm = lazy(() => import('../features/auth/components/LoginForm.jsx').then(m => ({ default: m.LoginForm })));
const RegisterForm = lazy(() => import('../features/auth/components/RegisterForm.jsx').then(m => ({ default: m.RegisterForm })));

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

// Placeholder Dashboard for now
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <p>Welcome to Project Task Manager</p>
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
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
};
