import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { RollConfirmationService } from '@/services/rollConfirmationService';
import { ProductionAllotmentService } from '@/services/productionAllotmentService';
import { SalesOrderService } from '@/services/salesOrderService';
import type { 
  RollConfirmationRequestDto, 
  ProductionAllotmentResponseDto,
  SalesOrderDto,
  MachineAllocationResponseDto
} from '@/types/api-types';

const ProductionConfirmation: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    allotId: '',
    machineName: '',
    rollNo: '',
    greyGsm: '0',
    greyWidth: '0',
    blendPercent: '0',
    cotton: '0',
    polyester: '0',
    spandex: '0'
  });

  // Allotment data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allotmentData, setAllotmentData] = useState<ProductionAllotmentResponseDto | null>(null);
  const [salesOrderData, setSalesOrderData] = useState<SalesOrderDto | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineAllocationResponseDto | null>(null);

  // Refs for scanner
  const scanBuffer = useRef<string>(''); // store scanned characters
  const isScanning = useRef<boolean>(false); // track if we're in a scanning session
  const lastKeyTime = useRef<number>(Date.now()); // track time between key presse`s

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch greyGsm and greyWidth based on allotId
  const fetchAllotmentData = async (allotId: string, machineNameFromBarcode?: string) => {
    if (!allotId) return;
    
    setIsFetchingData(true);
    setError(null);
    
    try {
      const allotmentData = await ProductionAllotmentService.getProductionAllotmentByAllotId(allotId);
      setAllotmentData(allotmentData);
      
      // Fetch sales order data if salesOrderId is available
      if (allotmentData.salesOrderId) {
        try {
          const salesOrder = await SalesOrderService.getSalesOrderById(allotmentData.salesOrderId);
          setSalesOrderData(salesOrder);
        } catch (salesOrderError) {
          console.error('Error fetching sales order data:', salesOrderError);
          setSalesOrderData(null);
        }
      }
      
      // Get rollPerKg from the matching machine allocation if available
      let selectedMachineData = null;
      
      if (allotmentData.machineAllocations && allotmentData.machineAllocations.length > 0) {
        // If machine name from barcode is provided, find matching machine allocation
        if (machineNameFromBarcode) {
          selectedMachineData = allotmentData.machineAllocations.find(
            (ma: MachineAllocationResponseDto) => ma.machineName === machineNameFromBarcode
          ) || allotmentData.machineAllocations[0]; // Fallback to first machine if not found
        } else {
          // Otherwise use the first machine allocation
          selectedMachineData = allotmentData.machineAllocations[0];
        }
        
        setSelectedMachine(selectedMachineData);
      }
      
      setFormData(prev => ({
        ...prev,
        greyGsm: allotmentData.reqGreyGsm?.toString() || '0',
        greyWidth: allotmentData.reqGreyWidth?.toString() || '0',
      }));
      
      toast.success('Success', 'Production planning data loaded successfully. Please enter actual values for quality checking.');
    } catch (err) {
      console.error('Error fetching allotment data:', err);
      setAllotmentData(null);
      setSalesOrderData(null);
      setSelectedMachine(null);
      
      // Show specific error message to user
      if (err instanceof Error) {
        toast.error('Error', err.message);
      } else {
        toast.error('Error', 'Failed to fetch allotment data. Please check the allotment ID and try again.');
      }
    } finally {
      setIsFetchingData(false);
    }
  };

  // Parse barcode text and fill fields
  const handleBarcodeScan = (barcodeData: string) => {
    try {
      const parts = barcodeData.split('#');
      if (parts.length >= 3) {
        const newAllotId = parts[0] || '';
        const machineName = parts[1] || '';
        setFormData(prev => ({
          ...prev,
          allotId: newAllotId,
          machineName: machineName,
          rollNo: parts[2] || '',
        }));
        
        // Fetch greyGsm, greyWidth, and rollPerKg based on allotId and machineName
        fetchAllotmentData(newAllotId, machineName);
        
        toast.success('Success', 'Barcode data loaded successfully');
      } else {
        toast.error('Error', 'Invalid barcode format. Expected: ALLOTID#MACHINENAME#ROLLNO');
      }
    } catch (err) {
      console.error('Error processing barcode:', err);
      toast.error('Error', 'Failed to process barcode data');
    }
  };

  // Scanner event handler (keyboard-based scanners)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if user is typing in an input field
      if (e.target instanceof HTMLInputElement) {
        scanBuffer.current = '';
        isScanning.current = false;
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTime.current;
      
      // If it's been more than 100ms since the last key, start a new scan session
      if (timeSinceLastKey > 100) {
        scanBuffer.current = '';
        isScanning.current = true;
      }
      
      lastKeyTime.current = currentTime;
      
      if (e.key === 'Enter') {
        if (scanBuffer.current.length > 0 && isScanning.current) {
          handleBarcodeScan(scanBuffer.current);
          scanBuffer.current = '';
          isScanning.current = false;
          e.preventDefault(); // Prevent form submission if applicable
        }
      } else if (e.key.length === 1) { // Only process character keys
        if (isScanning.current) {
          scanBuffer.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields are filled
    const requiredFields = [
      { value: formData.allotId, name: 'Allot ID' },
      { value: formData.machineName, name: 'Machine Name' },
      { value: formData.rollNo, name: 'Roll No' },
      { value: formData.greyGsm, name: 'GREY GSM' },
      { value: formData.greyWidth, name: 'GREY WIDTH' }
    ];
    
    const emptyFields = requiredFields.filter(field => !field.value);
    
    if (emptyFields.length > 0) {
      const missingFields = emptyFields.map(field => field.name).join(', ');
      toast.error('Error', `Please fill in all required fields: ${missingFields}`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare data for roll confirmation API
      const rollConfirmationData: RollConfirmationRequestDto = {
        allotId: formData.allotId,
        machineName: formData.machineName,
        rollPerKg: selectedMachine?.rollPerKg || 0,
        greyGsm: parseFloat(formData.greyGsm) || 0,
        greyWidth: parseFloat(formData.greyWidth) || 0,
        blendPercent: parseFloat(formData.blendPercent) || 0,
        cotton: parseFloat(formData.cotton) || 0,
        polyester: parseFloat(formData.polyester) || 0,
        spandex: parseFloat(formData.spandex) || 0,
        rollNo: formData.rollNo
      };
      
      // Call the roll confirmation API
      const response = await RollConfirmationService.createRollConfirmation(rollConfirmationData);
      
      console.log('Roll confirmation saved:', response);
      setIsLoading(false);
      toast.success('Success', 'Quality checking data saved successfully');
      
      // Reset form after successful submission
      setFormData({
        allotId: '',
        machineName: '',
        rollNo: '',
        greyGsm: '0',
        greyWidth: '0',
        blendPercent: '0',
        cotton: '0',
        polyester: '0',
        spandex: '0'
      });
      setAllotmentData(null);
      setSalesOrderData(null);
      setSelectedMachine(null);
    } catch (err) {
      console.error('Error saving roll confirmation:', err);
      setIsLoading(false);
      toast.error('Error', 'Failed to save confirmation data. Please try again.');
    }
  };

  // Auto-dismiss error messages after 2 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quality Checking</h1>
        <p className="text-muted-foreground">
          Enter actual fabric specifications for quality checking
        </p>
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-blue-800">Quality Checking Details</CardTitle>
        </CardHeader>
        <CardContent>
         
          {/* Completely hidden scanner focus element */}
          <div className="absolute -left-full top-0 opacity-0 w-0 h-0 overflow-hidden">
            <input type="text" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="allotId" className="text-sm">Allot ID *</Label>
                <Input
                  id="allotId"
                  name="allotId"
                  value={formData.allotId}
                  onChange={handleChange}
                  placeholder="Enter Allot ID"
                  required
                 disabled={!!allotmentData}
                  className="text-sm h-9"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="machineName" className="text-sm">Machine Name *</Label>
                <Input
                  id="machineName"
                  name="machineName"
                  value={formData.machineName}
                  onChange={handleChange}
                  placeholder="Enter Machine Name"
                  required
                  disabled={!!selectedMachine} // Disable when machine data is fetched
                  className="text-sm h-9"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="rollNo" className="text-sm">Roll No. *</Label>
                <Input
                  id="rollNo"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleChange}
                  placeholder="Enter Roll Number"
                  required
                  disabled={!!formData.allotId && !!formData.machineName} // Disable when populated from barcode
                  className="text-sm h-9"
                />
              </div>
            </div>
            
            {/* Sales Order Description Section - Attractive Compact Display */}
            {salesOrderData && (
              <div className="mb-6">
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-sm rounded-lg">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm font-semibold text-purple-800">ROll Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="text-center bg-white/60 rounded p-2">
                        <Label className="text-xs text-purple-600 block">Order No</Label>
                        <div className="text-xs font-medium">{salesOrderData.voucherNumber || 'N/A'}</div>
                      </div>
                      
                      <div className="text-center bg-white/60 rounded p-2">
                        <Label className="text-xs text-purple-600 block">Party</Label>
                        <div className="text-xs font-medium truncate" title={salesOrderData.partyName || 'N/A'}>
                          {salesOrderData.partyName || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="text-center bg-white/60 rounded p-2">
                        <Label className="text-xs text-purple-600 block">Order Date</Label>
                        <div className="text-xs font-medium">
                          {salesOrderData.salesDate 
                            ? new Date(salesOrderData.salesDate).toLocaleDateString() 
                            : 'N/A'}
                        </div>
                      </div>
                                                <div className="text-center bg-white/50 rounded p-1">
                            <Label className="text-xs text-green-600 block">Machine</Label>
                            <div className="text-xs font-medium">{selectedMachine?.machineName || 'N/A'}</div>
                          </div>
                          
                         
                          
                          <div className="text-center bg-white/50 rounded p-1">
                            <Label className="text-xs text-green-600 block">RPM</Label>
                            <div className="text-xs font-medium">{selectedMachine?.rpm || 'N/A'}</div>
                          </div>
                          
                          <div className="text-center bg-white/50 rounded p-1">
                            <Label className="text-xs text-green-600 block">Rolls/Kg</Label>
                            <div className="text-xs font-medium">{selectedMachine?.rollPerKg?.toFixed(3) || 'N/A'}</div>
                          </div>
                    </div>
                    
                    {salesOrderData.items && salesOrderData.items.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-purple-100">
                        <Label className="text-xs text-purple-600 block mb-1">Item Descriptions</Label>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {salesOrderData.items.map((item, index) => (
                            <div 
                              key={index} 
                              className="text-xs bg-white/60 rounded p-1 truncate"
                              title={item.descriptions || item.stockItemName || 'N/A'}
                            >
                              {item.descriptions || item.stockItemName || 'N/A'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                 
                </Card>
              </div>
            )}

        
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">Quality Checking - Fabric Specifications</h3>
              
              {/* Planning Values Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2 bg-blue-50 p-3 rounded">
                  <Label className="text-sm font-medium text-blue-800">Planning GREY GSM</Label>
                  <div className="text-lg font-semibold">
                    {allotmentData?.reqGreyGsm?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-2 bg-blue-50 p-3 rounded">
                  <Label className="text-sm font-medium text-blue-800">Planning GREY WIDTH</Label>
                  <div className="text-lg font-semibold">
                    {allotmentData?.reqGreyWidth?.toFixed(2) || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="greyGsm">Actual GREY GSM *</Label>
                  <Input
                    id="greyGsm"
                    name="greyGsm"
                    value={formData.greyGsm}
                    onChange={handleChange}
                    type="number"
                    placeholder="Enter Actual GREY GSM"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="greyWidth">Actual GREY WIDTH *</Label>
                  <Input
                    id="greyWidth"
                    name="greyWidth"
                    value={formData.greyWidth}
                    onChange={handleChange}
                    type="number"
                    placeholder="Enter Actual GREY WIDTH"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blendPercent">BLEND %</Label>
                  <Input
                    id="blendPercent"
                    name="blendPercent"
                    value={formData.blendPercent}
                    onChange={handleChange}
                    type="number"
                    placeholder="Enter BLEND %"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="cotton">COTTON</Label>
                  <Input
                    id="cotton"
                    name="cotton"
                    value={formData.cotton}
                    onChange={handleChange}
                    type="number"
                    placeholder="Enter COTTON"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="polyester">POLYESTER</Label>
                  <Input
                    id="polyester"
                    name="polyester"
                    value={formData.polyester}
                    onChange={handleChange}
                    type="number"
                    placeholder="Enter POLYESTER"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spandex">SPANDEX</Label>
                  <Input
                    id="spandex"
                    name="spandex"
                    value={formData.spandex}
                    onChange={handleChange}
                    type="number"
                    placeholder="Enter SPANDEX"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isLoading || isFetchingData}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span>Saving...</span>
                  </div>
                ) : isFetchingData ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span>Loading Data...</span>
                  </div>
                ) : (
                  'Save Quality Check'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionConfirmation;