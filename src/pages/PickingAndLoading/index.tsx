import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, ArrowLeft, Calendar, Scan, Truck } from 'lucide-react';
import { toast } from '@/lib/toast';

const PickingAndLoading = () => {
  const [activeTab, setActiveTab] = useState<'picking' | 'loading'>('picking');
  const [rollNumber, setRollNumber] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setLoadingDriverName] = useState('');
  const [loadingDate, setLoadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [pickedRolls, setPickedRolls] = useState<any[]>([]);
  const [loadedRolls, setLoadedRolls] = useState<any[]>([]);
  const [hasError, setHasError] = useState(false);

  // Picking functions
  const handleRollScan = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && rollNumber) {
      // Mock data for demonstration
      const newRoll = {
        id: Date.now(),
        rollNumber: rollNumber,
        lotNumber: 'LOT-' + Math.floor(Math.random() * 1000),
        product: 'Product A',
        quantity: Math.floor(Math.random() * 100) + 50,
        status: 'Picked',
      };
      
      setPickedRolls([...pickedRolls, newRoll]);
      setRollNumber('');
      toast.success('Success', 'Roll picked successfully');
    }
  };

  const removePickedRoll = (id: number) => {
    setPickedRolls(pickedRolls.filter(roll => roll.id !== id));
    toast.success('Success', 'Roll removed from picking list');
  };

  const submitPicking = () => {
    if (pickedRolls.length === 0) {
      toast.error('Error', 'Please pick at least one roll');
      return;
    }
    
    // Mock submission
    toast.success('Success', `Submitted ${pickedRolls.length} rolls for picking`);
    setPickedRolls([]);
  };

  // Loading functions
  const handleAddRoll = () => {
    // Mock data for demonstration
    const newRoll = {
      id: Date.now(),
      rollNumber: 'ROLL-' + Math.floor(Math.random() * 10000),
      lotNumber: 'LOT-' + Math.floor(Math.random() * 1000),
      customer: 'Customer ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      quantity: Math.floor(Math.random() * 100) + 50,
      status: 'Loaded',
    };
    
    setLoadedRolls([...loadedRolls, newRoll]);
    toast.success('Success', 'Roll added to loading list');
  };

  const removeLoadedRoll = (id: number) => {
    setLoadedRolls(loadedRolls.filter(roll => roll.id !== id));
    toast.success('Success', 'Roll removed from loading list');
  };

  const submitLoading = () => {
    if (!vehicleNo || !driverName) {
      toast.error('Error', 'Please enter vehicle number and driver name');
      return;
    }
    
    if (loadedRolls.length === 0) {
      toast.error('Error', 'Please add at least one roll to load');
      return;
    }
    
    // Mock submission
    toast.success('Success', `Submitted loading for ${loadedRolls.length} rolls`);
    setLoadedRolls([]);
    setVehicleNo('');
    setLoadingDriverName('');
    setRemarks('');
  };

  return (
    <div className="p-2 max-w-6xl mx-auto">
      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-semibold">
              Picking and Loading Operations
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white hover:bg-white/20 h-6 px-2"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
          </div>
          <p className="text-white/80 text-xs mt-1">
            Manage both picking and loading operations in one place
          </p>
        </CardHeader>

        <CardContent className="p-3">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'picking'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('picking')}
            >
              Picking Operations
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'loading'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('loading')}
            >
              Loading Operations
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'picking' ? (
            <div className="space-y-4">
              {/* Roll Scanning Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-3">
                <h3 className="text-xs font-semibold text-blue-800 mb-2">Scan Rolls for Picking</h3>
                <p className="text-xs text-blue-700/80 mb-2">
                  Scan or enter the roll number to add to picking list
                </p>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="rollNumber" className="text-xs font-medium text-gray-700">
                      Roll Number (Scan QR Code)
                    </Label>
                    <div className="relative">
                      <Scan className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="rollNumber"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        onKeyPress={handleRollScan}
                        placeholder="Scan QR code or enter roll number"
                        className={`pl-7 text-xs h-8 ${hasError ? 'bg-red-50 border-red-300' : 'bg-white'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Picked Rolls Summary */}
              {pickedRolls.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-green-800">Picked Rolls</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {pickedRolls.length} rolls
                    </span>
                  </div>

                  <div className="border rounded-md">
                    <Table>
                      <TableHeader className="bg-green-50">
                        <TableRow>
                          <TableHead className="text-xs font-medium text-green-700">Roll No</TableHead>
                          <TableHead className="text-xs font-medium text-green-700">Lot No</TableHead>
                          <TableHead className="text-xs font-medium text-green-700">Product</TableHead>
                          <TableHead className="text-xs font-medium text-green-700">Quantity</TableHead>
                          <TableHead className="text-xs font-medium text-green-700">Status</TableHead>
                          <TableHead className="text-xs font-medium text-green-700 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pickedRolls.map((roll) => (
                          <TableRow key={roll.id} className="border-b border-green-100">
                            <TableCell className="py-2 text-xs font-medium">{roll.rollNumber}</TableCell>
                            <TableCell className="py-2 text-xs">{roll.lotNumber}</TableCell>
                            <TableCell className="py-2 text-xs">{roll.product}</TableCell>
                            <TableCell className="py-2 text-xs">{roll.quantity} kg</TableCell>
                            <TableCell className="py-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {roll.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePickedRoll(roll.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-3">
                    <Button
                      variant="outline"
                      onClick={() => setPickedRolls([])}
                      className="h-8 px-3 text-xs"
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={submitPicking}
                      className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Submit Picking
                    </Button>
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-md p-3">
                <h3 className="text-xs font-semibold text-gray-800 mb-2">Picking Instructions</h3>
                <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                  <li>Scan the QR code on each roll to add it to the picking list</li>
                  <li>Verify that all roll details are correct before submitting</li>
                  <li>Use the remove button to delete incorrect entries</li>
                  <li>Click "Submit Picking" to finalize the picking operation</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Loading Details Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-3">
                <h3 className="text-xs font-semibold text-blue-800 mb-2">Loading Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="vehicleNo" className="text-xs font-medium text-gray-700">
                      Vehicle Number
                    </Label>
                    <div className="relative">
                      <Truck className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="vehicleNo"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value)}
                        placeholder="Enter vehicle number"
                        className={`pl-7 text-xs h-8 ${hasError && !vehicleNo ? 'bg-red-50 border-red-300' : 'bg-white'}`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="driverName" className="text-xs font-medium text-gray-700">
                      Driver Name
                    </Label>
                    <Input
                      id="driverName"
                      value={driverName}
                      onChange={(e) => setLoadingDriverName(e.target.value)}
                      placeholder="Enter driver name"
                      className={`text-xs h-8 ${hasError && !driverName ? 'bg-red-50 border-red-300' : 'bg-white'}`}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="loadingDate" className="text-xs font-medium text-gray-700">
                      Loading Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="loadingDate"
                        type="date"
                        value={loadingDate}
                        onChange={(e) => setLoadingDate(e.target.value)}
                        className="pl-7 text-xs h-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="remarks" className="text-xs font-medium text-gray-700">
                      Remarks
                    </Label>
                    <Textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Any additional remarks"
                      className="text-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Add Rolls Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold text-green-800">Add Rolls to Load</h3>
                  <Button
                    onClick={handleAddRoll}
                    className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                  >
                    Add Sample Roll
                  </Button>
                </div>
                <p className="text-xs text-green-700/80 mb-2">
                  Add rolls to the loading list for dispatch
                </p>
              </div>

              {/* Loaded Rolls Summary */}
              {loadedRolls.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-purple-800">Loaded Rolls</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {loadedRolls.length} rolls
                    </span>
                  </div>

                  <div className="border rounded-md">
                    <Table>
                      <TableHeader className="bg-purple-50">
                        <TableRow>
                          <TableHead className="text-xs font-medium text-purple-700">Roll No</TableHead>
                          <TableHead className="text-xs font-medium text-purple-700">Lot No</TableHead>
                          <TableHead className="text-xs font-medium text-purple-700">Customer</TableHead>
                          <TableHead className="text-xs font-medium text-purple-700">Quantity</TableHead>
                          <TableHead className="text-xs font-medium text-purple-700">Status</TableHead>
                          <TableHead className="text-xs font-medium text-purple-700 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadedRolls.map((roll) => (
                          <TableRow key={roll.id} className="border-b border-purple-100">
                            <TableCell className="py-2 text-xs font-medium">{roll.rollNumber}</TableCell>
                            <TableCell className="py-2 text-xs">{roll.lotNumber}</TableCell>
                            <TableCell className="py-2 text-xs">{roll.customer}</TableCell>
                            <TableCell className="py-2 text-xs">{roll.quantity} kg</TableCell>
                            <TableCell className="py-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {roll.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLoadedRoll(roll.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-3">
                    <Button
                      variant="outline"
                      onClick={() => setLoadedRolls([])}
                      className="h-8 px-3 text-xs"
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={submitLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-4 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Submit Loading
                    </Button>
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-md p-3">
                <h3 className="text-xs font-semibold text-gray-800 mb-2">Loading Instructions</h3>
                <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                  <li>Enter vehicle and driver details for the loading operation</li>
                  <li>Add rolls to the loading list using the "Add Sample Roll" button</li>
                  <li>Verify that all roll details are correct before submitting</li>
                  <li>Use the remove button to delete incorrect entries</li>
                  <li>Click "Submit Loading" to finalize the loading operation</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PickingAndLoading;