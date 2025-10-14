import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTapeColors } from '@/hooks/queries/useTapeColorQueries';
import { getTapeColorStyle } from '@/utils/tapeColorUtils';

interface PackagingDetailsProps {
  rollPerKg?: number;
  onCoreTypeChange: (coreType: 'with' | 'without') => void;
  onTubeWeightChange: (weight: number) => void;
  onTapeColorChange: (tapeColorId: number) => void;
  onShrinkRapWeightChange?: (weight: number) => void;
  tubeWeight: number;
  shrinkRapWeight?: number;
  tapeColorId: number | null;
}

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
  onShrinkRapWeightChange,
  tubeWeight,
  shrinkRapWeight = 0.06,
  tapeColorId,
}: PackagingDetailsProps) {
  const { data: tapeColors = [] } = useTapeColors();
  const [coreType, setCoreType] = useState<'with' | 'without'>('without');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const colorOptions = useMemo(() => {
    const options: TapeColorOption[] = tapeColors.map((color) => ({
      id: `color-${color.id}`,
      type: 'color',
      name: color.tapeColor,
      colorId: color.id,
    }));

    tapeColors.forEach((color, i) => {
      tapeColors.slice(i + 1).forEach((nextColor) => {
        options.push({
          id: `combo-${color.id}-${nextColor.id}`,
          type: 'combination',
          name: `${color.tapeColor} + ${nextColor.tapeColor}`,
          color1Id: color.id,
          color2Id: nextColor.id,
        });
      });
    });

    return options;
  }, [tapeColors]);

  useEffect(() => {
    if (tapeColorId !== null) {
      const colorOption = colorOptions.find(
        (option) => option.type === 'color' && option.colorId === tapeColorId
      );
      setSelectedOptionId(colorOption?.id || null);
    }
  }, [tapeColorId, colorOptions]);

  const handleCoreTypeChange = (value: 'with' | 'without') => {
    setCoreType(value);
    onCoreTypeChange(value);
    if (value === 'without') onTubeWeightChange(0);
    else if (tubeWeight === 0) onTubeWeightChange(1);
  };

  const handleOptionSelect = (option: TapeColorOption) => {
    setSelectedOptionId(option.id);
    onTapeColorChange(option.type === 'color' ? option.colorId : option.color1Id);
  };

  const selectedOption = colorOptions.find((option) => option.id === selectedOptionId);
  const getColorStyle = (colorName: string) => ({ backgroundColor: getTapeColorStyle(colorName) });

  // Calculate total weight
  const totalWeight = coreType === 'with' ? tubeWeight + shrinkRapWeight : shrinkRapWeight;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Packaging Details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Roll per Kg</Label>
          <div className="text-lg font-bold text-primary">
            {(rollPerKg || 0).toFixed(2)} rolls/kg
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Core Type</Label>
            <RadioGroup value={coreType} onValueChange={handleCoreTypeChange} className="space-y-2">
              {['without', 'with'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`${type}-core`} />
                  <Label htmlFor={`${type}-core`} className="text-sm capitalize">
                    {type === 'with' ? 'With Core' : 'No Core '}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {coreType === 'with' && (
            <div className="space-y-3">
              <Label htmlFor="tube-weight" className="text-sm font-medium">
                Tube Weight
              </Label>
              <div className="relative">
                <Input
                  id="tube-weight"
                  type="number"
                  step="1"
                  min="0"
                  value={tubeWeight}
                  onChange={(e) => onTubeWeightChange(parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
                <span className="absolute right-7 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  kg
                </span>
              </div>
            </div>
          )}
          {/* Shrink Rap + Polyester Bag + Tape field */}
          <div className="space-y-3">
            <Label htmlFor="shrink-rap-weight" className="text-sm font-medium">
              Shrink Rap + Polyester Bag + Tape
            </Label>
            <div className="relative">
              <Input
                id="shrink-rap-weight"
                type="number"
                step="1"
                min="0"
                value={shrinkRapWeight}
                onChange={(e) => onShrinkRapWeightChange?.(parseFloat(e.target.value) || 0)}
                className="w-full"
                readOnly
              />
              <span className="absolute right-7 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                kg
              </span>
            </div>
          </div>
        </div>

        {/* Add Total Weight Display */}
        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Total Weight</Label>
          <div className="text-lg font-bold text-primary">{totalWeight.toFixed(3)} kg</div>
        </div>

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
                      style={getColorStyle(option.name)}
                    />
                    <span className="text-xs text-center truncate w-full">{option.name}</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center mb-1">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={getColorStyle(
                          tapeColors.find((c) => c.id === option.color1Id)?.tapeColor || ''
                        )}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300 -ml-1"
                        style={getColorStyle(
                          tapeColors.find((c) => c.id === option.color2Id)?.tapeColor || ''
                        )}
                      />
                    </div>
                    <span className="text-xs text-center truncate w-full">{option.name}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedOption && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            {selectedOption.type === 'color' ? (
              <>
                <div
                  className="w-5 h-5 rounded-full border border-gray-300"
                  style={getColorStyle(selectedOption.name)}
                />
                <span className="text-sm font-medium">Selected: {selectedOption.name}</span>
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={getColorStyle(
                      tapeColors.find((c) => c.id === selectedOption.color1Id)?.tapeColor || ''
                    )}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300 -ml-1"
                    style={getColorStyle(
                      tapeColors.find((c) => c.id === selectedOption.color2Id)?.tapeColor || ''
                    )}
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
