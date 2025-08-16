import { useState, useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import type { NotificationDto, CreateNotificationDto, NotificationFilterDto } from '@/types/notification';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const useNotifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const connectionRef = useRef<HubConnection | null>(null);

  // Initialize SignalR connection for real-time notifications
  const initializeConnection = async () => {
    if (!token || !user) {
      console.log('No token or user available for notifications SignalR connection');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://localhost:7009';
      const connection = new HubConnectionBuilder()
        .withUrl(`${apiUrl}/notificationhub`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      connection.on('ReceiveNotification', (notification: NotificationDto) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      });

      connection.on('NotificationRead', (notificationId: number) => {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      });

      await connection.start();
      connectionRef.current = connection;
      setIsConnected(true);
      
      console.log('Notification SignalR connected');
    } catch (err) {
      console.error('Notification SignalR connection failed:', err);
      setError('Failed to connect to notification service');
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Fetch notifications
  const fetchNotifications = async (filter?: NotificationFilterDto) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filter?.type) params.append('type', filter.type);
      if (filter?.category) params.append('category', filter.category);
      if (filter?.isRead !== undefined) params.append('isRead', filter.isRead.toString());
      if (filter?.fromDate) params.append('fromDate', filter.fromDate);
      if (filter?.toDate) params.append('toDate', filter.toDate);
      if (filter?.limit) params.append('limit', filter.limit.toString());
      if (filter?.offset) params.append('offset', filter.offset.toString());
      
      const response = await apiClient.get(`/api/Notifications?${params.toString()}`);
      const notificationsData = Array.isArray(response.data) ? response.data : [];
      setNotifications(notificationsData);

      // Calculate unread count
      const unread = notificationsData.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await apiClient.put(`/api/Notifications/${notificationId}/read`);
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiClient.put('/api/Notifications/mark-all-read');
      
      setNotifications(prev => prev.map(n => ({ 
        ...n, 
        isRead: true, 
        readAt: n.readAt || new Date().toISOString() 
      })));
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    try {
      await apiClient.delete(`/api/Notifications/${notificationId}`);
      
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete notification');
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      await apiClient.delete('/api/Notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete all notifications');
    }
  };

  // Create notification (admin only)
  const createNotification = async (data: CreateNotificationDto) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/api/Notifications', data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create notification');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Send bulk notifications (admin only)
  const sendBulkNotifications = async (userIds: number[], data: Omit<CreateNotificationDto, 'userId'>) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/api/Notifications/bulk', {
        userIds,
        ...data,
      });
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send bulk notifications');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get notification statistics
  const getNotificationStats = async () => {
    try {
      const response = await apiClient.get('/api/Notifications/stats');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch notification statistics');
      return null;
    }
  };

  // Get unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/api/Notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (err: any) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  // Initialize connection and fetch data on mount
  useEffect(() => {
    let isMounted = true;

    const initializeNotifications = async () => {
      if (user && token && isMounted) {
        await initializeConnection();
        await fetchNotifications();
        await fetchUnreadCount();
        await requestNotificationPermission();
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop().catch(console.error);
        connectionRef.current = null;
      }
    };
  }, [user, token]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification,
    sendBulkNotifications,
    getNotificationStats,
    fetchUnreadCount,
  };
};
