// Backend DTOs matching your API
export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
  roles: string[];
  pageAccesses: PageAccessDto[];
}

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  lastLoginAt: string;
  createdAt: string;
  roleName: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  roleIds: number[];
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  roleIds: number[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
}

export interface RefreshTokenDto {
  token: string;
  refreshToken: string;
}

export interface PageAccessDto {
  id: number;
  roleId: number;
  pageName: string;
  isView: boolean;
  isAdd: boolean;
  isEdit: boolean;
  isDelete: boolean;
}

export interface RoleDto {
  id: number;
  name: string;
  description?: string;
  isSystemRole: boolean;
}

export interface AssignRoleDto {
  userId: number;
  roleId: number;
  expiresAt?: string;
}

// Legacy types for compatibility
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}