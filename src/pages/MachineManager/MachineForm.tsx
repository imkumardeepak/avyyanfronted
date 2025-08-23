import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useMachines } from '@/hooks/useMachines';
import type { CreateMachineManagerDto, UpdateMachineManagerDto } from '@/types/machine';

const machineSchema = z.object({
  machineName: z.string().min(1, 'Machine name is required').max(200, 'Machine name too long'),
  dia: z.number().min(0, 'Dia must be positive'),
  gg: z.number().min(0, 'GG must be positive'),
  needle: z.number().int().min(1, 'Needle count must be at least 1'),
  feeder: z.number().int().min(1, 'Feeder count must be at least 1'),
  rpm: z.number().min(0, 'RPM must be positive'),
  constat: z.number().min(0, 'Constat must be positive'),
  efficiency: z
    .number()
    .min(0, 'Efficiency must be positive')
    .max(100, 'Efficiency cannot exceed 100%'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  isActive: z.boolean().optional(),
});

type MachineFormData = z.infer<typeof machineSchema>;

const MachineForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { getMachine, createMachine, updateMachine, loading, error } = useMachines();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<MachineFormData>({
    resolver: zodResolver(machineSchema),
    defaultValues: {
      machineName: '',
      dia: 0,
      gg: 0,
      needle: 1,
      feeder: 1,
      rpm: 0,
      constat: 0,
      efficiency: 0,
      description: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (isEdit && id) {
      loadMachine(parseInt(id));
    }
  }, [isEdit, id]);

  const loadMachine = async (machineId: number) => {
    try {
      const machine = await getMachine(machineId);
      if (machine) {
        setValue('machineName', machine.machineName);
        setValue('dia', machine.dia);
        setValue('gg', machine.gg);
        setValue('needle', machine.needle);
        setValue('feeder', machine.feeder);
        setValue('rpm', machine.rpm);
        setValue('constat', machine.constat || 0);
        setValue('efficiency', machine.efficiency);
        setValue('description', machine.description || '');
        setValue('isActive', machine.isActive);
      }
    } catch (err) {
      setSubmitError('Failed to load machine data');
    }
  };

  const onSubmit = async (data: MachineFormData) => {
    try {
      setSubmitError(null);

      if (isEdit && id) {
        const updateData: UpdateMachineManagerDto = {
          ...data,
          isActive: data.isActive ?? true,
        };
        await updateMachine(parseInt(id), updateData);
      } else {
        const createData: CreateMachineManagerDto = {
          machineName: data.machineName,
          dia: data.dia,
          gg: data.gg,
          needle: data.needle,
          feeder: data.feeder,
          rpm: data.rpm,
          constat: data.constat,
          efficiency: data.efficiency,
          description: data.description,
        };
        await createMachine(createData);
      }

      navigate('/machines');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save machine');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/machines')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-display">
            {isEdit ? 'Edit Machine' : 'Create New Machine'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? 'Update machine configuration'
              : 'Add a new knitting machine to your inventory'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(error || submitError) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error || submitError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="machineName">Machine Name *</Label>
                <Input
                  id="machineName"
                  {...register('machineName')}
                  placeholder="Enter machine name"
                />
                {errors.machineName && (
                  <p className="text-sm text-red-500">{errors.machineName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dia">Dia *</Label>
                <Input
                  id="dia"
                  type="number"
                  step="0.01"
                  {...register('dia', { valueAsNumber: true })}
                  placeholder="Enter dia value"
                />
                {errors.dia && <p className="text-sm text-red-500">{errors.dia.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gg">GG *</Label>
                <Input
                  id="gg"
                  type="number"
                  step="0.01"
                  {...register('gg', { valueAsNumber: true })}
                  placeholder="Enter GG value"
                />
                {errors.gg && <p className="text-sm text-red-500">{errors.gg.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="needle">Needle Count *</Label>
                <Input
                  id="needle"
                  type="number"
                  {...register('needle', { valueAsNumber: true })}
                  placeholder="Enter needle count"
                />
                {errors.needle && <p className="text-sm text-red-500">{errors.needle.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="feeder">Feeder Count *</Label>
                <Input
                  id="feeder"
                  type="number"
                  {...register('feeder', { valueAsNumber: true })}
                  placeholder="Enter feeder count"
                />
                {errors.feeder && <p className="text-sm text-red-500">{errors.feeder.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rpm">RPM *</Label>
                <Input
                  id="rpm"
                  type="number"
                  step="0.01"
                  {...register('rpm', { valueAsNumber: true })}
                  placeholder="Enter RPM"
                />
                {errors.rpm && <p className="text-sm text-red-500">{errors.rpm.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="efficiency">Efficiency (%) *</Label>
                <Input
                  id="efficiency"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('efficiency', { valueAsNumber: true })}
                  placeholder="Enter efficiency percentage"
                />
                {errors.efficiency && (
                  <p className="text-sm text-red-500">{errors.efficiency.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="constat">Constat *</Label>
              <Input
                id="constat"
                type="number"
                step="0.01"
                {...register('constat', { valueAsNumber: true })}
                placeholder="Enter constat value"
              />
              {errors.constat && <p className="text-sm text-red-500">{errors.constat.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter machine description"
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {isEdit && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/machines')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || loading}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update Machine' : 'Create Machine'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MachineForm;
