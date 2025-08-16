import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, Filter, UserCheck, UserX, Shield } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { formatDate } from '@/lib/utils';
import type { Row } from '@tanstack/react-table';

// UserDto type from useUsers hook
interface UserDto {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePicture?: string;
  isActive: boolean;
  isLocked: boolean;
  lockedUntil?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  roles: string[];
  isOnline: boolean;
}

type UserCellProps = { row: Row<UserDto> };

const UserManagement = () => {
  const navigate = useNavigate();
  const { users, loading, error, deleteUser, lockUser, unlockUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([]);

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
        const lastLogin = row.getValue('lastLoginAt');
        return <div className="text-sm">{lastLogin ? formatDate(lastLogin) : 'Never'}</div>;
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
    }
  };

  const handleLock = async (id: number) => {
    if (window.confirm('Are you sure you want to lock this user?')) {
      await lockUser(id);
    }
  };

  const handleUnlock = async (id: number) => {
    await unlockUser(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">Error loading users: {error}</div>;
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};

export default UserManagement;
