export interface NotificationDto {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error';
  category?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
}

export interface CreateNotificationDto {
  userId: number;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error';
  category?: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
}

export interface BulkNotificationDto {
  userIds: number[];
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error';
  category?: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
}

export interface NotificationStatsDto {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  notificationsByType: {
    info: number;
    success: number;
    warning: number;
    error: number;
  };
  notificationsByCategory: Record<string, number>;
}

export interface NotificationSettingsDto {
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  categories: {
    system: boolean;
    chat: boolean;
    machine: boolean;
    maintenance: boolean;
    user: boolean;
  };
}

export interface UpdateNotificationSettingsDto {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  categories?: {
    system?: boolean;
    chat?: boolean;
    machine?: boolean;
    maintenance?: boolean;
    user?: boolean;
  };
}

export interface NotificationFilterDto {
  type?: 'Info' | 'Success' | 'Warning' | 'Error';
  category?: string;
  isRead?: boolean;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface MarkNotificationsReadDto {
  notificationIds: number[];
}

export interface DeleteNotificationsDto {
  notificationIds: number[];
}
