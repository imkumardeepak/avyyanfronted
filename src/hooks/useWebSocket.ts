import { useState, useEffect } from 'react';
import { webSocketManager } from '../lib/websocket-manager';
import { NotificationDto, ChatMessageDto } from '../types/api-types';
import { useAuth } from '../contexts/AuthContext';

interface WebSocketState {
  notifications: NotificationDto[];
  messages: ChatMessageDto[];
  connectionStatus: {
    notifications: 'connecting' | 'connected' | 'disconnected' | 'error';
    chat: 'connecting' | 'connected' | 'disconnected' | 'error';
  };
}

export const useWebSocket = () => {
  const [state, setState] = useState<WebSocketState>({
    notifications: [],
    messages: [],
    connectionStatus: {
      notifications: 'disconnected',
      chat: 'disconnected'
    }
  });
  
  const { user } = useAuth();

  // Add a new notification
  const addNotification = (notification: NotificationDto) => {
    setState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications]
    }));
  };

  // Add a new chat message
  const addMessage = (message: ChatMessageDto) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  // Send a chat message
  const sendMessage = (message: any) => {
    webSocketManager.sendChatMessage(message);
  };

  // Mark a notification as read
  const markNotificationAsRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    }));
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification => 
        ({ ...notification, isRead: true })
      )
    }));
  };

  // Get unread notification count
  const unreadNotificationCount = state.notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // Only connect if user is authenticated
    if (user?.id) {
      // Connect to both notification and chat WebSockets - convert user.id to string
      webSocketManager.connectToNotifications(user.id.toString());
      webSocketManager.connectToChat(user.id.toString());
      
      // Add listeners for incoming data
      webSocketManager.addNotificationListener(addNotification);
      webSocketManager.addChatListener(addMessage);
      
      // Add listener for connection status updates
      webSocketManager.addConnectionStatusListener((status) => {
        setState(prev => ({
          ...prev,
          connectionStatus: status
        }));
      });

      // Clean up on unmount
      return () => {
        webSocketManager.removeNotificationListener(addNotification);
        webSocketManager.removeChatListener(addMessage);
        webSocketManager.removeConnectionStatusListener((status) => {
          setState(prev => ({
            ...prev,
            connectionStatus: status
          }));
        });
      };
    }
  }, [user?.id]);

  return {
    ...state,
    sendMessage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationCount
  };
};