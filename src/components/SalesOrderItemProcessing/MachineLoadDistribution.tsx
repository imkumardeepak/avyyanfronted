import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import type { MachineResponseDto } from '@/types/api-types';

interface MachineLoadDistribution {
  machineId: number;
  machineName: string;
  allocatedRolls: number;
  allocatedWeight: number;
  estimatedProductionTime: number;
  isEditing?: boolean;
  customParameters?: {
    needle: number;
    feeder: number;
    rpm: number;
    efficiency: number;
    constant: number;
  };
}

interface MachineLoadDistributionProps {
  machines: MachineResponseDto[] | undefined;
  isLoadingMachines: boolean;
  selectedMachines: MachineLoadDistribution[];
  rollInput: {
    actualQuantity: number;
    rollPerKg: number;
  };
  showMachineDistribution: boolean;
  onToggleMachineDistribution: () => void;
  onAddMachineToDistribution: (machine: MachineResponseDto) => void;
  onRemoveMachineFromDistribution: (machineId: number) => void;
  onToggleMachineEdit: (machineId: number) => void;
  onSaveMachineParameters: (machineId: number) => void;
  onUpdateMachineParameters: (
    machineId: number,
    parameters: Partial<{
      needle: number;
      feeder: number;
      rpm: number;
      efficiency: number;
      constant: number;
    }>
  ) => void;
  onUpdateMachineAllocation: (machineId: number, allocatedWeight: number) => void;
  onAutoDistributeLoad: () => void;
  onClearAllMachines: () => void;
  // New props for filtering machines by diameter and gauge
  machineDiameter?: number;
  machineGauge?: number;
}

export function MachineLoadDistribution({
  machines,
  isLoadingMachines,
  selectedMachines,
  rollInput,
  showMachineDistribution,
  onToggleMachineDistribution,
  onAddMachineToDistribution,
  onRemoveMachineFromDistribution,
  onToggleMachineEdit,
  onSaveMachineParameters,
  onUpdateMachineParameters,
  onUpdateMachineAllocation,
  onAutoDistributeLoad,
  onClearAllMachines,
  machineDiameter,
  machineGauge,
}: MachineLoadDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Machine Load Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Machine Selection for Distribution */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Machine Selection for Load Distribution</h3>
              <Button onClick={onToggleMachineDistribution} variant="outline" size="sm">
                {showMachineDistribution ? 'Hide' : 'Show'} Machine Selection
              </Button>
            </div>

            {showMachineDistribution && (
              <div className="space-y-4">
                {/* Available Machines */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Available Machines</h4>
                  {isLoadingMachines ? (
                    <div className="animate-pulse space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Filter machines by diameter and gauge if provided */}
                      {machines
                        ?.filter((machine) => {
                          // If diameter and gauge are not provided, show all machines
                          if (!machineDiameter || !machineGauge) return true;
                          // Otherwise, only show machines with matching diameter and gauge
                          return machine.dia === machineDiameter && machine.gg === machineGauge;
                        })
                        .map((machine) => {
                          const isSelected = selectedMachines.some(
                            (m) => m.machineId === machine.id
                          );
                          return (
                            <div
                              key={machine.id}
                              className={`p-3 border rounded cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-300 bg-white hover:border-blue-400'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  onRemoveMachineFromDistribution(machine.id);
                                } else {
                                  onAddMachineToDistribution(machine);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{machine.machineName}</p>
                                  <p className="text-xs text-gray-600">
                                    Dia: {machine.dia}" | GG: {machine.gg} | Eff:{' '}
                                    {machine.efficiency}%
                                  </p>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-full ${
                                    isSelected ? 'bg-green-500' : 'border-2 border-gray-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg
                                      className="w-4 h-4 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Selected Machines Distribution */}
                {selectedMachines.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-green-800">
                        Load Distribution ({selectedMachines.length} machines)
                      </h4>
                      <div className="space-x-2">
                        <Button
                          onClick={onAutoDistributeLoad}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={!rollInput.rollPerKg || rollInput.rollPerKg <= 0}
                        >
                          Auto Distribute
                        </Button>
                        <Button onClick={onClearAllMachines} size="sm" variant="outline">
                          Clear All
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedMachines.map((machine) => {
                        const machineData = machines?.find((m) => m.id === machine.machineId);
                        const params = machine.customParameters || {
                          needle: machineData?.needle || 0,
                          feeder: machineData?.feeder || 0,
                          rpm: machineData?.rpm || 0,
                          efficiency: machineData?.efficiency || 0,
                          constant: machineData?.constat || 0.00085,
                        };

                        return (
                          <div
                            key={machine.machineId}
                            className="bg-white border border-green-300 rounded-lg p-3"
                          >
                            {/* Machine Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-medium text-sm">{machine.machineName}</p>
                                <p className="text-xs text-gray-600">
                                  Dia: {machineData?.dia}" | GG: {machineData?.gg} | Base Eff:{' '}
                                  {params.efficiency}%
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() =>
                                    machine.isEditing
                                      ? onSaveMachineParameters(machine.machineId)
                                      : onToggleMachineEdit(machine.machineId)
                                  }
                                  size="sm"
                                  variant={machine.isEditing ? 'default' : 'outline'}
                                  className="h-7 px-2 text-xs"
                                >
                                  {machine.isEditing ? 'Save' : 'Edit'}
                                </Button>
                                {machine.isEditing && (
                                  <Button
                                    onClick={() => onToggleMachineEdit(machine.machineId)}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                )}
                                <Button
                                  onClick={() => onRemoveMachineFromDistribution(machine.machineId)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 h-7 px-2 text-xs"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>

                            {/* Machine Parameters - Editable when in edit mode */}
                            {machine.isEditing && (
                              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <h5 className="font-medium text-blue-800 mb-2">
                                  Machine Parameters
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Needles</Label>
                                    <Input
                                      type="number"
                                      value={params.needle}
                                      onChange={(e) =>
                                        onUpdateMachineParameters(machine.machineId, {
                                          needle: Number(e.target.value),
                                        })
                                      }
                                      className="text-center text-xs h-7"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Feeders</Label>
                                    <Input
                                      type="number"
                                      value={params.feeder}
                                      onChange={(e) =>
                                        onUpdateMachineParameters(machine.machineId, {
                                          feeder: Number(e.target.value),
                                        })
                                      }
                                      className="text-center text-xs h-7"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">RPM</Label>
                                    <Input
                                      type="number"
                                      value={params.rpm}
                                      onChange={(e) =>
                                        onUpdateMachineParameters(machine.machineId, {
                                          rpm: Number(e.target.value),
                                        })
                                      }
                                      className="text-center text-xs h-7"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Efficiency (%)</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={params.efficiency}
                                      onChange={(e) =>
                                        onUpdateMachineParameters(machine.machineId, {
                                          efficiency: Number(e.target.value),
                                        })
                                      }
                                      className="text-center text-xs h-7"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Constant</Label>
                                    <Input
                                      type="number"
                                      step="0.00001"
                                      value={params.constant}
                                      onChange={(e) =>
                                        onUpdateMachineParameters(machine.machineId, {
                                          constant: Number(e.target.value),
                                        })
                                      }
                                      className="text-center text-xs h-7"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Load Allocation */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                              <div className="space-y-1">
                                <Label className="text-xs">Weight (kg)</Label>
                                <Input
                                  type="number"
                                  step="0.5"
                                  value={machine.allocatedWeight}
                                  onChange={(e) => {
                                    const weight = Number(e.target.value);
                                    onUpdateMachineAllocation(machine.machineId, weight);
                                  }}
                                  className={`text-center text-xs h-8 ${(() => {
                                    // Check if this allocation would cause over-allocation
                                    const currentTotalAllocated = selectedMachines.reduce(
                                      (sum, m) =>
                                        m.machineId === machine.machineId
                                          ? sum
                                          : sum + m.allocatedWeight,
                                      0
                                    );
                                    const newTotalAllocated =
                                      currentTotalAllocated + machine.allocatedWeight;
                                    const actualQuantity = Number(rollInput.actualQuantity) || 0;
                                    return newTotalAllocated > actualQuantity
                                      ? 'border-red-500 border-2'
                                      : '';
                                  })()}`}
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Rolls</Label>
                                <div className="text-center font-medium text-sm border rounded py-1 bg-gray-50">
                                  {machine.allocatedRolls.toFixed(2)}
                                </div>
                              </div>

                              <div className="text-center">
                                <p className="text-xs text-gray-600">Est. Time</p>
                                <p className="font-medium text-sm">
                                  {machine.estimatedProductionTime > 0
                                    ? `${machine.estimatedProductionTime.toFixed(1)}h`
                                    : '-'}
                                </p>
                              </div>

                              <div className="text-center">
                                <p className="text-xs text-gray-600">Roll Breakdown</p>
                                <p className="font-medium text-xs">
                                  {machine.allocatedRolls > 0 && rollInput.rollPerKg > 0
                                    ? (() => {
                                        const wholeRolls = Math.floor(machine.allocatedRolls);
                                        const fractionalPart = machine.allocatedRolls - wholeRolls;

                                        if (fractionalPart > 0) {
                                          // Has fractional part
                                          const fractionalWeight =
                                            fractionalPart * rollInput.rollPerKg;
                                          return `${wholeRolls}×${rollInput.rollPerKg}kg + 1×${fractionalWeight.toFixed(2)}kg`;
                                        } else {
                                          // Only whole rolls
                                          return `${wholeRolls}×${rollInput.rollPerKg}kg`;
                                        }
                                      })()
                                    : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Distribution Summary */}
                    <div className="mt-4 p-3 rounded border">
                      {(() => {
                        const totalAllocated = selectedMachines.reduce(
                          (sum, m) => sum + m.allocatedWeight,
                          0
                        );
                        const actualQuantity = Number(rollInput.actualQuantity || 0);
                        const remaining = actualQuantity - totalAllocated;
                        const isOverAllocated = totalAllocated > actualQuantity;

                        return (
                          <div
                            className={
                              isOverAllocated
                                ? 'bg-red-100 border-red-300'
                                : 'bg-green-100 border-green-300'
                            }
                          >
                            <h5
                              className={`font-medium mb-2 ${isOverAllocated ? 'text-red-800' : 'text-green-800'}`}
                            >
                              Distribution Summary
                              {isOverAllocated && (
                                <span className="ml-2 text-red-600 font-bold">
                                  ⚠ OVER ALLOCATED!
                                </span>
                              )}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className={isOverAllocated ? 'text-red-600' : 'text-green-600'}>
                                  Total Allocated Weight:
                                </p>
                                <p
                                  className={`font-bold ${isOverAllocated ? 'text-red-800' : 'text-green-800'}`}
                                >
                                  {totalAllocated.toFixed(2)} kg
                                  {isOverAllocated && <span className="ml-2 text-red-600">⚠</span>}
                                </p>
                              </div>
                              <div>
                                <p className={isOverAllocated ? 'text-red-600' : 'text-green-600'}>
                                  Remaining:
                                </p>
                                <p
                                  className={`font-bold ${remaining >= 0 ? (isOverAllocated ? 'text-red-800' : 'text-green-800') : 'text-red-800'}`}
                                >
                                  {remaining.toFixed(2)} kg
                                  {remaining < 0 && (
                                    <span className="ml-2 text-red-600">⚠ EXCEEDED</span>
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className={isOverAllocated ? 'text-red-600' : 'text-green-600'}>
                                  Total Machine Distribution Time:
                                </p>
                                <p
                                  className={`font-bold ${isOverAllocated ? 'text-red-800' : 'text-green-800'}`}
                                >
                                  {selectedMachines
                                    .reduce((sum, m) => sum + m.estimatedProductionTime, 0)
                                    .toFixed(1)}
                                  h
                                </p>
                              </div>
                            </div>
                            {isOverAllocated && (
                              <div className="mt-2 p-2 bg-red-200 rounded text-red-800 text-sm">
                                ⚠ Warning: Total allocated weight ({totalAllocated.toFixed(2)} kg)
                                exceeds actual quantity ({actualQuantity.toFixed(2)} kg). Please
                                adjust machine allocations.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
