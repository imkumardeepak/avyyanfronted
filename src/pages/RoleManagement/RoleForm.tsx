import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Role, PageAccess } from '@/types/role';

const roleFormSchema = z.object({
  roleName: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

const fetchRole = async (id: number): Promise<Role> => {
  const response = await apiClient.get(`/Role/${id}`);
  return response.data;
};

const fetchAllPageAccesses = async (): Promise<PageAccess[]> => {
  const response = await apiClient.get('/Role/page-accesses');
  return response.data;
};

const fetchRolePageAccesses = async (roleId: number): Promise<PageAccess[]> => {
  const response = await apiClient.get(`/Role/${roleId}/page-accesses`);
  return response.data;
};

const createRole = async (data: { role: RoleFormValues; pageAccesses: PageAccess[] }) => {
  const roleResponse = await apiClient.post('/Role', data.role);
  const newRole: Role = roleResponse.data;

  const permissionPromises = data.pageAccesses.map((permission) =>
    apiClient.post('/Role/page-accesses', { ...permission, roleId: newRole.id })
  );
  await Promise.all(permissionPromises);

  return newRole;
};

const updateRole = async (data: {
  id: number;
  role: RoleFormValues;
  pageAccesses: PageAccess[];
}) => {
  await apiClient.put(`/Role/${data.id}`, data.role);

  const permissionPromises = data.pageAccesses.map((permission) =>
    apiClient.put(`/Role/page-accesses/${permission.id}`, permission)
  );
  await Promise.all(permissionPromises);
};

const RoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: role, isLoading: roleLoading } = useQuery<Role>({
    queryKey: ['role', id],
    queryFn: () => fetchRole(parseInt(id!)),
    enabled: isEditing,
  });

  const { data: allPageAccesses, isLoading: allPageAccessesLoading } = useQuery<PageAccess[]>({
    queryKey: ['allPageAccesses'],
    queryFn: fetchAllPageAccesses,
  });

  const { data: rolePageAccesses, isLoading: rolePageAccessesLoading } = useQuery<PageAccess[]>({
    queryKey: ['rolePageAccesses', id],
    queryFn: () => fetchRolePageAccesses(parseInt(id!)),
    enabled: isEditing,
  });

  const [permissions, setPermissions] = useState<
    Record<number, Omit<PageAccess, 'id' | 'pageName' | 'path'>>
  >({});

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      roleName: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isEditing && role) {
      form.reset({
        roleName: role.roleName,
        description: role.description,
      });
    }
  }, [role, isEditing, form]);

  useEffect(() => {
    if (allPageAccesses) {
      const initialPermissions: Record<number, Omit<PageAccess, 'id' | 'pageName' | 'path'>> = {};
      allPageAccesses.forEach((p) => {
        const existingPermission =
          isEditing && rolePageAccesses
            ? rolePageAccesses.find((rp) => rp.pageName === p.pageName)
            : null;
        initialPermissions[p.id] = {
          isRead: existingPermission?.isRead || false,
          isWrite: existingPermission?.isWrite || false,
          isDelete: existingPermission?.isDelete || false,
        };
      });
      setPermissions(initialPermissions);
    }
  }, [allPageAccesses, rolePageAccesses, isEditing]);

  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigate('/roles');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', id] });
      navigate('/roles');
    },
  });

  const handlePermissionChange = (
    pageId: number,
    permission: keyof Omit<PageAccess, 'id' | 'pageName' | 'path'>,
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [permission]: value,
      },
    }));
  };

  const onSubmit = (values: RoleFormValues) => {
    const pageAccesses =
      allPageAccesses?.map((p) => ({
        ...p,
        ...permissions[p.id],
      })) || [];

    if (isEditing) {
      updateRoleMutation.mutate({ id: parseInt(id!), role: values, pageAccesses });
    } else {
      createRoleMutation.mutate({ role: values, pageAccesses });
    }
  };

  const isLoading = roleLoading || allPageAccessesLoading || rolePageAccessesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <h1 className="text-3xl font-bold font-display">
              {isEditing ? 'Edit Role' : 'Create Role'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? 'Modify role details and permissions'
                : 'Create a new role with specific permissions'}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="roleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role name" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique name for this role (e.g., "Machine Operator", "Administrator")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter role description"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description explaining the purpose of this role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  {allPageAccesses?.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.pageName}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={permissions[page.id]?.isRead}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(page.id, 'isRead', !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={permissions[page.id]?.isWrite}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(page.id, 'isWrite', !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={permissions[page.id]?.isDelete}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(page.id, 'isDelete', !!checked)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/roles')}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RoleForm;
