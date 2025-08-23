import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Trash2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Role, PageAccess } from '@/types/role';

const fetchRole = async (id: number): Promise<Role> => {
  const response = await apiClient.get(`/Role/${id}`);
  return response.data;
};

const fetchRolePageAccesses = async (roleId: number): Promise<PageAccess[]> => {
  const response = await apiClient.get(`/Role/${roleId}/page-accesses`);
  return response.data;
};

const deleteRole = async (id: number): Promise<void> => {
  await apiClient.delete(`/Role/${id}`);
};

const RoleDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: role, isLoading: roleLoading } = useQuery<Role>({
    queryKey: ['role', id],
    queryFn: () => fetchRole(parseInt(id!)),
    enabled: !!id,
  });

  const { data: pageAccesses, isLoading: pageAccessesLoading } = useQuery<PageAccess[]>({
    queryKey: ['rolePageAccesses', id],
    queryFn: () => fetchRolePageAccesses(parseInt(id!)),
    enabled: !!id,
  });

  const { mutate: deleteRoleMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigate('/roles');
    },
  });

  const [deleteDialog, setDeleteDialog] = useState(false);

  const handleDeleteRole = () => {
    if (!role) return;
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!role) return;
    deleteRoleMutation(role.id);
    setDeleteDialog(false);
  };

  const isLoading = roleLoading || pageAccessesLoading;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/roles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">{role.roleName}</h1>
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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Role Name</Label>
                <p className="text-lg font-semibold">{role.roleName}</p>
              </div>

              {role.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-muted-foreground">{role.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Page Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-center">Read</TableHead>
                    <TableHead className="text-center">Write</TableHead>
                    <TableHead className="text-center">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageAccesses?.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.pageName}</TableCell>
                      <TableCell className="text-center">
                        {page.isRead ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {page.isWrite ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {page.isDelete ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        itemName={role.roleName}
        itemType="Role"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm font-medium ${className}`}>{children}</div>
);

export default RoleDetails;
