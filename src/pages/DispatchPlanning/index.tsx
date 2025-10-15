import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Package, Truck, Eye } from 'lucide-react';
import { toast } from '@/lib/toast';
import { storageCaptureApi, rollConfirmationApi, productionAllotmentApi, apiUtils } from '@/lib/api-client';
import type { 
  StorageCaptureResponseDto, 
  RollConfirmationResponseDto,
  ProductionAllotmentResponseDto
} from '@/types/api-types';

// Define types for our dispatch planning data
interface DispatchPlanningItem {
  lotNo: string;
  customerName: string;
  tape: string;
  totalRolls: number;
  totalNetWeight: number;
  totalActualQuantity: number;
  isDispatched: boolean;
  rolls: RollDetail[];
}

interface RollDetail {
  fgRollNo: string;
  netWeight: number;
  rollNo: string;
  machineName: string;
}

const DispatchPlanning = () => {
  const [dispatchItems, setDispatchItems] = useState<DispatchPlanningItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DispatchPlanningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLot, setSelectedLot] = useState<DispatchPlanningItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch dispatch planning data
  useEffect(() => {
    fetchDispatchPlanningData();
  }, []);

  // Filter items when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(dispatchItems);
    } else {
      const filtered = dispatchItems.filter(item => 
        item.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tape.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, dispatchItems]);

  const fetchDispatchPlanningData = async () => {
    try {
      setLoading(true);
      
      // Step 1: Fetch all storage captures
      const storageResponse = await storageCaptureApi.getAllStorageCaptures();
      const storageCaptures = apiUtils.extractData(storageResponse);
      
      // Group storage captures by lotNo
      const lotGroups: Record<string, StorageCaptureResponseDto[]> = {};
      
      storageCaptures.forEach(capture => {
        if (!lotGroups[capture.lotNo]) {
          lotGroups[capture.lotNo] = [];
        }
        lotGroups[capture.lotNo].push(capture);
      });
      
      // Step 2: For each lot, fetch roll details
      const dispatchItems: DispatchPlanningItem[] = [];
      
      for (const [lotNo, captures] of Object.entries(lotGroups)) {
        // Get unique roll numbers for this lot
        const uniqueRolls = Array.from(new Set(captures.map(c => c.fgRollNo)));
        
        // Fetch roll confirmation details for each roll
        const rollDetails: RollDetail[] = [];
        let totalNetWeight = 0;
        
        for (const fgRollNo of uniqueRolls) {
          try {
            // Get roll confirmations by lotNo
            const rollResponse = await rollConfirmationApi.getRollConfirmationsByAllotId(lotNo);
            const rollConfirmations = apiUtils.extractData(rollResponse);
            
            // Find the specific roll with matching fgRollNo
            const roll = rollConfirmations.find(r => r.fgRollNo?.toString() === fgRollNo);
            
            if (roll) {
              const netWeight = roll.netWeight || 0;
              totalNetWeight += netWeight;
              
              rollDetails.push({
                fgRollNo: roll.fgRollNo?.toString() || '',
                netWeight,
                rollNo: roll.rollNo,
                machineName: roll.machineName
              });
            }
          } catch (error) {
            console.error(`Error fetching roll details for ${fgRollNo}:`, error);
          }
        }
        
        // Get customer and tape info from first capture
        const firstCapture = captures[0];
        
        // Get total actual quantity from production allotment
        let totalActualQuantity = 0;
        try {
          const allotmentResponse = await productionAllotmentApi.getProductionAllotmentByAllotId(lotNo);
          const allotmentData = apiUtils.extractData(allotmentResponse);
          totalActualQuantity = allotmentData?.actualQuantity || 0;
        } catch (error) {
          console.error(`Error fetching production allotment data for ${lotNo}:`, error);
        }
        
        dispatchItems.push({
          lotNo,
          customerName: firstCapture.customerName,
          tape: firstCapture.tape,
          totalRolls: uniqueRolls.length,
          totalNetWeight,
          totalActualQuantity,
          isDispatched: captures.every(c => c.isDispatched),
          rolls: rollDetails
        });
      }
      
      setDispatchItems(dispatchItems);
      setFilteredItems(dispatchItems);
    } catch (error) {
      console.error('Error fetching dispatch planning data:', error);
      const errorMessage = apiUtils.handleError(error);
      toast.error('Error', errorMessage || 'Failed to fetch dispatch planning data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDispatchPlanningData();
  };

  const toggleDispatchStatus = async (lotNo: string, currentStatus: boolean) => {
    try {
      // Find all storage captures for this lot
      const storageResponse = await storageCaptureApi.getAllStorageCaptures();
      const storageCaptures = apiUtils.extractData(storageResponse);
      
      // Filter captures for this lot
      const lotCaptures = storageCaptures.filter(capture => capture.lotNo === lotNo);
      
      // Update each capture's dispatch status
      const updatePromises = lotCaptures.map(capture => {
        const updateDto = {
          lotNo: capture.lotNo,
          fgRollNo: capture.fgRollNo,
          locationCode: capture.locationCode,
          tape: capture.tape,
          customerName: capture.customerName,
          isDispatched: !currentStatus, // Toggle the status
          isActive: capture.isActive
        };
        
        return storageCaptureApi.updateStorageCapture(capture.id, updateDto);
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      toast.success('Success', `Dispatch status for lot ${lotNo} updated to ${currentStatus ? 'Pending' : 'Dispatched'}`);
      // Refresh the data
      fetchDispatchPlanningData();
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      const errorMessage = apiUtils.handleError(error);
      toast.error('Error', errorMessage || 'Failed to update dispatch status');
    }
  };

  return (
    <div className="p-2 max-w-7xl mx-auto">
      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-semibold">
              Dispatch Planning
            </CardTitle>
          </div>
          <p className="text-white/80 text-xs mt-1">
            Plan and manage dispatch of finished goods
          </p>
        </CardHeader>

        <CardContent className="p-3">
          {/* Search Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <Label htmlFor="search" className="text-xs font-medium text-gray-700 mb-1 block">
                  Search Lots
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by lot number, customer, or tape..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 text-xs h-8"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleRefresh}
                  variant="outline" 
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-xs text-blue-600 font-medium">Total Lots</div>
              <div className="text-lg font-bold text-blue-800">{filteredItems.length}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="text-xs text-green-600 font-medium">Total Rolls</div>
              <div className="text-lg font-bold text-green-800">
                {filteredItems.reduce((sum, item) => sum + item.totalRolls, 0)}
              </div>
            </div>
            <div className="bg-cyan-50 border border-cyan-200 rounded-md p-3">
              <div className="text-xs text-cyan-600 font-medium">Total Actual Qty (kg)</div>
              <div className="text-lg font-bold text-cyan-800">
                {filteredItems.reduce((sum, item) => sum + item.totalActualQuantity, 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
              <div className="text-xs text-purple-600 font-medium">Total Weight (kg)</div>
              <div className="text-lg font-bold text-purple-800">
                {filteredItems.reduce((sum, item) => sum + item.totalNetWeight, 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <div className="text-xs text-orange-600 font-medium">Pending Dispatch</div>
              <div className="text-lg font-bold text-orange-800">
                {filteredItems.filter(item => !item.isDispatched).length}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading dispatch data...</span>
            </div>
          )}

          {/* Dispatch Planning Table */}
          {!loading && (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-xs font-medium text-gray-700">Lot No</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Customer</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Tape</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Rolls</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Actual Qty (kg)</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Net Weight (kg)</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Status</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No dispatch planning data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
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
                        <TableCell className="py-3 flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setSelectedLot(item);
                              setIsModalOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant={item.isDispatched ? "outline" : "default"}
                            className="h-7 px-2 text-xs"
                            onClick={() => toggleDispatchStatus(item.lotNo, item.isDispatched)}
                          >
                            {item.isDispatched ? (
                              <>
                                <Package className="h-3 w-3 mr-1" />
                                Undispatch
                              </>
                            ) : (
                              <>
                                <Truck className="h-3 w-3 mr-1" />
                                Dispatch
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Roll Details Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Roll Details for Lot: {selectedLot?.lotNo} - {selectedLot?.customerName}
                </DialogTitle>
              </DialogHeader>
              {selectedLot && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                      <div className="text-xs text-blue-600 font-medium">Lot No</div>
                      <div className="text-sm font-medium">{selectedLot.lotNo}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-md p-2">
                      <div className="text-xs text-green-600 font-medium">Customer</div>
                      <div className="text-sm font-medium">{selectedLot.customerName}</div>
                    </div>
                    <div className="bg-cyan-50 border border-cyan-200 rounded-md p-2">
                      <div className="text-xs text-cyan-600 font-medium">Actual Qty (kg)</div>
                      <div className="text-sm font-medium">{selectedLot.totalActualQuantity.toFixed(2)}</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
                      <div className="text-xs text-purple-600 font-medium">Tape</div>
                      <div className="text-sm font-medium">{selectedLot.tape}</div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-xs py-2 px-3">FG Roll No</TableHead>
                          <TableHead className="text-xs py-2 px-3">Machine</TableHead>
                          <TableHead className="text-xs py-2 px-3">Roll No</TableHead>
                          <TableHead className="text-xs py-2 px-3">Net Weight (kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLot.rolls.map((roll) => (
                          <TableRow key={roll.fgRollNo} className="border-b border-gray-100">
                            <TableCell className="py-2 px-3 text-sm">{roll.fgRollNo}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{roll.machineName}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{roll.rollNo}</TableCell>
                            <TableCell className="py-2 px-3 text-sm font-medium">
                              {roll.netWeight.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50 font-medium">
                          <TableCell className="py-2 px-3 text-sm" colSpan={3}>
                            Total for Lot {selectedLot.lotNo}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            {selectedLot.totalNetWeight.toFixed(2)} kg
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default DispatchPlanning;