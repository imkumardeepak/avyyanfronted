import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';

import { useUser, useDeleteUser, useLockUser, useUnlockUser } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  User,
  Lock,
  Unlock,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';

const UserDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();

  // React Query hooks
  const { data: user, isLoading } = useUser(id ? parseInt(id) : 0, !!id);
  const deleteUserMutation = useDeleteUser();
  const lockUserMutation = useLockUser();
  const unlockUserMutation = useUnlockUser();

  // Confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState(false);

  const handleLockUser = async () => {
    if (!user) return;
    lockUserMutation.mutate(user.id);
  };

  const handleUnlockUser = async () => {
    if (!user) return;
    unlockUserMutation.mutate(user.id);
  };

  const handleDeleteUser = () => {
    if (!user) return;
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!user) return;
    deleteUserMutation.mutate(user.id, {
      onSuccess: () => {
        navigate('/users');
      },
    });
    setDeleteDialog(false);
  };

  // Check admin authorization
  if (!isAdmin()) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You need administrator privileges to view user details.
                </p>
                <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested user could not be found.</p>
          <Button onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/users')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{user.fullName}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate(`/users/${user.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            {user.isLocked ? (
              <Button
                variant="outline"
                onClick={handleUnlockUser}
                disabled={unlockUserMutation.isPending}
              >
                {unlockUserMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Unlock
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleLockUser}
                disabled={lockUserMutation.isPending}
              >
                {lockUserMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Lock
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="text-lg">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{user.fullName}</h3>
                <p className="text-muted-foreground">@{user.username}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {user.isOnline ? (
                    <Badge variant="default" className="text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <UserX className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                  {user.isLocked && (
                    <Badge variant="destructive" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Label>
                <p className="text-sm">{user.email}</p>
                {user.isEmailVerified && (
                  <Badge variant="outline" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>

              {user.phoneNumber && (
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </Label>
                  <p className="text-sm">{user.phoneNumber}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created
                </Label>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>

              {user.lastLoginAt && (
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">
                    <Clock className="h-4 w-4 mr-2" />
                    Last Login
                  </Label>
                  <p className="text-sm">{formatRelativeTime(user.lastLoginAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Roles Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>User roles and access levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.roles.map((role) => (
                <Badge key={role} variant="outline" className="mr-2">
                  {role}
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        itemName={user ? `${user.firstName} ${user.lastName}` : ''}
        itemType="User"
        onConfirm={confirmDelete}
        isLoading={deleteUserMutation.isPending}
        additionalInfo="All associated data, permissions, and chat history will be permanently removed."
      />
    </div>
  );
};

// Helper Label component
const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm font-medium ${className}`}>{children}</div>
);

export default UserDetails;
