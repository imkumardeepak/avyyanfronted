import { useState, useEffect, useCallback } from 'react';
import { webSocketManager } from '../lib/websocket-manager';
import { NotificationDto } from '../types/api-types';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const { user } = useAuth();

  // Add a new notification to the list
  const addNotification = useCallback((notification: NotificationDto) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // Only connect if user is authenticated
    if (user?.id) {
      // Connect to notifications WebSocket - convert user.id to string
      webSocketManager.connectToNotifications(user.id.toString());
      
      // Add listener for incoming notifications
      webSocketManager.addNotificationListener(addNotification);
      
      // Add listener for connection status updates
      webSocketManager.addConnectionStatusListener((status) => {
        setConnectionStatus(status.notifications);
      });

      // Clean up on unmount
      return () => {
        webSocketManager.removeNotificationListener(addNotification);
        webSocketManager.removeConnectionStatusListener((status) => {
          setConnectionStatus(status.notifications);
        });
      };
    }
  }, [user?.id, addNotification]);

  return {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification
  };
};