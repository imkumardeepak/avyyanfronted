import { 
  WebSocketResponseDto, 
  NotificationDto, 
  ChatMessageDto 
} from '../types/api-types';

// Helper function to get environment variables
const getEnvVar = (name: string): string | undefined => {
  // In a browser environment, we can access import.meta.env
  // But for TypeScript compilation, we need to handle this differently
  try {
    // @ts-ignore - This will work at runtime in Vite
    return import.meta.env ? import.meta.env[name] : undefined;
  } catch (e) {
    return undefined;
  }
};

export type WebSocketMessageType = 'notification' | 'chat' | 'pong' | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: string;
}

export class WebSocketManager {
  private notificationSocket: WebSocket | null = null;
  private chatSocket: WebSocket | null = null;
  private notificationListeners: Array<(message: NotificationDto) => void> = [];
  private chatListeners: Array<(message: ChatMessageDto) => void> = [];
  private connectionStatusListeners: Array<(status: {
    notifications: 'connecting' | 'connected' | 'disconnected' | 'error';
    chat: 'connecting' | 'connected' | 'disconnected' | 'error';
  }) => void> = [];
  
  private notificationConnectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private chatConnectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms

  constructor() {
    // Bind methods to preserve 'this' context
    this.handleNotificationMessage = this.handleNotificationMessage.bind(this);
    this.handleChatMessage = this.handleChatMessage.bind(this);
    this.handleNotificationError = this.handleNotificationError.bind(this);
    this.handleChatError = this.handleChatError.bind(this);
    this.handleNotificationClose = this.handleNotificationClose.bind(this);
    this.handleChatClose = this.handleChatClose.bind(this);
  }

  // Connect to notification WebSocket
  connectToNotifications(userId: string): void {
    if (!userId) {
      console.warn('User ID is required to connect to notifications');
      return;
    }

    // Close existing connection if any
    if (this.notificationSocket) {
      this.notificationSocket.close();
    }

    try {
      // Update connection status
      this.notificationConnectionStatus = 'connecting';
      this.notifyConnectionStatusListeners();
      
      // Use environment variable or construct from API URL
      const wsNotificationsUrl = getEnvVar('VITE_WS_NOTIFICATIONS_URL');
      const apiUrl = getEnvVar('VITE_API_URL') || 'http://localhost:5000/api';
      const wsUrl = wsNotificationsUrl || apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '/notifications');
      
      this.notificationSocket = new WebSocket(`${wsUrl}/${userId}`);
      
      this.notificationSocket.onopen = () => {
        console.log('Connected to notification WebSocket');
        this.notificationConnectionStatus = 'connected';
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.notifyConnectionStatusListeners();
      };
      
      this.notificationSocket.onmessage = this.handleNotificationMessage;
      this.notificationSocket.onerror = this.handleNotificationError;
      this.notificationSocket.onclose = this.handleNotificationClose;
    } catch (error) {
      console.error('Failed to connect to notification WebSocket:', error);
      this.notificationConnectionStatus = 'error';
      this.notifyConnectionStatusListeners();
    }
  }

  // Connect to chat WebSocket
  connectToChat(userId: string): void {
    if (!userId) {
      console.warn('User ID is required to connect to chat');
      return;
    }

    // Close existing connection if any
    if (this.chatSocket) {
      this.chatSocket.close();
    }

    try {
      // Update connection status
      this.chatConnectionStatus = 'connecting';
      this.notifyConnectionStatusListeners();
      
      // Use environment variable or construct from API URL
      const wsChatUrl = getEnvVar('VITE_WS_CHAT_URL');
      const apiUrl = getEnvVar('VITE_API_URL') || 'http://localhost:5000/api';
      const wsUrl = wsChatUrl || apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '/chat');
      
      this.chatSocket = new WebSocket(`${wsUrl}/${userId}`);
      
      this.chatSocket.onopen = () => {
        console.log('Connected to chat WebSocket');
        this.chatConnectionStatus = 'connected';
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.notifyConnectionStatusListeners();
      };
      
      this.chatSocket.onmessage = this.handleChatMessage;
      this.chatSocket.onerror = this.handleChatError;
      this.chatSocket.onclose = this.handleChatClose;
    } catch (error) {
      console.error('Failed to connect to chat WebSocket:', error);
      this.chatConnectionStatus = 'error';
      this.notifyConnectionStatusListeners();
    }
  }

  // Handle incoming notification messages
  private handleNotificationMessage(event: MessageEvent): void {
    try {
      const response: WebSocketResponseDto = JSON.parse(event.data);
      
      if (response.type === 'notification' && response.data) {
        const notification: NotificationDto = response.data;
        // Notify all listeners
        this.notificationListeners.forEach(listener => listener(notification));
      } else if (response.type === 'pong') {
        // Handle pong messages (if implementing ping/pong)
        console.log('Received pong from server');
      }
    } catch (error) {
      console.error('Failed to parse notification message:', error);
    }
  }

  // Handle incoming chat messages
  private handleChatMessage(event: MessageEvent): void {
    try {
      const response: WebSocketResponseDto = JSON.parse(event.data);
      
      if (response.type === 'chat' && response.data) {
        const chatMessage: ChatMessageDto = response.data;
        // Notify all listeners
        this.chatListeners.forEach(listener => listener(chatMessage));
      } else if (response.type === 'pong') {
        // Handle pong messages (if implementing ping/pong)
        console.log('Received pong from server');
      }
    } catch (error) {
      console.error('Failed to parse chat message:', error);
    }
  }

  // Handle notification WebSocket errors
  private handleNotificationError(event: Event): void {
    console.error('Notification WebSocket error:', event);
    this.notificationConnectionStatus = 'error';
    this.notifyConnectionStatusListeners();
  }

  // Handle chat WebSocket errors
  private handleChatError(event: Event): void {
    console.error('Chat WebSocket error:', event);
    this.chatConnectionStatus = 'error';
    this.notifyConnectionStatusListeners();
  }

  // Handle notification WebSocket close
  private handleNotificationClose(event: CloseEvent): void {
    console.log('Notification WebSocket closed:', event);
    this.notificationConnectionStatus = 'disconnected';
    this.notifyConnectionStatusListeners();
    
    // Attempt to reconnect if not closed intentionally
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        // We would need the userId to reconnect, which isn't available here
        // Reconnection should be handled at the component level
        console.log(`Attempting to reconnect to notifications (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
    }
  }

  // Handle chat WebSocket close
  private handleChatClose(event: CloseEvent): void {
    console.log('Chat WebSocket closed:', event);
    this.chatConnectionStatus = 'disconnected';
    this.notifyConnectionStatusListeners();
    
    // Attempt to reconnect if not closed intentionally
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        // We would need the userId to reconnect, which isn't available here
        // Reconnection should be handled at the component level
        console.log(`Attempting to reconnect to chat (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
    }
  }

  // Send a message through the chat WebSocket
  sendChatMessage(message: any): void {
    if (this.chatSocket && this.chatSocket.readyState === WebSocket.OPEN) {
      this.chatSocket.send(JSON.stringify(message));
    } else {
      console.warn('Chat WebSocket is not connected');
    }
  }

  // Add notification listener
  addNotificationListener(listener: (message: NotificationDto) => void): void {
    this.notificationListeners.push(listener);
  }

  // Remove notification listener
  removeNotificationListener(listener: (message: NotificationDto) => void): void {
    this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
  }

  // Add chat listener
  addChatListener(listener: (message: ChatMessageDto) => void): void {
    this.chatListeners.push(listener);
  }

  // Remove chat listener
  removeChatListener(listener: (message: ChatMessageDto) => void): void {
    this.chatListeners = this.chatListeners.filter(l => l !== listener);
  }

  // Add connection status listener
  addConnectionStatusListener(listener: (status: {
    notifications: 'connecting' | 'connected' | 'disconnected' | 'error';
    chat: 'connecting' | 'connected' | 'disconnected' | 'error';
  }) => void): void {
    this.connectionStatusListeners.push(listener);
  }

  // Remove connection status listener
  removeConnectionStatusListener(listener: (status: {
    notifications: 'connecting' | 'connected' | 'disconnected' | 'error';
    chat: 'connecting' | 'connected' | 'disconnected' | 'error';
  }) => void): void {
    this.connectionStatusListeners = this.connectionStatusListeners.filter(l => l !== listener);
  }

  // Notify all connection status listeners
  private notifyConnectionStatusListeners(): void {
    const status = {
      notifications: this.notificationConnectionStatus,
      chat: this.chatConnectionStatus
    };
    
    this.connectionStatusListeners.forEach(listener => listener(status));
  }

  // Close all connections
  disconnect(): void {
    if (this.notificationSocket) {
      this.notificationSocket.close();
      this.notificationSocket = null;
    }
    
    if (this.chatSocket) {
      this.chatSocket.close();
      this.chatSocket = null;
    }
    
    this.notificationConnectionStatus = 'disconnected';
    this.chatConnectionStatus = 'disconnected';
    this.notifyConnectionStatusListeners();
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      notifications: this.notificationConnectionStatus,
      chat: this.chatConnectionStatus
    };
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();