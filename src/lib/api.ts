 
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

  // User management endpoints (Admin only) - EXACT BACKEND MATCH with UserController
  getAllUsers: () =>
    api.get('/api/User'),

  getUser: (id: number) =>
    api.get(`/api/User/${id}`),

  createUser: (userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
    roleIds: number[];
  }) =>
    api.post('/api/User', userData),

  updateUser: (id: number, userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    roleIds: number[];
  }) =>
    api.put(`/api/User/${id}`, userData),

  deleteUser: (id: number) =>
    api.delete(`/api/User/${id}`),

  // Lock/Unlock endpoints - Available in UserController
  lockUser: (id: number) =>
    api.post(`/api/User/${id}/lock`),

  unlockUser: (id: number) =>
    api.post(`/api/User/${id}/unlock`),

  // Role assignment endpoints - Available in UserController
  assignUserRole: (userId: number, assignData: { roleId: number; expiresAt?: string }) =>
    api.post(`/api/User/${userId}/roles`, assignData),

  removeUserRole: (userId: number, roleId: number) =>
    api.delete(`/api/User/${userId}/roles/${roleId}`),

  getUserRoles: (userId: number) =>
    api.get(`/api/User/${userId}/roles`),
};

// User API - extracted from authApi for better organization
export const userApi = {
  // User management endpoints (Admin only) - EXACT BACKEND MATCH with UserController
  getAllUsers: () => api.get('/api/User'),
  getUser: (id: number) => api.get(`/api/User/${id}`),
  createUser: (userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
    roleIds: number[];
  }) => api.post('/api/User', userData),
  updateUser: (id: number, userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    roleIds: number[];
  }) => api.put(`/api/User/${id}`, userData),
  deleteUser: (id: number) => api.delete(`/api/User/${id}`),
  lockUser: (id: number) => api.post(`/api/User/${id}/lock`),
  unlockUser: (id: number) => api.post(`/api/User/${id}/unlock`),
  assignUserRole: (userId: number, assignData: { roleId: number; expiresAt?: string }) =>
    api.post(`/api/User/${userId}/roles`, assignData),
  removeUserRole: (userId: number, roleId: number) =>
    api.delete(`/api/User/${userId}/roles/${roleId}`),
  getUserRoles: (userId: number) => api.get(`/api/User/${userId}/roles`),
};

export const roleApi = {
  // Role management endpoints - EXACT BACKEND MATCH with RoleController
  getAllRoles: () => api.get('/api/Role'),

  getRole: (id: number) => api.get(`/api/Role/${id}`),

  createRole: (data: {
    name: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: number[];
    pagePermissions?: Array<{
      pageName: string;
      canRead: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }>;
  }) => api.post('/api/Role', data),

  updateRole: (id: number, data: {
    name: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: number[];
    pagePermissions?: Array<{
      pageName: string;
      canRead: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }>;
  }) => api.put(`/api/Role/${id}`, data),

  deleteRole: (id: number) => api.delete(`/api/Role/${id}`),

  // Page access management
  getAllPageAccesses: () => api.get('/api/Role/page-accesses'),

  getPageAccess: (id: number) => api.get(`/api/Role/page-accesses/${id}`),

  createPageAccess: (data: {
    pageName: string;
    pageUrl: string;
    description?: string;
    category?: string;
    icon?: string;
    sortOrder?: number;
    isMenuItem?: boolean;
  }) => api.post('/api/Role/page-accesses', data),

  updatePageAccess: (id: number, data: {
    pageName: string;
    pageUrl: string;
    description?: string;
    category?: string;
    icon?: string;
    sortOrder?: number;
    isMenuItem?: boolean;
  }) => api.put(`/api/Role/page-accesses/${id}`, data),

  deletePageAccess: (id: number) => api.delete(`/api/Role/page-accesses/${id}`),

  // Role-page access management
  getRolePageAccesses: (roleId: number) => api.get(`/api/Role/${roleId}/page-accesses`),

  grantPageAccess: (roleId: number, pageAccessId: number, permissions: {
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canExport?: boolean;
  }) => api.post(`/api/Role/${roleId}/page-accesses/${pageAccessId}`, permissions),

  revokePageAccess: (roleId: number, pageAccessId: number) =>
    api.delete(`/api/Role/${roleId}/page-accesses/${pageAccessId}`),

  // Role-user management
  getUsersInRole: (roleId: number) => api.get(`/api/Role/${roleId}/users`),

  assignRoleToUser: (roleId: number, data: { userId: number; expiresAt?: string }) =>
    api.post(`/api/Role/${roleId}/users`, data),

  removeRoleFromUser: (roleId: number, userId: number) =>
    api.delete(`/api/Role/${roleId}/users/${userId}`),

  // Permission operations
  getAllPermissions: () => api.get('/api/Permissions'),

  getPermissionsByCategory: () => api.get('/api/Permissions/by-category'),

  getUserPermissions: (userId: number) => api.get(`/api/Permissions/user/${userId}`),

  checkUserPermission: (userId: number, resource: string, action: string) =>
    api.get(`/api/Permissions/check/${userId}?resource=${resource}&action=${action}`),

  // Search and filter operations
  searchRoles: (searchTerm?: string, isActive?: boolean) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    return api.get(`/api/Role/search?${params.toString()}`);
  },

  // Page-based permission operations
  getRolePagePermissions: (roleId: number) =>
    api.get(`/api/Role/${roleId}/page-permissions`),

  updateRolePagePermissions: (roleId: number, pagePermissions: Array<{
    pageName: string;
    canRead: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>) => api.put(`/api/Role/${roleId}/page-permissions`, { pagePermissions }),

  getUserPagePermissions: (userId: number) =>
    api.get(`/api/User/${userId}/page-permissions`),

  getAllAvailablePages: () =>
    api.get('/api/Navigation/available-pages'),
};

export const machineApi = {
  // Basic CRUD operations - EXACT BACKEND MATCH
  getAllMachines: () => api.get('/api/MachineManager'),

  getMachine: (id: number) => api.get(`/api/MachineManager/${id}`),

  createMachine: (data: {
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

  createMultipleMachines: (data: Array<{
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
  }>) => api.post('/api/MachineManager/bulk', data),

  updateMachine: (id: number, data: {
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

  deleteMachine: (id: number) => api.delete(`/api/MachineManager/${id}`),

  // Search operations - EXACT BACKEND MATCH
  searchMachines: (machineName?: string, dia?: number) => {
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
  getUserChatRooms: () => api.get('/api/Chat/rooms'),

  getChatRoom: (chatRoomId: number) => api.get(`/api/Chat/rooms/${chatRoomId}`),

  createChatRoom: (data: {
    name: string;
    description?: string;
    type: string;
    isPrivate: boolean;
    maxMembers: number;
    memberIds: number[];
  }) => api.post('/api/Chat/rooms', data),

  updateChatRoom: (chatRoomId: number, data: {
    name?: string;
    description?: string;
    isPrivate?: boolean;
  }) => api.put(`/api/Chat/rooms/${chatRoomId}`, data),

  deleteChatRoom: (chatRoomId: number) => api.delete(`/api/Chat/rooms/${chatRoomId}`),

  // Chat room messages - EXACT BACKEND MATCH
  getChatRoomMessages: (chatRoomId: number, page: number = 1, pageSize: number = 50) =>
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
  sendMessage: (roomId: number, data: { content: string; messageType?: string }) => {
    // This is a placeholder - actual implementation should use SignalR
    return Promise.resolve({ data: { id: Date.now(), content: data.content, messageType: data.messageType || 'Text' } });
  },

  markMessageAsRead: (roomId: number, messageId: number) => {
    // This would need to be implemented in the backend
    return api.patch(`/api/Chat/rooms/${roomId}/messages/${messageId}/read`);
  },
};

export const notificationApi = {
  // Get user notifications - EXACT BACKEND MATCH
  getNotifications: (page: number = 1, pageSize: number = 20) =>
    api.get(`/api/Notifications?page=${page}&pageSize=${pageSize}`),

  getUnreadNotifications: () => api.get('/api/Notifications/unread'),

  getUnreadNotificationCount: () => api.get('/api/Notifications/unread/count'),

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

  createBulkNotifications: (data: Array<{
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
  }>) => api.post('/api/Notifications/bulk', data),

  getUserNotifications: (userId: number) => api.get(`/api/Notifications/user/${userId}`),

  deleteAllNotifications: () => api.delete('/api/Notifications/all'),

  createSystemNotification: (data: {
    title: string;
    message: string;
    actionUrl?: string;
  }) => api.post('/api/Notifications/system', data),
};



export default apiClient;
