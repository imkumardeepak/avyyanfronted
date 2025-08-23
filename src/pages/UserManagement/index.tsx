import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Row } from '@tanstack/react-table';
import type { User } from '@/types/user';

type UserCellProps = { row: Row<User> };

const fetchUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/User');
  return response.data;
};

const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/User/${id}`);
};

const UserManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<User[]>({ queryKey: ['users'], queryFn: fetchUsers });

  const { mutate: deleteUserMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null,
  });

  const columns = [
    {
      accessorKey: 'firstName',
      header: 'User',
      cell: ({ row }: UserCellProps) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.firstName?.[0] || 'U'}
                {user.lastName?.[0] || 'N'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{`${user.firstName} ${user.lastName}`}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'roleName',
      header: 'Role',
      cell: ({ row }: UserCellProps) => <Badge variant="outline">{row.getValue('roleName')}</Badge>,
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }: UserCellProps) => {
        const lastLogin = row.getValue('lastLoginAt') as string;
        return (
          <div className="text-sm">{lastLogin ? formatDate(new Date(lastLogin)) : 'Never'}</div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: UserCellProps) => (
        <div className="text-sm">{formatDate(row.getValue('createdAt'))}</div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: UserCellProps) => {
        const user = row.original;
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/users/${user.id}`)}>
              View
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/users/${user.id}/edit`)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDelete = (id: number) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setDeleteDialog({
        open: true,
        user,
      });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.user) {
      deleteUserMutation(deleteDialog.user.id);
      setDeleteDialog({ open: false, user: null });
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
    return <div className="text-center text-red-500 p-4">Error loading users: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">User Management</h1>
          <p className="text-muted-foreground">Manage system users, roles, and permissions</p>
        </div>
        <Button onClick={() => navigate('/users/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={users} />
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
        itemName={
          deleteDialog.user ? `${deleteDialog.user.firstName} ${deleteDialog.user.lastName}` : ''
        }
        itemType="User"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default UserManagement;
