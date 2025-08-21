import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, roleApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { UserDto, CreateUserDto, UpdateUserDto, RoleDto, AssignRoleDto } from '@/types/auth';

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  roles: (id: number) => [...userKeys.detail(id), 'roles'] as const,
};

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: string) => [...roleKeys.lists(), { filters }] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: number) => [...roleKeys.details(), id] as const,
  pageAccesses: () => [...roleKeys.all, 'pageAccesses'] as const,
};

// User Queries
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const response = await userApi.getAllUsers();
      return response.data as UserDto[];
    },
  });
};

export const useUser = (id: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await userApi.getUser(id);
      return response.data as UserDto;
    },
    enabled: enabled && !!id,
  });
};

export const useUserRoles = (userId: number, enabled = true) => {
  return useQuery({
    queryKey: userKeys.roles(userId),
    queryFn: async () => {
      const response = await userApi.getUserRoles(userId);
      return response.data as RoleDto[];
    },
    enabled: enabled && !!userId,
  });
};

// Role Queries
export const useRoles = () => {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: async () => {
      const response = await roleApi.getAllRoles();
      return response.data as RoleDto[];
    },
  });
};

export const useRole = (id: number, enabled = true) => {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const response = await roleApi.getRole(id);
      return response.data as RoleDto;
    },
    enabled: enabled && !!id,
  });
};

export const usePageAccesses = () => {
  return useQuery({
    queryKey: roleKeys.pageAccesses(),
    queryFn: async () => {
      const response = await roleApi.getAllPageAccesses();
      return response.data;
    },
  });
};

// User Mutations
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserDto) => {
      const response = await userApi.createUser(userData);
      return response.data as UserDto;
    },
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Add the new user to the cache
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser);

      toast.success('Success', 'User created successfully');
    },
    onError: (error: any) => {
      toast.error('Error', error?.response?.data?.message || 'Failed to create user');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: UpdateUserDto }) => {
      const response = await userApi.updateUser(id, userData);
      return response.data as UserDto;
    },
    onSuccess: (updatedUser) => {
      // Update the user in the cache
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);

      // Invalidate users list to reflect changes
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success('Success', 'User updated successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to update user';
      toast.error('Error', errorMessage);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await userApi.deleteUser(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) });

      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success('Success', 'User deleted successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete user';
      toast.error('Error', errorMessage);
    },
  });
};

export const useLockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await userApi.lockUser(id);
      return id;
    },
    onSuccess: (userId) => {
      // Invalidate user details and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success('Success', 'User locked successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to lock user';
      toast.error('Error', errorMessage);
    },
  });
};

export const useUnlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await userApi.unlockUser(id);
      return id;
    },
    onSuccess: (userId) => {
      // Invalidate user details and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success('Success', 'User unlocked successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to unlock user';
      toast.error('Error', errorMessage);
    },
  });
};

export const useAssignUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleData }: { userId: number; roleData: { roleId: number; expiresAt?: string } }) => {
      await userApi.assignUserRole(userId, roleData);
      return { userId, roleData };
    },
    onSuccess: ({ userId }) => {
      // Invalidate user details and roles
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.roles(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success('Success', 'Role assigned successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to assign role';
      toast.error('Error', errorMessage);
    },
  });
};

export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      await userApi.removeUserRole(userId, roleId);
      return { userId, roleId };
    },
    onSuccess: ({ userId }) => {
      // Invalidate user details and roles
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.roles(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success('Success', 'Role removed successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to remove role';
      toast.error('Error', errorMessage);
    },
  });
};
