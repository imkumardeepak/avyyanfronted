import { useState, useEffect, useCallback } from 'react';
import { webSocketManager } from '../lib/websocket-manager';
import { ChatMessageDto } from '../types/api-types';
import { useAuth } from '../contexts/AuthContext';

export const useChat = (recipientId?: string) => {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const { user } = useAuth();

  // Add a new message to the chat
  const addMessage = useCallback((message: ChatMessageDto) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Send a message
  const sendMessage = useCallback((message: string, receiverId?: string) => {
    if (!user?.id) {
      console.warn('User not authenticated');
      return;
    }

    const chatMessage = {
      id: Date.now().toString(), // Temporary ID, will be replaced by server
      senderId: user.id.toString(), // Convert to string to match ChatMessageDto
      receiverId: receiverId || recipientId,
      message: message,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Send through WebSocket manager
    webSocketManager.sendChatMessage(chatMessage);
    
    // Add to local messages immediately (optimistic update)
    addMessage(chatMessage);
  }, [user?.id, recipientId, addMessage]);

  // Mark messages as read
  const markAsRead = useCallback((messageIds: string[]) => {
    setMessages(prev => 
      prev.map(message => 
        messageIds.includes(message.id) 
          ? { ...message, isRead: true } 
          : message
      )
    );
  }, []);

  useEffect(() => {
    // Only connect if user is authenticated
    if (user?.id) {
      // Connect to chat WebSocket - convert user.id to string
      webSocketManager.connectToChat(user.id.toString());
      
      // Add listener for incoming messages
      webSocketManager.addChatListener(addMessage);
      
      // Add listener for connection status updates
      const handleConnectionStatus = (status: { 
        notifications: 'connecting' | 'connected' | 'disconnected' | 'error'; 
        chat: 'connecting' | 'connected' | 'disconnected' | 'error' 
      }) => {
        setConnectionStatus(status.chat);
      };
      
      webSocketManager.addConnectionStatusListener(handleConnectionStatus);

      // Clean up on unmount
      return () => {
        webSocketManager.removeChatListener(addMessage);
        webSocketManager.removeConnectionStatusListener(handleConnectionStatus);
      };
    }
  }, [user?.id, addMessage]);

  return {
    messages,
    connectionStatus,
    sendMessage,
    markAsRead,
    addMessage
  };
};