import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { machineApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { MachineManagerDto, CreateMachineManagerDto, UpdateMachineManagerDto } from '@/types/machine';

// Query Keys
export const machineKeys = {
  all: ['machines'] as const,
  lists: () => [...machineKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...machineKeys.lists(), { filters }] as const,
  details: () => [...machineKeys.all, 'detail'] as const,
  detail: (id: number) => [...machineKeys.details(), id] as const,
  search: (params: { machineName?: string; dia?: number }) => [...machineKeys.all, 'search', params] as const,
};

// Machine Queries
export const useMachines = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: machineKeys.list(filters || {}),
    queryFn: async () => {
      const response = await machineApi.getAllMachines();
      return response.data as MachineManagerDto[];
    },
  });
};

export const useMachine = (id: number, enabled = true) => {
  return useQuery({
    queryKey: machineKeys.detail(id),
    queryFn: async () => {
      const response = await machineApi.getMachine(id);
      return response.data as MachineManagerDto;
    },
    enabled: enabled && !!id,
  });
};

export const useSearchMachines = (searchParams: { machineName?: string; dia?: number }, enabled = true) => {
  return useQuery({
    queryKey: machineKeys.search(searchParams),
    queryFn: async () => {
      const response = await machineApi.searchMachines(searchParams.machineName, searchParams.dia);
      return response.data as MachineManagerDto[];
    },
    enabled: enabled && (!!searchParams.machineName || !!searchParams.dia),
  });
};

// Machine Mutations
export const useCreateMachine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (machineData: CreateMachineManagerDto) => {
      const response = await machineApi.createMachine(machineData);
      return response.data as MachineManagerDto;
    },
    onSuccess: (newMachine) => {
      // Invalidate and refetch machines list
      queryClient.invalidateQueries({ queryKey: machineKeys.lists() });

      // Add the new machine to the cache
      queryClient.setQueryData(machineKeys.detail(newMachine.id), newMachine);

      toast.success('Success', 'Machine created successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to create machine';
      toast.error('Error', errorMessage);
    },
  });
};

export const useCreateMultipleMachines = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (machinesData: CreateMachineManagerDto[]) => {
      const response = await machineApi.createMultipleMachines(machinesData);
      return response.data as MachineManagerDto[];
    },
    onSuccess: (newMachines) => {
      // Invalidate machines list
      queryClient.invalidateQueries({ queryKey: machineKeys.lists() });

      // Add new machines to cache
      newMachines.forEach(machine => {
        queryClient.setQueryData(machineKeys.detail(machine.id), machine);
      });

      toast.success('Success', `${newMachines.length} machines created successfully`);
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to create machines';
      toast.error('Error', errorMessage);
    },
  });
};

export const useUpdateMachine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, machineData }: { id: number; machineData: UpdateMachineManagerDto }) => {
      const response = await machineApi.updateMachine(id, machineData);
      return response.data as MachineManagerDto;
    },
    onSuccess: (updatedMachine) => {
      // Update the machine in the cache
      queryClient.setQueryData(machineKeys.detail(updatedMachine.id), updatedMachine);

      // Invalidate machines list to reflect changes
      queryClient.invalidateQueries({ queryKey: machineKeys.lists() });

      toast.success('Success', 'Machine updated successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to update machine';
      toast.error('Error', errorMessage);
    },
  });
};

export const useDeleteMachine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await machineApi.deleteMachine(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove machine from cache
      queryClient.removeQueries({ queryKey: machineKeys.detail(deletedId) });

      // Invalidate machines list
      queryClient.invalidateQueries({ queryKey: machineKeys.lists() });

      toast.success('Success', 'Machine deleted successfully');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete machine';
      toast.error('Error', errorMessage);
    },
  });
};

// Optimistic Updates for Machine Status
export const useUpdateMachineStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      // This would be an API call to update machine status
      // For now, we'll simulate it
      const response = await machineApi.updateMachine(id, { status } as UpdateMachineManagerDto);
      return response.data as MachineManagerDto;
    },
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: machineKeys.detail(id) });

      // Snapshot the previous value
      const previousMachine = queryClient.getQueryData(machineKeys.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(machineKeys.detail(id), (old: MachineManagerDto | undefined) => {
        if (!old) return old;
        return { ...old, status };
      });

      // Return a context object with the snapshotted value
      return { previousMachine, id };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMachine) {
        queryClient.setQueryData(machineKeys.detail(id), context.previousMachine);
      }

      toast.error('Error', 'Failed to update machine status');
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: machineKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: machineKeys.lists() });
    },
    onSuccess: () => {
      toast.success('Success', 'Machine status updated successfully');
    },
  });
};

// Prefetch machine details
export const usePrefetchMachine = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: machineKeys.detail(id),
      queryFn: async () => {
        const response = await machineApi.getMachine(id);
        return response.data as MachineManagerDto;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
};

// Infinite query for large machine lists (if needed)
export const useInfiniteMachines = (pageSize = 20) => {
  return useQuery({
    queryKey: [...machineKeys.lists(), 'infinite'],
    queryFn: async () => {
      // This would need pagination support in the API
      const response = await machineApi.getAllMachines();
      return {
        data: response.data as MachineManagerDto[],
        nextCursor: null, // Would be provided by API
      };
    },
  });
};
