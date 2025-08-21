import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DeleteConfirmationDialog, ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, UserCheck, UserX, Shield, AlertTriangle } from 'lucide-react';
import { useUsers, useDeleteUser, useLockUser, useUnlockUser } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import type { Row } from '@tanstack/react-table';
import type { UserDto } from '@/types/auth';

type UserCellProps = { row: Row<UserDto> };

const UserManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // React Query hooks
  const { data: users = [], isLoading, error, refetch } = useUsers();
  const deleteUserMutation = useDeleteUser();
  const lockUserMutation = useLockUser();
  const unlockUserMutation = useUnlockUser();

  const [searchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([]);

  // Confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: UserDto | null;
  }>({
    open: false,
    user: null,
  });

  const [lockDialog, setLockDialog] = useState<{
    open: boolean;
    user: UserDto | null;
  }>({
    open: false,
    user: null,
  });

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchTerm]);

  const columns = [
    {
      accessorKey: 'username',
      header: 'User',
      cell: ({ row }: UserCellProps) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profilePicture} />
              <AvatarFallback>
                {user.firstName?.[0] || 'U'}
                {user.lastName?.[0] || 'N'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {user.fullName || `${user.firstName} ${user.lastName}`}
              </div>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: UserCellProps) => <div className="text-sm">{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }: UserCellProps) => {
        const roles = row.getValue('roles') as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'isOnline',
      header: 'Status',
      cell: ({ row }: UserCellProps) => {
        const isOnline = row.getValue('isOnline');
        const isLocked = row.original.isLocked;

        if (isLocked) {
          return <Badge variant="destructive">Locked</Badge>;
        }

        return (
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        );
      },
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
            {user.isLocked ? (
              <Button variant="outline" size="sm" onClick={() => handleUnlock(user.id)}>
                <UserCheck className="h-3 w-3 mr-1" />
                Unlock
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleLock(user.id)}>
                <UserX className="h-3 w-3 mr-1" />
                Lock
              </Button>
            )}
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
      deleteUserMutation.mutate(deleteDialog.user.id);
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleLock = (id: number) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setLockDialog({
        open: true,
        user,
      });
    }
  };

  const confirmLock = () => {
    if (lockDialog.user) {
      lockUserMutation.mutate(lockDialog.user.id);
      setLockDialog({ open: false, user: null });
    }
  };

  const handleUnlock = (id: number) => {
    unlockUserMutation.mutate(id);
  };

  // Check admin authorization
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You need administrator privileges to access User Management.
              </p>
              <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <Card className="w-96 mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Users</h2>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">User Management</h1>
          <p className="text-muted-foreground">Manage system users, roles, and permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/users/roles')}>
            <Shield className="h-4 w-4 mr-2" />
            Manage Roles
          </Button>
          <Button onClick={() => navigate('/users/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.isOnline).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.isLocked).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.roles.includes('Admin')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredUsers} searchKey="username" />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
        itemName={
          deleteDialog.user ? `${deleteDialog.user.firstName} ${deleteDialog.user.lastName}` : ''
        }
        itemType="User"
        onConfirm={confirmDelete}
        isLoading={deleteUserMutation.isPending}
        additionalInfo="All associated data and permissions will be permanently removed."
      />

      {/* Lock Confirmation Dialog */}
      <ConfirmationDialog
        open={lockDialog.open}
        onOpenChange={(open) => setLockDialog({ open, user: null })}
        title="Lock User Account"
        description={`Are you sure you want to lock ${lockDialog.user ? `${lockDialog.user.firstName} ${lockDialog.user.lastName}'s` : "this user's"} account? They will not be able to log in until the account is unlocked.`}
        confirmText="Lock Account"
        cancelText="Cancel"
        onConfirm={confirmLock}
        variant="warning"
        isLoading={lockUserMutation.isPending}
      />
    </div>
  );
};

export default UserManagement;
