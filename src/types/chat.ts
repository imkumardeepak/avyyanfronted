export interface ChatRoomDto {
  id: number;
  name: string;
  description?: string;
  type: 'Direct' | 'Group';
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  memberCount: number;
  unreadMessageCount: number;
  lastMessage?: ChatMessageDto;
  isActive: boolean;
}

export interface ChatMessageDto {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: 'Text' | 'Image' | 'File' | 'System';
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  replyToMessageId?: number;
  replyToMessage?: ChatMessageDto;
  reactions: MessageReactionDto[];
  attachments: MessageAttachmentDto[];
}

export interface MessageReactionDto {
  id: number;
  messageId: number;
  userId: number;
  userName: string;
  emoji: string;
  createdAt: string;
}

export interface MessageAttachmentDto {
  id: number;
  messageId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface ChatRoomMemberDto {
  id: number;
  chatRoomId: number;
  userId: number;
  userName: string;
  userFullName: string;
  userProfilePicture?: string;
  role: 'Admin' | 'Member';
  joinedAt: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface CreateChatRoomDto {
  name: string;
  description?: string;
  type: 'Direct' | 'Group';
  memberIds: number[];
}

export interface UpdateChatRoomDto {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface SendMessageDto {
  chatRoomId: number;
  content: string;
  messageType: 'Text' | 'Image' | 'File';
  replyToMessageId?: number;
}

export interface EditMessageDto {
  messageId: number;
  content: string;
}

export interface AddReactionDto {
  messageId: number;
  emoji: string;
}

export interface JoinChatRoomDto {
  chatRoomId: number;
  userId: number;
}

export interface ChatRoomInviteDto {
  chatRoomId: number;
  userIds: number[];
}

export interface ChatSearchDto {
  query: string;
  chatRoomId?: number;
  messageType?: 'Text' | 'Image' | 'File';
  fromDate?: string;
  toDate?: string;
}

export interface ChatStatsDto {
  totalRooms: number;
  totalMessages: number;
  activeUsers: number;
  messagesThisWeek: number;
  popularRooms: ChatRoomDto[];
}
