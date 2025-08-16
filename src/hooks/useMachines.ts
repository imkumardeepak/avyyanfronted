import { useState, useEffect } from 'react';
import type {
  MachineManagerDto,
  CreateMachineManagerDto,
  UpdateMachineManagerDto,
  MachineSearchDto
} from '@/types/machine';
import { apiClient } from '@/lib/api';
import { AxiosError } from 'axios';

export const useMachines = () => {
  const [machines, setMachines] = useState<MachineManagerDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch all machines
  const fetchMachines = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try multiple possible endpoints
      let response;
      try {
        response = await apiClient.get('/api/MachineManager');
      } catch (firstError) {
        if (firstError instanceof AxiosError && firstError.response?.status === 404) {
          try {
            response = await apiClient.get('/api/Machines');
          } catch (secondError) {
            if (secondError instanceof AxiosError && secondError.response?.status === 404) {
              // If both endpoints fail, use mock data for development
              console.warn('Machine API endpoints not available, using mock data');
              const mockMachines = [
                {
                  id: 1,
                  machineName: 'Machine-001',
                  dia: 30,
                  gg: 12,
                  needle: 2400,
                  feeder: 96,
                  rpm: 25,
                  slit: 4,
                  constat: 'Standard',
                  efficiency: 85,
                  description: 'High-performance knitting machine',
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  id: 2,
                  machineName: 'Machine-002',
                  dia: 32,
                  gg: 14,
                  needle: 2800,
                  feeder: 112,
                  rpm: 22,
                  slit: 6,
                  constat: 'Premium',
                  efficiency: 92,
                  description: 'Premium knitting machine with advanced features',
                  isActive: true,
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  id: 3,
                  machineName: 'Machine-003',
                  dia: 28,
                  gg: 10,
                  needle: 2000,
                  feeder: 80,
                  rpm: 28,
                  slit: 2,
                  constat: 'Basic',
                  efficiency: 78,
                  description: 'Basic knitting machine for standard operations',
                  isActive: false,
                  createdAt: new Date(Date.now() - 172800000).toISOString(),
                  updatedAt: new Date(Date.now() - 86400000).toISOString(),
                },
              ];
              setMachines(mockMachines);
              return;
            }
            throw secondError;
          }
        } else {
          throw firstError;
        }
      }

      setMachines(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching machines:', err);
      setError(handleError(err, 'Failed to fetch machines'));
      setMachines([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Get single machine
  const getMachine = async (id: number): Promise<MachineManagerDto | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/MachineManager/${id}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch machine');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create machine
  const createMachine = async (data: CreateMachineManagerDto): Promise<MachineManagerDto | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/api/MachineManager', data);
      const newMachine = response.data;
      setMachines(prev => [...prev, newMachine]);
      return newMachine;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create machine');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update machine
  const updateMachine = async (id: number, data: UpdateMachineManagerDto): Promise<MachineManagerDto | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put(`/api/MachineManager/${id}`, data);
      const updatedMachine = response.data;
      setMachines(prev => prev.map(m => m.id === id ? updatedMachine : m));
      return updatedMachine;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update machine');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete machine
  const deleteMachine = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/api/MachineManager/${id}`);
      setMachines(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete machine');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Search machines
  const searchMachines = async (searchData: MachineSearchDto): Promise<MachineManagerDto[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/api/MachineManager/search', searchData);
      const searchResults = response.data;
      setMachines(searchResults);
      return searchResults;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search machines');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Bulk update machines
  const bulkUpdateMachines = async (machineIds: number[], updates: Partial<UpdateMachineManagerDto>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.put('/api/MachineManager/bulk-update', {
        machineIds,
        ...updates
      });
      // Refresh machines list
      await fetchMachines();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to bulk update machines');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get machine statistics
  const getMachineStats = async () => {
    try {
      const response = await apiClient.get('/api/MachineManager/stats');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch machine statistics');
      return null;
    }
  };

  // Import machines from file
  const importMachines = async (file: File): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      
      await apiClient.post('/api/MachineManager/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh machines list
      await fetchMachines();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import machines');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Export machines to file
  const exportMachines = async (format: 'csv' | 'excel' = 'csv'): Promise<Blob | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/MachineManager/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export machines');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load machines on mount
  useEffect(() => {
    fetchMachines();
  }, []);

  return {
    machines,
    loading,
    error,
    fetchMachines,
    getMachine,
    createMachine,
    updateMachine,
    deleteMachine,
    searchMachines,
    bulkUpdateMachines,
    getMachineStats,
    importMachines,
    exportMachines,
  };
};
