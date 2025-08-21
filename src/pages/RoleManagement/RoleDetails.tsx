import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  Users,
  Settings,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useRole, useRoleUsers, useDeleteRole } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { groupPermissionsByCategory } from '@/types/role';

const RoleDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();

  // React Query hooks
  const { data: role, isLoading } = useRole(id ? parseInt(id) : 0, !!id);
  const { data: roleUsers = [] } = useRoleUsers(id ? parseInt(id) : 0, !!id);
  const deleteRoleMutation = useDeleteRole();

  // Confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState(false);

  const handleDeleteRole = () => {
    if (!role) return;
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!role) return;
    deleteRoleMutation.mutate(role.id, {
      onSuccess: () => {
        navigate('/roles');
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
                <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You need administrator privileges to view role details.
                </p>
                <Button onClick={() => navigate('/roles')}>Back to Roles</Button>
              </div>
            </CardContent>
          </Card>
        </div>
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

  if (!role) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Role Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested role could not be found.</p>
          <Button onClick={() => navigate('/roles')}>Back to Roles</Button>
        </div>
      </div>
    );
  }

  const permissionGroups = groupPermissionsByCategory(role.permissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/roles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">{role.name}</h1>
            <p className="text-muted-foreground">Role Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/roles/${role.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteRole}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role Name</Label>
                  <p className="text-lg font-semibold">{role.name}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    {role.isActive ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge variant="default">Active</Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-600" />
                        <Badge variant="secondary">Inactive</Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {role.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-muted-foreground">{role.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created</span>
                  </Label>
                  <p className="text-sm">{formatDate(role.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(role.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Last Updated</span>
                  </Label>
                  <p className="text-sm">{formatDate(role.updatedAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(role.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Permissions ({role.permissions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {permissionGroups.length > 0 ? (
                permissionGroups.map((group) => (
                  <div key={group.category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">{group.category}</h4>
                      <Badge variant="outline">
                        {group.permissions.length} permissions
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{permission.name}</p>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {group !== permissionGroups[permissionGroups.length - 1] && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No permissions assigned to this role</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Usage Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{roleUsers.length}</div>
                <p className="text-sm text-muted-foreground">Users assigned</p>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <div className="text-2xl font-bold">{role.permissions.length}</div>
                <p className="text-sm text-muted-foreground">Total permissions</p>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Users */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Users</CardTitle>
            </CardHeader>
            <CardContent>
              {roleUsers.length > 0 ? (
                <div className="space-y-3">
                  {roleUsers.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                  {roleUsers.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{roleUsers.length - 5} more users
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No users assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        itemName={role ? role.name : ''}
        itemType="Role"
        onConfirm={confirmDelete}
        isLoading={deleteRoleMutation.isPending}
        additionalInfo="All users assigned to this role will lose their permissions. This action cannot be undone."
      />
    </div>
  );
};

// Helper Label component
const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm font-medium ${className}`}>{children}</div>
);

export default RoleDetails;
