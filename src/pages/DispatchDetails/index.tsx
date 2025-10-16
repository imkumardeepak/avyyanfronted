import { useState, useEffect, useRef } from 'react';
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
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, Truck, FileText, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/lib/toast';
import { storageCaptureApi, apiUtils } from '@/lib/api-client';
import type { StorageCaptureResponseDto, UpdateStorageCaptureRequestDto } from '@/types/api-types';

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
  salesOrder?: {
    id: number;
    voucherNumber: string;
    partyName: string;
  };
  salesOrderItemName?: string;
}

interface RollDetail {
  fgRollNo: string;
  netWeight: number;
  rollNo: string;
  machineName: string;
}

// New interface for grouping by sales order
interface SalesOrderGroup {
  salesOrderId: number;
  voucherNumber: string;
  partyName: string;
  customerName: string;
  allotments: DispatchPlanningItem[];
  totalRolls: number;
  totalNetWeight: number;
  totalActualQuantity: number;
  isFullyDispatched: boolean;
  dispatchRolls?: number; // Number of rolls to dispatch for the entire group
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

  // Group items by sales order
  const groupedItems: Record<number, SalesOrderGroup> = selectedLots.reduce(
    (acc, item: DispatchPlanningItem) => {
      const salesOrderId = item.salesOrder?.id || 0;

      if (!acc[salesOrderId]) {
        acc[salesOrderId] = {
          salesOrderId,
          voucherNumber: item.salesOrder?.voucherNumber || 'N/A',
          partyName: item.salesOrder?.partyName || 'N/A',
          customerName: item.customerName,
          allotments: [],
          totalRolls: 0,
          totalNetWeight: 0,
          totalActualQuantity: 0,
          isFullyDispatched: true,
          dispatchRolls: 0,
        };
      }

      acc[salesOrderId].allotments.push({
        ...item,
        dispatchRolls: item.dispatchRolls || item.totalRolls,
      });

      acc[salesOrderId].totalRolls += item.totalRolls;
      acc[salesOrderId].totalNetWeight += item.totalNetWeight;
      acc[salesOrderId].totalActualQuantity += item.totalActualQuantity;
      acc[salesOrderId].dispatchRolls =
        (acc[salesOrderId].dispatchRolls || 0) + (item.dispatchRolls || item.totalRolls);

      // If any allotment is not dispatched, the whole group is not fully dispatched
      if (!item.isDispatched) {
        acc[salesOrderId].isFullyDispatched = false;
      }

      return acc;
    },
    {} as Record<number, SalesOrderGroup>
  );

 
  // Initialize sequence numbers
  const groupedItemsArray: SalesOrderGroup[] = Object.values(groupedItems);
  groupedItemsArray.forEach((group: SalesOrderGroup, index) => {
    group.sequenceNumber = index + 1;
  });

  const [dispatchItems, setDispatchItems] = useState<SalesOrderGroup[]>(groupedItemsArray);
  const [loading, setLoading] = useState(false);
  const [dispatchData, setDispatchData] = useState<DispatchData>({
    dispatchDate: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    driverName: '',
    license: '',
    mobileNumber: '',
    remarks: '',
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'confirm'>('details');

  // Refs for drag and drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Function to handle drag start
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  // Function to handle drag enter
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  // Function to handle drag end (drop)
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    const newItems = [...dispatchItems];
    const draggedItem = newItems[dragItem.current];

    // Remove dragged item
    newItems.splice(dragItem.current, 1);
    // Insert dragged item at new position
    newItems.splice(dragOverItem.current, 0, draggedItem);

    // Update state
    setDispatchItems(newItems);

    // Reset positions
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Function to move sales order up in the sequence
  const moveSalesOrderUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...dispatchItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setDispatchItems(newItems);
  };

  // Function to move sales order down in the sequence
  const moveSalesOrderDown = (index: number) => {
    if (index >= dispatchItems.length - 1) return;
    const newItems = [...dispatchItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setDispatchItems(newItems);
  };

  // Update dispatch status for all selected lots
  const handleDispatch = async () => {
    try {
      setLoading(true);

      // Get all storage captures for the selected lots
      const storageResponse = await storageCaptureApi.getAllStorageCaptures();
      const allStorageCaptures = apiUtils.extractData(storageResponse);

      // For each lot, update only the specified number of rolls
      const updatePromises = [];

      for (const group of dispatchItems) {
        for (const item of group.allotments) {
          // Get all captures for this lot
          const lotCaptures = allStorageCaptures.filter(
            (capture: StorageCaptureResponseDto) => capture.lotNo === item.lotNo
          );

          // Take only the specified number of rolls (or all if not specified)
          const rollsToDispatch =
            item.dispatchRolls !== undefined
              ? Math.min(item.dispatchRolls, lotCaptures.length)
              : lotCaptures.length;

          // Update the specified number of rolls
          const lotPromises = lotCaptures.slice(0, rollsToDispatch).map((capture) => {
            const updateDto: UpdateStorageCaptureRequestDto = {
              lotNo: capture.lotNo,
              fgRollNo: capture.fgRollNo,
              locationCode: capture.locationCode,
              tape: capture.tape,
              customerName: capture.customerName,
              isDispatched: true, // Set to dispatched
              isActive: capture.isActive,
            };

            return storageCaptureApi.updateStorageCapture(capture.id, updateDto);
          });

          updatePromises.push(...lotPromises);
        }
      }

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      const totalGroups = dispatchItems.length;
      const totalLots = dispatchItems.reduce((sum, group) => sum + group.allotments.length, 0);
      const totalRolls = dispatchItems.reduce(
        (sum, group) =>
          sum +
          group.allotments.reduce(
            (itemSum, item) =>
              itemSum + (item.dispatchRolls !== undefined ? item.dispatchRolls : item.totalRolls),
            0
          ),
        0
      );

      toast.success(
        'Success',
        `Successfully dispatched ${totalGroups} sales orders with ${totalLots} lots and ${totalRolls} rolls`
      );

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
            <CardTitle className="text-white text-base font-semibold">Dispatch Details</CardTitle>
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
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`py-2 px-4 text-sm font-medium flex items-center ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('details')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Dispatch Information
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium flex items-center ${
                activeTab === 'confirm'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('confirm')}
              disabled={dispatchItems.length === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Dispatch
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div>
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
                      onChange={(e) =>
                        setDispatchData({ ...dispatchData, dispatchDate: e.target.value })
                      }
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
                      onChange={(e) =>
                        setDispatchData({ ...dispatchData, vehicleNo: e.target.value })
                      }
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
                      onChange={(e) =>
                        setDispatchData({ ...dispatchData, driverName: e.target.value })
                      }
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
                      onChange={(e) =>
                        setDispatchData({ ...dispatchData, license: e.target.value })
                      }
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
                      onChange={(e) =>
                        setDispatchData({ ...dispatchData, mobileNumber: e.target.value })
                      }
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
                      onChange={(e) =>
                        setDispatchData({ ...dispatchData, remarks: e.target.value })
                      }
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Lots Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md p-3 mb-4">
                <h3 className="text-xs font-semibold text-green-800 mb-2">
                  Selected Sales Orders for Dispatch ({dispatchItems.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                    <div className="text-xs text-blue-600 font-medium">Sales Orders</div>
                    <div className="text-lg font-bold text-blue-800">{dispatchItems.length}</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-md p-2">
                    <div className="text-xs text-green-600 font-medium">Total Lots</div>
                    <div className="text-lg font-bold text-green-800">
                      {dispatchItems.reduce((sum, group) => sum + group.allotments.length, 0)}
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                    <div className="text-xs text-yellow-600 font-medium">Dispatch Rolls</div>
                    <div className="text-lg font-bold text-yellow-800">
                      {dispatchItems.reduce(
                        (sum, group) =>
                          sum +
                          group.allotments.reduce(
                            (itemSum, item) =>
                              itemSum +
                              (item.dispatchRolls !== undefined
                                ? item.dispatchRolls
                                : item.totalRolls),
                            0
                          ),
                        0
                      )}
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
                    <div className="text-xs text-purple-600 font-medium">Total Weight (kg)</div>
                    <div className="text-lg font-bold text-purple-800">
                      {dispatchItems
                        .reduce((sum, group) => sum + group.totalNetWeight, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-cyan-50 border border-cyan-200 rounded-md p-2">
                    <div className="text-xs text-cyan-600 font-medium">Total Actual Qty (kg)</div>
                    <div className="text-lg font-bold text-cyan-800">
                      {dispatchItems
                        .reduce((sum, group) => sum + group.totalActualQuantity, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Lots Details */}
              <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-xs font-medium text-gray-700 w-12"></TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">SO Number</TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">Party</TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">Customer</TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">Allotments</TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">Total Rolls</TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">Dispatch Rolls</TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">
                        Allotments
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">
                        Total Rolls
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">
                        Dispatch Rolls
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">
                        Actual Qty (kg)
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">
                        Net Weight (kg)
                      </TableHead>
                      <TableHead className="text-xs font-medium text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatchItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          No dispatch details found
                        </TableCell>
                      </TableRow>
                    ) : (
                      dispatchItems.map((group) => (
                        <>
                          <TableRow
                            key={group.salesOrderId}
                            className="border-b border-gray-100 bg-gray-50"
                          >
                            <TableCell className="py-3">
                              <div className="font-medium text-sm">SO</div>
                            </TableCell>
                            <TableCell className="py-3 font-medium">
                              {group.voucherNumber}
                            </TableCell>
                            <TableCell className="py-3">{group.partyName}</TableCell>
                            <TableCell className="py-3">{group.customerName}</TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {group.allotments.length} lot
                                  {group.allotments.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 font-medium">{group.totalRolls}</TableCell>
                            <TableCell className="py-3">
                              <Input
                                type="number"
                                min="0"
                                max={group.totalRolls}
                                value={group.dispatchRolls || 0}
                                onChange={(e) => {
                                  const newDispatchRolls = parseInt(e.target.value) || 0;
                                  const updatedItems = [...dispatchItems];
                                  const groupIndex = updatedItems.findIndex(
                                    (g) => g.salesOrderId === group.salesOrderId
                                  );

                                  if (groupIndex !== -1) {
                                    updatedItems[groupIndex] = {
                                      ...group,
                                      dispatchRolls: Math.min(newDispatchRolls, group.totalRolls),
                                    };

                                    // Distribute rolls proportionally among allotments
                                    let remainingRolls = Math.min(
                                      newDispatchRolls,
                                      group.totalRolls
                                    );
                                    const updatedAllotments = group.allotments.map((allotment) => {
                                      if (remainingRolls <= 0) {
                                        return { ...allotment, dispatchRolls: 0 };
                                      }

                                      // Calculate proportional allocation
                                      const allotmentProportion =
                                        allotment.totalRolls / group.totalRolls;
                                      const allotmentRolls = Math.min(
                                        Math.round(allotmentProportion * newDispatchRolls),
                                        allotment.totalRolls,
                                        remainingRolls
                                      );

                                      remainingRolls -= allotmentRolls;

                                      return { ...allotment, dispatchRolls: allotmentRolls };
                                    });

                                    // Distribute any remaining rolls to the first allotments
                                    if (remainingRolls > 0) {
                                      for (
                                        let i = 0;
                                        i < updatedAllotments.length && remainingRolls > 0;
                                        i++
                                      ) {
                                        const allotment = updatedAllotments[i];
                                        if (allotment.dispatchRolls < allotment.totalRolls) {
                                          const additionalRolls = Math.min(
                                            remainingRolls,
                                            allotment.totalRolls - allotment.dispatchRolls
                                          );
                                          updatedAllotments[i] = {
                                            ...allotment,
                                            dispatchRolls:
                                              allotment.dispatchRolls + additionalRolls,
                                          };
                                          remainingRolls -= additionalRolls;
                                        }
                                      }
                                    }

                                    updatedItems[groupIndex] = {
                                      ...updatedItems[groupIndex],
                                      allotments: updatedAllotments,
                                      dispatchRolls: newDispatchRolls,
                                    };
                                  }

                                  setDispatchItems(updatedItems);
                                }}
                                className="text-xs h-8 w-20"
                              />
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge
                                variant={group.isFullyDispatched ? 'default' : 'secondary'}
                                className={
                                  group.isFullyDispatched
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {group.isFullyDispatched ? 'Dispatched' : 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {/* Expanded view for allotments in this group */}
                          {group.allotments.map((allotment, allotmentIndex) => (
                            <TableRow
                              key={`${group.salesOrderId}-${allotment.lotNo}`}
                              className="border-b border-gray-100"
                            >
                              <TableCell className="py-2 pl-8">
                                <div className="text-xs text-muted-foreground">Lot</div>
                              </TableCell>
                              <TableCell className="py-2 text-xs text-muted-foreground" colSpan={2}>
                                Allotment:
                              </TableCell>
                              <TableCell className="py-2" colSpan={2}>
                                <div className="font-medium text-sm">{allotment.lotNo}</div>
                                <div className="text-xs text-muted-foreground">
                                  {allotment.tape}
                                </div>
                              </TableCell>
                              <TableCell className="py-2">{allotment.totalRolls}</TableCell>
                              <TableCell className="py-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={allotment.totalRolls}
                                  value={allotment.dispatchRolls || 0}
                                  onChange={(e) => {
                                    const newDispatchRolls = parseInt(e.target.value) || 0;
                                    const updatedItems = [...dispatchItems];
                                    const groupIndex = updatedItems.findIndex(
                                      (g) => g.salesOrderId === group.salesOrderId
                                    );

                                    if (groupIndex !== -1) {
                                      const allotmentIndex = updatedItems[
                                        groupIndex
                                      ].allotments.findIndex((a) => a.lotNo === allotment.lotNo);
                                      if (allotmentIndex !== -1) {
                                        updatedItems[groupIndex].allotments[allotmentIndex] = {
                                          ...allotment,
                                          dispatchRolls: Math.min(
                                            newDispatchRolls,
                                            allotment.totalRolls
                                          ),
                                        };

                                        // Update group dispatch rolls total
                                        const groupDispatchRolls = updatedItems[
                                          groupIndex
                                        ].allotments.reduce(
                                          (sum, a) => sum + (a.dispatchRolls || 0),
                                          0
                                        );

                                        updatedItems[groupIndex] = {
                                          ...updatedItems[groupIndex],
                                          dispatchRolls: groupDispatchRolls,
                                        };
                                      }
                                    }

                                    setDispatchItems(updatedItems);
                                  }}
                                  className="text-xs h-8 w-20"
                                />
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge
                                  variant={allotment.isDispatched ? 'default' : 'secondary'}
                                  className={
                                    allotment.isDispatched
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {allotment.isDispatched ? 'Dispatched' : 'Pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Navigation Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setActiveTab('confirm')}
                  disabled={dispatchItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-xs"
                >
                  Review & Confirm Dispatch
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'confirm' && (
            <div>
              {/* Confirmation Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-3 mb-4">
                <h3 className="text-xs font-semibold text-blue-800 mb-2">Dispatch Confirmation</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Please review the details below before confirming the dispatch. You can reorder
                  the sales orders as needed.
                </p>

                {/* Dispatch Information Review */}
                <div className="bg-white border border-gray-200 rounded-md p-3 mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Dispatch Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">Dispatch Date</Label>
                      <div className="text-sm">{dispatchData.dispatchDate || 'N/A'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Vehicle Number</Label>
                      <div className="text-sm">{dispatchData.vehicleNo || 'N/A'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Driver Name</Label>
                      <div className="text-sm">{dispatchData.driverName || 'N/A'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">License</Label>
                      <div className="text-sm">{dispatchData.license || 'N/A'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Mobile Number</Label>
                      <div className="text-sm">{dispatchData.mobileNumber || 'N/A'}</div>
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs text-gray-500">Remarks</Label>
                      <div className="text-sm">{dispatchData.remarks || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Sequence Reordering Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <h4 className="text-xs font-semibold text-yellow-800 mb-1">
                    Reorder Sales Orders
                  </h4>
                  <p className="text-xs text-yellow-700">
                    Drag and drop the sales orders to reorder them in the sequence you want them to
                    be dispatched.
                  </p>
                </div>

                {/* Dispatch Sequence Table */}
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-xs font-medium text-gray-700 w-16">
                          Order
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700">
                          SO Number
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700">Party</TableHead>
                        <TableHead className="text-xs font-medium text-gray-700">
                          Customer
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700">
                          Allotments
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700">
                          Total Rolls
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700">
                          Dispatch Rolls
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispatchItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No sales orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        dispatchItems.map((group, index) => (
                          <TableRow
                            key={group.salesOrderId}
                            className="border-b border-gray-100"
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={handleDragEnd}
                          >
                            <TableCell className="py-3">
                              <div className="font-medium text-sm cursor-move">#{index + 1} ≡</div>
                            </TableCell>
                            <TableCell className="py-3 font-medium">
                              {group.voucherNumber}
                            </TableCell>
                            <TableCell className="py-3">{group.partyName}</TableCell>
                            <TableCell className="py-3">{group.customerName}</TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {group.allotments.length} lot
                                  {group.allotments.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">{group.totalRolls}</TableCell>
                            <TableCell className="py-3">
                              {group.allotments.reduce(
                                (sum, item) =>
                                  sum +
                                  (item.dispatchRolls !== undefined
                                    ? item.dispatchRolls
                                    : item.totalRolls),
                                0
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moveSalesOrderUp(index)}
                                  disabled={index === 0}
                                  className="h-6 w-6 p-0"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moveSalesOrderDown(index)}
                                  disabled={index === dispatchItems.length - 1}
                                  className="h-6 w-6 p-0"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Dispatch Summary */}
                <div className="bg-white border border-gray-200 rounded-md p-3 mt-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Dispatch Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                      <div className="text-xs text-blue-600 font-medium">Sales Orders</div>
                      <div className="text-lg font-bold text-blue-800">{dispatchItems.length}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-md p-2">
                      <div className="text-xs text-green-600 font-medium">Total Lots</div>
                      <div className="text-lg font-bold text-green-800">
                        {dispatchItems.reduce((sum, group) => sum + group.allotments.length, 0)}
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                      <div className="text-xs text-yellow-600 font-medium">Dispatch Rolls</div>
                      <div className="text-lg font-bold text-yellow-800">
                        {dispatchItems.reduce(
                          (sum, group) =>
                            sum +
                            group.allotments.reduce(
                              (itemSum, item) =>
                                itemSum +
                                (item.dispatchRolls !== undefined
                                  ? item.dispatchRolls
                                  : item.totalRolls),
                              0
                            ),
                          0
                        )}
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
                      <div className="text-xs text-purple-600 font-medium">Total Weight (kg)</div>
                      <div className="text-lg font-bold text-purple-800">
                        {dispatchItems
                          .reduce((sum, group) => sum + group.totalNetWeight, 0)
                          .toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-cyan-50 border border-cyan-200 rounded-md p-2">
                      <div className="text-xs text-cyan-600 font-medium">Total Actual Qty (kg)</div>
                      <div className="text-lg font-bold text-cyan-800">
                        {dispatchItems
                          .reduce((sum, group) => sum + group.totalActualQuantity, 0)
                          .toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <h3 className="text-xs font-semibold text-yellow-800 mb-1">Important Notice</h3>
                <p className="text-xs text-yellow-700">
                  Once you confirm the dispatch, the status of the selected items will be updated
                  and this action cannot be undone. Please ensure all details are correct before
                  proceeding.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('details')}
                  className="h-8 px-3 text-xs"
                >
                  Back to Details
                </Button>
                <div className="space-x-2">
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DispatchDetails;
