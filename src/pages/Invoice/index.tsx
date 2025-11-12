import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from '@/lib/toast';
import { dispatchPlanningApi, apiUtils } from '@/lib/api-client';
import type { DispatchPlanningDto } from '@/types/api-types';

interface DispatchOrderGroup {
  dispatchOrderId: string;
  customerName: string;
  lots: DispatchPlanningDto[];
  totalGrossWeight: number;
  totalNetWeight: number;
  dispatchDate: string;
}

const InvoicePage = () => {
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all fully dispatched orders on component mount
  useEffect(() => {
    loadFullyDispatchedOrders();
  }, []);

  const loadFullyDispatchedOrders = async () => {
    setIsLoading(true);
    try {
      // Get all dispatch planning records
      const response = await dispatchPlanningApi.getAllDispatchPlannings();
      const allDispatchPlannings = apiUtils.extractData(response);
      
      // Filter for fully dispatched orders only
      const fullyDispatched = allDispatchPlannings.filter(
        (order: DispatchPlanningDto) => order.isFullyDispatched
      );
      
      // Group by dispatch order ID
      const groupedOrders: Record<string, DispatchPlanningDto[]> = {};
      fullyDispatched.forEach((order: DispatchPlanningDto) => {
        if (!groupedOrders[order.dispatchOrderId]) {
          groupedOrders[order.dispatchOrderId] = [];
        }
        groupedOrders[order.dispatchOrderId].push(order);
      });
      
      // Convert to array with calculated totals
      const orderGroups: DispatchOrderGroup[] = Object.entries(groupedOrders).map(([dispatchOrderId, lots]) => {
        // Calculate totals
        const totalGrossWeight = lots.reduce((sum, lot) => sum + (lot.totalGrossWeight || 0), 0);
        const totalNetWeight = lots.reduce((sum, lot) => sum + (lot.totalNetWeight || 0), 0);
        
        // Get dispatch date (use the latest date among lots)
        const dispatchDate = lots.reduce((latest, lot) => {
          const lotDate = lot.dispatchEndDate || lot.dispatchStartDate;
          if (!latest || (lotDate && new Date(lotDate) > new Date(latest))) {
            return lotDate || latest;
          }
          return latest;
        }, '');
        
        return {
          dispatchOrderId,
          customerName: lots[0].customerName || 'N/A',
          lots,
          totalGrossWeight,
          totalNetWeight,
          dispatchDate: dispatchDate || new Date().toISOString()
        };
      });
      
      setDispatchOrders(orderGroups);
    } catch (error) {
      console.error('Error loading fully dispatched orders:', error);
      toast.error('Error', 'Failed to load fully dispatched orders');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-2 max-w-6xl mx-auto">
      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-semibold">
              Fully Dispatched Orders
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
            List of all fully dispatched orders ready for invoicing
          </p>
        </CardHeader>

        <CardContent className="p-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Loading fully dispatched orders...
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-md">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-xs font-medium text-gray-700">Dispatch Order ID</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Customer</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Lots</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700">Dispatch Date</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 text-right">Gross Weight (kg)</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 text-right">Net Weight (kg)</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchOrders.length > 0 ? (
                    dispatchOrders.map((orderGroup) => (
                      <TableRow key={orderGroup.dispatchOrderId} className="border-b border-gray-100">
                        <TableCell className="py-2 text-xs font-medium">{orderGroup.dispatchOrderId}</TableCell>
                        <TableCell className="py-2 text-xs">{orderGroup.customerName}</TableCell>
                        <TableCell className="py-2 text-xs">{orderGroup.lots.length}</TableCell>
                        <TableCell className="py-2 text-xs">{formatDate(orderGroup.dispatchDate)}</TableCell>
                        <TableCell className="py-2 text-xs text-right">{orderGroup.totalGrossWeight.toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-xs text-right">{orderGroup.totalNetWeight.toFixed(2)}</TableCell>
                        <TableCell className="py-2 text-right">
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              // In a full implementation, this would navigate to a detailed invoice view
                              toast.info('Info', `Would generate invoice for ${orderGroup.dispatchOrderId}`);
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Generate Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-4 text-center text-xs text-gray-500">
                        No fully dispatched orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicePage;