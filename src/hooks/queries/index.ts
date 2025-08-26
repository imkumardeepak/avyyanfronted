// Export all React Query hooks for easy importing

// User Management Queries
export {
  userKeys,
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from './useUserQueries';

// Role Management Queries
export {
  roleKeys,
  useRoles,
  useRole,
  useRolePageAccesses,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from './useRoleQueries';

// Machine Management Queries
export {
  machineKeys,
  useMachines,
  useMachine,
  useSearchMachines,
  useCreateMachine,
  useUpdateMachine,
  useDeleteMachine,
  useBulkCreateMachines,
} from './useMachineQueries';

// Additional Role Queries - Removed

// Chat Management Queries - Removed

// Notification Management Queries - Removed

// Common Query Utilities
export const queryUtils = {
  // Invalidate all queries for a specific entity type
  invalidateUserQueries: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
  
  invalidateRoleQueries: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  },
  
  invalidateMachineQueries: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['machines'] });
  },

  // Clear all caches
  clearAllCaches: (queryClient: any) => {
    queryClient.clear();
  },
};

// Query key factories for consistent key generation
export const createQueryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...createQueryKeys.users.all, 'list'] as const,
    list: (filters: any) => [...createQueryKeys.users.lists(), { filters }] as const,
    details: () => [...createQueryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...createQueryKeys.users.details(), id] as const,
  },
  
  roles: {
    all: ['roles'] as const,
    lists: () => [...createQueryKeys.roles.all, 'list'] as const,
    list: (filters: any) => [...createQueryKeys.roles.lists(), { filters }] as const,
    details: () => [...createQueryKeys.roles.all, 'detail'] as const,
    detail: (id: number) => [...createQueryKeys.roles.details(), id] as const,
  },
  
  machines: {
    all: ['machines'] as const,
    lists: () => [...createQueryKeys.machines.all, 'list'] as const,
    list: (filters: any) => [...createQueryKeys.machines.lists(), { filters }] as const,
    details: () => [...createQueryKeys.machines.all, 'detail'] as const,
    detail: (id: number) => [...createQueryKeys.machines.details(), id] as const,
  },
};

// Error handling utilities
export const queryErrorHandlers = {
  // Standard error handler for mutations
  handleMutationError: (error: any, defaultMessage: string) => {
    const message = error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      defaultMessage;

    return {
      title: 'Error',
      description: message,
      variant: 'destructive' as const,
    };
  },

  // Check if error is authentication related
  isAuthError: (error: any) => {
    return error?.response?.status === 401 || error?.response?.status === 403;
  },

  // Check if error is network related
  isNetworkError: (error: any) => {
    return !error?.response && error?.code === 'NETWORK_ERROR';
  },

  // Get user-friendly error message
  getUserFriendlyMessage: (error: any) => {
    if (queryErrorHandlers.isAuthError(error)) {
      return 'You are not authorized to perform this action.';
    }

    if (queryErrorHandlers.isNetworkError(error)) {
      return 'Network error. Please check your connection and try again.';
    }

    if (error?.response?.status === 404) {
      return 'The requested resource was not found.';
    }

    if (error?.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }

    return error?.response?.data?.message || error?.message || 'An unexpected error occurred.';
  },
};

// Performance optimization utilities
export const queryOptimizations = {
  // Background refetch for critical data
  setupBackgroundRefetch: (queryClient: any) => {
    // Can add background refetch logic here if needed
  },

  // Prefetch common data
  prefetchCommonData: async (queryClient: any) => {
    try {
      // Prefetch roles for user management (pageAccesses included)
      await queryClient.prefetchQuery({
        queryKey: ['roles', 'list'],
        queryFn: async () => {
          const { roleApi } = await import('@/lib/api-client');
          const response = await roleApi.getAllRoles();
          return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    } catch (error) {
      console.warn('Failed to prefetch common data:', error);
    }
  },
};