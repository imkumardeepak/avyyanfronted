import apiClient from '@/lib/api-client';

export class SalesOrderService {
  // PUT /api/salesorder/{salesOrderId}/items/{salesOrderItemId}/process - Mark a sales order item as processed
  static async markSalesOrderItemAsProcessed(salesOrderId: number, salesOrderItemId: number): Promise<void> {
    try {
      await apiClient.put(`/salesorder/${salesOrderId}/items/${salesOrderItemId}/process`);
    } catch (error) {
      console.error('Error marking sales order item as processed:', error);
      throw error;
    }
  }
}