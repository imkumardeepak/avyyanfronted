import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTapeColors } from '@/hooks/queries/useTapeColorQueries';

interface PackagingDetailsProps {
  rollPerKg?: number;
  onCoreTypeChange: (coreType: 'with' | 'without') => void;
  onTubeWeightChange: (weight: number) => void;
  onTapeColorChange: (tapeColorId: number) => void;
  tubeWeight: number;
  tapeColorId: number | null;
}

export function PackagingDetails({
  rollPerKg = 0,
  onCoreTypeChange,
  onTubeWeightChange,
  onTapeColorChange,
  tubeWeight,
  tapeColorId
}: PackagingDetailsProps) {
  const { data: tapeColors = [] } = useTapeColors();
  const [coreType, setCoreType] = useState<'with' | 'without'>('with');

  const handleCoreTypeChange = (value: string) => {
    const newCoreType = value as 'with' | 'without';
    setCoreType(newCoreType);
    onCoreTypeChange(newCoreType);
    
    if (newCoreType === 'without') {
      onTubeWeightChange(0);
    } else if (tubeWeight === 0) {
      onTubeWeightChange(1);
    }
  };

  const selectedTapeColor = tapeColors.find(color => color.id === tapeColorId);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Packaging Details</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Roll per Kg - Compact display */}
        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Roll per Kg</Label>
          <div className="text-lg font-bold text-primary">
            {(rollPerKg || 0).toFixed(2)} rolls/kg
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Core Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Core Type</Label>
            <RadioGroup 
              value={coreType} 
              onValueChange={handleCoreTypeChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="with" id="with-core" />
                <Label htmlFor="with-core" className="text-sm">With Core</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="without" id="without-core" />
                <Label htmlFor="without-core" className="text-sm">No Core</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tube Weight */}
          {coreType === 'with' && (
            <div className="space-y-3">
              <Label htmlFor="tube-weight" className="text-sm font-medium">Tube Weight</Label>
              <div className="relative">
                <Input
                  id="tube-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tubeWeight}
                  onChange={(e) => onTubeWeightChange(parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  kg
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tape Color */}
        <div className="space-y-3">
          <Label htmlFor="tape-color" className="text-sm font-medium">Tape Color</Label>
          <Select 
            value={tapeColorId?.toString() || ''} 
            onValueChange={(value) => onTapeColorChange(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select color">
                {selectedTapeColor && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                     
                    />
                    {selectedTapeColor.tapeColor}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tapeColors.map((color) => (
                <SelectItem key={color.id} value={color.id.toString()} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border"
                   
                  />
                  {color.tapeColor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}