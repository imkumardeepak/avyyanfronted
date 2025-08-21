import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { roleKeys } from './useUserQueries'; // Use existing roleKeys
import type {
  RoleDto,
  CreateRoleDto,
  UpdateRoleDto,
  PermissionDto,
  PermissionGroupDto,
  UserPermissions
} from '@/types/role';
import type {
  PagePermissionRecord,
  RolePagePermissions,
  NavigationPermissionMatrix
} from '@/types/navigation';

// Additional Query Keys for new functionality
const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
  byCategory: () => [...permissionKeys.all, 'by-category'] as const,
  userPermissions: (userId: number) => [...permissionKeys.all, 'user', userId] as const,
  roleUsers: (roleId: number) => [...roleKeys.all, 'role-users', roleId] as const,
  pagePermissions: () => ['page-permissions'] as const,
  rolePagePermissions: (roleId: number) => [...permissionKeys.pagePermissions(), 'role', roleId] as const,
  userPagePermissions: (userId: number) => [...permissionKeys.pagePermissions(), 'user', userId] as const,
  availablePages: () => [...permissionKeys.pagePermissions(), 'available-pages'] as const,
};

// Note: useRoles and useRole are already exported from useUserQueries
// We don't re-export them here to avoid conflicts

// Permission Queries
export const usePermissions = () => {
  return useQuery({
    queryKey: permissionKeys.lists(),
    queryFn: async () => {
      const response = await roleApi.getAllPermissions();
      return response.data as PermissionDto[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions don't change often
  });
};

export const usePermissionsByCategory = () => {
  return useQuery({
    queryKey: permissionKeys.byCategory(),
    queryFn: async () => {
      const response = await roleApi.getPermissionsByCategory();
      return response.data as PermissionGroupDto[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// User Permission Queries
export const useUserPermissions = (userId: number, enabled = true) => {
  return useQuery({
    queryKey: permissionKeys.userPermissions(userId),
    queryFn: async () => {
      const response = await roleApi.getUserPermissions(userId);
      return response.data as UserPermissions;
    },
    enabled: enabled && userId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Note: useUserRoles is already exported from useUserQueries

export const useRoleUsers = (roleId: number, enabled = true) => {
  return useQuery({
    queryKey: permissionKeys.roleUsers(roleId),
    queryFn: async () => {
      const response = await roleApi.getRoleUsers(roleId);
      return response.data;
    },
    enabled: enabled && roleId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Page-based Permission Queries
export const useRolePagePermissions = (roleId: number, enabled = true) => {
  return useQuery({
    queryKey: permissionKeys.rolePagePermissions(roleId),
    queryFn: async () => {
      const response = await roleApi.getRolePagePermissions(roleId);
      return response.data as PagePermissionRecord[];
    },
    enabled: enabled && roleId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserPagePermissions = (userId: number, enabled = true) => {
  return useQuery({
    queryKey: permissionKeys.userPagePermissions(userId),
    queryFn: async () => {
      const response = await roleApi.getUserPagePermissions(userId);
      return response.data as PagePermissionRecord[];
    },
    enabled: enabled && userId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAvailablePages = () => {
  return useQuery({
    queryKey: permissionKeys.availablePages(),
    queryFn: async () => {
      const response = await roleApi.getAllAvailablePages();
      return response.data as Array<{
        pageName: string;
        title: string;
        description?: string;
        isParent: boolean;
        children?: string[];
      }>;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - pages don't change often
  });
};

// Role Mutations
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleData: CreateRoleDto & {
      pagePermissions?: PagePermissionRecord[]
    }) => {
      const response = await roleApi.createRole(roleData);
      return response.data as RoleDto;
    },
    onSuccess: (newRole) => {
      // Invalidate and refetch roles list
      queryClient.invalidateQueries({ queryKey: roleKeys.all });

      // Add the new role to the cache
      queryClient.setQueryData(roleKeys.detail(newRole.id), newRole);

      // Invalidate page permissions
      queryClient.invalidateQueries({ queryKey: permissionKeys.pagePermissions() });

      toast.success('Success', 'Role created successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to create role';
      toast.error('Error', errorMessage);
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleData: UpdateRoleDto & {
      pagePermissions?: PagePermissionRecord[]
    }) => {
      const response = await roleApi.updateRole(roleData.id, roleData);
      return response.data as RoleDto;
    },
    onSuccess: (updatedRole) => {
      // Update the role in the cache
      queryClient.setQueryData(roleKeys.detail(updatedRole.id), updatedRole);

      // Invalidate roles list to reflect changes
      queryClient.invalidateQueries({ queryKey: roleKeys.all });

      // Invalidate user permissions that might be affected
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });

      // Invalidate page permissions
      queryClient.invalidateQueries({ queryKey: permissionKeys.pagePermissions() });

      toast.success('Success', 'Role updated successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to update role';
      toast.error('Error', errorMessage);
    },
  });
};

// Page Permission Mutations
export const useUpdateRolePagePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      pagePermissions
    }: {
      roleId: number;
      pagePermissions: PagePermissionRecord[]
    }) => {
      const response = await roleApi.updateRolePagePermissions(roleId, pagePermissions);
      return response.data;
    },
    onSuccess: (_, { roleId }) => {
      // Invalidate role page permissions
      queryClient.invalidateQueries({ queryKey: permissionKeys.rolePagePermissions(roleId) });

      // Invalidate all user page permissions (they might be affected)
      queryClient.invalidateQueries({ queryKey: permissionKeys.pagePermissions() });

      toast.success('Success', 'Role permissions updated successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to update role permissions';
      toast.error('Error', errorMessage);
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await roleApi.deleteRole(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove role from cache
      queryClient.removeQueries({ queryKey: roleKeys.detail(deletedId) });

      // Invalidate roles list
      queryClient.invalidateQueries({ queryKey: roleKeys.all });

      // Invalidate user permissions that might be affected
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });

      toast.success('Success', 'Role deleted successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete role';
      toast.error('Error', errorMessage);
    },
  });
};

// Role Assignment Mutations
export const useAssignRoleToUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      const response = await roleApi.assignRoleToUser(userId, roleId);
      return response.data;
    },
    onSuccess: (_, { userId, roleId }) => {
      // Invalidate user roles and permissions
      queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(userId) });
      queryClient.invalidateQueries({ queryKey: permissionKeys.userPermissions(userId) });
      queryClient.invalidateQueries({ queryKey: permissionKeys.roleUsers(roleId) });

      toast.success('Success', 'Role assigned successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to assign role';
      toast.error('Error', errorMessage);
    },
  });
};

export const useRemoveRoleFromUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      await roleApi.removeRoleFromUser(userId, roleId);
      return { userId, roleId };
    },
    onSuccess: (_, { userId, roleId }) => {
      // Invalidate user roles and permissions
      queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(userId) });
      queryClient.invalidateQueries({ queryKey: permissionKeys.userPermissions(userId) });
      queryClient.invalidateQueries({ queryKey: permissionKeys.roleUsers(roleId) });

      toast.success('Success', 'Role removed successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to remove role';
      toast.error('Error', errorMessage);
    },
  });
};

// Permission Check Hook
export const usePermissionCheck = (resource: string, action: string, userId?: number) => {
  return useQuery({
    queryKey: ['permission-check', userId, resource, action],
    queryFn: async () => {
      if (!userId) return false;
      const response = await roleApi.checkUserPermission(userId, resource, action);
      return response.data as boolean;
    },
    enabled: !!userId && !!resource && !!action,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
