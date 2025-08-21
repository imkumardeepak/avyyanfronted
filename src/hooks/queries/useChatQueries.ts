import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { ChatRoomDto, ChatMessageDto, CreateChatRoomDto, UserDto } from '@/types/auth';

// Query Keys
export const chatKeys = {
  all: ['chat'] as const,
  rooms: () => [...chatKeys.all, 'rooms'] as const,
  room: (id: number) => [...chatKeys.rooms(), id] as const,
  messages: (roomId: number) => [...chatKeys.room(roomId), 'messages'] as const,
  messagesPaginated: (roomId: number, page: number, pageSize: number) => 
    [...chatKeys.messages(roomId), { page, pageSize }] as const,
  users: () => [...chatKeys.all, 'users'] as const,
  userSearch: (searchTerm: string) => [...chatKeys.users(), 'search', searchTerm] as const,
  unreadCounts: () => [...chatKeys.all, 'unreadCounts'] as const,
};

// Chat Room Queries
export const useChatRooms = () => {
  return useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: async () => {
      const response = await chatApi.getUserChatRooms();
      return response.data as ChatRoomDto[];
    },
  });
};

export const useChatRoom = (id: number, enabled = true) => {
  return useQuery({
    queryKey: chatKeys.room(id),
    queryFn: async () => {
      const response = await chatApi.getChatRoom(id);
      return response.data as ChatRoomDto;
    },
    enabled: enabled && !!id,
  });
};

// Chat Messages Queries
export const useChatMessages = (roomId: number, page = 1, pageSize = 50, enabled = true) => {
  return useQuery({
    queryKey: chatKeys.messagesPaginated(roomId, page, pageSize),
    queryFn: async () => {
      const response = await chatApi.getChatRoomMessages(roomId, page, pageSize);
      return response.data as ChatMessageDto[];
    },
    enabled: enabled && !!roomId,
  });
};

// Infinite query for chat messages (better for chat UX)
export const useInfiniteChatMessages = (roomId: number, pageSize = 50, enabled = true) => {
  return useInfiniteQuery({
    queryKey: [...chatKeys.messages(roomId), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await chatApi.getChatRoomMessages(roomId, pageParam as number, pageSize);
      return {
        messages: response.data as ChatMessageDto[],
        nextPage: (response.data as ChatMessageDto[]).length === pageSize ? (pageParam as number) + 1 : undefined,
        hasMore: (response.data as ChatMessageDto[]).length === pageSize,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: enabled && !!roomId,
    initialPageParam: 1,
  });
};

// User Search Query
export const useSearchUsers = (searchTerm: string, enabled = true) => {
  return useQuery({
    queryKey: chatKeys.userSearch(searchTerm),
    queryFn: async () => {
      const response = await chatApi.searchUsers(searchTerm);
      return response.data as UserDto[];
    },
    enabled: enabled && searchTerm.length >= 2, // Only search when term is at least 2 characters
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Unread message counts
export const useUnreadCounts = () => {
  return useQuery({
    queryKey: chatKeys.unreadCounts(),
    queryFn: async () => {
      // This would need to be implemented in the API
      // For now, return empty object
      return {} as Record<number, number>;
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Chat Room Mutations
export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomData: CreateChatRoomDto) => {
      const response = await chatApi.createChatRoom(roomData);
      return response.data as ChatRoomDto;
    },
    onSuccess: (newRoom) => {
      // Invalidate and refetch chat rooms
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });

      // Add the new room to the cache
      queryClient.setQueryData(chatKeys.room(newRoom.id), newRoom);

      toast.success('Success', 'Chat room created successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to create chat room';
      toast.error('Error', errorMessage);
    },
  });
};

export const useUpdateChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roomData }: { id: number; roomData: Partial<CreateChatRoomDto> }) => {
      const response = await chatApi.updateChatRoom(id, roomData);
      return response.data as ChatRoomDto;
    },
    onSuccess: (updatedRoom) => {
      // Update the room in the cache
      queryClient.setQueryData(chatKeys.room(updatedRoom.id), updatedRoom);

      // Invalidate rooms list to reflect changes
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });

      toast.success('Success', 'Chat room updated successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to update chat room';
      toast.error('Error', errorMessage);
    },
  });
};

export const useDeleteChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await chatApi.deleteChatRoom(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove room from cache
      queryClient.removeQueries({ queryKey: chatKeys.room(deletedId) });
      queryClient.removeQueries({ queryKey: chatKeys.messages(deletedId) });

      // Invalidate rooms list
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });

      toast.success('Success', 'Chat room deleted successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete chat room';
      toast.error('Error', errorMessage);
    },
  });
};

// Message Mutations
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, content, messageType = 'Text' }: { 
      roomId: number; 
      content: string; 
      messageType?: string;
    }) => {
      const response = await chatApi.sendMessage(roomId, { content, messageType });
      return response.data as ChatMessageDto;
    },
    onMutate: async ({ roomId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.messages(roomId) });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(chatKeys.messagesPaginated(roomId, 1, 50));

      // Optimistically update with new message
      const optimisticMessage: ChatMessageDto = {
        id: Date.now(), // Temporary ID
        content,
        messageType: 'Text',
        sentAt: new Date().toISOString(),
        isRead: false,
        chatRoomId: roomId,
        senderId: 0, // Would be filled from auth context
        sender: {} as UserDto, // Would be filled from auth context
      };

      queryClient.setQueryData(
        chatKeys.messagesPaginated(roomId, 1, 50),
        (old: ChatMessageDto[] | undefined) => {
          if (!old) return [optimisticMessage];
          return [optimisticMessage, ...old];
        }
      );

      return { previousMessages, roomId };
    },
    onError: (err, { roomId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messagesPaginated(roomId, 1, 50),
          context.previousMessages
        );
      }
      
      toast.error('Error', 'Failed to send message');
    },
    onSettled: (data, error, { roomId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() }); // Update last message
    },
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: number; messageId: number }) => {
      await chatApi.markMessageAsRead(roomId, messageId);
      return { roomId, messageId };
    },
    onSuccess: ({ roomId }) => {
      // Invalidate messages and unread counts
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCounts() });
    },
  });
};

// Real-time message updates (to be used with SignalR)
export const useAddMessageToCache = () => {
  const queryClient = useQueryClient();

  return (roomId: number, message: ChatMessageDto) => {
    // Add new message to the cache
    queryClient.setQueryData(
      chatKeys.messagesPaginated(roomId, 1, 50),
      (old: ChatMessageDto[] | undefined) => {
        if (!old) return [message];
        // Check if message already exists (avoid duplicates)
        if (old.some(m => m.id === message.id)) return old;
        return [message, ...old];
      }
    );

    // Update room's last message
    queryClient.setQueryData(
      chatKeys.rooms(),
      (old: ChatRoomDto[] | undefined) => {
        if (!old) return old;
        return old.map(room => 
          room.id === roomId 
            ? { ...room, lastMessage: message, lastMessageAt: message.sentAt }
            : room
        );
      }
    );
  };
};
