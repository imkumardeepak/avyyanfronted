import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Save, User, Mail, Phone, Shield } from 'lucide-react';
import type { CreateUserDto, UpdateUserDto, User } from '@/types/user';
import type { Role } from '@/types/role';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  phoneNumber: z.string().optional(),
  roleName: z.string().min(1, 'Role is required'),
});

type FormData = z.infer<typeof formSchema>;

const fetchUser = async (id: number): Promise<User> => {
  const response = await apiClient.get(`/User/${id}`);
  return response.data;
};

const fetchRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get('/Role');
  return response.data;
};

const createUser = async (data: CreateUserDto): Promise<User> => {
  const response = await apiClient.post('/User', data);
  return response.data;
};

const updateUser = async ({ id, data }: { id: number; data: UpdateUserDto }): Promise<User> => {
  const response = await apiClient.put(`/User/${id}`, data);
  return response.data;
};

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => fetchUser(parseInt(id!)),
    enabled: isEditMode,
  });

  const { data: roles = [], isLoading: areRolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const { mutate: createUserMutation, isPending: isCreating } = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const { mutate: updateUserMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      navigate('/users');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phoneNumber: '',
      roleName: '',
    },
  });

  useEffect(() => {
    if (user && isEditMode) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
      setValue('phoneNumber', user.phoneNumber || '');
      setValue('roleName', user.roleName);
    }
  }, [user, isEditMode, setValue]);

  const onSubmit = (data: FormData) => {
    if (isEditMode) {
      const updateData: UpdateUserDto = data;
      updateUserMutation({ id: parseInt(id!), data: updateData });
    } else {
      const createData: CreateUserDto = data as CreateUserDto;
      createUserMutation(createData);
    }
  };

  if (isUserLoading || areRolesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          {isEditMode ? 'Update user information and role' : 'Add a new user to the system'}
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
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
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

            <div className="space-y-2">
              <Label className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Role
              </Label>
              <Controller
                name="roleName"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.roleName}>
                          {role.roleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.roleName && (
                <p className="text-sm text-destructive">{errors.roleName.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? (
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
