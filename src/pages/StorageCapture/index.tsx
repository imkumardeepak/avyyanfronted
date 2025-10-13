import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, Calendar, Scan } from 'lucide-react';
import { toast } from '@/lib/toast';
import { rollConfirmationApi, locationApi, apiUtils, storageCaptureApi } from '@/lib/api-client';
import type { LocationResponseDto } from '@/types/api-types';

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
  const [scannedLocationCode, setScannedLocationCode] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationResponseDto | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Handle location code scan
  const handleLocationCodeScan = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scannedLocationCode) {
      try {
        // Call API to search for location by code
        const response = await locationApi.searchLocations({ code: scannedLocationCode });
        const locations = response.data;

        if (locations && locations.length > 0) {
          const location = locations[0]; // Take the first match
          setSelectedLocation(location);
          setValue('locationId', location.id.toString());
          toast.success('Success', `Location found: ${location.location}`);
        } else {
          toast.error('Error', 'Location not found. Please check the location code.');
          setSelectedLocation(null);
          setValue('locationId', '');
        }
      } catch (error) {
        console.error('Error searching for location:', error);
        toast.error('Error', 'Failed to search for location. Please try again.');
        setSelectedLocation(null);
        setValue('locationId', '');
      }
    }
  };

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
      const response = await storageCaptureApi.getRollConfirmationsByAllotId(allotId);
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
        setValue('rollNumber', '');
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

  return (
    <div className="p-2 max-w-4xl mx-auto">
      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-semibold">
              Storage Capture & Allocation
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20 h-6 px-2"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
          </div>
          <p className="text-white/80 text-xs mt-1">
            Capture and allocate finished goods rolls to storage locations
          </p>
        </CardHeader>

        <CardContent className="p-3">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Roll Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-3">
              <h3 className="text-xs font-semibold text-blue-800 mb-2">Roll Information</h3>
              <p className="text-xs text-blue-700/80 mb-2">
                Scan or enter the FG roll number to fetch details
              </p>

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="rollNumber" className="text-xs font-medium text-gray-700">
                    FG Roll Number (Scan QR Code)
                  </Label>
                  <div className="relative">
                    <Scan className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      ref={rollNumberInputRef}
                      id="rollNumber"
                      {...register('rollNumber')}
                      onKeyPress={handleRollNumberKeyPress}
                      placeholder="Scan QR code or enter FG Roll Number"
                      className={`pl-7 text-xs h-8 ${hasError ? 'bg-red-50 border-red-300' : 'bg-white'}`}
                    />
                  </div>
                </div>

                {rollNumber && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="lotNumber" className="text-xs font-medium text-gray-700">
                        Lot Number
                      </Label>
                      <Input
                        id="lotNumber"
                        {...register('lotNumber')}
                        readOnly
                        className="text-xs h-8 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="product" className="text-xs font-medium text-gray-700">
                        Product
                      </Label>
                      <Input
                        id="product"
                        {...register('product')}
                        readOnly
                        className="text-xs h-8 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="quantity" className="text-xs font-medium text-gray-700">
                        Width (inches)
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        {...register('quantity', { valueAsNumber: true })}
                        readOnly
                        className="text-xs h-8 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="quality" className="text-xs font-medium text-gray-700">
                        Quality (GSM)
                      </Label>
                      <Input
                        id="quality"
                        {...register('quality')}
                        readOnly
                        className="text-xs h-8 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Allocation Details Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md p-3">
              <h3 className="text-xs font-semibold text-green-800 mb-2">Allocation Details</h3>
              <p className="text-xs text-green-700/80 mb-2">
                Specify where to store the roll and when
              </p>

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="locationCode" className="text-xs font-medium text-gray-700">
                    Scan Location Code
                  </Label>
                  <div className="relative">
                    <Scan className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      ref={locationInputRef}
                      id="locationCode"
                      value={scannedLocationCode}
                      onChange={(e) => setScannedLocationCode(e.target.value)}
                      onKeyPress={handleLocationCodeScan}
                      placeholder="Scan location code"
                      className="pl-7 text-xs h-8"
                    />
                  </div>
                </div>

                {/* Location Details Display */}
                {selectedLocation && (
                  <div className="bg-white border border-gray-200 rounded-md p-2">
                    <h4 className="text-xs font-semibold text-gray-800 mb-1">Location Details</h4>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="flex">
                        <span className="text-gray-600 mr-1">Name:</span>
                        <span className="font-medium">{selectedLocation.location}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 mr-1">Warehouse:</span>
                        <span className="font-medium">{selectedLocation.warehousename}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 mr-1">Code:</span>
                        <span className="font-medium">{selectedLocation.locationcode}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 mr-1">Status:</span>
                        <span
                          className={`font-medium ${selectedLocation.isActive ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {selectedLocation.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="date" className="text-xs font-medium text-gray-700">
                    Allocation Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="date"
                      type="text"
                      value={new Date().toLocaleDateString('en-CA')}
                      readOnly
                      className="pl-7 text-xs h-8 bg-muted"
                    />
                    <input
                      type="hidden"
                      {...register('date')}
                      value={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="remarks" className="text-xs font-medium text-gray-700">
                    Remarks
                  </Label>
                  <Textarea
                    id="remarks"
                    {...register('remarks')}
                    placeholder="Enter any additional remarks"
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
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
                className="h-8 px-3 text-xs"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={allocateRollMutation.isPending || !rollNumber || !locationId}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-xs"
              >
                {allocateRollMutation.isPending ? (
                  <>
                    <div className="mr-1.5 h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Allocating...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    Allocate Roll
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

export default StorageCapture;
