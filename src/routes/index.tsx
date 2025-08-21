import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingBar from 'react-top-loading-bar';
import { useLoadingBar } from '../hooks/useLoadingBar';
import Layout from '../components/Layout';
import AuthLayout from '../components/AuthLayout';
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';
import { Loader } from '../components/loader';

// Lazy-loaded pages
const Home = lazy(() => import('../pages/Home'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Login = lazy(() => import('../pages/Login'));

// Machine Manager Pages
const MachineManager = lazy(() => import('../pages/MachineManager'));
const MachineForm = lazy(() => import('../pages/MachineManager/MachineForm'));
const MachineDetails = lazy(() => import('../pages/MachineManager/MachineDetails'));

// User Management Pages
const UserManagement = lazy(() => import('../pages/UserManagement'));
const UserForm = lazy(() => import('../pages/UserManagement/UserForm'));
const UserDetails = lazy(() => import('../pages/UserManagement/UserDetails'));

// Role Management Pages
const RoleManagement = lazy(() => import('../pages/RoleManagement'));
const RoleForm = lazy(() => import('../pages/RoleManagement/RoleForm'));
const RoleDetails = lazy(() => import('../pages/RoleManagement/RoleDetails'));

// Chat Pages
const Chat = lazy(() => import('../pages/Chat'));

// Notification Pages
const Notifications = lazy(() => import('../pages/Notifications'));

const Router = () => {
  const { ref, handleStart, handleComplete } = useLoadingBar();

  return (
    <>
      <LoadingBar color="#3b82f6" ref={ref} />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route
              path="login"
              element={
                <PublicRoute>
                  <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                    <Login />
                  </LazyRoute>
                </PublicRoute>
              }
            />
          </Route>

          {/* Redirect /login to /auth/login */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <Login />
                </LazyRoute>
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <Dashboard />
                </LazyRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <Dashboard />
                </LazyRoute>
              }
            />
            <Route
              path="home"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <Home />
                </LazyRoute>
              }
            />

            {/* Machine Manager Routes */}
            <Route
              path="machines"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <MachineManager />
                </LazyRoute>
              }
            />
            <Route
              path="machines/create"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <MachineForm />
                </LazyRoute>
              }
            />
            <Route
              path="machines/:id"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <MachineDetails />
                </LazyRoute>
              }
            />
            <Route
              path="machines/:id/edit"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <MachineForm />
                </LazyRoute>
              }
            />

            {/* User Management Routes */}
            <Route
              path="users"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <UserManagement />
                </LazyRoute>
              }
            />
            <Route
              path="users/create"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <UserForm />
                </LazyRoute>
              }
            />
            <Route
              path="users/:id"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <UserDetails />
                </LazyRoute>
              }
            />
            <Route
              path="users/:id/edit"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <UserForm />
                </LazyRoute>
              }
            />

            {/* Role Management Routes */}
            <Route
              path="roles"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <RoleManagement />
                </LazyRoute>
              }
            />
            <Route
              path="roles/new"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <RoleForm />
                </LazyRoute>
              }
            />
            <Route
              path="roles/:id"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <RoleDetails />
                </LazyRoute>
              }
            />
            <Route
              path="roles/:id/edit"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <RoleForm />
                </LazyRoute>
              }
            />

            {/* Chat Routes */}
            <Route
              path="chat"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <Chat />
                </LazyRoute>
              }
            />

            {/* Notification Routes */}
            <Route
              path="notifications"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <Notifications />
                </LazyRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

// Helper component for loading bar integration
const LazyRoute = ({
  children,
  onLoadStart,
  onLoadComplete,
}: {
  children: React.ReactNode;
  onLoadStart: () => void;
  onLoadComplete: () => void;
}) => {
  useEffect(() => {
    onLoadStart();
    const timer = setTimeout(() => onLoadComplete(), 500);
    return () => clearTimeout(timer);
  }, [onLoadStart, onLoadComplete]);

  return <>{children}</>;
};

export default Router;
