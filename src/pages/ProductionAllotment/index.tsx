import React, { useState } from 'react';
import { useProductionAllotments } from '@/hooks/queries/useProductionAllotmentQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, FileText, QrCode } from 'lucide-react';
import { productionAllotmentApi } from '@/lib/api-client';
import type { ProductionAllotmentResponseDto, MachineAllocationResponseDto } from '@/types/api-types';

const ProductionAllotment: React.FC = () => {
  const { data: productionAllotments, isLoading, error, refetch } = useProductionAllotments();
  const [selectedAllotment, setSelectedAllotment] = useState<ProductionAllotmentResponseDto | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading production allotments: {error.message}
            <button 
              onClick={() => refetch()}
              className="ml-4 text-sm underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Function to handle PDF generation for a specific machine
  const handleGeneratePDF = (allotment: ProductionAllotmentResponseDto, machine: MachineAllocationResponseDto) => {
    // TODO: Implement PDF generation logic
    console.log(`Generating PDF for machine: ${machine.machineName} in allotment: ${allotment.allotmentId}`);
    alert(`PDF generation for ${machine.machineName} would be implemented here`);
  };

  // Function to handle QR code generation for a specific machine
  const handleGenerateQRCode = async (allotment: ProductionAllotmentResponseDto, machine: MachineAllocationResponseDto) => {
    try {
      setIsGeneratingQR(true);
      const response = await productionAllotmentApi.generateQRCodes(machine.id);
      alert(response.data.message || "QR codes generated successfully");
    } catch (error) {
      console.error("Error generating QR codes:", error);
      alert("Failed to generate QR codes. Please try again.");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const MachineLoadDetails = ({ allotment }: { allotment: ProductionAllotmentResponseDto }) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Allotment Information</h3>
            <p><span className="font-medium">ID:</span> {allotment.allotmentId}</p>
            <p><span className="font-medium">Item:</span> {allotment.itemName}</p>
            <p><span className="font-medium">Voucher:</span> {allotment.voucherNumber}</p>
            <p><span className="font-medium">Quantity:</span> {allotment.actualQuantity}</p>
          </div>
          <div>
            <h3 className="font-semibold">Fabric Details</h3>
            <p><span className="font-medium">Type:</span> {allotment.fabricType}</p>
            <p><span className="font-medium">Yarn Count:</span> {allotment.yarnCount}</p>
            <p><span className="font-medium">Diameter:</span> {allotment.diameter}</p>
            <p><span className="font-medium">Gauge:</span> {allotment.gauge}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Machine Allocations</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine Name</TableHead>
                <TableHead>Needles</TableHead>
                <TableHead>Feeders</TableHead>
                <TableHead>RPM</TableHead>
                <TableHead>Load Weight (kg)</TableHead>
                <TableHead>Total Rolls</TableHead>
                <TableHead>Rolls per Kg</TableHead>
                <TableHead>Est. Production Time (hrs)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allotment.machineAllocations.map((allocation: MachineAllocationResponseDto) => (
                <TableRow key={allocation.id}>
                  <TableCell>{allocation.machineName}</TableCell>
                  <TableCell>{allocation.numberOfNeedles}</TableCell>
                  <TableCell>{allocation.feeders}</TableCell>
                  <TableCell>{allocation.rpm}</TableCell>
                  <TableCell>{allocation.totalLoadWeight.toFixed(2)}</TableCell>
                  <TableCell>{allocation.totalRolls}</TableCell>
                  <TableCell>{allocation.rollPerKg.toFixed(2)}</TableCell>
                  <TableCell>{allocation.estimatedProductionTime.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleGeneratePDF(allotment, allocation)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleGenerateQRCode(allotment, allocation)}
                        disabled={isGeneratingQR}
                      >
                        {isGeneratingQR ? (
                          <span className="h-4 w-4 mr-1">...</span>
                        ) : (
                          <QrCode className="h-4 w-4 mr-1" />
                        )}
                        Scanner
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Roll Breakdown Section */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Roll Breakdown Details</h4>
            {allotment.machineAllocations.map((allocation: MachineAllocationResponseDto) => (
              <div key={allocation.id} className="mb-4 p-3 border rounded">
                <h5 className="font-medium mb-2">{allocation.machineName} - Roll Breakdown</h5>
                {allocation.rollBreakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="font-medium mb-1">Whole Rolls:</h6>
                      {allocation.rollBreakdown.wholeRolls && allocation.rollBreakdown.wholeRolls.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Weight per Roll (kg)</TableHead>
                              <TableHead>Total Weight (kg)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allocation.rollBreakdown.wholeRolls.map((roll, index) => (
                              <TableRow key={index}>
                                <TableCell>{roll.quantity}</TableCell>
                                <TableCell>{roll.weightPerRoll.toFixed(2)}</TableCell>
                                <TableCell>{roll.totalWeight.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No whole rolls</p>
                      )}
                    </div>
                    {allocation.rollBreakdown.fractionalRoll && (
                      <div>
                        <h6 className="font-medium mb-1">Fractional Roll:</h6>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Weight per Roll (kg)</TableHead>
                              <TableHead>Total Weight (kg)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>{allocation.rollBreakdown.fractionalRoll.quantity}</TableCell>
                              <TableCell>{allocation.rollBreakdown.fractionalRoll.weightPerRoll.toFixed(2)}</TableCell>
                              <TableCell>{allocation.rollBreakdown.fractionalRoll.totalWeight.toFixed(2)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Production Allotment</h1>
        <p className="text-muted-foreground">
          View all production allotment records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Allotment List</CardTitle>
        </CardHeader>
        <CardContent>
          {productionAllotments && productionAllotments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Allotment ID</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Voucher Number</TableHead>
                    <TableHead>Actual Quantity</TableHead>
                    <TableHead>Fabric Type</TableHead>
                    <TableHead>Machine Allocations</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionAllotments.map((allotment) => (
                    <TableRow key={allotment.id}>
                      <TableCell className="font-medium">{allotment.allotmentId}</TableCell>
                      <TableCell>{allotment.itemName}</TableCell>
                      <TableCell>{allotment.voucherNumber}</TableCell>
                      <TableCell>{allotment.actualQuantity}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{allotment.fabricType}</Badge>
                      </TableCell>
                      <TableCell>{allotment.machineAllocations.length}</TableCell>
                      <TableCell>
                        {new Date(allotment.createdDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedAllotment(allotment)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Machine Load Details</DialogTitle>
                            </DialogHeader>
                            {selectedAllotment && (
                              <MachineLoadDetails allotment={selectedAllotment} />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No production allotments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionAllotment;