import { useEffect } from 'react';
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
import { Calculator } from 'lucide-react';
import type { MachineResponseDto, SalesOrderItemDto } from '@/types/api-types';

interface ProductionCalculation {
  needle: number;
  feeder: number;
  rpm: number;
  constant: number;
  stichLength: number;
  count: number;
  efficiency: number;
  productionPerDay: number;
  productionPerHour: number;
  productionPerMinute: number;
}

interface MachineSelection {
  selectedMachine: MachineResponseDto | null;
}

interface ProductionTimingCalculationProps {
  machines: MachineResponseDto[] | undefined;
  isLoadingMachines: boolean;
  selectedItem: SalesOrderItemDto;
  parsedDescriptionValues: {
    stitchLength: number;
    count: number;
    weightPerRoll: number;
    numberOfRolls: number;
    diameter: number;
    gauge: number;
    composition: string;
  };
  extractFabricTypeFromDescription: (description: string) => string;
  fabricStructures: Array<{
    fabricstr: string;
    standardeffencny: number;
  }>;
  productionCalc: ProductionCalculation;
  machineSelection: MachineSelection;
  onMachineChange: (machineId: string) => void;
  onProductionValueChange: (field: keyof ProductionCalculation, value: number) => void;
  onRefreshFromDescription: () => void;
}

export function ProductionTimingCalculation({
  machines,
  isLoadingMachines,
  selectedItem,
  parsedDescriptionValues,
  extractFabricTypeFromDescription,
  fabricStructures,
  productionCalc,
  machineSelection,
  onMachineChange,
  onProductionValueChange,
  onRefreshFromDescription,
}: ProductionTimingCalculationProps) {
  // Get fabric efficiency when fabric structures are loaded
  useEffect(() => {
    if (fabricStructures && selectedItem && fabricStructures.length > 0) {
      // Try to match fabric type from sales order item with fabric structure
      // Updated to use description for fabric type matching instead of just item name
      let itemFabricType = '';

      // First try to get fabric type from descriptions
      if (selectedItem.descriptions) {
        itemFabricType = extractFabricTypeFromDescription(selectedItem.descriptions);
      }

      // Fallback to item name if no fabric type found in description
      if (!itemFabricType && selectedItem.stockItemName) {
        itemFabricType = selectedItem.stockItemName.toLowerCase();
      }

      const matchingFabric = fabricStructures.find(
        (f) =>
          itemFabricType.includes(f.fabricstr.toLowerCase()) ||
          f.fabricstr.toLowerCase().includes(itemFabricType.split(' ')[0])
      );

      if (matchingFabric) {
        // We'll let the parent component handle this update
        onProductionValueChange('efficiency', matchingFabric.standardeffencny);
      } else {
        // Default efficiency if no match found
        onProductionValueChange('efficiency', 85); // Default 85% efficiency
      }
    }
  }, [fabricStructures, selectedItem]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Production Timing Calculation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Machine Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Machine Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="machine-select">Select Machine</Label>
                {isLoadingMachines ? (
                  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                ) : (
                  <Select
                    value={machineSelection.selectedMachine?.id.toString() || ''}
                    onValueChange={onMachineChange}
                  >
                    <SelectTrigger id="machine-select">
                      <SelectValue placeholder="Select a machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines?.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id.toString()}>
                          {machine.machineName} (Dia: {machine.dia}", GG: {machine.gg})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Machine Details</Label>
                {machineSelection.selectedMachine ? (
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    <p>
                      <strong>Name:</strong> {machineSelection.selectedMachine.machineName}
                    </p>
                    <p>
                      <strong>Diameter:</strong> {machineSelection.selectedMachine.dia}"
                    </p>
                    <p>
                      <strong>Gauge:</strong> {machineSelection.selectedMachine.gg}
                    </p>
                    <p>
                      <strong>Efficiency:</strong> {machineSelection.selectedMachine.efficiency}%
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-500">
                    Select a machine to view details
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Machine Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Machine Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="needle">No. of Needles</Label>
                <Input
                  id="needle"
                  type="number"
                  value={productionCalc.needle}
                  onChange={(e) => onProductionValueChange('needle', Number(e.target.value))}
                  className="text-center font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeder">Feeders</Label>
                <Input
                  id="feeder"
                  type="number"
                  value={productionCalc.feeder}
                  onChange={(e) => onProductionValueChange('feeder', Number(e.target.value))}
                  className="text-center font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpm">RPM</Label>
                <Input
                  id="rpm"
                  type="number"
                  value={productionCalc.rpm}
                  onChange={(e) => onProductionValueChange('rpm', Number(e.target.value))}
                  className="text-center font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="efficiency">Efficiency (%)</Label>
                <Input
                  id="efficiency"
                  type="number"
                  step="0.1"
                  value={productionCalc.efficiency}
                  onChange={(e) =>
                    onProductionValueChange('efficiency', Number(e.target.value))
                  }
                  className="text-center font-mono"
                />
              </div>
            </div>
          </div>

          {/* Production Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Production Inputs</h3>
              {selectedItem?.descriptions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshFromDescription}
                  className="text-xs"
                >
                  🔄 Re-parse Description
                </Button>
              )}
            </div>
            {/* Description Analysis */}
            {selectedItem?.descriptions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-yellow-800 mb-2">📋 Description Analysis</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  <strong>Original Description:</strong> {selectedItem.descriptions}
                </p>
                <div className="text-xs text-yellow-600">
                  <div className="space-y-1">
                    <p>
                      🔍 <strong>Parsed Values:</strong>
                    </p>
                    <p>
                      • Stitch Length (S.L.):{' '}
                      {parsedDescriptionValues.stitchLength > 0
                        ? `${parsedDescriptionValues.stitchLength}`
                        : 'Not found'}
                    </p>
                    <p>
                      • Count:{' '}
                      {parsedDescriptionValues.count > 0
                        ? `${parsedDescriptionValues.count}`
                        : 'Not found'}
                    </p>
                    <p>
                      • Weight per Roll:{' '}
                      {parsedDescriptionValues.weightPerRoll > 0
                        ? `${parsedDescriptionValues.weightPerRoll} kg/roll`
                        : 'Not found'}
                    </p>
                    <p>
                      • Number of Rolls:{' '}
                      {parsedDescriptionValues.numberOfRolls > 0
                        ? `${parsedDescriptionValues.numberOfRolls}`
                        : 'Not found'}
                    </p>
                    <p>
                      • Diameter:{' '}
                      {parsedDescriptionValues.diameter > 0
                        ? `${parsedDescriptionValues.diameter}"`
                        : 'Not found'}
                    </p>
                    <p>
                      • Gauge:{' '}
                      {parsedDescriptionValues.gauge > 0
                        ? `${parsedDescriptionValues.gauge}`
                        : 'Not found'}
                    </p>
                    <p>• Composition: {parsedDescriptionValues.composition || 'Not found'}</p>
                    <div className="mt-2 p-1 bg-yellow-100 rounded text-xs">
                      <p>
                        <strong>Supported formats:</strong>
                      </p>
                      <p>• Stitch Length: "s.l. 2.5", "s/l 2.5", "S.L: 2.5", "sl: 2.5"</p>
                      <p>• Count: "count 30", "30 count", "count: 30", "cnt 30"</p>
                      <p>
                        • Weight per Roll: "Wt./Roll: 30 Kg/Roll", "30 kg/roll", "weight per
                        roll 30kg", "Roll: 30 kg"
                      </p>
                      <p>
                        • Number of Rolls: "No Of Rolls: 50", "Number of Rolls: 50", "Rolls:
                        50"
                      </p>
                      <p>• Diameter & Gauge: "Dia X GG: 34" X 28"</p>
                      <p>• Composition: "Composition: 97% Cotton + 5 % Lycra"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stitch-length">Stitch Length (S.L.)</Label>
                <Input
                  id="stitch-length"
                  type="number"
                  step="0.01"
                  value={productionCalc.stichLength}
                  onChange={(e) =>
                    onProductionValueChange('stichLength', Number(e.target.value))
                  }
                  className="text-center font-mono"
                  placeholder="Enter S.L. value"
                />
                <div className="text-xs text-muted-foreground">
                  {parsedDescriptionValues.stitchLength > 0 ? (
                    <span className="text-green-600">
                      ✓ Auto-parsed from description: {parsedDescriptionValues.stitchLength}
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      ⚠ Enter manually (not found in description)
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  step="0.1"
                  value={productionCalc.count}
                  onChange={(e) => onProductionValueChange('count', Number(e.target.value))}
                  className="text-center font-mono"
                  placeholder="Enter count value"
                />
                <div className="text-xs text-muted-foreground">
                  {parsedDescriptionValues.count > 0 ? (
                    <span className="text-green-600">
                      ✓ Auto-parsed from description: {parsedDescriptionValues.count}
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      ⚠ Enter manually (not found in description)
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Constant</Label>
                <div className="p-3 bg-gray-50 rounded text-center font-mono text-sm">
                  {productionCalc.constant}
                </div>
                <p className="text-xs text-muted-foreground">Fixed constant value</p>
              </div>
            </div>
          </div>

          {/* Production Formula & Result */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Production Calculation</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="text-sm font-mono text-center">
                  <strong>Formula:</strong> PRODUCTION = (Needles × Feeders × RPM × S.L. × 0.00085
                  × Efficiency%) ÷ Count
                </div>
                <div className="text-sm font-mono text-center text-blue-700">
                  = ({productionCalc.needle} × {productionCalc.feeder} × {productionCalc.rpm} ×{' '}
                  {productionCalc.stichLength} × {productionCalc.constant} ×{' '}
                  {productionCalc.efficiency}%) ÷ {productionCalc.count}
                </div>

                {/* Show calculation status */}
                {productionCalc.productionPerDay > 0 ? (
                  <div className="text-xs text-center text-green-600 font-medium">
                    ✓ Calculation Complete
                  </div>
                ) : (
                  <div className="text-xs text-center text-orange-600 font-medium">
                    ⚠ Enter all values to calculate production
                  </div>
                )}

                <div className="border-t border-blue-300 pt-3">
                  {/* Production Results Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Per Day */}
                    <div className="text-center p-3 bg-blue-100 rounded">
                      <div className="text-xl font-bold text-blue-800">
                        {productionCalc.productionPerDay.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">kg/day</div>
                      <div className="text-xs text-blue-500 mt-1">24 hours production</div>
                    </div>

                    {/* Per Hour */}
                    <div className="text-center p-3 bg-green-100 rounded">
                      <div className="text-xl font-bold text-green-800">
                        {productionCalc.productionPerHour.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600 font-medium">kg/hour</div>
                      <div className="text-xs text-green-500 mt-1">Hourly production rate</div>
                    </div>
                    {/* Per Minute */}
                    <div className="text-center p-3 bg-purple-100 rounded">
                      <div className="text-xl font-bold text-purple-800">
                        {productionCalc.productionPerMinute.toFixed(4)}
                      </div>
                      <div className="text-sm text-purple-600 font-medium">kg/min</div>
                      <div className="text-xs text-purple-500 mt-1">Per minute output</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fabric Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">
              Fabric Information & Efficiency
            </h4>
            <div className="text-sm text-green-700">
              <p>
                <strong>Item:</strong> {selectedItem?.stockItemName}
              </p>
              <p>
                <strong>Efficiency Source:</strong>
                {(() => {
                  // Updated to use description for fabric type matching
                  let itemFabricType = '';

                  // First try to get fabric type from descriptions
                  if (selectedItem?.descriptions) {
                    itemFabricType = extractFabricTypeFromDescription(
                      selectedItem.descriptions
                    );
                  }

                  // Fallback to item name if no fabric type found in description
                  if (!itemFabricType && selectedItem?.stockItemName) {
                    itemFabricType = selectedItem.stockItemName.toLowerCase();
                  }

                  const matchingFabric = fabricStructures?.find(
                    (f) =>
                      itemFabricType.includes(f.fabricstr.toLowerCase()) ||
                      f.fabricstr.toLowerCase().includes(itemFabricType.split(' ')[0] || '')
                  );
                  return matchingFabric ? (
                    <span className="text-green-600">
                      ✓ Auto-detected: {matchingFabric.fabricstr} (
                      {matchingFabric.standardeffencny}%)
                    </span>
                  ) : (
                    <span className="text-orange-600">⚠ Using default efficiency (85%)</span>
                  );
                })()}
              </p>
              <p>
                <strong>Current Efficiency:</strong> {productionCalc.efficiency}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}