import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Row } from '@tanstack/react-table';
import type { Role } from '@/types/role';

type CellProps = { row: Row<Role> };

const fetchRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get('/Role');
  return response.data;
};

const deleteRole = async (id: number): Promise<void> => {
  await apiClient.delete(`/Role/${id}`);
};

const RoleManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: roles = [],
    isLoading,
    error,
  } = useQuery<Role[]>({ queryKey: ['roles'], queryFn: fetchRoles });

  const { mutate: deleteRoleMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    role: Role | null;
  }>({
    open: false,
    role: null,
  });

  const columns = [
    {
      accessorKey: 'roleName',
      header: 'Role Name',
      cell: ({ row }: CellProps) => <div className="font-medium">{row.getValue('roleName')}</div>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: CellProps) => (
        <div className="text-muted-foreground">{row.getValue('description')}</div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: CellProps) => {
        const role = row.original;
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/roles/${role.id}`)}>
              View
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/roles/${role.id}/edit`)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(role.id)}>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDelete = (id: number) => {
    const role = roles.find((r) => r.id === id);
    if (role) {
      setDeleteDialog({
        open: true,
        role,
      });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.role) {
      deleteRoleMutation(deleteDialog.role.id);
      setDeleteDialog({ open: false, role: null });
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
    return <div className="text-center text-red-500 p-4">Error loading roles: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => navigate('/roles/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={roles} />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, role: null })}
        itemName={deleteDialog.role?.roleName || ''}
        itemType="Role"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RoleManagement;
