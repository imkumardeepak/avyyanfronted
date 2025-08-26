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
  FabricStructureResponseDto,
  CreateFabricStructureRequestDto,
  UpdateFabricStructureRequestDto,
  FabricStructureSearchRequestDto
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
};

// ============================================
// MACHINE MANAGEMENT API (/api/MachineManager)
// ============================================

export const machineApi = {
  // GET /api/MachineManager - Get all machines
  getAllMachines: (): Promise<AxiosResponse<MachineResponseDto[]>> =>
    apiClient.get('/MachineManager'),

  // GET /api/MachineManager/{id} - Get machine by ID
  getMachine: (id: number): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.get(`/MachineManager/${id}`),

  // POST /api/MachineManager - Create new machine
  createMachine: (data: CreateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.post('/MachineManager', data),

  // PUT /api/MachineManager/{id} - Update machine
  updateMachine: (id: number, data: UpdateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.put(`/MachineManager/${id}`, data),

  // DELETE /api/MachineManager/{id} - Delete machine
  deleteMachine: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/MachineManager/${id}`),

  // GET /api/MachineManager/search - Search machines
  searchMachines: (params: MachineSearchRequestDto): Promise<AxiosResponse<MachineResponseDto[]>> =>
    apiClient.get('/MachineManager/search', { params }),

  // POST /api/MachineManager/bulk-create - Bulk create machines
  createBulkMachines: (data: BulkCreateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto[]>> =>
    apiClient.post('/MachineManager/bulk-create', data),
};

// ============================================
// FABRIC STRUCTURE API (/api/FabricStructure)
// ============================================

export const fabricStructureApi = {
  // GET /api/FabricStructure - Get all fabric structures
  getAllFabricStructures: (): Promise<AxiosResponse<FabricStructureResponseDto[]>> =>
    apiClient.get('/FabricStructure'),

  // GET /api/FabricStructure/{id} - Get fabric structure by ID
  getFabricStructure: (id: number): Promise<AxiosResponse<FabricStructureResponseDto>> =>
    apiClient.get(`/FabricStructure/${id}`),

  // POST /api/FabricStructure - Create new fabric structure
  createFabricStructure: (data: CreateFabricStructureRequestDto): Promise<AxiosResponse<FabricStructureResponseDto>> =>
    apiClient.post('/FabricStructure', data),

  // PUT /api/FabricStructure/{id} - Update fabric structure
  updateFabricStructure: (id: number, data: UpdateFabricStructureRequestDto): Promise<AxiosResponse<FabricStructureResponseDto>> =>
    apiClient.put(`/FabricStructure/${id}`, data),

  // DELETE /api/FabricStructure/{id} - Delete fabric structure
  deleteFabricStructure: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/FabricStructure/${id}`),

  // GET /api/FabricStructure/search - Search fabric structures
  searchFabricStructures: (params: FabricStructureSearchRequestDto): Promise<AxiosResponse<FabricStructureResponseDto[]>> =>
    apiClient.get('/FabricStructure/search', { params }),
};