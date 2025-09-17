import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProductionConfirmation: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    allotId: '',
    machineName: '',
    rollNo: '',
    greyGsm: '',
    greyWidth: '',
    blendPercent: '',
    cotton: '',
    polyester: '',
    spandex: '',
  });

  // Ref for the simulate button to manage focus
  const simulateButtonRef = useRef<HTMLButtonElement>(null);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Simulate barcode scanning - in a real app, this would be connected to a scanner
  const handleBarcodeScan = (barcodeData: string) => {
    // Parse the barcode format: "JSJL-130C3024-240005N#K10#1"
    // Split by # and assign:
    // JSJL-130C3024-240005N = Allot id
    // K10 = machine name
    // 1 = roll no
    try {
      const parts = barcodeData.split('#');
      if (parts.length >= 3) {
        setFormData(prev => ({
          ...prev,
          allotId: parts[0] || '',
          machineName: parts[1] || '',
          rollNo: parts[2] || '',
        }));
        setSuccess('Barcode data loaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Invalid barcode format. Expected: ALLOTID#MACHINENAME#ROLLNO');
      }
    } catch (err) {
      console.error('Error processing barcode:', err);
      setError('Failed to process barcode data');
    }
  };

  // Simulate a manual barcode scan for testing with the new format
  const simulateBarcodeScan = () => {
    // This is just for demonstration - in a real app, the scanner would provide this data
    handleBarcodeScan('JSJL-130C3024-240005N#K10#1');
  };

  // Set focus to the simulate button when component mounts
  useEffect(() => {
    if (simulateButtonRef.current) {
      simulateButtonRef.current.focus();
    }
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setIsLoading(false);
      setSuccess('Confirmation data saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    }, 1500);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Production Confirmation</h1>
        <p className="text-muted-foreground">
          Confirm production details and enter fabric specifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roll Confirmation Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="default" className="mb-4 bg-green-100 border-green-500">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6">
            <Button 
              ref={simulateButtonRef}
              onClick={simulateBarcodeScan} 
              variant="outline" 
              className="mr-2"
            >
              Simulate Barcode Scan
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              In a real application, this form would be populated automatically when scanning a barcode.
              Expected format: ALLOTID#MACHINENAME#ROLLNO (e.g., JSJL-130C3024-240005N#K10#1)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allotId">Allot ID *</Label>
                <Input
                  id="allotId"
                  name="allotId"
                  value={formData.allotId}
                  onChange={handleChange}
                  placeholder="Enter Allot ID"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="machineName">Machine Name *</Label>
                <Input
                  id="machineName"
                  name="machineName"
                  value={formData.machineName}
                  onChange={handleChange}
                  placeholder="Enter Machine Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rollNo">Roll No. *</Label>
                <Input
                  id="rollNo"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleChange}
                  placeholder="Enter Roll Number"
                  required
                />
              </div>
            </div>
            
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-medium mb-4">Fabric Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="greyGsm">GREY GSM</Label>
                  <Input
                    id="greyGsm"
                    name="greyGsm"
                    value={formData.greyGsm}
                    onChange={handleChange}
                    placeholder="Enter GREY GSM"
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="greyWidth">GREY WIDTH</Label>
                  <Input
                    id="greyWidth"
                    name="greyWidth"
                    value={formData.greyWidth}
                    onChange={handleChange}
                    placeholder="Enter GREY WIDTH"
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blendPercent">BLEND %</Label>
                  <Input
                    id="blendPercent"
                    name="blendPercent"
                    value={formData.blendPercent}
                    onChange={handleChange}
                    placeholder="Enter BLEND %"
                    type="number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="cotton">COTTON</Label>
                  <Input
                    id="cotton"
                    name="cotton"
                    value={formData.cotton}
                    onChange={handleChange}
                    placeholder="Enter COTTON value"
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="polyester">POLYESTER</Label>
                  <Input
                    id="polyester"
                    name="polyester"
                    value={formData.polyester}
                    onChange={handleChange}
                    placeholder="Enter POLYESTER value"
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spandex">SPANDEX</Label>
                  <Input
                    id="spandex"
                    name="spandex"
                    value={formData.spandex}
                    onChange={handleChange}
                    placeholder="Enter SPANDEX value"
                    type="number"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Confirmation'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionConfirmation;