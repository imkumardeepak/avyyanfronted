/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

// Create axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('auth_refresh_token');
        const currentToken = localStorage.getItem('auth_token');

        if (refreshToken && currentToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/Auth/refresh`,
            {
              token: currentToken,
              refreshToken: refreshToken
            }
          );

          const { token: newToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('auth_token', newToken);
          localStorage.setItem('auth_refresh_token', newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden:', error.response.data);
    } else if (error.response?.status === 404) {
      // Not found
      console.error('Resource not found:', error.response.data);
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const api = {
  // Generic GET request
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },

  // Generic POST request
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },

  // Generic PUT request
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },

  // Generic PATCH request
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },

  // Generic DELETE request
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },

  // File upload
  upload: <T = unknown>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  // Download file
  download: (url: string, filename?: string): Promise<void> => {
    return apiClient.get(url, {
      responseType: 'blob',
    }).then((response) => {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    });
  },
};

// Specific API endpoints
export const authApi = {
  // Authentication endpoints - EXACT BACKEND MATCH
  login: (credentials: { username: string; password: string; rememberMe?: boolean }) =>
    api.post('/api/Auth/login', credentials),

  register: (userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber?: string;
  }) =>
    api.post('/api/Auth/register', userData),

  refreshToken: (refreshToken: string) =>
    api.post('/api/Auth/refresh', { refreshToken }),

  logout: () =>
    api.post('/api/Auth/logout'),

  // Profile endpoints - EXACT BACKEND MATCH
  getProfile: () =>
    api.get('/api/Auth/profile'),

  updateProfile: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    roleIds: number[];
  }) =>
    api.put('/api/Auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post('/api/Auth/change-password', data),

  // Permission endpoints - EXACT BACKEND MATCH
  getPermissions: () =>
    api.get('/api/Auth/permissions'),

  checkPermission: (pageUrl: string, permission: string = 'View') =>
    api.get(`/api/Auth/permissions/check?pageUrl=${encodeURIComponent(pageUrl)}&permission=${permission}`),

  // User management endpoints (Admin only) - EXACT BACKEND MATCH
  getAllUsers: () =>
    api.get('/api/Auth/users'),

  getUser: (id: number) =>
    api.get(`/api/Auth/users/${id}`),

  createUser: (userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
    roleIds: number[];
  }) =>
    api.post('/api/Auth/users', userData),

  updateUser: (id: number, userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    roleIds: number[];
  }) =>
    api.put(`/api/Auth/users/${id}`, userData),

  deleteUser: (id: number) =>
    api.delete(`/api/Auth/users/${id}`),

  // NOTE: Lock/Unlock endpoints NOT FOUND in backend - removing
  // lockUser and unlockUser endpoints do not exist in AuthController

  // NOTE: Role management endpoints NOT FOUND in backend - removing
  // getAllRoles, assignRole, removeRole endpoints do not exist in AuthController
  // Role management is handled through the UpdateUserDto.roleIds field
};

export const machineApi = {
  // Basic CRUD operations - EXACT BACKEND MATCH
  getAll: () => api.get('/api/MachineManager'),

  getById: (id: number) => api.get(`/api/MachineManager/${id}`),

  create: (data: {
    machineName: string;
    dia: number;
    gg: number;
    needle: number;
    feeder: number;
    rpm: number;
    slit: number;
    constat?: string;
    efficiency: number;
    description?: string;
  }) => api.post('/api/MachineManager', data),

  update: (id: number, data: {
    machineName: string;
    dia: number;
    gg: number;
    needle: number;
    feeder: number;
    rpm: number;
    slit: number;
    constat?: string;
    efficiency: number;
    description?: string;
    isActive: boolean;
  }) => api.put(`/api/MachineManager/${id}`, data),

  delete: (id: number) => api.delete(`/api/MachineManager/${id}`),

  // Search operations - EXACT BACKEND MATCH
  search: (machineName?: string, dia?: number) => {
    const params = new URLSearchParams();
    if (machineName) params.append('machineName', machineName);
    if (dia !== undefined) params.append('dia', dia.toString());
    return api.get(`/api/MachineManager/search?${params.toString()}`);
  },

  // Bulk operations - EXACT BACKEND MATCH
  createMultiple: (machines: Array<{
    machineName: string;
    dia: number;
    gg: number;
    needle: number;
    feeder: number;
    rpm: number;
    slit: number;
    constat?: string;
    efficiency: number;
    description?: string;
  }>) => api.post('/api/MachineManager/bulk', machines),
};



export const chatApi = {
  // Chat room operations - EXACT BACKEND MATCH
  getRooms: () => api.get('/api/Chat/rooms'),

  getRoom: (chatRoomId: number) => api.get(`/api/Chat/rooms/${chatRoomId}`),

  createRoom: (data: {
    name: string;
    description?: string;
    type: string;
    isPrivate: boolean;
    maxMembers: number;
    memberIds: number[];
  }) => api.post('/api/Chat/rooms', data),

  // Chat room messages - EXACT BACKEND MATCH
  getRoomMessages: (chatRoomId: number, page: number = 1, pageSize: number = 50) =>
    api.get(`/api/Chat/rooms/${chatRoomId}/messages?page=${page}&pageSize=${pageSize}`),

  getMessage: (messageId: number) => api.get(`/api/Chat/messages/${messageId}`),

  // User search for chat - EXACT BACKEND MATCH
  searchUsers: (searchTerm: string) =>
    api.get(`/api/Chat/users/search?searchTerm=${encodeURIComponent(searchTerm)}`),

  // Unread message counts - EXACT BACKEND MATCH
  getUnreadCounts: () => api.get('/api/Chat/unread-counts'),

  // NOTE: sendMessage endpoint does NOT exist in ChatController
  // Messages are sent through SignalR Hub (ChatHub.SendMessage)
  // Frontend should use SignalR connection for real-time messaging
};

export const notificationApi = {
  // Get user notifications - EXACT BACKEND MATCH
  getNotifications: (page: number = 1, pageSize: number = 20) =>
    api.get(`/api/Notifications?page=${page}&pageSize=${pageSize}`),

  getUnreadNotifications: () => api.get('/api/Notifications/unread'),

  getUnreadCount: () => api.get('/api/Notifications/unread/count'),

  getRecentNotifications: (count: number = 10) =>
    api.get(`/api/Notifications/recent?count=${count}`),

  getNotification: (notificationId: number) =>
    api.get(`/api/Notifications/${notificationId}`),

  // Mark notifications as read - EXACT BACKEND MATCH
  markAsRead: (notificationId: number) => api.patch(`/api/Notifications/${notificationId}/read`),

  markAllAsRead: () => api.patch('/api/Notifications/read-all'),

  // Delete notifications - EXACT BACKEND MATCH
  deleteNotification: (notificationId: number) => api.delete(`/api/Notifications/${notificationId}`),

  // Admin/Manager operations - EXACT BACKEND MATCH
  createNotification: (data: {
    userId: number;
    title: string;
    message: string;
    type?: string;
    category?: string;
    actionUrl?: string;
    actionText?: string;
    isPush?: boolean;
    isEmail?: boolean;
    isSms?: boolean;
    scheduledAt?: string;
    metadata?: string;
    relatedEntityId?: number;
    relatedEntityType?: string;
  }) => api.post('/api/Notifications', data),

  createBulkNotification: (data: {
    userIds: number[];
    title: string;
    message: string;
    type?: string;
    category?: string;
    actionUrl?: string;
    actionText?: string;
    isPush?: boolean;
    isEmail?: boolean;
    isSms?: boolean;
    scheduledAt?: string;
    metadata?: string;
  }) => api.post('/api/Notifications/bulk', data),

  createSystemNotification: (data: {
    title: string;
    message: string;
    actionUrl?: string;
  }) => api.post('/api/Notifications/system', data),
};

export default apiClient;
