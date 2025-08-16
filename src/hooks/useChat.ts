import { useState, useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import type {
  ChatRoomDto,
  ChatMessageDto,
  SendMessageDto,
  CreateChatRoomDto
} from '@/types/chat';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const useChat = () => {
  const { user, token } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomDto[]>([]);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const connectionRef = useRef<HubConnection | null>(null);

  // Initialize SignalR connection
  const initializeConnection = async () => {
    if (!token || !user) {
      console.log('No token or user available for SignalR connection');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://localhost:7009';
      const connection = new HubConnectionBuilder()
        .withUrl(`${apiUrl}/chathub`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      connection.on('ReceiveMessage', (message: ChatMessageDto) => {
        setMessages(prev => [...prev, message]);
        
        // Update last message in chat rooms
        setChatRooms(prev => prev.map(room => 
          room.id === message.chatRoomId 
            ? { ...room, lastMessage: message }
            : room
        ));
      });

      connection.on('UserJoined', (roomId: number, userName: string) => {
        console.log(`${userName} joined room ${roomId}`);
      });

      connection.on('UserLeft', (roomId: number, userName: string) => {
        console.log(`${userName} left room ${roomId}`);
      });

      connection.on('Error', (error: string) => {
        setError(error);
      });

      await connection.start();
      connectionRef.current = connection;
      setIsConnected(true);
      
      console.log('SignalR connected');
    } catch (err) {
      console.error('SignalR connection failed:', err);
      setError('Failed to connect to chat service');
    }
  };

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/Chat/rooms');
      setChatRooms(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching chat rooms:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch chat rooms');
      setChatRooms([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a room
  const fetchMessages = async (roomId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/Chat/rooms/${roomId}/messages`);
      setMessages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Select a chat room
  const selectRoom = async (room: ChatRoomDto) => {
    setSelectedRoom(room);
    await fetchMessages(room.id);
    
    // Join the room via SignalR
    if (connectionRef.current && isConnected) {
      try {
        await connectionRef.current.invoke('JoinRoom', room.id);
      } catch (err) {
        console.error('Failed to join room:', err);
      }
    }
  };

  // Send a message
  const sendMessage = async (messageData: SendMessageDto) => {
    if (!connectionRef.current || !isConnected) {
      setError('Not connected to chat service');
      return;
    }

    try {
      await connectionRef.current.invoke('SendMessage', messageData);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  // Create a new chat room
  const createRoom = async (roomData?: CreateChatRoomDto) => {
    try {
      setLoading(true);
      setError(null);
      
      const defaultRoomData: CreateChatRoomDto = {
        name: 'New Chat Room',
        type: 'Group',
        memberIds: [user?.id || 0],
        ...roomData,
      };
      
      const response = await apiClient.post('/api/Chat/rooms', defaultRoomData);
      const newRoom = response.data;
      setChatRooms(prev => [...prev, newRoom]);
      return newRoom;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create chat room');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Join a chat room
  const joinRoom = async (roomId: number) => {
    try {
      await apiClient.post(`/api/Chat/rooms/${roomId}/join`);
      await fetchChatRooms(); // Refresh rooms
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join room');
    }
  };

  // Leave a chat room
  const leaveRoom = async (roomId: number) => {
    try {
      await apiClient.post(`/api/Chat/rooms/${roomId}/leave`);
      
      // Leave via SignalR
      if (connectionRef.current && isConnected) {
        await connectionRef.current.invoke('LeaveRoom', roomId);
      }
      
      setChatRooms(prev => prev.filter(room => room.id !== roomId));
      
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to leave room');
    }
  };

  // Edit a message
  const editMessage = async (messageId: number, content: string) => {
    try {
      await apiClient.put(`/api/Chat/messages/${messageId}`, { content });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, isEdited: true }
          : msg
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to edit message');
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: number) => {
    try {
      await apiClient.delete(`/api/Chat/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete message');
    }
  };

  // Add reaction to message
  const addReaction = async (messageId: number, emoji: string) => {
    try {
      await apiClient.post(`/api/Chat/messages/${messageId}/reactions`, { emoji });
      // The reaction will be updated via SignalR
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add reaction');
    }
  };

  // Initialize connection and fetch data on mount
  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      if (user && token && isMounted) {
        await initializeConnection();
        await fetchChatRooms();
      }
    };

    initializeChat();

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
    chatRooms,
    messages,
    selectedRoom,
    loading,
    error,
    isConnected,
    selectRoom,
    sendMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    editMessage,
    deleteMessage,
    addReaction,
    fetchChatRooms,
    fetchMessages,
  };
};
