import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Checkbox } from '@/components/ui/checkbox';

import { useUser, useRoles, useCreateUser, useUpdateUser } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, User, Mail, Phone, Shield, AlertTriangle } from 'lucide-react';
import type { CreateUserDto, UpdateUserDto, UserDto, RoleDto } from '@/types/auth';

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
  roleIds: z.array(z.number()).min(1, 'At least one role must be selected'),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  isActive: z.boolean(),
  roleIds: z.array(z.number()).min(1, 'At least one role must be selected'),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();

  // React Query hooks
  const { data: roles = [] } = useRoles();
  const { data: user } = useUser(id ? parseInt(id) : 0, !!id);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const isEditMode = !!id;
  const schema = isEditMode ? updateUserSchema : createUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      roleIds: [],
      isActive: true,
    },
  });

  // Load user data when editing
  useEffect(() => {
    if (user && isEditMode) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
      setValue('phoneNumber', user.phoneNumber || '');
      setValue('isActive', !user.isLocked);

      // Set selected roles
      const userRoleIds = roles
        .filter((role) => user.roles.includes(role.name))
        .map((role) => role.id);
      setSelectedRoles(userRoleIds);
      setValue('roleIds', userRoleIds);
    }
  }, [user, roles, isEditMode, setValue]);

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    if (isEditMode && id) {
      // Update user
      const updateData: UpdateUserDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        isActive: (data as UpdateFormData).isActive,
        roleIds: selectedRoles,
      };

      updateUserMutation.mutate(
        { id: parseInt(id), userData: updateData },
        {
          onSuccess: () => {
            navigate('/users');
          },
        }
      );
    } else {
      // Create user
      const createData: CreateUserDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: (data as CreateFormData).username,
        email: data.email,
        password: (data as CreateFormData).password,
        phoneNumber: data.phoneNumber,
        roleIds: selectedRoles,
      };

      createUserMutation.mutate(createData, {
        onSuccess: () => {
          navigate('/users');
        },
      });
    }
  };

  const handleRoleChange = (roleId: number, checked: boolean) => {
    const newSelectedRoles = checked
      ? [...selectedRoles, roleId]
      : selectedRoles.filter((id) => id !== roleId);

    setSelectedRoles(newSelectedRoles);
    setValue('roleIds', newSelectedRoles);
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
                  You need administrator privileges to manage users.
                </p>
                <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
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

        <h1 className="text-3xl font-bold">{isEditMode ? 'Edit User' : 'Create New User'}</h1>
        <p className="text-muted-foreground">
          {isEditMode ? 'Update user information and permissions' : 'Add a new user to the system'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            User Information
          </CardTitle>
          <CardDescription>
            {isEditMode ? 'Modify the user details below' : 'Enter the details for the new user'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} placeholder="Enter first name" />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} placeholder="Enter last name" />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register('username')} placeholder="Enter username" />
                {(errors as any).username && (
                  <p className="text-sm text-destructive">{(errors as any).username.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter email address"
                  className="pl-10"
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Enter password"
                />
                {(errors as any).password && (
                  <p className="text-sm text-destructive">{(errors as any).password.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  placeholder="Enter phone number"
                  className="pl-10"
                />
              </div>
            </div>

            {isEditMode && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', !!checked)}
                />
                <Label htmlFor="isActive">User is active</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Roles
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => handleRoleChange(role.id, !!checked)}
                    />
                    <Label htmlFor={`role-${role.id}`} className="text-sm">
                      {role.name}
                      {role.description && (
                        <span className="text-muted-foreground ml-1">- {role.description}</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.roleIds && (
                <p className="text-sm text-destructive">{errors.roleIds.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {createUserMutation.isPending || updateUserMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update User' : 'Create User'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserForm;
