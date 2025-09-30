import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface ProcessingActionsProps {
  selectedItem: {
    processFlag?: number;
    stockItemName?: string;
  } | null;
  selectedOrder: {
    voucherNumber?: string;
  } | null;
  isProcessing: boolean;
  isItemProcessing: boolean;
  onProcessItem: () => void;
}

export function ProcessingActions({
  selectedItem,
  selectedOrder,
  isProcessing,
  isItemProcessing,
  onProcessItem,
}: ProcessingActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedItem?.processFlag !== 1 ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
              <div>
                <h3 className="font-semibold text-green-800">Ready to Process Item</h3>
                <p className="text-sm text-green-600">
                  Process "{selectedItem?.stockItemName}" from order{' '}
                  {selectedOrder?.voucherNumber}
                </p>
              </div>
              <Button
                onClick={onProcessItem}
                className="bg-green-600 hover:bg-green-700"
                disabled={isProcessing || isItemProcessing}
              >
                {isProcessing || isItemProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Process Now
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div>
                <h3 className="font-semibold text-yellow-800">Item is in Process</h3>
                <p className="text-sm text-yellow-600">
                  "{selectedItem?.stockItemName}" from order {selectedOrder?.voucherNumber} is
                  currently being processed
                </p>
              </div>
              <div className="flex items-center space-x-2 text-yellow-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">In Process</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}