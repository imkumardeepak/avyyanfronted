import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import LoadingBar from "react-top-loading-bar";
import { useLoadingBar } from "../hooks/useLoadingBar";
import Layout from "../components/Layout";
import AuthLayout from "../components/AuthLayout";
import { ProtectedRoute, PublicRoute } from "../components/ProtectedRoute";
import { Loader } from "../components/loader";

// Lazy-loaded pages
const Home = lazy(() => import("../pages/Home"));
const ComponentsDemo = lazy(() => import("../pages/ComponentsDemo"));
const FormDemo = lazy(() => import("../pages/FormDemo"));
const TasksPage = lazy(() => import("../pages/Tasks"));
const Login = lazy(() => import("../pages/Login"));

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
                  <LazyRoute
                    onLoadStart={handleStart}
                    onLoadComplete={handleComplete}
                  >
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
                <LazyRoute
                  onLoadStart={handleStart}
                  onLoadComplete={handleComplete}
                >
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
                <LazyRoute
                  onLoadStart={handleStart}
                  onLoadComplete={handleComplete}
                >
                  <Home />
                </LazyRoute>
              }
            />
            <Route
              path="components"
              element={
                <LazyRoute
                  onLoadStart={handleStart}
                  onLoadComplete={handleComplete}
                >
                  <ComponentsDemo />
                </LazyRoute>
              }
            />
            <Route
              path="forms"
              element={
                <LazyRoute
                  onLoadStart={handleStart}
                  onLoadComplete={handleComplete}
                >
                  <FormDemo />
                </LazyRoute>
              }
            />
            <Route
              path="tasks"
              element={
                <LazyRoute
                  onLoadStart={handleStart}
                  onLoadComplete={handleComplete}
                >
                  <TasksPage />
                </LazyRoute>
              }
            />
            <Route
              path="projects"
              element={
                <LazyRoute
                  onLoadStart={handleStart}
                  onLoadComplete={handleComplete}
                >
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Projects Page</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
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
