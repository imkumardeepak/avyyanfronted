import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Settings, Search, Upload, Download } from 'lucide-react';
import { useMachines, useDeleteMachine, useSearchMachines } from '@/hooks/queries';
import { machineApi, apiUtils } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { Row } from '@tanstack/react-table';
import type { MachineResponseDto, MachineSearchRequestDto } from '@/types/api-types';

type MachineCellProps = { row: Row<MachineResponseDto> };

const MachineManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: machines = [], isLoading, error } = useMachines();
  const { mutate: deleteMachineMutation, isPending: isDeleting } = useDeleteMachine();

  const [searchParams, setSearchParams] = useState<MachineSearchRequestDto>({});
  const [isSearching, setIsSearching] = useState(false);

  // Use useSearchMachines correctly as a query hook
  const { data: searchResults = [], isLoading: isSearchLoading } = useSearchMachines(
    searchParams,
    isSearching
  );

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    machine: MachineResponseDto | null;
  }>({
    open: false,
    machine: null,
  });

  // Use search results when searching, otherwise use all machines
  const displayedMachines = useMemo(() => {
    return isSearching ? searchResults : machines;
  }, [isSearching, searchResults, machines]);

  const columns = [
    {
      accessorKey: 'machineName',
      header: 'Machine',
      cell: ({ row }: MachineCellProps) => {
        const machine = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="font-medium">{machine.machineName}</div>
              <div className="text-sm text-muted-foreground">
                {machine.description || 'No description'}
              </div>
              {!machine.isActive && (
                <Badge variant="destructive" className="text-xs mt-1">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'dia',
      header: 'Specifications',
      cell: ({ row }: MachineCellProps) => {
        const machine = row.original;
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">Dia:</span> {machine.dia}"
            </div>
            <div className="text-sm">
              <span className="font-medium">GG:</span> {machine.gg}
            </div>
            <div className="text-sm">
              <span className="font-medium">Needles:</span> {machine.needle}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'efficiency',
      header: 'Performance',
      cell: ({ row }: MachineCellProps) => {
        const machine = row.original;
        const efficiencyColor =
          machine.efficiency >= 80
            ? 'text-green-600'
            : machine.efficiency >= 60
              ? 'text-yellow-600'
              : 'text-red-600';
        return (
          <div className="space-y-1">
            <div className={`text-sm font-medium ${efficiencyColor}`}>
              {machine.efficiency}% Efficiency
            </div>
            <div className="text-sm text-muted-foreground">{machine.rpm} RPM</div>
            <div className="text-sm text-muted-foreground">{machine.feeder} Feeders</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: MachineCellProps) => (
        <div className="text-sm">{formatDate(row.getValue('createdAt'))}</div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: MachineCellProps) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: MachineCellProps) => {
        const machine = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/machines/${machine.id}/edit`)}
            >
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(machine.id)}>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const handleSearch = () => {
    setIsSearching(true);
  };

  const handleReset = () => {
    setSearchParams({});
    setIsSearching(false);
    queryClient.invalidateQueries({ queryKey: ['machines'] });
  };

  const handleDelete = (id: number) => {
    const machine = displayedMachines.find((m) => m.id === id);
    if (machine) {
      setDeleteDialog({
        open: true,
        machine,
      });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.machine) {
      deleteMachineMutation(deleteDialog.machine.id);
      setDeleteDialog({ open: false, machine: null });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    const errorMessage = apiUtils.handleError(error);
    return (
      <div className="text-center text-red-500 p-4">Error loading machines: {errorMessage}</div>
    );
  }

  const activeMachines = displayedMachines.filter((machine) => machine.isActive).length;
  const inactiveMachines = displayedMachines.length - activeMachines;
  const totalEfficiency = displayedMachines.reduce((sum, machine) => sum + machine.efficiency, 0);
  const averageEfficiency =
    displayedMachines.length > 0 ? (totalEfficiency / displayedMachines.length).toFixed(1) : '0';
  const highEfficiencyMachines = displayedMachines.filter(
    (machine) => machine.efficiency >= 80
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Machine Management</h1>
          <p className="text-muted-foreground">Manage manufacturing machines and equipment</p>
        </div>
        <Button onClick={() => navigate('/machines/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Machine
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayedMachines.length}</div>
            <p className="text-xs text-muted-foreground">{activeMachines} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEfficiency}%</div>
            <p className="text-xs text-muted-foreground">Across all machines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Efficiency</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highEfficiencyMachines}</div>
            <p className="text-xs text-muted-foreground">≥80% efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMachines}</div>
            <p className="text-xs text-muted-foreground">
              {displayedMachines.length - activeMachines} inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Machines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Machine Name</label>
              <Input
                placeholder="Enter machine name"
                value={searchParams.machineName || ''}
                onChange={(e) =>
                  setSearchParams((prev) => ({ ...prev, machineName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Diameter</label>
              <Input
                type="number"
                placeholder="Enter diameter"
                value={searchParams.dia || ''}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    dia: parseFloat(e.target.value) || undefined,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={searchParams.isActive === undefined ? '' : searchParams.isActive.toString()}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                  }))
                }
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={handleSearch} disabled={isSearchLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isSearchLoading ? 'Searching...' : 'Search'}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Machines Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isSearching ? 'Search Results' : 'All Machines'}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({displayedMachines.length} machines)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={displayedMachines} />
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, machine: null })}
        itemName={deleteDialog.machine ? deleteDialog.machine.machineName : ''}
        itemType="Machine"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MachineManagement;
