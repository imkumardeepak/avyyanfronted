import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { toast } from '@/lib/toast';
import { storageCaptureApi, apiUtils } from '@/lib/api-client';
import type { 
  StorageCaptureResponseDto,
  UpdateStorageCaptureRequestDto
} from '@/types/api-types';

// Define types for our dispatch details data
interface DispatchPlanningItem {
  lotNo: string;
  customerName: string;
  tape: string;
  totalRolls: number;
  totalNetWeight: number;
  totalActualQuantity: number;
  isDispatched: boolean;
  rolls: RollDetail[];
  dispatchRolls?: number; // Number of rolls to dispatch (optional)
}

interface RollDetail {
  fgRollNo: string;
  netWeight: number;
  rollNo: string;
  machineName: string;
}

// Define types for our dispatch details data
interface DispatchData {
  dispatchDate: string;
  vehicleNo: string;
  driverName: string;
  license: string;
  mobileNumber: string;
  remarks: string;
}

const DispatchDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedLots } = location.state || { selectedLots: [] };
  
  const [dispatchItems, setDispatchItems] = useState<DispatchPlanningItem[]>(
    selectedLots.map((item: DispatchPlanningItem) => ({
      ...item,
      dispatchRolls: item.totalRolls // Default to all rolls
    }))
  );
  const [loading, setLoading] = useState(false);
  const [dispatchData, setDispatchData] = useState<DispatchData>({
    dispatchDate: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    driverName: '',
    license: '',
    mobileNumber: '',
    remarks: ''
  });

  // Update dispatch status for all selected lots
  const handleDispatch = async () => {
    try {
      setLoading(true);
      
      // Get all storage captures for the selected lots
      const storageResponse = await storageCaptureApi.getAllStorageCaptures();
      const allStorageCaptures = apiUtils.extractData(storageResponse);
      
      // For each lot, update only the specified number of rolls
      const updatePromises = [];
      
      for (const item of dispatchItems) {
        // Get all captures for this lot
        const lotCaptures = allStorageCaptures.filter(capture => 
          capture.lotNo === item.lotNo
        );
        
        // Take only the specified number of rolls (or all if not specified)
        const rollsToDispatch = item.dispatchRolls !== undefined ? 
          Math.min(item.dispatchRolls, lotCaptures.length) : 
          lotCaptures.length;
        
        // Update the specified number of rolls
        const lotPromises = lotCaptures.slice(0, rollsToDispatch).map(capture => {
          const updateDto: UpdateStorageCaptureRequestDto = {
            lotNo: capture.lotNo,
            fgRollNo: capture.fgRollNo,
            locationCode: capture.locationCode,
            tape: capture.tape,
            customerName: capture.customerName,
            isDispatched: true, // Set to dispatched
            isActive: capture.isActive
          };
          
          return storageCaptureApi.updateStorageCapture(capture.id, updateDto);
        });
        
        updatePromises.push(...lotPromises);
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      const totalLots = dispatchItems.length;
      const totalRolls = dispatchItems.reduce((sum, item) => 
        sum + (item.dispatchRolls !== undefined ? item.dispatchRolls : item.totalRolls), 0);
      
      toast.success('Success', `Successfully dispatched ${totalLots} lots with ${totalRolls} rolls`);
      
      // Navigate back to dispatch planning
      navigate('/dispatch-planning');
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      const errorMessage = apiUtils.handleError(error);
      toast.error('Error', errorMessage || 'Failed to update dispatch status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 max-w-7xl mx-auto">
      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-semibold">
              Dispatch Details
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dispatch-planning')}
              className="text-white hover:bg-white/20 h-6 px-2"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
          </div>
          <p className="text-white/80 text-xs mt-1">
            Review and confirm dispatch details for selected lots
          </p>
        </CardHeader>

        <CardContent className="p-3">
          {/* Dispatch Information Form */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-3 mb-4">
            <h3 className="text-xs font-semibold text-blue-800 mb-2">Dispatch Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dispatchDate" className="text-xs font-medium text-gray-700">
                  Dispatch Date
                </Label>
                <Input
                  id="dispatchDate"
                  type="date"
                  value={dispatchData.dispatchDate}
                  onChange={(e) => setDispatchData({...dispatchData, dispatchDate: e.target.value})}
                  className="text-xs h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="vehicleNo" className="text-xs font-medium text-gray-700">
                  Vehicle Number
                </Label>
                <Input
                  id="vehicleNo"
                  placeholder="Enter vehicle number"
                  value={dispatchData.vehicleNo}
                  onChange={(e) => setDispatchData({...dispatchData, vehicleNo: e.target.value})}
                  className="text-xs h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="driverName" className="text-xs font-medium text-gray-700">
                  Driver Name
                </Label>
                <Input
                  id="driverName"
                  placeholder="Enter driver name"
                  value={dispatchData.driverName}
                  onChange={(e) => setDispatchData({...dispatchData, driverName: e.target.value})}
                  className="text-xs h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="license" className="text-xs font-medium text-gray-700">
                  License
                </Label>
                <Input
                  id="license"
                  placeholder="Enter license number"
                  value={dispatchData.license}
                  onChange={(e) => setDispatchData({...dispatchData, license: e.target.value})}
                  className="text-xs h-8"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="mobileNumber" className="text-xs font-medium text-gray-700">
                  Mobile Number
                </Label>
                <Input
                  id="mobileNumber"
                  placeholder="Enter mobile number"
                  value={dispatchData.mobileNumber}
                  onChange={(e) => setDispatchData({...dispatchData, mobileNumber: e.target.value})}
                  className="text-xs h-8"
                />
              </div>
              
              <div className="md:col-span-3 space-y-1">
                <Label htmlFor="remarks" className="text-xs font-medium text-gray-700">
                  Remarks
                </Label>
                <Input
                  id="remarks"
                  placeholder="Any additional remarks"
                  value={dispatchData.remarks}
                  onChange={(e) => setDispatchData({...dispatchData, remarks: e.target.value})}
                  className="text-xs h-8"
                />
              </div>
            </div>
          </div>

          {/* Selected Lots Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md p-3 mb-4">
            <h3 className="text-xs font-semibold text-green-800 mb-2">
              Selected Lots for Dispatch ({dispatchItems.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                <div className="text-xs text-blue-600 font-medium">Total Lots</div>
                <div className="text-lg font-bold text-blue-800">{dispatchItems.length}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-2">
                <div className="text-xs text-green-600 font-medium">Total Rolls</div>
                <div className="text-lg font-bold text-green-800">
                  {dispatchItems.reduce((sum, item) => sum + item.totalRolls, 0)}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                <div className="text-xs text-yellow-600 font-medium">Dispatch Rolls</div>
                <div className="text-lg font-bold text-yellow-800">
                  {dispatchItems.reduce((sum, item) => 
                    sum + (item.dispatchRolls !== undefined ? item.dispatchRolls : item.totalRolls), 0)}
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
                <div className="text-xs text-purple-600 font-medium">Total Weight (kg)</div>
                <div className="text-lg font-bold text-purple-800">
                  {dispatchItems.reduce((sum, item) => sum + item.totalNetWeight, 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-cyan-50 border border-cyan-200 rounded-md p-2">
                <div className="text-xs text-cyan-600 font-medium">Total Actual Qty (kg)</div>
                <div className="text-lg font-bold text-cyan-800">
                  {dispatchItems.reduce((sum, item) => sum + item.totalActualQuantity, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Lots Details */}
          <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-xs font-medium text-gray-700">Lot No</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Customer</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Tape</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Total Rolls</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Dispatch Rolls</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Actual Qty (kg)</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Net Weight (kg)</TableHead>
                  <TableHead className="text-xs font-medium text-gray-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatchItems.map((item, index) => (
                  <TableRow key={item.lotNo} className="border-b border-gray-100">
                    <TableCell className="py-3">
                      <div className="font-medium text-sm">{item.lotNo}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm">{item.customerName}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm">{item.tape}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm font-medium">{item.totalRolls}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Input
                        type="number"
                        min="0"
                        max={item.totalRolls}
                        value={item.dispatchRolls || 0}
                        onChange={(e) => {
                          const newDispatchRolls = parseInt(e.target.value) || 0;
                          const updatedItems = [...dispatchItems];
                          updatedItems[index] = {
                            ...item,
                            dispatchRolls: Math.min(newDispatchRolls, item.totalRolls)
                          };
                          setDispatchItems(updatedItems);
                        }}
                        className="text-xs h-8 w-20"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm font-medium">{item.totalActualQuantity.toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm font-medium">{item.totalNetWeight.toFixed(2)}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge 
                        variant={item.isDispatched ? "default" : "secondary"}
                        className={item.isDispatched ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                      >
                        {item.isDispatched ? "Dispatched" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/dispatch-planning')}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDispatch}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-xs"
            >
              {loading ? (
                <>
                  <div className="mr-1.5 h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Dispatching...
                </>
              ) : (
                <>
                  <Truck className="h-3 w-3 mr-1" />
                  Confirm Dispatch
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DispatchDetails;