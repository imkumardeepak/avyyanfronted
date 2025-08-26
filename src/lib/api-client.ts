import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { getToken, setToken, removeToken } from '@/lib/auth';
import type {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  UserProfileResponseDto,
  AdminUserResponseDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  RoleResponseDto,
  CreateRoleRequestDto,
  UpdateRoleRequestDto,
  MachineResponseDto,
  CreateMachineRequestDto,
  UpdateMachineRequestDto,
  MachineSearchRequestDto,
  BulkCreateMachineRequestDto,
  ChangePasswordRequestDto,
  ResetPasswordRequestDto,
  UserPermissionsResponseDto,
  PageAccessResponseDto,
  MessageResponseDto,
} from '@/types/api-types';

// API Configuration
const API_CONFIG = {
  DEVELOPMENT_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  PRODUCTION_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
};

// Determine base URL based on environment
const getBaseUrl = () => {
  return import.meta.env.DEV ? API_CONFIG.DEVELOPMENT_URL : API_CONFIG.PRODUCTION_URL;
};

// Create axios instance
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // TODO: Implement token refresh logic if needed
      // For now, redirect to login
      removeToken();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Export the main API client
export default apiClient;

// ============================================
// AUTHENTICATION API (/api/Auth)
// ============================================

export const authApi = {
  // POST /api/Auth/login - User login
  login: (data: LoginRequestDto): Promise<AxiosResponse<LoginResponseDto>> =>
    apiClient.post('/Auth/login', data),

  // POST /api/Auth/register - User registration
  register: (data: RegisterRequestDto): Promise<AxiosResponse<LoginResponseDto>> =>
    apiClient.post('/Auth/register', data),

  // POST /api/Auth/change-password - Change user password
  changePassword: (data: ChangePasswordRequestDto): Promise<AxiosResponse<MessageResponseDto>> =>
    apiClient.post('/Auth/change-password', data),

  // POST /api/Auth/reset-password - Reset user password
  resetPassword: (data: ResetPasswordRequestDto): Promise<AxiosResponse<MessageResponseDto>> =>
    apiClient.post('/Auth/reset-password', data),

  // GET /api/Auth/profile - Get current user profile
  getProfile: (): Promise<AxiosResponse<UserProfileResponseDto>> =>
    apiClient.get('/Auth/profile'),

  // PUT /api/Auth/profile - Update current user profile
  updateProfile: (data: Partial<UserProfileResponseDto>): Promise<AxiosResponse<UserProfileResponseDto>> =>
    apiClient.put('/Auth/profile', data),

  // POST /api/Auth/logout - User logout
  logout: (): Promise<AxiosResponse<MessageResponseDto>> =>
    apiClient.post('/Auth/logout'),
};

// ============================================
// USER MANAGEMENT API (/api/User)
// ============================================

export const userApi = {
  // GET /api/User - Get all users (admin only)
  getAllUsers: (): Promise<AxiosResponse<AdminUserResponseDto[]>> =>
    apiClient.get('/User'),

  // GET /api/User/{id} - Get user by ID (admin only)
  getUser: (id: number): Promise<AxiosResponse<AdminUserResponseDto>> =>
    apiClient.get(`/User/${id}`),

  // GET /api/User/permissions/{userId} - Get user permissions
  getUserPermissions: (userId: number): Promise<AxiosResponse<UserPermissionsResponseDto>> =>
    apiClient.get(`/User/permissions/${userId}`),

  // POST /api/User - Create new user (admin only)
  createUser: (data: CreateUserRequestDto): Promise<AxiosResponse<AdminUserResponseDto>> =>
    apiClient.post('/User', data),

  // PUT /api/User/{id} - Update user (admin only)
  updateUser: (id: number, data: UpdateUserRequestDto): Promise<AxiosResponse<AdminUserResponseDto>> =>
    apiClient.put(`/User/${id}`, data),

  // DELETE /api/User/{id} - Delete user (admin only)
  deleteUser: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/User/${id}`),

  // GET /api/User/profile - Get current user profile (alternative endpoint)
  getProfile: (): Promise<AxiosResponse<UserProfileResponseDto>> =>
    apiClient.get('/User/profile'),

  // POST /api/User/change-password - Change user password
  changePassword: (data: ChangePasswordRequestDto): Promise<AxiosResponse<MessageResponseDto>> =>
    apiClient.post('/User/change-password', data),

  // GET /api/User/permissions - Get current user permissions
  getPermissions: (): Promise<AxiosResponse<UserPermissionsResponseDto>> =>
    apiClient.get('/User/permissions'),
};

// ============================================
// ROLE MANAGEMENT API (/api/Role)
// ============================================

export const roleApi = {
  // GET /api/Role - Get all roles
  getAllRoles: (): Promise<AxiosResponse<RoleResponseDto[]>> =>
    apiClient.get('/Role'),

  // GET /api/Role/{id} - Get role by ID
  getRole: (id: number): Promise<AxiosResponse<RoleResponseDto>> =>
    apiClient.get(`/Role/${id}`),

  // POST /api/Role - Create new role
  createRole: (data: CreateRoleRequestDto): Promise<AxiosResponse<RoleResponseDto>> =>
    apiClient.post('/Role', data),

  // PUT /api/Role/{id} - Update role
  updateRole: (id: number, data: UpdateRoleRequestDto): Promise<AxiosResponse<RoleResponseDto>> =>
    apiClient.put(`/Role/${id}`, data),

  // DELETE /api/Role/{id} - Delete role
  deleteRole: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/Role/${id}`),

  // GET /api/Role/{roleId}/page-accesses - Get role page accesses
  getRolePageAccesses: (roleId: number): Promise<AxiosResponse<PageAccessResponseDto[]>> =>
    apiClient.get(`/Role/${roleId}/page-accesses`),
};

// ============================================
// MACHINE MANAGEMENT API (/api/Machine)
// ============================================

export const machineApi = {
  // GET /api/Machine - Get all machines
  getAllMachines: (): Promise<AxiosResponse<MachineResponseDto[]>> =>
    apiClient.get('/Machine'),

  // GET /api/Machine/{id} - Get machine by ID
  getMachine: (id: number): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.get(`/Machine/${id}`),

  // GET /api/Machine/search - Search machines
  searchMachines: (params: MachineSearchRequestDto): Promise<AxiosResponse<MachineResponseDto[]>> => {
    const queryParams = new URLSearchParams();
    if (params.machineName) queryParams.append('machineName', params.machineName);
    if (params.dia !== undefined) queryParams.append('dia', params.dia.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    return apiClient.get(`/Machine/search?${queryParams.toString()}`);
  },

  // POST /api/Machine - Create new machine
  createMachine: (data: CreateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.post('/Machine', data),

  // PUT /api/Machine/{id} - Update machine
  updateMachine: (id: number, data: UpdateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.put(`/Machine/${id}`, data),

  // DELETE /api/Machine/{id} - Delete machine (soft delete)
  deleteMachine: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/Machine/${id}`),

  // POST /api/Machine/bulk - Create multiple machines
  createBulkMachines: (data: BulkCreateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto[]>> =>
    apiClient.post('/Machine/bulk', data),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => !!getToken(),

  // Get current token
  getAuthToken: (): string | null => getToken(),

  // Set authentication token
  setAuthToken: (token: string): void => setToken(token),

  // Clear authentication
  clearAuth: (): void => removeToken(),

  // Handle API errors
  handleError: (error: any): string => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Extract data from API response
  extractData: <T>(response: AxiosResponse<T>): T => response.data,
};