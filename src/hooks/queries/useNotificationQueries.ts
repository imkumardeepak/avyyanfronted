import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { NotificationDto, CreateNotificationDto } from '@/types/notification';

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (page: number, pageSize: number) => [...notificationKeys.lists(), { page, pageSize }] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: number) => [...notificationKeys.details(), id] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  userNotifications: (userId: number) => [...notificationKeys.all, 'user', userId] as const,
};

// Notification Queries
export const useNotifications = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: notificationKeys.list(page, pageSize),
    queryFn: async () => {
      const response = await notificationApi.getNotifications(page, pageSize);
      return response.data as NotificationDto[];
    },
  });
};

// Infinite query for notifications (better UX for scrolling)
export const useInfiniteNotifications = (pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: [...notificationKeys.lists(), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await notificationApi.getNotifications(pageParam as number, pageSize);
      return {
        notifications: response.data as NotificationDto[],
        nextPage: (response.data as NotificationDto[]).length === pageSize ? (pageParam as number) + 1 : undefined,
        hasMore: (response.data as NotificationDto[]).length === pageSize,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};

export const useNotification = (id: number, enabled = true) => {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: async () => {
      const response = await notificationApi.getNotification(id);
      return response.data as NotificationDto;
    },
    enabled: enabled && !!id,
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await notificationApi.getUnreadNotificationCount();
      return response.data as number;
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 15 * 1000, // Consider stale after 15 seconds
  });
};

// User-specific notifications
export const useUserNotifications = (userId: number, enabled = true) => {
  return useQuery({
    queryKey: notificationKeys.userNotifications(userId),
    queryFn: async () => {
      const response = await notificationApi.getUserNotifications(userId);
      return response.data as NotificationDto[];
    },
    enabled: enabled && !!userId,
  });
};

// Notification Mutations
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationData: CreateNotificationDto) => {
      const response = await notificationApi.createNotification(notificationData);
      return response.data as NotificationDto;
    },
    onSuccess: (newNotification) => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });

      // Add the new notification to the cache
      queryClient.setQueryData(notificationKeys.detail(newNotification.id), newNotification);

      // Update user-specific notifications if applicable
      if (newNotification.userId) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.userNotifications(newNotification.userId)
        });
      }

      toast.success('Success', 'Notification created successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to create notification';
      toast.error('Error', errorMessage);
    },
  });
};

export const useCreateSystemNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationData: { title: string; message: string; type?: string }) => {
      const response = await notificationApi.createSystemNotification(notificationData);
      return response.data as NotificationDto;
    },
    onSuccess: () => {
      // Invalidate all notification queries since system notifications affect all users
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      
      toast.success('Success', 'System notification sent successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to send system notification';
      toast.error('Error', errorMessage);
    },
  });
};

export const useCreateBulkNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationsData: CreateNotificationDto[]) => {
      const response = await notificationApi.createBulkNotifications(notificationsData);
      return response.data as NotificationDto[];
    },
    onSuccess: (newNotifications) => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      
      toast.success('Success', `${newNotifications.length} notifications sent successfully`);
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to send bulk notifications';
      toast.error('Error', errorMessage);
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      await notificationApi.markAsRead(notificationId);
      return notificationId;
    },
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.detail(notificationId) });

      // Snapshot the previous value
      const previousNotification = queryClient.getQueryData(notificationKeys.detail(notificationId));

      // Optimistically update to mark as read
      queryClient.setQueryData(notificationKeys.detail(notificationId), (old: NotificationDto | undefined) => {
        if (!old) return old;
        return { ...old, isRead: true, readAt: new Date().toISOString() };
      });

      // Update in lists as well
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: NotificationDto[] | undefined) => {
          if (!old) return old;
          return old.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          );
        }
      );

      return { previousNotification, notificationId };
    },
    onError: (err, notificationId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousNotification) {
        queryClient.setQueryData(notificationKeys.detail(notificationId), context.previousNotification);
      }
    },
    onSettled: (data, error, notificationId) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(notificationId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await notificationApi.markAllAsRead();
    },
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      toast.success('Success', 'All notifications marked as read');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to mark notifications as read';
      toast.error('Error', errorMessage);
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      await notificationApi.deleteNotification(notificationId);
      return notificationId;
    },
    onSuccess: (deletedId) => {
      // Remove notification from cache
      queryClient.removeQueries({ queryKey: notificationKeys.detail(deletedId) });

      // Invalidate lists and counts
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });

      toast.success('Success', 'Notification deleted successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete notification';
      toast.error('Error', errorMessage);
    },
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await notificationApi.deleteAllNotifications();
    },
    onSuccess: () => {
      // Clear all notification caches
      queryClient.removeQueries({ queryKey: notificationKeys.all });

      toast.success('Success', 'All notifications deleted successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete notifications';
      toast.error('Error', errorMessage);
    },
  });
};

// Real-time notification updates (to be used with SignalR)
export const useAddNotificationToCache = () => {
  const queryClient = useQueryClient();

  return (notification: NotificationDto) => {
    // Add new notification to the cache
    queryClient.setQueryData(notificationKeys.detail(notification.id), notification);

    // Update lists
    queryClient.setQueriesData(
      { queryKey: notificationKeys.lists() },
      (old: NotificationDto[] | undefined) => {
        if (!old) return [notification];
        // Check if notification already exists (avoid duplicates)
        if (old.some(n => n.id === notification.id)) return old;
        return [notification, ...old];
      }
    );

    // Update unread count
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });

    // Update user-specific notifications if applicable
    if (notification.userId) {
      queryClient.invalidateQueries({ 
        queryKey: notificationKeys.userNotifications(notification.userId) 
      });
    }
  };
};
