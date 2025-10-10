import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTapeColors } from '@/hooks/queries/useTapeColorQueries';
import { getTapeColorStyle, TAPE_COLOR_MAP } from '@/utils/tapeColorUtils';

interface PackagingDetailsProps {
  rollPerKg?: number;
  onCoreTypeChange: (coreType: 'with' | 'without') => void;
  onTubeWeightChange: (weight: number) => void;
  onTapeColorChange: (tapeColorId: number) => void;
  tubeWeight: number;
  tapeColorId: number | null;
}

// Define types for our color options
type ColorOption = {
  id: string;
  type: 'color';
  name: string;
  colorId: number;
};

type CombinationOption = {
  id: string;
  type: 'combination';
  name: string;
  color1Id: number;
  color2Id: number;
};

type TapeColorOption = ColorOption | CombinationOption;

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
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Generate all possible color options (individual colors + combinations)
  const colorOptions = useMemo(() => {
    const options: TapeColorOption[] = [];
    
    // Add individual colors
    tapeColors.forEach(color => {
      options.push({
        id: `color-${color.id}`,
        type: 'color',
        name: color.tapeColor,
        colorId: color.id
      });
    });
    
    // Add combinations (including same color combinations)
    for (let i = 0; i < tapeColors.length; i++) {
      for (let j = i; j < tapeColors.length; j++) {
        options.push({
          id: `combo-${tapeColors[i].id}-${tapeColors[j].id}`,
          type: 'combination',
          name: `${tapeColors[i].tapeColor} + ${tapeColors[j].tapeColor}`,
          color1Id: tapeColors[i].id,
          color2Id: tapeColors[j].id
        });
      }
    }
    
    return options;
  }, [tapeColors]);

  useEffect(() => {
    // Initialize selected option based on tapeColorId
    if (tapeColorId !== null) {
      const colorOption = colorOptions.find(
        option => option.type === 'color' && option.colorId === tapeColorId
      );
      if (colorOption) {
        setSelectedOptionId(colorOption.id);
      }
    }
  }, [tapeColorId, colorOptions]);

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

  // Handle option selection
  const handleOptionSelect = (option: TapeColorOption) => {
    setSelectedOptionId(option.id);
    
    // For now, we'll just pass the first color ID for both colors and combinations
    // In a real implementation, you might want to handle combinations differently
    if (option.type === 'color') {
      onTapeColorChange(option.colorId);
    } else {
      onTapeColorChange(option.color1Id);
    }
  };

  // Find the currently selected option
  const selectedOption = selectedOptionId 
    ? colorOptions.find(option => option.id === selectedOptionId)
    : null;

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

        {/* All Tape Colors and Combinations Grid */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tape Colors & Combinations</Label>
          <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
            {colorOptions.map((option) => (
              <div
                key={option.id}
                className={`flex flex-col items-center p-2 rounded cursor-pointer transition-all ${
                  selectedOptionId === option.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                {option.type === 'color' ? (
                  <>
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300 mb-1"
                      style={{ backgroundColor: getTapeColorStyle(option.name) }}
                    />
                    <span className="text-xs text-center truncate w-full">{option.name}</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center mb-1">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: getTapeColorStyle(
                          tapeColors.find(c => c.id === option.color1Id)?.tapeColor || ''
                        )}}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300 -ml-1"
                        style={{ backgroundColor: getTapeColorStyle(
                          tapeColors.find(c => c.id === option.color2Id)?.tapeColor || ''
                        )}}
                      />
                    </div>
                    <span className="text-xs text-center truncate w-full">{option.name}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Option Display */}
        {selectedOption && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            {selectedOption.type === 'color' ? (
              <>
                <div
                  className="w-5 h-5 rounded-full border border-gray-300"
                  style={{ backgroundColor: getTapeColorStyle(selectedOption.name) }}
                />
                <span className="text-sm font-medium">Selected: {selectedOption.name}</span>
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: getTapeColorStyle(
                      tapeColors.find(c => c.id === selectedOption.color1Id)?.tapeColor || ''
                    )}}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300 -ml-1"
                    style={{ backgroundColor: getTapeColorStyle(
                      tapeColors.find(c => c.id === selectedOption.color2Id)?.tapeColor || ''
                    )}}
                  />
                </div>
                <span className="text-sm font-medium">Selected: {selectedOption.name}</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}