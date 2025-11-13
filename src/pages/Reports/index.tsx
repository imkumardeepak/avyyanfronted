import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Download, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';
import { rollConfirmationApi, salesOrderApi, productionAllotmentApi } from '@/lib/api-client';
import type { RollConfirmationResponseDto, SalesOrderDto, ProductionAllotmentResponseDto } from '@/types/api-types';
import { DatePicker } from '@/components/ui/date-picker';

// Define types
interface FilterOptions {
  fromDate: Date | null;
  toDate: Date | null;
  lotNo: string;
  machineName: string;
  shift: string;
  customerName: string;
  salesOrder: string;
}

interface GroupedReportData {
  id: string;
  date: string;
  shift: string;
  machineName: string;
  lotNo: string;
  customerName: string;
  salesOrder: string;
  rollCount: number;
  totalWeight: number;
  avgGsm: number;
  avgWidth: number;
}

interface ExtendedRollConfirmation extends RollConfirmationResponseDto {
  customerName?: string;
  salesOrder?: string;
}

const Reports: React.FC = () => {
  // State for filters
  const [filters, setFilters] = useState<FilterOptions>({
    fromDate: new Date(), // Set default to current date
    toDate: new Date(),
    lotNo: '__all_lots__',
    machineName: '__all_machines__',
    shift: '__all_shifts__',
    customerName: '__all_customers__',
    salesOrder: '__all_sales_orders__',
  });

  // State for data
  const [rollConfirmations, setRollConfirmations] = useState<ExtendedRollConfirmation[]>([]);
  const [filteredRollConfirmations, setFilteredRollConfirmations] = useState<ExtendedRollConfirmation[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedReportData[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupedReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uniqueLots, setUniqueLots] = useState<string[]>([]);
  const [uniqueMachines, setUniqueMachines] = useState<string[]>([]);
  const [uniqueCustomers, setUniqueCustomers] = useState<string[]>([]);
  const [uniqueSalesOrders, setUniqueSalesOrders] = useState<string[]>([]);
  const [allSalesOrders, setAllSalesOrders] = useState<SalesOrderDto[]>([]);
  const [allProductionAllotments, setAllProductionAllotments] = useState<ProductionAllotmentResponseDto[]>([]);

  // Fetch all roll confirmations on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [rollConfirmations, filters]);

  // Group data when filtered data changes
  useEffect(() => {
    groupData();
  }, [filteredRollConfirmations]);

  // Extract unique values for filter dropdowns
  useEffect(() => {
    const lots = Array.from(new Set(rollConfirmations.map(item => item.allotId)));
    const machines = Array.from(new Set(rollConfirmations.map(item => item.machineName)));
    const customers = Array.from(new Set(rollConfirmations.map(item => item.customerName || 'Unknown Customer')));
    const salesOrders = Array.from(new Set(rollConfirmations.map(item => item.salesOrder || 'Unknown Sales Order')));
    
    setUniqueLots(lots);
    setUniqueMachines(machines);
    setUniqueCustomers(customers);
    setUniqueSalesOrders(salesOrders);
  }, [rollConfirmations]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [rollConfirmationsResponse, salesOrdersResponse, productionAllotmentsResponse] = await Promise.all([
        rollConfirmationApi.getAllRollConfirmations(),
        salesOrderApi.getAllSalesOrders(),
        productionAllotmentApi.getAllProductionAllotments()
      ]);
      
      setAllSalesOrders(salesOrdersResponse.data);
      setAllProductionAllotments(productionAllotmentsResponse.data);
      
      // Enrich roll confirmations with customer and sales order data
      const enrichedRollConfirmations = rollConfirmationsResponse.data.map(roll => {
        // Find the production allotment for this roll
        const productionAllotment = productionAllotmentsResponse.data.find(pa => pa.allotmentId === roll.allotId);
        
        if (productionAllotment) {
          // Find the sales order for this production allotment
          const salesOrder = salesOrdersResponse.data.find(so => so.id === productionAllotment.salesOrderId);
          
          if (salesOrder) {
            return {
              ...roll,
              customerName: salesOrder.partyName,
              salesOrder: salesOrder.voucherNumber
            };
          }
        }
        
        // Return roll with default values if no matching data found
        return {
          ...roll,
          customerName: 'Unknown Customer',
          salesOrder: 'Unknown Sales Order'
        };
      });
      
      setRollConfirmations(enrichedRollConfirmations);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...rollConfirmations];

    // Apply date filters
    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(item => new Date(item.createdDate) >= fromDate);
    }

    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(item => new Date(item.createdDate) <= toDate);
    }

    // Apply lot filter (ignore if "All Lots" is selected)
    if (filters.lotNo && filters.lotNo !== '__all_lots__') {
      // For search-based filtering, check if the lotNo is included in the allotId
      if (filters.lotNo !== '__search__') {
        result = result.filter(item => item.allotId.includes(filters.lotNo));
      }
    }

    // Apply machine filter (ignore if "All Machines" is selected)
    if (filters.machineName && filters.machineName !== '__all_machines__') {
      // For search-based filtering, check if the machineName is included in the machineName
      if (filters.machineName !== '__search__') {
        result = result.filter(item => item.machineName.includes(filters.machineName));
      }
    }

    // Apply customer filter (ignore if "All Customers" is selected)
    if (filters.customerName && filters.customerName !== '__all_customers__') {
      // For search-based filtering, check if the customerName is included in the customerName
      if (filters.customerName !== '__search__') {
        result = result.filter(item => item.customerName?.includes(filters.customerName));
      }
    }

    // Apply sales order filter (ignore if "All Sales Orders" is selected)
    if (filters.salesOrder && filters.salesOrder !== '__all_sales_orders__') {
      // For search-based filtering, check if the salesOrder is included in the salesOrder
      if (filters.salesOrder !== '__search__') {
        result = result.filter(item => item.salesOrder?.includes(filters.salesOrder));
      }
    }

    setFilteredRollConfirmations(result);
  };

  const groupData = () => {
    // Group by date, shift, machine, lot
    const grouped: Record<string, ExtendedRollConfirmation[]> = {};
    
    filteredRollConfirmations.forEach(item => {
      const date = format(new Date(item.createdDate), 'yyyy-MM-dd');
      const key = `${date}__A__${item.machineName}__${item.allotId}`; // Using A as placeholder for shift
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // Convert to GroupedReportData format
    const groupedArray: GroupedReportData[] = Object.entries(grouped).map(([key, items]) => {
      const [date, shift, machineName, lotNo] = key.split('__');
      
      const totalWeight = items.reduce((sum, item) => sum + (item.netWeight || 0), 0);
      const avgGsm = items.reduce((sum, item) => sum + (item.greyGsm || 0), 0) / items.length;
      const avgWidth = items.reduce((sum, item) => sum + (item.greyWidth || 0), 0) / items.length;
      
      return {
        id: key,
        date,
        shift,
        machineName,
        lotNo,
        customerName: items[0]?.customerName || 'Unknown Customer',
        salesOrder: items[0]?.salesOrder || 'Unknown Sales Order',
        rollCount: items.length,
        totalWeight,
        avgGsm,
        avgWidth
      };
    });

    setGroupedData(groupedArray);
  };

  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      fromDate: new Date(),
      toDate: new Date(),
      lotNo: '__all_lots__',
      machineName: '__all_machines__',
      shift: '__all_shifts__',
      customerName: '__all_customers__',
      salesOrder: '__all_sales_orders__',
    });
  };

  const viewGroupDetails = (group: GroupedReportData) => {
    // Filter roll confirmations for this group
    const groupRolls = filteredRollConfirmations.filter(item => {
      const date = format(new Date(item.createdDate), 'yyyy-MM-dd');
      return (
        date === group.date &&
        item.machineName === group.machineName &&
        item.allotId === group.lotNo
      );
    });
    
    setSelectedGroup({...group, rollCount: groupRolls.length});
  };

  const exportToExcel = () => {
    try {
      // Create CSV content
      let headers: string[];
      let rows: string[][];
      
      if (selectedGroup) {
        // Export detailed data for selected group
        headers = [
          'Date',
          'Shift',
          'Machine No',
          'Lot No',
          'Customer Name',
          'Sales Order',
          'Roll No',
          'Fabric Type',
          'GSM',
          'Width (inch)',
          'Roll Length (Meter)',
          'Weight (Kg)',
          'Operator Name',
          'Remarks'
        ];
        
        const groupRolls = filteredRollConfirmations.filter(item => {
          const date = format(new Date(item.createdDate), 'yyyy-MM-dd');
          return (
            date === selectedGroup.date &&
            item.machineName === selectedGroup.machineName &&
            item.allotId === selectedGroup.lotNo
          );
        });
        
        rows = groupRolls.map(item => [
          format(new Date(item.createdDate), 'dd-MM-yyyy'),
          'A', // Placeholder for shift
          item.machineName,
          item.allotId,
          item.customerName || 'Unknown Customer',
          item.salesOrder || 'Unknown Sales Order',
          item.rollNo,
          'Fabric Type', // Placeholder for fabric type
          item.greyGsm?.toString() || '',
          item.greyWidth?.toString() || '',
          '', // Placeholder for roll length
          item.netWeight?.toString() || '',
          'Operator Name', // Placeholder for operator name
          'Remarks' // Placeholder for remarks
        ]);
      } else {
        // Export grouped data
        headers = [
          'Date',
          'Shift',
          'Machine No',
          'Lot No',
          'Customer Name',
          'Sales Order',
          'Roll Count',
          'Total Weight (Kg)',
          'Avg GSM',
          'Avg Width (inch)'
        ];
        
        rows = groupedData.map(item => [
          format(new Date(item.date), 'dd-MM-yyyy'),
          item.shift,
          item.machineName,
          item.lotNo,
          item.customerName,
          item.salesOrder,
          item.rollCount.toString(),
          item.totalWeight.toFixed(2),
          item.avgGsm.toFixed(0),
          item.avgWidth.toFixed(0)
        ]);
      }

      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(field => `"${field}"`).join(',') + '\n';
      });

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = selectedGroup 
        ? `roll_details_${selectedGroup.date}_${selectedGroup.machineName}_${selectedGroup.lotNo}_${new Date().toISOString().slice(0, 10)}.csv`
        : `roll_report_${new Date().toISOString().slice(0, 10)}.csv`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Success', 'Report exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error', 'Failed to export report to Excel');
    }
  };

  const exportToPDF = () => {
    toast.info('Info', 'PDF export functionality will be implemented in a future update');
  };

  const backToGroupedView = () => {
    setSelectedGroup(null);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Roll Confirmation Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Section */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <div className="relative">
                  <DatePicker
                    date={filters.fromDate || undefined}
                    onDateChange={(date: Date | undefined) => handleFilterChange('fromDate', date || null)}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div>
                <Label htmlFor="toDate">To Date</Label>
                <div className="relative">
                  <DatePicker
                    date={filters.toDate || undefined}
                    onDateChange={(date: Date | undefined) => handleFilterChange('toDate', date || null)}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div>
                <Label htmlFor="lotNo">Lot No</Label>
                <Input
                  placeholder="Search lot..."
                  value={filters.lotNo === '__all_lots__' || filters.lotNo === '__search__' ? '' : filters.lotNo}
                  onChange={(e) => handleFilterChange('lotNo', e.target.value || '__all_lots__')}
                />
              </div>

              <div>
                <Label htmlFor="machineName">Machine</Label>
                <Input
                  placeholder="Search machine..."
                  value={filters.machineName === '__all_machines__' || filters.machineName === '__search__' ? '' : filters.machineName}
                  onChange={(e) => handleFilterChange('machineName', e.target.value || '__all_machines__')}
                />
              </div>

              <div>
                <Label htmlFor="shift">Shift</Label>
                <Select
                  value={filters.shift}
                  onValueChange={(value) => handleFilterChange('shift', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all_shifts__">All Shifts</SelectItem>
                    <SelectItem value="A">Shift A</SelectItem>
                    <SelectItem value="B">Shift B</SelectItem>
                    <SelectItem value="C">Shift C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customerName">Customer</Label>
                <Input
                  placeholder="Search customer..."
                  value={filters.customerName === '__all_customers__' || filters.customerName === '__search__' ? '' : filters.customerName}
                  onChange={(e) => handleFilterChange('customerName', e.target.value || '__all_customers__')}
                />
              </div>

              <div>
                <Label htmlFor="salesOrder">Sales Order</Label>
                <Input
                  placeholder="Search sales order..."
                  value={filters.salesOrder === '__all_sales_orders__' || filters.salesOrder === '__search__' ? '' : filters.salesOrder}
                  onChange={(e) => handleFilterChange('salesOrder', e.target.value || '__all_sales_orders__')}
                />
              </div>

              <div className="flex items-end space-x-2">
                <Button onClick={handleResetFilters} variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              {selectedGroup 
                ? `Showing details for ${selectedGroup.date} - ${selectedGroup.machineName} - ${selectedGroup.lotNo}`
                : `Showing ${groupedData.length} grouped records`
              }
            </div>
            <div className="space-x-2">
              {selectedGroup && (
                <Button onClick={backToGroupedView} variant="outline" className="mr-2">
                  Back to Grouped View
                </Button>
              )}
              <Button onClick={exportToExcel} disabled={loading || (selectedGroup ? filteredRollConfirmations.length === 0 : groupedData.length === 0)}>
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" disabled={loading || (selectedGroup ? filteredRollConfirmations.length === 0 : groupedData.length === 0)}>
                <Download className="h-4 w-4 mr-2" />
                Export to PDF
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading reports...</span>
            </div>
          )}

          {/* Results Table */}
          {!loading && (
            <>
              <div className="border rounded-lg overflow-hidden">
                {selectedGroup ? (
                  // Detailed view for selected group
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Machine No</TableHead>
                        <TableHead>Lot No</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Sales Order</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Fabric Type</TableHead>
                        <TableHead>GSM</TableHead>
                        <TableHead>Width (inch)</TableHead>
                        <TableHead>Roll Length (Meter)</TableHead>
                        <TableHead>Weight (Kg)</TableHead>
                        <TableHead>Operator Name</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRollConfirmations
                        .filter(item => {
                          const date = format(new Date(item.createdDate), 'yyyy-MM-dd');
                          return (
                            date === selectedGroup.date &&
                            item.machineName === selectedGroup.machineName &&
                            item.allotId === selectedGroup.lotNo
                          );
                        })
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{format(new Date(item.createdDate), 'dd-MM-yyyy')}</TableCell>
                            <TableCell>A</TableCell>
                            <TableCell>{item.machineName}</TableCell>
                            <TableCell>{item.allotId}</TableCell>
                            <TableCell>{item.customerName || 'Unknown Customer'}</TableCell>
                            <TableCell>{item.salesOrder || 'Unknown Sales Order'}</TableCell>
                            <TableCell>{item.rollNo}</TableCell>
                            <TableCell>Fabric Type</TableCell>
                            <TableCell>{item.greyGsm?.toFixed(0) || 'N/A'}</TableCell>
                            <TableCell>{item.greyWidth?.toFixed(0) || 'N/A'}</TableCell>
                            <TableCell>Roll Length</TableCell>
                            <TableCell>{item.netWeight?.toFixed(2) || 'N/A'}</TableCell>
                            <TableCell>Operator Name</TableCell>
                            <TableCell>Remarks</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                ) : (
                  // Grouped view
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Machine No</TableHead>
                        <TableHead>Lot No</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Sales Order</TableHead>
                        <TableHead>Roll Count</TableHead>
                        <TableHead>Total Weight (Kg)</TableHead>
                        <TableHead>Avg GSM</TableHead>
                        <TableHead>Avg Width (inch)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedData.length > 0 ? (
                        groupedData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{format(new Date(item.date), 'dd-MM-yyyy')}</TableCell>
                            <TableCell>{item.shift}</TableCell>
                            <TableCell>{item.machineName}</TableCell>
                            <TableCell>{item.lotNo}</TableCell>
                            <TableCell>{item.customerName}</TableCell>
                            <TableCell>{item.salesOrder}</TableCell>
                            <TableCell>{item.rollCount}</TableCell>
                            <TableCell>{item.totalWeight.toFixed(2)}</TableCell>
                            <TableCell>{item.avgGsm.toFixed(0)}</TableCell>
                            <TableCell>{item.avgWidth.toFixed(0)}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => viewGroupDetails(item)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                            No data found matching the selected filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;