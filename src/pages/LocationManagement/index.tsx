import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useLocations, useDeleteLocation } from '@/hooks/queries';
import { apiUtils } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { Row } from '@tanstack/react-table';
import type { LocationResponseDto } from '@/types/api-types';

type LocationCellProps = { row: Row<LocationResponseDto> };

const LocationManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: locations = [], isLoading, error } = useLocations();
  const { mutate: deleteLocationMutation, isPending: isDeleting } = useDeleteLocation();

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    location: LocationResponseDto | null;
  }>({
    open: false,
    location: null,
  });

  const columns = [
    {
      accessorKey: 'warehousename',
      header: 'Warehouse',
      cell: ({ row }: LocationCellProps) => {
        const location = row.original;
        return <div className="font-medium">{location.warehousename}</div>;
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }: LocationCellProps) => {
        const location = row.original;
        return (
          <div>
            <div className="font-medium">{location.location}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'locationcode',
      header: 'Code',
      cell: ({ row }: LocationCellProps) => {
        const location = row.original;
        return <div className="font-medium">{location.locationcode}</div>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: LocationCellProps) => {
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
      cell: ({ row }: LocationCellProps) => {
        const location = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/locations/${location.id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(location.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDelete = (id: number) => {
    const location = locations.find((m) => m.id === id);
    if (location) {
      setDeleteDialog({
        open: true,
        location,
      });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.location) {
      deleteLocationMutation(deleteDialog.location.id);
      // Add query invalidation to refresh the list after delete
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDeleteDialog({ open: false, location: null });
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
      <div className="text-center text-red-500 p-4">Error loading locations: {errorMessage}</div>
    );
  }

  const activeLocations = locations.filter((location) => location.isActive).length;
  const inactiveLocations = locations.length - activeLocations;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Location Management</h1>
          <p className="text-muted-foreground">Manage warehouse locations and sublocations</p>
        </div>
        <Button onClick={() => navigate('/locations/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">{activeLocations} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations}</div>
            <p className="text-xs text-muted-foreground">{inactiveLocations} inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.from(new Set(locations.map((l) => l.warehousename))).length}
            </div>
            <p className="text-xs text-muted-foreground">Unique warehouses</p>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
          <span className="text-sm font-normal text-muted-foreground">
            ({locations.length} locations)
          </span>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={locations}
            searchKey="locationcode"
            searchPlaceholder="Search by Any Field..."
          />
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, location: null })}
        itemName={deleteDialog.location ? deleteDialog.location.locationcode : ''}
        itemType="Location"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default LocationManagement;
