import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiUtils } from '@/lib/api-client';
import { useUnprocessedSalesOrders } from '@/hooks/queries/useSalesOrderQueries';
import { formatDate } from '@/lib/utils';
import { Eye, RefreshCw } from 'lucide-react';
import type { Row } from '@tanstack/react-table';
import type { SalesOrderDto, SalesOrderItemDto } from '@/types/api-types';
import { vouchersApi } from '@/lib/api-client';

type SalesOrderCellProps = { row: Row<SalesOrderDto> };

const SalesOrderManagement = () => {
  const { data: salesOrders = [], isLoading, error, refetch } = useUnprocessedSalesOrders();
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call getAllVouchers API
      await vouchersApi.getAllVouchers();
      // Refetch sales orders
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewItems = (order: SalesOrderDto) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const columns = [
    {
      accessorKey: 'voucherNumber',
      header: 'Voucher Number',
      cell: ({ row }: SalesOrderCellProps) => {
        const order = row.original;
        return <div className="font-medium text-primary">{order.voucherNumber}</div>;
      },
    },
    {
      accessorKey: 'partyName',
      header: 'Party Name',
      cell: ({ row }: SalesOrderCellProps) => {
        const order = row.original;
        return <div>{order.partyName}</div>;
      },
    },
    {
      accessorKey: 'salesDate',
      header: 'Sales Date',
      cell: ({ row }: SalesOrderCellProps) => {
        const order = row.original;
        return <div>{formatDate(new Date(order.salesDate))}</div>;
      },
    },
    // {
    //   accessorKey: 'reference',
    //   header: 'Reference',
    //   cell: ({ row }: SalesOrderCellProps) => {
    //     const order = row.original;
    //     return <div>{order.reference}</div>;
    //   },
    // },
    {
      accessorKey: 'items',
      header: 'Items Count',
      cell: ({ row }: SalesOrderCellProps) => {
        const order = row.original;
        return <div>{order.items.length}</div>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: SalesOrderCellProps) => {
        const order = row.original;
        return (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleViewItems(order)}>
              <Eye className="h-4 w-4 mr-1" />
              View Items
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    const errorMessage = apiUtils.handleError(error);
    return (
      <div className="text-center text-red-500 p-4">Error loading sales orders: {errorMessage}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display">Sales Order Management</h1>
          <p className="text-muted-foreground">Manage unprocessed sales orders</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unprocessed Sales Orders</CardTitle>
          <span className="text-sm font-normal text-muted-foreground">
            ({salesOrders.length} orders)
          </span>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={salesOrders}
            searchKey="voucherNumber"
            searchPlaceholder="Search by voucher number..."
          />
        </CardContent>
      </Card>

      {/* Sales Order Items Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              Sales Order Items
              {selectedOrder && (
                <div className="text-sm font-normal mt-2">
                  Voucher:{' '}
                  <span className="text-primary font-medium">{selectedOrder.voucherNumber}</span> |
                  Party: {selectedOrder.partyName}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-grow w-full rounded-md h-[calc(90vh-8rem)]">
            <div className="p-4">
              {selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Voucher Number:</span>{' '}
                          <span className="text-primary font-medium">
                            {selectedOrder.voucherNumber}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Party Name:</span> {selectedOrder.partyName}
                        </p>
                        <p>
                          <span className="font-medium">Sales Date:</span>{' '}
                          {formatDate(new Date(selectedOrder.salesDate))}
                        </p>
                        <p>
                          <span className="font-medium">Reference:</span> {selectedOrder.reference}
                        </p>
                        <p>
                          <span className="font-medium">GST Registration:</span>{' '}
                          {selectedOrder.gstRegistrationType}
                        </p>
                        <p>
                          <span className="font-medium">State:</span> {selectedOrder.stateName}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Voucher Type:</span> {selectedOrder.vchType}
                        </p>
                        <p>
                          <span className="font-medium">Process Flag:</span>{' '}
                          {selectedOrder.processFlag}
                          {selectedOrder.processFlag === 0 && (
                            <span className="ml-2 inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                              Unprocessed
                            </span>
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Created At:</span>{' '}
                          {formatDate(new Date(selectedOrder.createdAt))}
                        </p>
                        <p>
                          <span className="font-medium">Created By:</span> {selectedOrder.createdBy}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Items ({selectedOrder.items.length})
                    </h3>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted z-10">
                          <tr>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[200px]">
                              Item Name
                            </th>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[120px]">
                              Rate
                            </th>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[120px]">
                              Amount
                            </th>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[120px]">
                              Actual Qty
                            </th>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[120px]">
                              Billed Qty
                            </th>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[150px]">
                              Batch
                            </th>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[200px]">
                              Description
                            </th>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[150px]">
                              Order No
                            </th>
                            <th className="text-left p-3 sticky top-0 bg-muted z-10 min-w-[120px]">
                              Due Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item: SalesOrderItemDto) => (
                            <tr key={item.id} className="border-t hover:bg-muted/50">
                              <td className="p-3 whitespace-normal break-words">
                                {item.stockItemName}
                              </td>
                              <td className="p-3">{item.rate}</td>
                              <td className="p-3">{item.amount}</td>
                              <td className="p-3">{item.actualQty}</td>
                              <td className="p-3">{item.billedQty}</td>
                              <td className="p-3">{item.batchName}</td>
                              <td className="p-3 whitespace-normal break-words">
                                {item.descriptions || '-'}
                              </td>
                              <td className="p-3">{item.orderNo}</td>
                              <td className="p-3">{item.orderDueDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {selectedOrder.orderTerms && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Order Terms</h3>
                      <div className="border rounded-lg p-3 bg-muted">
                        <p className="text-sm">{selectedOrder.orderTerms}</p>
                      </div>
                    </div>
                  )}

                  {selectedOrder.companyAddress && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Company Address</h3>
                      <div className="border rounded-lg p-3 bg-muted">
                        <p className="text-sm">{selectedOrder.companyAddress}</p>
                      </div>
                    </div>
                  )}

                  {selectedOrder.buyerAddress && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Buyer Address</h3>
                      <div className="border rounded-lg p-3 bg-muted">
                        <p className="text-sm">{selectedOrder.buyerAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesOrderManagement;
