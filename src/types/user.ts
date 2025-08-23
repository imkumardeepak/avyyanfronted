export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  lastLoginAt: string;
  createdAt: string;
  roleName: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  roleName: string;
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  roleName: string;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  lastLoginAt: string;
  createdAt: string;
  roleName: string;
}