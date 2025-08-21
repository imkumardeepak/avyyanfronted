import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Search, Filter, Shield, Users, Settings } from 'lucide-react';
import { useRoles, useDeleteRole } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import type { Row } from '@tanstack/react-table';
import type { RoleDto } from '@/types/role';

type CellProps = { row: Row<RoleDto> };

const RoleManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // React Query hooks
  const { data: roles = [], isLoading, error } = useRoles();
  const deleteRoleMutation = useDeleteRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRoles, setFilteredRoles] = useState<RoleDto[]>([]);
  
  // Confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    role: RoleDto | null;
  }>({
    open: false,
    role: null,
  });

  useEffect(() => {
    if (searchTerm) {
      const filtered = roles.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRoles(filtered);
    } else {
      setFilteredRoles(roles);
    }
  }, [roles, searchTerm]);

  // Check admin authorization
  if (!isAdmin()) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You need administrator privileges to manage roles.
                </p>
                <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const columns = [
    {
      id: 'name',
      header: 'Role Name',
      cell: ({ row }: CellProps) => {
        const role = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">{role.name}</div>
              {role.description && (
                <div className="text-sm text-muted-foreground">{role.description}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: CellProps) => {
        const role = row.original;
        return (
          <Badge variant={role.isActive ? 'default' : 'secondary'}>
            {role.isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: ({ row }: CellProps) => {
        const role = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{role.permissions?.length || 0} permissions</span>
          </div>
        );
      },
    },
    {
      id: 'userCount',
      header: 'Users',
      cell: ({ row }: CellProps) => {
        const role = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{role.userCount || 0} users</span>
          </div>
        );
      },
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: ({ row }: CellProps) => {
        const role = row.original;
        return (
          <div className="text-sm text-muted-foreground">
            {formatDate(role.createdAt)}
          </div>
        );
      },
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/roles/${role.id}/edit`)}
            >
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
    const role = roles.find(r => r.id === id);
    if (role) {
      setDeleteDialog({
        open: true,
        role,
      });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.role) {
      deleteRoleMutation.mutate(deleteDialog.role.id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => navigate('/roles/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => r.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Roles</CardTitle>
            <Shield className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => !r.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.reduce((sum, role) => sum + (role.userCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles ({filteredRoles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredRoles} searchKey="name" />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, role: null })}
        itemName={deleteDialog.role ? deleteDialog.role.name : ''}
        itemType="Role"
        onConfirm={confirmDelete}
        isLoading={deleteRoleMutation.isPending}
        additionalInfo="All users assigned to this role will lose their permissions. This action cannot be undone."
      />
    </div>
  );
};

export default RoleManagement;
