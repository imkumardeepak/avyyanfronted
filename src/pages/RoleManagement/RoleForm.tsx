import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { useRole, useCreateRole, useUpdateRole } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';

const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

const RoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const isEditing = !!id && id !== 'new';

  // React Query hooks
  const { data: role, isLoading: roleLoading } = useRole(isEditing ? parseInt(id!) : 0, isEditing);
  // Temporarily disable page permission queries
  const rolePagePermissions: any[] = [];
  const pagePermissionsLoading = false;
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const updatePagePermissionsMutation = useUpdateRolePagePermissions();

  // State for page permissions
  const [permissionMatrix, setPermissionMatrix] = useState<NavigationPermissionMatrix>({});
  const [isActiveState, setIsActiveState] = useState(true);
  const formInitialized = useRef(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  // Initialize form with role data when editing
  useEffect(() => {
    if (isEditing && role && !formInitialized.current) {
      form.reset({
        name: role.name,
        description: role.description || '',
        isActive: role.isActive,
      });
      setIsActiveState(role.isActive);
      formInitialized.current = true;
    } else if (!isEditing) {
      formInitialized.current = false;
      setIsActiveState(true);
    }
  }, [role, isEditing]);

  // Memoize permission matrix creation
  const initialPermissionMatrix = useMemo(() => {
    if (rolePagePermissions && Array.isArray(rolePagePermissions)) {
      return createNavigationPermissionMatrix(rolePagePermissions);
    }
    return {};
  }, [rolePagePermissions]);

  // Initialize permission matrix
  useEffect(() => {
    setPermissionMatrix(initialPermissionMatrix);
  }, [initialPermissionMatrix]);

  // Permission change handlers
  const handlePermissionChange = useCallback(
    (pageName: string, permission: keyof PagePermissions, value: boolean) => {
      setPermissionMatrix((prev) => ({
        ...prev,
        [pageName]: {
          ...prev[pageName],
          permissions: {
            ...prev[pageName]?.permissions,
            [permission]: value,
          },
        },
      }));
    },
    []
  );

  const handleBulkPermissionChange = useCallback(
    (pageNames: string[], permission: keyof PagePermissions, value: boolean) => {
      setPermissionMatrix((prev) => {
        const updated = { ...prev };
        pageNames.forEach((pageName) => {
          if (updated[pageName]) {
            updated[pageName] = {
              ...updated[pageName],
              permissions: {
                ...updated[pageName].permissions,
                [permission]: value,
              },
            };
          }
        });
        return updated;
      });
    },
    []
  );

  // Loading state
  const isLoading = roleLoading || pagePermissionsLoading;

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
                <Button onClick={() => navigate('/roles')}>Back to Roles</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: RoleFormValues) => {
    try {
      const roleData = {
        name: values.name,
        description: values.description || undefined,
        isActive: isActiveState,
      };

      if (isEditing && role) {
        // Update role basic info
        await updateRoleMutation.mutateAsync({
          id: role.id,
          ...roleData,
        });
      } else {
        // Create new role
        await createRoleMutation.mutateAsync(roleData);
      }

      navigate('/roles');
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
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

              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label className="text-base font-medium">Active Status</label>
                  <p className="text-sm text-muted-foreground">
                    Enable this role for assignment to users
                  </p>
                </div>
                <Checkbox
                  checked={isActiveState}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setIsActiveState(isChecked);
                    form.setValue('isActive', isChecked);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Page Permissions - Temporarily Disabled */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Page Permissions</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Page-level permission management will be available once the backend API is
                implemented.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Permission matrix coming soon...
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
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
