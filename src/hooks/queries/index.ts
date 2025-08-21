// Export all React Query hooks for easy importing

// User Management Queries
export {
  userKeys,
  roleKeys,
  useUsers,
  useUser,
  useUserRoles,
  useRoles,
  useRole,
  usePageAccesses,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useLockUser,
  useUnlockUser,
  useAssignUserRole,
  useRemoveUserRole,
} from './useUserQueries';

// Machine Management Queries
export {
  machineKeys,
  useMachines,
  useMachine,
  useSearchMachines,
  useCreateMachine,
  useCreateMultipleMachines,
  useUpdateMachine,
  useDeleteMachine,
  useUpdateMachineStatus,
  usePrefetchMachine,
  useInfiniteMachines,
} from './useMachineQueries';

// Chat Queries
export {
  chatKeys,
  useChatRooms,
  useChatRoom,
  useChatMessages,
  useInfiniteChatMessages,
  useSearchUsers,
  useUnreadCounts,
  useCreateChatRoom,
  useUpdateChatRoom,
  useDeleteChatRoom,
  useSendMessage,
  useMarkMessageAsRead,
  useAddMessageToCache,
} from './useChatQueries';

// Notification Queries
export {
  notificationKeys,
  useNotifications,
  useInfiniteNotifications,
  useNotification,
  useUnreadNotificationCount,
  useUserNotifications,
  useCreateNotification,
  useCreateSystemNotification,
  useCreateBulkNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  useAddNotificationToCache,
} from './useNotificationQueries';

// Additional Role Queries (extending existing ones)
export {
  usePermissions,
  usePermissionsByCategory,
  useUserPermissions,
  useRoleUsers,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignRoleToUser,
  useRemoveRoleFromUser,
  usePermissionCheck,
  // Page-based permission queries
  useRolePagePermissions,
  useUserPagePermissions,
  useAvailablePages,
  useUpdateRolePagePermissions,
} from './useRoleQueries';

// Common Query Utilities
export const queryUtils = {
  // Invalidate all queries for a specific entity type
  invalidateUserQueries: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
  
  invalidateMachineQueries: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['machines'] });
  },
  
  invalidateChatQueries: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['chat'] });
  },
  
  invalidateNotificationQueries: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
  
  machines: {
    all: ['machines'] as const,
    lists: () => [...createQueryKeys.machines.all, 'list'] as const,
    list: (filters: any) => [...createQueryKeys.machines.lists(), { filters }] as const,
    details: () => [...createQueryKeys.machines.all, 'detail'] as const,
    detail: (id: number) => [...createQueryKeys.machines.details(), id] as const,
  },
  
  chat: {
    all: ['chat'] as const,
    rooms: () => [...createQueryKeys.chat.all, 'rooms'] as const,
    room: (id: number) => [...createQueryKeys.chat.rooms(), id] as const,
    messages: (roomId: number) => [...createQueryKeys.chat.room(roomId), 'messages'] as const,
  },
  
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...createQueryKeys.notifications.all, 'list'] as const,
    list: (filters: any) => [...createQueryKeys.notifications.lists(), { filters }] as const,
    details: () => [...createQueryKeys.notifications.all, 'detail'] as const,
    detail: (id: number) => [...createQueryKeys.notifications.details(), id] as const,
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
    // Refetch unread notification count every 30 seconds
    setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unreadCount'],
        refetchType: 'active',
      });
    }, 30000);

    // Refetch chat unread counts every 15 seconds
    setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ['chat', 'unreadCounts'],
        refetchType: 'active',
      });
    }, 15000);
  },

  // Prefetch common data
  prefetchCommonData: async (queryClient: any) => {
    try {
      // Prefetch roles for user management
      await queryClient.prefetchQuery({
        queryKey: ['roles', 'list'],
        queryFn: async () => {
          const { roleApi } = await import('@/lib/api');
          const response = await roleApi.getAllRoles();
          return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });

      // Prefetch page accesses
      await queryClient.prefetchQuery({
        queryKey: ['roles', 'pageAccesses'],
        queryFn: async () => {
          const { roleApi } = await import('@/lib/api');
          const response = await roleApi.getAllPageAccesses();
          return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    } catch (error) {
      console.warn('Failed to prefetch common data:', error);
    }
  },
};
