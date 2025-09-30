import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';

import { ProductionAllotmentService } from '@/services/productionAllotmentService';
import { SalesOrderService } from '@/services/salesOrderService';
import { InspectionService } from '@/services/inspectionService';
import type { ProductionAllotmentResponseDto, MachineAllocationResponseDto } from '@/types/api-types';
import type { SalesOrderDto, InspectionRequestDto } from '@/types/api-types';

const RollInspection: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    allotId: '',
    machineName: '',
    rollNo: '',
    // Spinning Faults
    thinPlaces: '0',
    thickPlaces: '0',
    thinLines: '0',
    thickLines: '0',
    doubleParallelYarn: '0',
    // Contamination Faults
    haidJute: '0',
    colourFabric: '0',
    // Column 3 Faults
    holes: '0',
    dropStitch: '0',
    lycraStitch: '0',
    lycraBreak: '0',
    ffd: '0',
    needleBroken: '0',
    knitFly: '0',
    oilSpots: '0',
    oilLines: '0',
    verticalLines: '0',
    // Summary
    grade: '',
    totalFaults: '0',
    remarks: '',
    // Flag for approval status (true = approved, false = rejected)
    flag: true // Default to approved
  });

  // Allotment data
  const [allotmentData, setAllotmentData] = useState<ProductionAllotmentResponseDto | null>(null);
  const [salesOrderData, setSalesOrderData] = useState<SalesOrderDto | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineAllocationResponseDto | null>(null);

  // Refs for scanner
  const scanBuffer = useRef<string>(''); // store scanned characters
  const isScanning = useRef<boolean>(false); // track if we're in a scanning session
  const lastKeyTime = useRef<number>(Date.now()); // track time between key presses

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate total faults
  const calculateTotalFaults = () => {
    const faultFields = [
      'thinPlaces', 'thickPlaces', 'thinLines', 'thickLines', 'doubleParallelYarn',
      'haidJute', 'colourFabric',
      'holes', 'dropStitch', 'lycraStitch', 'lycraBreak', 'ffd', 
      'needleBroken', 'knitFly', 'oilSpots', 'oilLines', 'verticalLines'
    ];
    
    let total = 0;
    faultFields.forEach(field => {
      // Ensure we're only working with string values
      const fieldValue = formData[field as keyof typeof formData];
      if (typeof fieldValue === 'string') {
        const value = parseInt(fieldValue || '0');
        if (!isNaN(value)) {
          total += value;
        }
      }
    });
    
    return total;
  };

  // Fetch allotment data based on allotId
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
      
      // Get machine allocation data if available
      let selectedMachineData = null;
      
      if (allotmentData.machineAllocations && allotmentData.machineAllocations.length > 0) {
        // If machine name from barcode is provided, find matching machine allocation
        if (machineNameFromBarcode) {
          selectedMachineData = allotmentData.machineAllocations.find(
            ma => ma.machineName === machineNameFromBarcode
          ) || allotmentData.machineAllocations[0]; // Fallback to first machine if not found
        } else {
          // Otherwise use the first machine allocation
          selectedMachineData = allotmentData.machineAllocations[0];
        }
        
        setSelectedMachine(selectedMachineData);
      }
      
      toast.success('Success', 'Allotment data loaded successfully');
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
        
        // Fetch allotment data based on allotId and machineName
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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

  // Handle form submission for approval
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields are filled
    const requiredFields = [
      { value: formData.allotId, name: 'Allot ID' },
      { value: formData.machineName, name: 'Machine Name' },
      { value: formData.rollNo, name: 'Roll No' },
      { value: formData.grade, name: 'Grade' }
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
      // Calculate total faults before submission
      const totalFaults = calculateTotalFaults();
      
      // Prepare data for inspection API with flag set to true (approved)
      const inspectionData: InspectionRequestDto = {
        allotId: formData.allotId,
        machineName: formData.machineName,
        rollNo: formData.rollNo,
        // Spinning Faults
        thinPlaces: parseInt(formData.thinPlaces) || 0,
        thickPlaces: parseInt(formData.thickPlaces) || 0,
        thinLines: parseInt(formData.thinLines) || 0,
        thickLines: parseInt(formData.thickLines) || 0,
        doubleParallelYarn: parseInt(formData.doubleParallelYarn) || 0,
        // Contamination Faults
        haidJute: parseInt(formData.haidJute) || 0,
        colourFabric: parseInt(formData.colourFabric) || 0,
        // Column 3 Faults
        holes: parseInt(formData.holes) || 0,
        dropStitch: parseInt(formData.dropStitch) || 0,
        lycraStitch: parseInt(formData.lycraStitch) || 0,
        lycraBreak: parseInt(formData.lycraBreak) || 0,
        ffd: parseInt(formData.ffd) || 0,
        needleBroken: parseInt(formData.needleBroken) || 0,
        knitFly: parseInt(formData.knitFly) || 0,
        oilSpots: parseInt(formData.oilSpots) || 0,
        oilLines: parseInt(formData.oilLines) || 0,
        verticalLines: parseInt(formData.verticalLines) || 0,
        // Summary
        grade: formData.grade,
        totalFaults: totalFaults,
        remarks: formData.remarks,
        createdDate: new Date().toISOString(),
        // Flag for approval status (true = approved)
        flag: true
      };
      
      // Call the inspection API
      const response = await InspectionService.createInspection(inspectionData);
      
      console.log('Roll inspection saved:', response);
      setIsLoading(false);
      toast.success('Success', 'Roll inspection details saved successfully');
      
      // Reset form after successful submission
      setFormData({
        allotId: '',
        machineName: '',
        rollNo: '',
        // Spinning Faults
        thinPlaces: '0',
        thickPlaces: '0',
        thinLines: '0',
        thickLines: '0',
        doubleParallelYarn: '0',
        // Contamination Faults
        haidJute: '0',
        colourFabric: '0',
        // Column 3 Faults
        holes: '0',
        dropStitch: '0',
        lycraStitch: '0',
        lycraBreak: '0',
        ffd: '0',
        needleBroken: '0',
        knitFly: '0',
        oilSpots: '0',
        oilLines: '0',
        verticalLines: '0',
        // Summary
        grade: '',
        totalFaults: '0',
        remarks: '',
        // Flag for approval status
        flag: true
      });

    } catch (err) {
      console.error('Error saving roll inspection:', err);
      setIsLoading(false);
      toast.error('Error', 'Failed to save inspection data. Please try again.');
    }
  };

  // Handle form submission for rejection
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields are filled
    const requiredFields = [
      { value: formData.allotId, name: 'Allot ID' },
      { value: formData.machineName, name: 'Machine Name' },
      { value: formData.rollNo, name: 'Roll No' }
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
      // Calculate total faults before submission
      const totalFaults = calculateTotalFaults();
      
      // Prepare data for inspection API with flag set to false (rejected)
      const inspectionData: InspectionRequestDto = {
        allotId: formData.allotId,
        machineName: formData.machineName,
        rollNo: formData.rollNo,
        // Spinning Faults
        thinPlaces: parseInt(formData.thinPlaces) || 0,
        thickPlaces: parseInt(formData.thickPlaces) || 0,
        thinLines: parseInt(formData.thinLines) || 0,
        thickLines: parseInt(formData.thickLines) || 0,
        doubleParallelYarn: parseInt(formData.doubleParallelYarn) || 0,
        // Contamination Faults
        haidJute: parseInt(formData.haidJute) || 0,
        colourFabric: parseInt(formData.colourFabric) || 0,
        // Column 3 Faults
        holes: parseInt(formData.holes) || 0,
        dropStitch: parseInt(formData.dropStitch) || 0,
        lycraStitch: parseInt(formData.lycraStitch) || 0,
        lycraBreak: parseInt(formData.lycraBreak) || 0,
        ffd: parseInt(formData.ffd) || 0,
        needleBroken: parseInt(formData.needleBroken) || 0,
        knitFly: parseInt(formData.knitFly) || 0,
        oilSpots: parseInt(formData.oilSpots) || 0,
        oilLines: parseInt(formData.oilLines) || 0,
        verticalLines: parseInt(formData.verticalLines) || 0,
        // Summary
        grade: formData.grade || 'C', // Default to grade C for rejected rolls
        totalFaults: totalFaults,
        remarks: formData.remarks || 'Roll rejected during inspection',
        createdDate: new Date().toISOString(),
        // Flag for approval status (false = rejected)
        flag: false
      };
      
      // Call the inspection API
      const response = await InspectionService.createInspection(inspectionData);
      
      console.log('Roll inspection saved:', response);
      setIsLoading(false);
      toast.success('Success', 'Roll rejected successfully');
      
      // Reset form after successful submission
      setFormData({
        allotId: '',
        machineName: '',
        rollNo: '',
        // Spinning Faults
        thinPlaces: '0',
        thickPlaces: '0',
        thinLines: '0',
        thickLines: '0',
        doubleParallelYarn: '0',
        // Contamination Faults
        haidJute: '0',
        colourFabric: '0',
        // Column 3 Faults
        holes: '0',
        dropStitch: '0',
        lycraStitch: '0',
        lycraBreak: '0',
        ffd: '0',
        needleBroken: '0',
        knitFly: '0',
        oilSpots: '0',
        oilLines: '0',
        verticalLines: '0',
        // Summary
        grade: '',
        totalFaults: '0',
        remarks: '',
        // Flag for approval status
        flag: true
      });
      setAllotmentData(null);
      setSalesOrderData(null);
      setSelectedMachine(null);
    } catch (err) {
      console.error('Error rejecting roll:', err);
      setIsLoading(false);
      toast.error('Error', 'Failed to reject roll. Please try again.');
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
        <h1 className="text-3xl font-bold">Roll Inspection</h1>
        <p className="text-muted-foreground">
          Scan a barcode or enter details manually to inspect roll quality
        </p>
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-blue-800">Roll Inspection Details</CardTitle>
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
                  disabled={!!selectedMachine}
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
                  disabled={!!formData.allotId && !!formData.machineName}
                  className="text-sm h-9"
                />
              </div>
            </div>
            
            {/* Sales Order Description Section - Attractive Compact Display */}
            {salesOrderData && (
              <div className="mb-6">
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-sm rounded-lg">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm font-semibold text-purple-800">Roll Details</CardTitle>
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

            {/* Fabric Checking Report Sections */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-200 pb-2">Fabric Checking Report</h3>
              
              {/* Spinning Faults Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3 text-gray-700">1. Spinning Faults</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="thinPlaces" className="text-sm">Thin Places</Label>
                    <Input
                      id="thinPlaces"
                      name="thinPlaces"
                      type="number"
                      min="0"
                      value={formData.thinPlaces}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="thickPlaces" className="text-sm">Thick Places</Label>
                    <Input
                      id="thickPlaces"
                      name="thickPlaces"
                      type="number"
                      min="0"
                      value={formData.thickPlaces}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="thinLines" className="text-sm">Thin Lines</Label>
                    <Input
                      id="thinLines"
                      name="thinLines"
                      type="number"
                      min="0"
                      value={formData.thinLines}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="thickLines" className="text-sm">Thick Lines</Label>
                    <Input
                      id="thickLines"
                      name="thickLines"
                      type="number"
                      min="0"
                      value={formData.thickLines}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="doubleParallelYarn" className="text-sm">Double/Parallel Yarn</Label>
                    <Input
                      id="doubleParallelYarn"
                      name="doubleParallelYarn"
                      type="number"
                      min="0"
                      value={formData.doubleParallelYarn}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                </div>
              </div>
              
              {/* Contamination Faults Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3 text-gray-700">2. Contamination Faults</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="haidJute" className="text-sm">Haid Jute</Label>
                    <Input
                      id="haidJute"
                      name="haidJute"
                      type="number"
                      min="0"
                      value={formData.haidJute}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="colourFabric" className="text-sm">Colour Fabric</Label>
                    <Input
                      id="colourFabric"
                      name="colourFabric"
                      type="number"
                      min="0"
                      value={formData.colourFabric}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                </div>
              </div>
              
              {/* Column 3 Faults Section */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3 text-gray-700">3. Other Faults</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="holes" className="text-sm">Holes</Label>
                    <Input
                      id="holes"
                      name="holes"
                      type="number"
                      min="0"
                      value={formData.holes}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="dropStitch" className="text-sm">Drop Stitch</Label>
                    <Input
                      id="dropStitch"
                      name="dropStitch"
                      type="number"
                      min="0"
                      value={formData.dropStitch}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="lycraStitch" className="text-sm">Lycra Stitch</Label>
                    <Input
                      id="lycraStitch"
                      name="lycraStitch"
                      type="number"
                      min="0"
                      value={formData.lycraStitch}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="lycraBreak" className="text-sm">Lycra Break</Label>
                    <Input
                      id="lycraBreak"
                      name="lycraBreak"
                      type="number"
                      min="0"
                      value={formData.lycraBreak}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="ffd" className="text-sm">FFD</Label>
                    <Input
                      id="ffd"
                      name="ffd"
                      type="number"
                      min="0"
                      value={formData.ffd}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="needleBroken" className="text-sm">Needle Broken</Label>
                    <Input
                      id="needleBroken"
                      name="needleBroken"
                      type="number"
                      min="0"
                      value={formData.needleBroken}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="knitFly" className="text-sm">Knit Fly</Label>
                    <Input
                      id="knitFly"
                      name="knitFly"
                      type="number"
                      min="0"
                      value={formData.knitFly}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="oilSpots" className="text-sm">Oil Spots</Label>
                    <Input
                      id="oilSpots"
                      name="oilSpots"
                      type="number"
                      min="0"
                      value={formData.oilSpots}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="oilLines" className="text-sm">Oil Lines</Label>
                    <Input
                      id="oilLines"
                      name="oilLines"
                      type="number"
                      min="0"
                      value={formData.oilLines}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="verticalLines" className="text-sm">Vertical Lines</Label>
                    <Input
                      id="verticalLines"
                      name="verticalLines"
                      type="number"
                      min="0"
                      value={formData.verticalLines}
                      onChange={handleChange}
                      placeholder="Enter points"
                      className="text-sm h-9"
                    />
                  </div>
                </div>
              </div>
              
              {/* Summary Section */}
              <div className="border-t pt-4 mt-6">
                <h4 className="text-md font-semibold mb-3 text-gray-700">Inspection Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="grade" className="text-sm">Grade *</Label>
                    <Select 
                      value={formData.grade} 
                      onValueChange={(value) => handleSelectChange('grade', value)}
                    >
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="totalFaults" className="text-sm">Total Faults</Label>
                    <Input
                      id="totalFaults"
                      name="totalFaults"
                      type="number"
                      value={calculateTotalFaults()}
                      readOnly
                      className="text-sm h-9 bg-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-1 md:col-span-3">
                    <Label htmlFor="remarks" className="text-sm">Remarks</Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      placeholder="Enter any additional remarks"
                      className="text-sm"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={isLoading || isFetchingData}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Reject Roll'
                )}
              </Button>
              
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
                  'Approve Roll'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RollInspection;