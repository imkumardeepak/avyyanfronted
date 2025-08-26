import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import {
  useFabricStructures,
  useDeleteFabricStructure,
  useSearchFabricStructures,
} from '@/hooks/queries';
import { apiUtils } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { Row } from '@tanstack/react-table';
import type {
  FabricStructureResponseDto,
  FabricStructureSearchRequestDto,
} from '@/types/api-types';

type FabricStructureCellProps = { row: Row<FabricStructureResponseDto> };

const FabricStructureManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: fabricStructures = [], isLoading, error } = useFabricStructures();
  const { mutate: deleteFabricStructureMutation, isPending: isDeleting } =
    useDeleteFabricStructure();

  const [searchParams, setSearchParams] = useState<FabricStructureSearchRequestDto>({});
  const [isSearching, setIsSearching] = useState(false);

  // Use useSearchFabricStructures correctly as a query hook
  const { data: searchResults = [], isLoading: isSearchLoading } = useSearchFabricStructures(
    searchParams,
    isSearching
  );

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    fabricStructure: FabricStructureResponseDto | null;
  }>({
    open: false,
    fabricStructure: null,
  });

  // Use search results when searching, otherwise use all fabric structures
  const displayedFabricStructures = useMemo(() => {
    return isSearching ? searchResults : fabricStructures;
  }, [isSearching, searchResults, fabricStructures]);

  const columns = [
    {
      accessorKey: 'fabricstr',
      header: 'Fabric Structure',
      cell: ({ row }: FabricStructureCellProps) => {
        const fabricStructure = row.original;
        return <div className="font-medium">{fabricStructure.fabricstr}</div>;
      },
    },
    {
      accessorKey: 'standardeffencny',
      header: 'Standard Efficiency',
      cell: ({ row }: FabricStructureCellProps) => {
        const fabricStructure = row.original;
        return <div className="font-medium">{fabricStructure.standardeffencny}%</div>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: FabricStructureCellProps) => (
        <div className="text-sm">{formatDate(row.getValue('createdAt'))}</div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: FabricStructureCellProps) => {
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
      cell: ({ row }: FabricStructureCellProps) => {
        const fabricStructure = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/fabric-structures/${fabricStructure.id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(fabricStructure.id)}
            >
              <Trash2 className="h-4 w-4" />
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
    queryClient.invalidateQueries({ queryKey: ['fabricStructures'] });
  };

  const handleDelete = (id: number) => {
    const fabricStructure = displayedFabricStructures.find((m) => m.id === id);
    if (fabricStructure) {
      setDeleteDialog({
        open: true,
        fabricStructure,
      });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.fabricStructure) {
      deleteFabricStructureMutation(deleteDialog.fabricStructure.id);
      setDeleteDialog({ open: false, fabricStructure: null });
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
      <div className="text-center text-red-500 p-4">
        Error loading fabric structures: {errorMessage}
      </div>
    );
  }

  const activeFabricStructures = displayedFabricStructures.filter(
    (fabricStructure) => fabricStructure.isActive
  ).length;
  const inactiveFabricStructures = displayedFabricStructures.length - activeFabricStructures;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Fabric Structure Management</h1>
          <p className="text-muted-foreground">
            Manage fabric structures and their standard efficiencies
          </p>
        </div>
        <Button onClick={() => navigate('/fabric-structures/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Fabric Structure
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fabric Structures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayedFabricStructures.length}</div>
            <p className="text-xs text-muted-foreground">{activeFabricStructures} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fabric Structures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFabricStructures}</div>
            <p className="text-xs text-muted-foreground">{inactiveFabricStructures} inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayedFabricStructures.length > 0
                ? (
                    displayedFabricStructures.reduce((sum, fs) => sum + fs.standardeffencny, 0) /
                    displayedFabricStructures.length
                  ).toFixed(1)
                : '0'}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across all fabric structures</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Fabric Structures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fabric Structure Name</label>
              <Input
                placeholder="Enter fabric structure name"
                value={searchParams.fabricstr || ''}
                onChange={(e) =>
                  setSearchParams((prev) => ({ ...prev, fabricstr: e.target.value }))
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

      {/* Fabric Structures Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isSearching ? 'Search Results' : 'All Fabric Structures'}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({displayedFabricStructures.length} fabric structures)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={displayedFabricStructures} />
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, fabricStructure: null })}
        itemName={deleteDialog.fabricStructure ? deleteDialog.fabricStructure.fabricstr : ''}
        itemType="Fabric Structure"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FabricStructureManagement;
