import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import type {
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  RoleDto
} from '@/types/auth';
import { AxiosError } from 'axios';

// Helper function to handle errors
const handleError = (err: unknown, defaultMessage: string): string => {
  if (err instanceof AxiosError) {
    return err.response?.data?.message || err.message || defaultMessage;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMessage;
};

export const useUsers = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const users = await authService.getAllUsers();
      setUsers(users);
    } catch (err) {
      console.error('Error fetching users:', err);

      // If API fails, use mock data for development
      if (err instanceof AxiosError && err.response?.status === 404) {
        console.warn('User API endpoints not available, using mock data');
        const mockUsers: UserDto[] = [
          {
            id: 1,
            username: 'admin',
            email: 'admin@avyaan.com',
            firstName: 'Admin',
            lastName: 'User',
            fullName: 'Admin User',
            profilePicture: '',
            isEmailVerified: true,
            isLocked: false,
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            roles: ['Admin'],
            isOnline: true,
          },
          {
            id: 2,
            username: 'manager',
            email: 'manager@avyaan.com',
            firstName: 'Manager',
            lastName: 'User',
            fullName: 'Manager User',
            profilePicture: '',
            isEmailVerified: true,
            isLocked: false,
            lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            roles: ['Manager'],
            isOnline: false,
          },
          {
            id: 3,
            username: 'operator',
            email: 'operator@avyaan.com',
            firstName: 'Operator',
            lastName: 'User',
            fullName: 'Operator User',
            profilePicture: '',
            isEmailVerified: true,
            isLocked: false,
            lastLoginAt: new Date(Date.now() - 7200000).toISOString(),
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            roles: ['Operator'],
            isOnline: true,
          },
        ];
        setUsers(mockUsers);
      } else {
        setError(handleError(err, 'Failed to fetch users'));
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get single user
  const getUser = async (id: number): Promise<UserDto | null> => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.getUserById(id);
      return user;
    } catch (err) {
      setError(handleError(err, 'Failed to fetch user'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const createUser = async (data: CreateUserDto): Promise<UserDto | null> => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await authService.createUser(data);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(handleError(err, 'Failed to create user'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async (id: number, data: UpdateUserDto): Promise<UserDto | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await authService.updateUser(id, data);
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      return updatedUser;
    } catch (err) {
      setError(handleError(err, 'Failed to update user'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await authService.deleteUser(id);
      if (success) {
        setUsers(prev => prev.filter(u => u.id !== id));
      }
      return success;
    } catch (err) {
      setError(handleError(err, 'Failed to delete user'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Lock user account (mock implementation - endpoint doesn't exist in backend)
  const lockUser = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      // Mock implementation since endpoint doesn't exist
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, isLocked: true } : u
      ));
      return true;
    } catch (err) {
      setError(handleError(err, 'Failed to lock user'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Unlock user account (mock implementation - endpoint doesn't exist in backend)
  const unlockUser = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      // Mock implementation since endpoint doesn't exist
      setUsers(prev => prev.map(u =>
        u.id === id ? { ...u, isLocked: false } : u
      ));
      return true;
    } catch (err) {
      setError(handleError(err, 'Failed to unlock user'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Change password (for current user)
  const changePassword = async (passwordData: ChangePasswordDto): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await authService.changePassword(passwordData);
      return success;
    } catch (err) {
      setError(handleError(err, 'Failed to change password'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Assign role to user (using updateUser since direct role endpoints don't exist)
  const assignRole = async (userId: number, roleId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Get current user data
      const currentUser = await authService.getUserById(userId);
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Add role to existing roles
      const currentRoleIds = currentUser.roles.map(role => {
        // Map role names to IDs (mock mapping since we don't have role endpoints)
        switch (role) {
          case 'Admin': return 1;
          case 'Manager': return 2;
          case 'User': return 3;
          default: return 3;
        }
      });

      const newRoleIds = [...new Set([...currentRoleIds, roleId])];

      // Update user with new roles
      const updateData = {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber,
        isActive: !currentUser.isLocked,
        roleIds: newRoleIds,
      };

      const success = await authService.updateUser(userId, updateData);
      if (success) {
        await fetchUsers(); // Refresh user data
      }
      return !!success;
    } catch (err) {
      setError(handleError(err, 'Failed to assign role'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove role from user (using updateUser since direct role endpoints don't exist)
  const removeRole = async (userId: number, roleId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Get current user data
      const currentUser = await authService.getUserById(userId);
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Remove role from existing roles
      const currentRoleIds = currentUser.roles.map(role => {
        // Map role names to IDs (mock mapping since we don't have role endpoints)
        switch (role) {
          case 'Admin': return 1;
          case 'Manager': return 2;
          case 'User': return 3;
          default: return 3;
        }
      });

      const newRoleIds = currentRoleIds.filter(id => id !== roleId);

      // Update user with new roles
      const updateData = {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber,
        isActive: !currentUser.isLocked,
        roleIds: newRoleIds,
      };

      const success = await authService.updateUser(userId, updateData);
      if (success) {
        await fetchUsers(); // Refresh user data
      }
      return !!success;
    } catch (err) {
      setError(handleError(err, 'Failed to remove role'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get all roles
  const getAllRoles = async (): Promise<RoleDto[]> => {
    try {
      const roles = await authService.getAllRoles();
      return roles;
    } catch (err) {
      setError(handleError(err, 'Failed to fetch roles'));
      return [];
    }
  };

  // Search users (local search for now)
  const searchUsers = async (query: string): Promise<UserDto[]> => {
    try {
      setLoading(true);
      setError(null);
      // Filter current users by query
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.fullName.toLowerCase().includes(query.toLowerCase())
      );
      return filtered;
    } catch (err) {
      setError(handleError(err, 'Failed to search users'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get user statistics
  const getUserStats = async () => {
    try {
      return {
        totalUsers: users.length,
        activeUsers: users.filter(u => !u.isLocked).length,
        onlineUsers: users.filter(u => u.isOnline).length,
        lockedUsers: users.filter(u => u.isLocked).length,
      };
    } catch (err) {
      setError(handleError(err, 'Failed to fetch user statistics'));
      return null;
    }
  };

  // Get online users
  const getOnlineUsers = async (): Promise<UserDto[]> => {
    try {
      return users.filter(u => u.isOnline);
    } catch (err) {
      setError(handleError(err, 'Failed to fetch online users'));
      return [];
    }
  };

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    lockUser,
    unlockUser,
    changePassword,
    assignRole,
    removeRole,
    getAllRoles,
    searchUsers,
    getUserStats,
    getOnlineUsers,
  };
};
