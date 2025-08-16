import { apiClient } from '@/lib/api';
import type {
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  UserDto,
  ChangePasswordDto,
  RefreshTokenDto,
  CreateUserDto,
  UpdateUserDto,
  RoleDto,
  AssignRoleDto,
  PageAccessDto
} from '@/types/auth';

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly USER_KEY = 'auth_user';

  // Authentication Methods
  async login(credentials: LoginDto): Promise<LoginResponseDto> {
    const response = await apiClient.post<LoginResponseDto>('/api/Auth/login', credentials);
    const data = response.data;

    // Store tokens and user data
    this.setTokens(data.token, data.refreshToken);
    this.setUser(data.user);

    return data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/Auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async register(userData: RegisterDto): Promise<UserDto> {
    const response = await apiClient.post<UserDto>('/api/Auth/register', userData);
    return response.data;
  }

  async refreshToken(): Promise<LoginResponseDto> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (!token || !refreshToken) {
      throw new Error('No tokens available');
    }

    const refreshData: RefreshTokenDto = { token, refreshToken };
    const response = await apiClient.post<LoginResponseDto>('/api/Auth/refresh', refreshData);
    const data = response.data;
    
    // Update stored tokens
    this.setTokens(data.token, data.refreshToken);
    this.setUser(data.user);
    
    return data;
  }

  async changePassword(passwordData: ChangePasswordDto): Promise<boolean> {
    const response = await apiClient.post('/api/Auth/change-password', passwordData);
    return response.status === 200;
  }

  async getProfile(): Promise<UserDto> {
    const response = await apiClient.get<UserDto>('/api/Auth/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<UserDto>): Promise<UserDto> {
    const response = await apiClient.put<UserDto>('/api/Auth/profile', userData);
    const updatedUser = response.data;
    this.setUser(updatedUser);
    return updatedUser;
  }

  // User Management Methods (Admin only)
  async getAllUsers(): Promise<UserDto[]> {
    const response = await apiClient.get<UserDto[]>('/api/Auth/users');
    return response.data;
  }

  async getUserById(id: number): Promise<UserDto> {
    const response = await apiClient.get<UserDto>(`/api/Auth/users/${id}`);
    return response.data;
  }

  async createUser(userData: CreateUserDto): Promise<UserDto> {
    const response = await apiClient.post<UserDto>('/api/Auth/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: UpdateUserDto): Promise<UserDto> {
    const response = await apiClient.put<UserDto>(`/api/Auth/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number): Promise<boolean> {
    const response = await apiClient.delete(`/api/Auth/users/${id}`);
    return response.status === 200;
  }

  // NOTE: Lock/Unlock endpoints do not exist in backend
  // Role management is handled through UpdateUserDto.roleIds field

  // Mock implementations for compatibility (will use local data)
  async lockUser(_id: number): Promise<boolean> {
    console.warn('Lock user endpoint not available in backend');
    return true; // Mock success
  }

  async unlockUser(_id: number): Promise<boolean> {
    console.warn('Unlock user endpoint not available in backend');
    return true; // Mock success
  }

  // Mock role management for compatibility
  async getAllRoles(): Promise<RoleDto[]> {
    console.warn('Get all roles endpoint not available in backend');
    // Return mock roles based on common system roles
    return [
      { id: 1, name: 'Admin', description: 'Administrator', isSystemRole: true },
      { id: 2, name: 'Manager', description: 'Manager', isSystemRole: true },
      { id: 3, name: 'User', description: 'Regular User', isSystemRole: true },
    ];
  }

  async assignRole(_assignData: AssignRoleDto): Promise<boolean> {
    console.warn('Assign role endpoint not available in backend - use updateUser with roleIds instead');
    return true; // Mock success
  }

  async removeRole(_userId: number, _roleId: number): Promise<boolean> {
    console.warn('Remove role endpoint not available in backend - use updateUser with roleIds instead');
    return true; // Mock success
  }

  // Permission Methods
  async getPermissions(): Promise<PageAccessDto[]> {
    const response = await apiClient.get<PageAccessDto[]>('/api/Auth/permissions');
    return response.data;
  }

  async checkPermission(pageUrl: string, permission: string = 'View'): Promise<boolean> {
    const response = await apiClient.get<boolean>('/api/Auth/permissions/check', {
      params: { pageUrl, permission }
    });
    return response.data;
  }

  // Token Management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUser(): UserDto | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  setUser(user: UserDto): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.roles?.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }
}

export const authService = new AuthService();
export default authService;
