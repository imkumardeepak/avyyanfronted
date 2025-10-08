import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';
import { getToken } from '@/lib/auth';
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
  FabricStructureSearchRequestDto,
  LocationResponseDto,
  CreateLocationRequestDto,
  UpdateLocationRequestDto,
  LocationSearchRequestDto,
  YarnTypeResponseDto,
  CreateYarnTypeRequestDto,
  UpdateYarnTypeRequestDto,
  YarnTypeSearchRequestDto,
  RefreshTokenRequestDto,
  SalesOrderDto,
  VoucherDto,
  ProductionAllotmentResponseDto,
  RollConfirmationRequestDto,
  RollConfirmationResponseDto,
  InspectionRequestDto,
  InspectionResponseDto,
  TapeColorResponseDto,
  CreateTapeColorRequestDto,
  UpdateTapeColorRequestDto,
  TapeColorSearchRequestDto,
  ShiftResponseDto,
  CreateShiftRequestDto,
  UpdateShiftRequestDto,
  ShiftSearchRequestDto,
  CreateRollAssignmentRequest,
  RollAssignmentResponseDto,
  GenerateStickersRequest,
  GenerateBarcodesRequest
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

// Create a separate axios instance for auth refresh to avoid circular dependencies
const authRefreshClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to refresh token without using authApi (to avoid circular dependency)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const refreshAuthToken = async (refreshToken: string): Promise<unknown> => {
  try {
    const response = await authRefreshClient.post('/Auth/refresh', { refreshToken });
    return response.data;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
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
          apiUtils.clearAuth();
          window.location.href = '/login';
          return Promise.reject(error);
    }
  }
);

// Export the main API client
export default apiClient;

// Add apiUtils object with helper functions
export const apiUtils = {
  // Extract data from Axios response
  extractData: <T>(response: AxiosResponse<T>): T => {
    return response.data;
  },

  // Handle API errors and return user-friendly messages
  handleError: (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      
      if (axiosError.response?.data?.error) {
        return axiosError.response.data.error;
      }
    }
    
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  },

  // Auth token management
  getAuthToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setAuthToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  clearAuth: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
  },
};

// ============================================
// AUTHENTICATION API (/api/Auth)
// ============================================

export const authApi = {
  // POST /api/Auth/login - User login
  login: (data: LoginRequestDto): Promise<AxiosResponse<LoginResponseDto>> =>
    apiClient.post('/Auth/login', data),

  // POST /api/Auth/refresh - Refresh authentication token
  refreshToken: (data: RefreshTokenRequestDto): Promise<AxiosResponse<LoginResponseDto>> =>
    apiClient.post('/Auth/refresh', data),

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

  // GET /api/Role/{id}/page-accesses - Get role page accesses
  getRolePageAccesses: (id: number): Promise<AxiosResponse<PageAccessResponseDto[]>> =>
    apiClient.get(`/Role/${id}/page-accesses`),

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
// MACHINE MANAGEMENT API (/api/Machine)
// ============================================

export const machineApi = {
  // GET /api/Machine - Get all machines
  getAllMachines: (): Promise<AxiosResponse<MachineResponseDto[]>> =>
    apiClient.get('/Machine'),

  // GET /api/Machine/{id} - Get machine by ID
  getMachine: (id: number): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.get(`/Machine/${id}`),

  // POST /api/Machine - Create new machine
  createMachine: (data: CreateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.post('/Machine', data),

  // PUT /api/Machine/{id} - Update machine
  updateMachine: (id: number, data: UpdateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto>> =>
    apiClient.put(`/Machine/${id}`, data),

  // DELETE /api/Machine/{id} - Delete machine
  deleteMachine: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/Machine/${id}`),

  // GET /api/Machine/search - Search machines
  searchMachines: (params: MachineSearchRequestDto): Promise<AxiosResponse<MachineResponseDto[]>> =>
    apiClient.get('/Machine/search', { params }),

  // POST /api/Machine/bulk - Bulk create machines
  createBulkMachines: (data: BulkCreateMachineRequestDto): Promise<AxiosResponse<MachineResponseDto[]>> =>
    apiClient.post('/Machine/bulk', data),

  // POST /api/Machine/generate-qr/{id} - Generate QR code for machine
  generateQRCode: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.post(`/Machine/generate-qr/${id}`),
};

// ============================================
// LOCATION API (/api/Location)
// ============================================

export const locationApi = {
  // GET /api/Location - Get all locations
  getAllLocations: (): Promise<AxiosResponse<LocationResponseDto[]>> =>
    apiClient.get('/Location'),

  // GET /api/Location/{id} - Get location by ID
  getLocation: (id: number): Promise<AxiosResponse<LocationResponseDto>> =>
    apiClient.get(`/Location/${id}`),

  // POST /api/Location - Create new location
  createLocation: (data: CreateLocationRequestDto): Promise<AxiosResponse<LocationResponseDto>> =>
    apiClient.post('/Location', data),

  // PUT /api/Location/{id} - Update location
  updateLocation: (id: number, data: UpdateLocationRequestDto): Promise<AxiosResponse<LocationResponseDto>> =>
    apiClient.put(`/Location/${id}`, data),

  // DELETE /api/Location/{id} - Delete location
  deleteLocation: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/Location/${id}`),

  // GET /api/Location/search - Search locations
  searchLocations: (params: LocationSearchRequestDto): Promise<AxiosResponse<LocationResponseDto[]>> =>
    apiClient.get('/Location/search', { params }),
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

// ============================================
// YARN TYPE API (/api/YarnType)
// ============================================

export const yarnTypeApi = {
  // GET /api/YarnType - Get all yarn types
  getAllYarnTypes: (): Promise<AxiosResponse<YarnTypeResponseDto[]>> =>
    apiClient.get('/YarnType'),

  // GET /api/YarnType/{id} - Get yarn type by ID
  getYarnType: (id: number): Promise<AxiosResponse<YarnTypeResponseDto>> =>
    apiClient.get(`/YarnType/${id}`),

  // POST /api/YarnType - Create new yarn type
  createYarnType: (data: CreateYarnTypeRequestDto): Promise<AxiosResponse<YarnTypeResponseDto>> =>
    apiClient.post('/YarnType', data),

  // PUT /api/YarnType/{id} - Update yarn type
  updateYarnType: (id: number, data: UpdateYarnTypeRequestDto): Promise<AxiosResponse<YarnTypeResponseDto>> =>
    apiClient.put(`/YarnType/${id}`, data),

  // DELETE /api/YarnType/{id} - Delete yarn type
  deleteYarnType: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/YarnType/${id}`),

  // POST /api/YarnType/search - Search yarn types
  searchYarnTypes: (data: YarnTypeSearchRequestDto): Promise<AxiosResponse<YarnTypeResponseDto[]>> =>
    apiClient.post('/YarnType/search', data),
};

// ============================================
// TAPE COLOR API (/api/TapeColor)
// ============================================

export const tapeColorApi = {
  // GET /api/TapeColor - Get all tape colors
  getAllTapeColors: (): Promise<AxiosResponse<TapeColorResponseDto[]>> =>
    apiClient.get('/TapeColor'),

  // GET /api/TapeColor/{id} - Get tape color by ID
  getTapeColor: (id: number): Promise<AxiosResponse<TapeColorResponseDto>> =>
    apiClient.get(`/TapeColor/${id}`),

  // POST /api/TapeColor - Create new tape color
  createTapeColor: (data: CreateTapeColorRequestDto): Promise<AxiosResponse<TapeColorResponseDto>> =>
    apiClient.post('/TapeColor', data),

  // PUT /api/TapeColor/{id} - Update tape color
  updateTapeColor: (id: number, data: UpdateTapeColorRequestDto): Promise<AxiosResponse<TapeColorResponseDto>> =>
    apiClient.put(`/TapeColor/${id}`, data),

  // DELETE /api/TapeColor/{id} - Delete tape color
  deleteTapeColor: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/TapeColor/${id}`),

  // GET /api/TapeColor/search - Search tape colors
  searchTapeColors: (params: TapeColorSearchRequestDto): Promise<AxiosResponse<TapeColorResponseDto[]>> =>
    apiClient.get('/TapeColor/search', { params }),
};

// ============================================
// SHIFT API (/api/Shift)
// ============================================

export const shiftApi = {
  // GET /api/Shift - Get all shifts
  getAllShifts: (): Promise<AxiosResponse<ShiftResponseDto[]>> =>
    apiClient.get('/Shift'),

  // GET /api/Shift/{id} - Get shift by ID
  getShift: (id: number): Promise<AxiosResponse<ShiftResponseDto>> =>
    apiClient.get(`/Shift/${id}`),

  // POST /api/Shift - Create new shift
  createShift: (data: CreateShiftRequestDto): Promise<AxiosResponse<ShiftResponseDto>> =>
    apiClient.post('/Shift', data),

  // PUT /api/Shift/{id} - Update shift
  updateShift: (id: number, data: UpdateShiftRequestDto): Promise<AxiosResponse<ShiftResponseDto>> =>
    apiClient.put(`/Shift/${id}`, data),

  // DELETE /api/Shift/{id} - Delete shift
  deleteShift: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/Shift/${id}`),

  // GET /api/Shift/search - Search shifts
  searchShifts: (params: ShiftSearchRequestDto): Promise<AxiosResponse<ShiftResponseDto[]>> =>
    apiClient.get('/Shift/search', { params }),
};

// ============================================
// VOUCHERS API (/api/Vouchers)
// ============================================

export const vouchersApi = {
  // GET /api/Vouchers - Get all vouchers
  getAllVouchers: (): Promise<AxiosResponse<VoucherDto[]>> =>
    apiClient.get('/Vouchers'),
};

// ============================================
// SALES ORDER API (/api/SalesOrder)
// ============================================

export const salesOrderApi = {
  // GET /api/SalesOrder/unprocessed - Get all unprocessed sales orders
  getUnprocessedSalesOrders: (): Promise<AxiosResponse<SalesOrderDto[]>> =>
    apiClient.get('/SalesOrder/unprocessed'),

  // GET /api/SalesOrder/processed - Get all processed sales orders
  getProcessedSalesOrders: (): Promise<AxiosResponse<SalesOrderDto[]>> =>
    apiClient.get('/SalesOrder/processed'),

  // GET /api/SalesOrder - Get all sales orders
  getAllSalesOrders: (): Promise<AxiosResponse<SalesOrderDto[]>> =>
    apiClient.get('/SalesOrder'),
};

// ============================================
// PRODUCTION ALLOTMENT API (/api/ProductionAllotment)
// ============================================

export const productionAllotmentApi = {
  // GET /api/ProductionAllotment - Get all production allotments
  getAllProductionAllotments: (): Promise<AxiosResponse<ProductionAllotmentResponseDto[]>> =>
    apiClient.get('/ProductionAllotment'),

  // GET /api/ProductionAllotment/next-serial-number - Get next serial number
  getNextSerialNumber: (): Promise<AxiosResponse<string>> =>
    apiClient.get('/ProductionAllotment/next-serial-number'),

  // GET /api/ProductionAllotment/by-allot-id/{allotId} - Get production allotment by AllotmentId
  getProductionAllotmentByAllotId: (allotId: string): Promise<AxiosResponse<ProductionAllotmentResponseDto>> =>
    apiClient.get(`/ProductionAllotment/by-allot-id/${allotId}`),

  // POST /api/ProductionAllotment/stkprint/{id} - Generate QR codes for machine allocation
  generateQRCodes: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.post(`/ProductionAllotment/stkprint/${id}`),
    
  // POST /api/ProductionAllotment/stkprint/roll-assignment/{id} - Generate QR codes for specific roll numbers in a roll assignment
  generateQRCodesForRollAssignment: (id: number, rollNumbers: number[]): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.post(`/ProductionAllotment/stkprint/roll-assignment/${id}`, { rollNumbers }),
};

// ============================================
// ROLL CONFIRMATION API (/api/RollConfirmation)
// ============================================

export const rollConfirmationApi = {
  // POST /api/RollConfirmation - Create new roll confirmation
  createRollConfirmation: (data: RollConfirmationRequestDto): Promise<AxiosResponse<RollConfirmationResponseDto>> =>
    apiClient.post('/RollConfirmation', data),

  // GET /api/RollConfirmation/{id} - Get roll confirmation by ID
  getRollConfirmation: (id: number): Promise<AxiosResponse<RollConfirmationResponseDto>> =>
    apiClient.get(`/RollConfirmation/${id}`),

  // GET /api/RollConfirmation/by-allot-id/{allotId} - Get roll confirmations by AllotId
  getRollConfirmationsByAllotId: (allotId: string): Promise<AxiosResponse<RollConfirmationResponseDto[]>> =>
    apiClient.get(`/RollConfirmation/by-allot-id/${allotId}`),
};

// ============================================
// ROLL ASSIGNMENT API (/api/RollAssignment)
// ============================================

export const rollAssignmentApi = {
  // POST /api/RollAssignment - Create new roll assignment
  createRollAssignment: (data: CreateRollAssignmentRequest): Promise<AxiosResponse<RollAssignmentResponseDto>> =>
    apiClient.post('/RollAssignment', data),

  // POST /api/RollAssignment/generate-stickers - Generate stickers for roll assignment
  generateStickers: (data: GenerateStickersRequest): Promise<AxiosResponse<RollAssignmentResponseDto>> =>
    apiClient.post('/RollAssignment/generate-stickers', data),

  // POST /api/RollAssignment/generate-barcodes - Generate barcodes for roll assignment
  generateBarcodes: (data: GenerateBarcodesRequest): Promise<AxiosResponse<RollAssignmentResponseDto>> =>
    apiClient.post('/RollAssignment/generate-barcodes', data),

  // GET /api/RollAssignment/by-machine-allocation/{machineAllocationId} - Get roll assignments by MachineAllocationId
  getRollAssignmentsByMachineAllocationId: (machineAllocationId: number): Promise<AxiosResponse<RollAssignmentResponseDto[]>> =>
    apiClient.get(`/RollAssignment/by-machine-allocation/${machineAllocationId}`),
};

// ============================================
// INSPECTION API (/api/Inspection)
// ============================================

export const inspectionApi = {
  // POST /api/Inspection - Create new inspection
  createInspection: (data: InspectionRequestDto): Promise<AxiosResponse<InspectionResponseDto>> =>
    apiClient.post('/Inspection', data),

  // GET /api/Inspection/{id} - Get inspection by ID
  getInspection: (id: number): Promise<AxiosResponse<InspectionResponseDto>> =>
    apiClient.get(`/Inspection/${id}`),

  // GET /api/Inspection/by-allot-id/{allotId} - Get inspections by AllotId
  getInspectionsByAllotId: (allotId: string): Promise<AxiosResponse<InspectionResponseDto[]>> =>
    apiClient.get(`/Inspection/by-allot-id/${allotId}`),
};
