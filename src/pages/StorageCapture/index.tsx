import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Save,
  ArrowLeft,
  QrCode,
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  Scan,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { locationApi, rollConfirmationApi, apiUtils } from '@/lib/api-client';
import { useLocations } from '@/hooks/queries/useLocationQueries';
import type { LocationResponseDto, RollConfirmationResponseDto } from '@/types/api-types';

// Define form data types
interface StorageCaptureFormData {
  rollNumber: string;
  locationId: string;
  remarks: string;
  date: string;
  lotNumber: string;
  product: string;
  quantity: number;
  quality: string;
}

const StorageCapture = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rollNumberInputRef = useRef<HTMLInputElement>(null);
  const [hasError, setHasError] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StorageCaptureFormData>({
    defaultValues: {
      rollNumber: '',
      locationId: '',
      remarks: '',
      date: new Date().toISOString().split('T')[0],
      lotNumber: '',
      product: '',
      quantity: 0,
      quality: '',
    },
  });

  // Watch form values
  const rollNumber = watch('rollNumber');
  const locationId = watch('locationId');

  // Fetch locations using TanStack Query
  const {
    data: locations = [],
    isLoading: locationsLoading,
    isError: locationsError,
  } = useLocations();

  // Mock mutation for allocating FG roll (in a real app, this would call an actual API)
  const allocateRollMutation = useMutation({
    mutationFn: async (data: StorageCaptureFormData) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would call an API endpoint here
      // For example: return storageApi.allocateRoll(data);

      // For now, we'll just return a mock response
      return { success: true, message: 'FG Roll allocated to location successfully' };
    },
    onSuccess: () => {
      // Invalidate and refetch queries if needed
      queryClient.invalidateQueries({ queryKey: ['locations'] });

      // Reset form
      reset({
        rollNumber: '',
        locationId: '',
        remarks: '',
        date: new Date().toISOString().split('T')[0],
        lotNumber: '',
        product: '',
        quantity: 0,
        quality: '',
      });

      // Clear error state
      setHasError(false);

      toast.success('Success', 'FG Roll allocated to location successfully');

      // Refocus on roll number input after submission
      setTimeout(() => {
        if (rollNumberInputRef.current) {
          rollNumberInputRef.current.focus();
        }
      }, 100);
    },
    onError: (error: any) => {
      const errorMessage = apiUtils.handleError(error);
      toast.error('Error', errorMessage);

      // Set error state and refocus
      setHasError(true);
      setTimeout(() => {
        if (rollNumberInputRef.current) {
          rollNumberInputRef.current.focus();
        }
      }, 100);
    },
  });

  // Focus on roll number input when component mounts
  useEffect(() => {
    if (rollNumberInputRef.current) {
      rollNumberInputRef.current.focus();
    }
  }, []);

  // Function to fetch data based on scanned roll number
  const fetchRollData = async (scannedData: string) => {
    try {
      // Clear previous error state
      setHasError(false);

      const parts = scannedData.split('#');
      const allotId = parts[0];
      if (!allotId) {
        toast.error('Error', 'Invalid QR code format');
        setHasError(true);
        setTimeout(() => {
          if (rollNumberInputRef.current) {
            rollNumberInputRef.current.focus();
          }
        }, 100);
        return;
      }

      // Call API to get roll confirmation data by allotId
      const response = await rollConfirmationApi.getRollConfirmationsByAllotId(allotId);
      console.log('Roll Data:', response);
      const rollData = apiUtils.extractData(response);

      if (rollData && rollData.length > 0) {
        // Use the first roll confirmation data
        const data = rollData[0];
        setValue('rollNumber', data.allotId);
        setValue('lotNumber', data.rollNo || '');
        setValue('product', data.machineName || '');
        setValue('quantity', data.greyWidth || 0);
        setValue('quality', `${data.greyGsm || 0} GSM`);

        toast.success('Success', 'FG Roll data retrieved successfully');
      } else {
        toast.error('Error', 'No roll data found for this QR code');
        // Reset form fields
        setValue('lotNumber', '');
        setValue('product', '');
        setValue('quantity', 0);
        setValue('quality', '');

        // Set error state and refocus
        setHasError(true);
        setTimeout(() => {
          if (rollNumberInputRef.current) {
            rollNumberInputRef.current.focus();
          }
        }, 100);
      }
    } catch (error) {
      const errorMessage = apiUtils.handleError(error);
      toast.error('Error', errorMessage);
      // Reset form fields on error
      setValue('lotNumber', '');
      setValue('product', '');
      setValue('quantity', 0);
      setValue('quality', '');

      // Set error state and refocus
      setHasError(true);
      setTimeout(() => {
        if (rollNumberInputRef.current) {
          rollNumberInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Handle when user presses Enter after scanning
  const handleRollNumberKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && rollNumber) {
      fetchRollData(rollNumber);
    }
  };

  // Handle form submission
  const onSubmit = (data: StorageCaptureFormData) => {
    if (!data.rollNumber || !data.locationId) {
      toast.error('Error', 'Please select both FG Roll and Storage Location');
      setHasError(true);
      setTimeout(() => {
        if (rollNumberInputRef.current) {
          rollNumberInputRef.current.focus();
        }
      }, 100);
      return;
    }

    allocateRollMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Allocated':
        return <Badge variant="default">Allocated</Badge>;
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Storage Capture & Allocation
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Capture and allocate finished goods rolls to storage locations
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Allocation Form */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">FG Roll Number (Scan QR Code)</Label>
                  <div className="relative">
                    <Scan className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={rollNumberInputRef}
                      id="rollNumber"
                      {...register('rollNumber')}
                      onKeyPress={handleRollNumberKeyPress}
                      placeholder="Scan QR code or enter FG Roll Number"
                      className={`pl-10 ${hasError ? 'bg-red-50 border-red-300' : ''}`}
                    />
                  </div>
                </div>

                {rollNumber && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="lotNumber">Lot Number</Label>
                      <Input
                        id="lotNumber"
                        {...register('lotNumber')}
                        readOnly
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product">Product</Label>
                      <Input id="product" {...register('product')} readOnly className="bg-muted" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Width (inches)</Label>
                        <Input
                          id="quantity"
                          type="number"
                          {...register('quantity', { valueAsNumber: true })}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quality">Quality (GSM)</Label>
                        <Input
                          id="quality"
                          {...register('quality')}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="locationId">Storage Location</Label>
                  <Select
                    value={locationId}
                    onValueChange={(value) => setValue('locationId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading locations...
                        </SelectItem>
                      ) : locationsError ? (
                        <SelectItem value="error" disabled>
                          Error loading locations
                        </SelectItem>
                      ) : (
                        locations.map((location: LocationResponseDto) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.name} ({location.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Allocation Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="date" type="date" {...register('date')} className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    {...register('remarks')}
                    placeholder="Enter any additional remarks"
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset({
                        rollNumber: '',
                        locationId: '',
                        remarks: '',
                        date: new Date().toISOString().split('T')[0],
                        lotNumber: '',
                        product: '',
                        quantity: 0,
                        quality: '',
                      });
                      // Clear error state and refocus
                      setHasError(false);
                      setTimeout(() => {
                        if (rollNumberInputRef.current) {
                          rollNumberInputRef.current.focus();
                        }
                      }, 100);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={allocateRollMutation.isPending || !rollNumber || !locationId}
                  >
                    {allocateRollMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Allocating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Allocate Roll
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageCapture;
