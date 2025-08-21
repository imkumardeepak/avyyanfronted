import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserPermissions } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import type { UserPermissions } from '@/types/role';
import { hasPermission, canAccessPage } from '@/types/role';

interface PermissionContextType {
  permissions: UserPermissions;
  isLoading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessPage: (page: string) => boolean;
  canCreate: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Temporarily disable permission queries to fix infinite loop
  const userPermissions = {};
  const isLoading = false;
  const refetch = () => Promise.resolve();

  // Use userPermissions directly instead of storing in state to avoid infinite loops
  const permissions = userPermissions;

  const checkPermission = (resource: string, action: string): boolean => {
    // Super admin has all permissions
    if (user?.roles?.includes('SuperAdmin') || user?.roles?.includes('Admin')) {
      return true;
    }

    return hasPermission(permissions, resource, action);
  };

  const checkPageAccess = (page: string): boolean => {
    // Super admin has access to all pages
    if (user?.roles?.includes('SuperAdmin') || user?.roles?.includes('Admin')) {
      return true;
    }

    return canAccessPage(permissions, page);
  };

  const canCreate = (resource: string): boolean => {
    return checkPermission(resource, 'write') || checkPermission(resource, 'manage');
  };

  const canRead = (resource: string): boolean => {
    return checkPermission(resource, 'read') || checkPermission(resource, 'manage');
  };

  const canUpdate = (resource: string): boolean => {
    return checkPermission(resource, 'write') || checkPermission(resource, 'manage');
  };

  const canDelete = (resource: string): boolean => {
    return checkPermission(resource, 'delete') || checkPermission(resource, 'manage');
  };

  const canManage = (resource: string): boolean => {
    return checkPermission(resource, 'manage');
  };

  const refreshPermissions = () => {
    refetch();
  };

  const value: PermissionContextType = {
    permissions,
    isLoading,
    hasPermission: checkPermission,
    canAccessPage: checkPageAccess,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    refreshPermissions,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

// Higher-order component for protecting routes
interface ProtectedRouteProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  resource,
  action,
  fallback = <div>Access Denied</div>,
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Component for conditionally rendering content based on permissions
interface PermissionGateProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource,
  action,
  fallback = null,
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook for checking multiple permissions
export const useMultiplePermissions = (checks: Array<{ resource: string; action: string }>) => {
  const { hasPermission } = usePermissions();

  return checks.map(({ resource, action }) => ({
    resource,
    action,
    allowed: hasPermission(resource, action),
  }));
};

// Hook for checking if user can access a specific page
export const usePageAccess = (page: string) => {
  const { canAccessPage } = usePermissions();
  return canAccessPage(page);
};

// Hook for resource-specific permissions
export const useResourcePermissions = (resource: string) => {
  const { canCreate, canRead, canUpdate, canDelete, canManage } = usePermissions();

  return {
    canCreate: canCreate(resource),
    canRead: canRead(resource),
    canUpdate: canUpdate(resource),
    canDelete: canDelete(resource),
    canManage: canManage(resource),
  };
};

// Permission-aware button component
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  resource,
  action,
  children,
  fallback = null,
  ...props
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <button {...props}>{children}</button>;
};

// Navigation guard hook
export const useNavigationGuard = () => {
  const { canAccessPage } = usePermissions();

  const getAccessibleRoutes = () => {
    const routes = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/users', name: 'User Management' },
      { path: '/machines', name: 'Machine Management' },
      { path: '/roles', name: 'Role Management' },
      { path: '/notifications', name: 'Notifications' },
      { path: '/chat', name: 'Chat' },
      { path: '/reports', name: 'Reports' },
      { path: '/settings', name: 'Settings' },
    ];

    return routes.filter((route) => canAccessPage(route.path));
  };

  return {
    canAccessPage,
    getAccessibleRoutes,
  };
};
