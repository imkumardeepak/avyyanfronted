import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineApi, apiUtils } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import type {
  CreateMachineRequestDto,
  UpdateMachineRequestDto,
  MachineResponseDto,
} from '@/types/api-types';

const formSchema = z.object({
  machineName: z
    .string()
    .min(1, 'Machine name is required')
    .max(200, 'Machine name must be less than 200 characters'),
  dia: z.number().positive('Diameter must be greater than 0'),
  gg: z.number().positive('GG must be greater than 0'),
  needle: z.number().positive('Needle count must be greater than 0'),
  feeder: z.number().positive('Feeder count must be greater than 0'),
  rpm: z.number().positive('RPM must be greater than 0'),
  constat: z.number().min(0, 'Constant must be 0 or greater').optional(),
  // Removed efficiency field as requested
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

const fetchMachine = async (id: number): Promise<MachineResponseDto> => {
  const response = await machineApi.getMachine(id);
  return apiUtils.extractData(response);
};

const createMachine = async (data: CreateMachineRequestDto): Promise<MachineResponseDto> => {
  const response = await machineApi.createMachine(data);
  return apiUtils.extractData(response);
};

const updateMachine = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateMachineRequestDto;
}): Promise<MachineResponseDto> => {
  const response = await machineApi.updateMachine(id, data);
  return apiUtils.extractData(response);
};

const MachineForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditMode = !!id && !isNaN(Number(id));

  // Validate ID parameter
  if (id && isNaN(Number(id))) {
    console.error('Invalid machine ID:', id);
    navigate('/machines');
    return null;
  }

  const { data: machine, isLoading: isMachineLoading } = useQuery<MachineResponseDto>({
    queryKey: ['machine', id],
    queryFn: () => fetchMachine(parseInt(id!)),
    enabled: isEditMode,
  });

  const { mutate: createMachineMutation, isPending: isCreating } = useMutation({
    mutationFn: createMachine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Success', 'Machine created successfully');
      navigate('/machines');
    },
    onError: (error) => {
      const errorMessage = apiUtils.handleError(error);
      toast.error('Error', errorMessage);
    },
  });

  const { mutate: updateMachineMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateMachine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machine', id] });
      toast.success('Success', 'Machine updated successfully');
      navigate('/machines');
    },
    onError: (error) => {
      const errorMessage = apiUtils.handleError(error);
      toast.error('Error', errorMessage);
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineName: '',
      dia: 0,
      gg: 0,
      needle: 0,
      feeder: 0,
      rpm: 0,
      constat: undefined,
      // Removed efficiency field as requested
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (machine && isEditMode) {
      form.setValue('machineName', machine.machineName);
      form.setValue('dia', machine.dia);
      form.setValue('gg', machine.gg);
      form.setValue('needle', machine.needle);
      form.setValue('feeder', machine.feeder);
      form.setValue('rpm', machine.rpm);
      form.setValue('constat', machine.constat);
      // Removed efficiency field as requested
      form.setValue('description', machine.description || '');
      form.setValue('isActive', machine.isActive);
    }
  }, [machine, isEditMode, form]);

  const onSubmit = (data: FormData) => {
    if (isEditMode) {
      updateMachineMutation({ id: parseInt(id!), data: data as UpdateMachineRequestDto });
    } else {
      createMachineMutation(data as CreateMachineRequestDto);
    }
  };

  if (isMachineLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/machines')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Machines
        </Button>
        <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Machine' : 'Create New Machine'}</h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? 'Update machine information and specifications'
            : 'Add a new machine to the system'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Machine Information
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Modify the machine details below'
              : 'Enter the details for the new machine'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="machineName">Machine Name</Label>
              <Input
                id="machineName"
                {...form.register('machineName')}
                placeholder="Enter machine name (e.g., K120, K150)"
              />
              {form.formState.errors.machineName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.machineName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dia">Diameter (Inch)</Label>
                <Input
                  id="dia"
                  type="number"
                  step="0.01"
                  {...form.register('dia', { valueAsNumber: true })}
                  placeholder="Enter diameter"
                />
                {form.formState.errors.dia && (
                  <p className="text-sm text-destructive">{form.formState.errors.dia.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gg">GG (Gauge)</Label>
                <Input
                  id="gg"
                  type="number"
                  step="0.01"
                  {...form.register('gg', { valueAsNumber: true })}
                  placeholder="Enter gauge"
                />
                {form.formState.errors.gg && (
                  <p className="text-sm text-destructive">{form.formState.errors.gg.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="needle">Needles</Label>
                <Input
                  id="needle"
                  type="number"
                  {...form.register('needle', { valueAsNumber: true })}
                  placeholder="Enter needle count"
                />
                {form.formState.errors.needle && (
                  <p className="text-sm text-destructive">{form.formState.errors.needle.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="feeder">Feeders</Label>
                <Input
                  id="feeder"
                  type="number"
                  {...form.register('feeder', { valueAsNumber: true })}
                  placeholder="Enter feeder count"
                />
                {form.formState.errors.feeder && (
                  <p className="text-sm text-destructive">{form.formState.errors.feeder.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rpm">RPM</Label>
                <Input
                  id="rpm"
                  type="number"
                  {...form.register('rpm', { valueAsNumber: true })}
                  placeholder="Enter RPM"
                />
                {form.formState.errors.rpm && (
                  <p className="text-sm text-destructive">{form.formState.errors.rpm.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="constat">Constant (Optional)</Label>
                <Input
                  id="constat"
                  type="number"
                  step="0.00001"
                  {...form.register('constat', { valueAsNumber: true })}
                  placeholder="Enter constant value"
                />
                {form.formState.errors.constat && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.constat.message}
                  </p>
                )}
              </div>

              {/* Removed efficiency field as requested */}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Enter machine description and specifications"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch('isActive')}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Active Machine</Label>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/machines')}>
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
                    {isEditMode ? 'Update Machine' : 'Create Machine'}
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

export default MachineForm;