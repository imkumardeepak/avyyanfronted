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
const Register = lazy(() => import('../pages/Register'));
const PasswordReset = lazy(() => import('../pages/PasswordReset'));

// User Management Pages
const UserManagement = lazy(() => import('../pages/UserManagement'));
const UserForm = lazy(() => import('../pages/UserManagement/UserForm'));
const UserDetails = lazy(() => import('../pages/UserManagement/UserDetails'));

// User Profile Pages
const UserProfile = lazy(() => import('../pages/UserProfile'));
const ChangePassword = lazy(() => import('../pages/UserProfile/ChangePassword'));

// Role Management Pages
const RoleManagement = lazy(() => import('../pages/RoleManagement'));
const RoleForm = lazy(() => import('../pages/RoleManagement/RoleForm'));
const RolePermissions = lazy(() => import('../pages/RoleManagement/RolePermissions'));

// Machine Management Pages
const MachineManagement = lazy(() => import('../pages/MachineManagement'));
const MachineForm = lazy(() => import('../pages/MachineManagement/MachineForm'));

// Fabric Structure Management Pages
const FabricStructureManagement = lazy(() => import('../pages/FabricStructureManagement'));
const FabricStructureForm = lazy(
  () => import('../pages/FabricStructureManagement/FabricStructureForm')
);

// Chat and Notifications Pages
const Chat = lazy(() => import('../pages/Chat'));
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

          {/* Public Auth Routes */}
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
          <Route
            path="/register"
            element={
              <PublicRoute>
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <Register />
                </LazyRoute>
              </PublicRoute>
            }
          />
          <Route
            path="/password-reset"
            element={
              <PublicRoute>
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <PasswordReset />
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

            <Route
              path="roles"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <RoleManagement />
                </LazyRoute>
              }
            />
            <Route
              path="roles/create"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <RoleForm />
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
            <Route
              path="roles/:id/permissions"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <RolePermissions />
                </LazyRoute>
              }
            />

            {/* Machine Management Routes */}
            <Route
              path="machines"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <MachineManagement />
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
              path="machines/:id/edit"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <MachineForm />
                </LazyRoute>
              }
            />

            {/* Fabric Structure Management Routes */}
            <Route
              path="fabric-structures"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <FabricStructureManagement />
                </LazyRoute>
              }
            />
            <Route
              path="fabric-structures/create"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <FabricStructureForm />
                </LazyRoute>
              }
            />
            <Route
              path="fabric-structures/:id/edit"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <FabricStructureForm />
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

            {/* User Profile Routes */}
            <Route
              path="profile"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <UserProfile />
                </LazyRoute>
              }
            />
            <Route
              path="profile/change-password"
              element={
                <LazyRoute onLoadStart={handleStart} onLoadComplete={handleComplete}>
                  <ChangePassword />
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

            {/* Notifications Routes */}
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
