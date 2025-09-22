import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { ArrowLeft, Package, CheckCircle, Calculator } from 'lucide-react';
import { useMachines } from '@/hooks/queries/useMachineQueries';
import { useFabricStructures } from '@/hooks/queries/useFabricStructureQueries';
import { useDescriptionParser } from '@/hooks/saleOrderitemPro/useDescriptionParser';
import type { SalesOrderDto, SalesOrderItemDto, MachineResponseDto } from '@/types/api-types';
import { ProductionAllotmentService } from '@/services/productionAllotmentService';
import { SalesOrderService } from '@/services/salesOrderService';

interface LocationState {
  orderData?: SalesOrderDto;
  selectedItem?: SalesOrderItemDto;
}

interface ProductionCalculation {
  needle: number;
  feeder: number;
  rpm: number;
  constant: number;
  stichLength: number; // S.L.
  count: number;
  efficiency: number;
  productionPerDay: number;
  productionPerHour: number;
  productionPerMinute: number;
}

interface MachineSelection {
  selectedMachine: MachineResponseDto | null;
}

interface MachineLoadDistribution {
  machineId: number;
  machineName: string;
  allocatedRolls: number;
  allocatedWeight: number; // kg
  estimatedProductionTime: number; // hours
  isEditing?: boolean;
  customParameters?: {
    needle: number;
    feeder: number;
    rpm: number;
    efficiency: number;
    constant: number;
  };
}

interface RollCalculation {
  actualQuantity: number;
  rollPerKg: number;
  numberOfRolls: number;
  totalWholeRolls: number;
  fractionalRoll: number;
  fractionalWeight: number; // kg
}

interface RollInput {
  actualQuantity: number;
  rollPerKg: number;
}

// Add new interface for additional fields
interface AdditionalFields {
  yarnLotNo: string;
  counter: string;
  colourCode: string;
  reqGreyGsm: number | null;
  reqGreyWidth: number | null;
  reqFinishGsm: number | null;
  reqFinishWidth: number | null;
}

const SalesOrderItemProcessing = () => {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDto | null>(
    locationState?.orderData || null
  );
  const [selectedItem, setSelectedItem] = useState<SalesOrderItemDto | null>(
    locationState?.selectedItem || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isItemProcessing, setIsItemProcessing] = useState(false);

  // Add state for additional fields
  const [additionalFields, setAdditionalFields] = useState<AdditionalFields>({
    yarnLotNo: '',
    counter: '',
    colourCode: '',
    reqGreyGsm: null,
    reqGreyWidth: null,
    reqFinishGsm: null,
    reqFinishWidth: null,
  });

  // Production calculation states
  const [machineSelection, setMachineSelection] = useState<MachineSelection>({
    selectedMachine: null,
  });

  // Multiple machine selection and load distribution
  const [selectedMachines, setSelectedMachines] = useState<MachineLoadDistribution[]>([]);
  const [showMachineDistribution, setShowMachineDistribution] = useState(false);

  // Roll calculation states
  const [rollInput, setRollInput] = useState<RollInput>({
    actualQuantity: 0,
    rollPerKg: 0,
  });

  const [rollCalculation, setRollCalculation] = useState<RollCalculation>({
    actualQuantity: 0,
    rollPerKg: 0,
    numberOfRolls: 0,
    totalWholeRolls: 0,
    fractionalRoll: 0,
    fractionalWeight: 0,
  });

  const [productionCalc, setProductionCalc] = useState<ProductionCalculation>({
    needle: 0,
    feeder: 0,
    rpm: 0,
    constant: 0.00085, // Fixed constant
    stichLength: 0, // S.L. from sales order item
    count: 0, // Count from sales order item
    efficiency: 0, // From fabric structure
    productionPerDay: 0,
    productionPerHour: 0,
    productionPerMinute: 0,
  });

  // Data fetching hooks
  const { data: machines, isLoading: isLoadingMachines } = useMachines();
  const { data: fabricStructures, isLoading: isLoadingFabrics } = useFabricStructures();
  const { extractFabricTypeFromDescription } = useDescriptionParser();

  useEffect(() => {
    // If data is passed via location state, use it
    if (locationState?.orderData && locationState?.selectedItem) {
      setSelectedOrder(locationState.orderData);
      setSelectedItem(locationState.selectedItem);
      setRollInput((prev) => ({
        ...prev,
        actualQuantity:
          parseFloat(locationState.selectedItem?.actualQty || '0') || prev.actualQuantity,
      }));
    } else if (orderId && itemId) {
      // TODO: Fetch order and item data by ID if not passed via state
      // For now, redirect back if no data
      navigate('/sales-orders');
    }
  }, [locationState, orderId, itemId, navigate]);

  // Keep rollInput in sync with selectedItem
  useEffect(() => {
    if (selectedItem) {
      setRollInput((prev) => ({
        ...prev,
        actualQuantity: parseFloat(selectedItem.actualQty || '0') || prev.actualQuantity,
      }));
    }
  }, [selectedItem]);

  // Initialize default machine (K120) and fabric efficiency
  useEffect(() => {
    if (machines && machines.length > 0) {
      // Find K120 machine as default
      const k120Machine = machines.find((m) => m.machineName.toLowerCase().includes('k120'));
      const defaultMachine = k120Machine || machines[0]; // Fallback to first machine if K120 not found

      setMachineSelection({
        selectedMachine: defaultMachine,
      });

      // Set initial production calculation values from machine
      setProductionCalc((prev) => ({
        ...prev,
        needle: defaultMachine.needle,
        feeder: defaultMachine.feeder,
        rpm: defaultMachine.rpm,
      }));
    }
  }, [machines]);

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
        setProductionCalc((prev) => ({
          ...prev,
          efficiency: matchingFabric.standardeffencny,
        }));
      } else {
        // Default efficiency if no match found
        setProductionCalc((prev) => ({
          ...prev,
          efficiency: 85, // Default 85% efficiency
        }));
      }
    }
  }, [fabricStructures, selectedItem]);

  // Parse description for production values with enhanced patterns
  const parseDescriptionValues = (description: string) => {
    if (!description)
      return {
        stitchLength: 0,
        count: 0,
        weightPerRoll: 0,
        numberOfRolls: 0,
        diameter: 0,
        gauge: 0,
        composition: '',
      };

    const desc = description.toLowerCase();
    let stitchLength = 0;
    let count = 0;
    let weightPerRoll = 0;
    let numberOfRolls = 0;
    let diameter = 0;
    let gauge = 0;
    let composition = '';

    // Parse Stitch Length (S.L.)
    const slPatterns = [
      /s\.?l\.?\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
      /s\/l\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
      /stitch\s+length\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
      /sl\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
    ];

    for (const pattern of slPatterns) {
      const match = desc.match(pattern);
      if (match && match[1]) {
        stitchLength = parseFloat(match[1]);
        break;
      }
    }

    // Parse Count
    const countPatterns = [
      /count\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
      /cnt\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
      /([0-9]+\.?[0-9]*)\s*count/i,
      /([0-9]+\.?[0-9]*)\s*cnt/i,
    ];

    for (const pattern of countPatterns) {
      const match = desc.match(pattern);
      if (match && match[1]) {
        count = parseFloat(match[1]);
        break;
      }
    }

    // Parse Weight per Roll (Wt./Roll) - Enhanced patterns
    const weightPerRollPatterns = [
      /wt\.\/roll\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg\/roll/i,
      /weight\s+per\s+roll\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg/i,
      /([0-9]+\.?[0-9]*)\s*kg\/roll/i,
      /wt\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg\/roll/i,
      /([0-9]+\.?[0-9]*)\s*kg\s*per\s*roll/i,
      /roll\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg/i, // New pattern: "Roll: 30 kg"
      /([0-9]+\.?[0-9]*)\s*kg\s*roll/i, // New pattern: "30 kg roll"
    ];

    for (const pattern of weightPerRollPatterns) {
      const match = desc.match(pattern);
      if (match && match[1]) {
        weightPerRoll = parseFloat(match[1]);
        break;
      }
    }

    // Parse Number of Rolls
    const numberOfRollsPatterns = [
      /no\s*of\s*rolls\s*[:=]?\s*([0-9]+)/i,
      /number\s*of\s*rolls\s*[:=]?\s*([0-9]+)/i,
      /rolls\s*[:=]?\s*([0-9]+)/i,
    ];

    for (const pattern of numberOfRollsPatterns) {
      const match = desc.match(pattern);
      if (match && match[1]) {
        numberOfRolls = parseInt(match[1], 10);
        break;
      }
    }

    // Parse Diameter and Gauge (Dia X GG: 34" X 28)
    const diaGgPatterns = [
      /dia\s*x\s*gg\s*:\s*([0-9]+)"?\s*x\s*([0-9]+)/i,
      /diameter\s*x\s*gauge\s*:\s*([0-9]+)"?\s*x\s*([0-9]+)/i,
      /dia\s*:\s*([0-9]+)"?\s*\|\s*gg\s*:\s*([0-9]+)/i,
    ];

    for (const pattern of diaGgPatterns) {
      const match = description.match(pattern);
      if (match && match[1] && match[2]) {
        diameter = parseInt(match[1], 10);
        gauge = parseInt(match[2], 10);
        break;
      }
    }

    // Parse Composition (Composition: 97% Cotton + 5 % Lycra)
    const compositionPatterns = [
      /composition\s*:\s*([^|]+)/i, // Match everything after "Composition:" until the next pipe or end of string
      /composition\s*[:=]?\s*(.+)/i,
    ];

    for (const pattern of compositionPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        composition = match[1].trim();
        // Clean up the composition string by removing trailing characters like "|"
        composition = composition.replace(/\s*\|\s*.*$/, '').trim();
        break;
      }
    }

    return { stitchLength, count, weightPerRoll, numberOfRolls, diameter, gauge, composition };
  };

  // Memoize parsed description values to avoid redundant parsing
  const parsedDescriptionValues = useMemo(() => {
    return selectedItem?.descriptions
      ? parseDescriptionValues(selectedItem.descriptions)
      : {
          stitchLength: 0,
          count: 0,
          weightPerRoll: 0,
          numberOfRolls: 0,
          diameter: 0,
          gauge: 0,
          composition: '',
        };
  }, [selectedItem?.descriptions]);

  // Extract values from description when selectedItem changes - now using memoized values
  useEffect(() => {
    if (selectedItem && selectedItem.descriptions) {
      setProductionCalc((prev) => ({
        ...prev,
        stichLength: parsedDescriptionValues.stitchLength || prev.stichLength,
        count: parsedDescriptionValues.count || prev.count,
      }));

      // Set roll per kg if found in description and not already set by user
      if (parsedDescriptionValues.weightPerRoll > 0 && rollInput.rollPerKg === 0) {
        setRollInput((prev) => ({
          ...prev,
          rollPerKg: parsedDescriptionValues.weightPerRoll,
        }));
      }

      // If number of rolls is provided in description, calculate rollPerKg based on actual quantity
      if (parsedDescriptionValues.numberOfRolls > 0 && rollInput.rollPerKg === 0) {
        const actualQuantity = Number(rollInput.actualQuantity) || 0;
        if (actualQuantity > 0) {
          const calculatedRollPerKg = actualQuantity / parsedDescriptionValues.numberOfRolls;
          setRollInput((prev) => ({
            ...prev,
            rollPerKg: calculatedRollPerKg,
          }));
        }
      }
    }
  }, [selectedItem, parsedDescriptionValues]);

  // Calculate production whenever relevant values change
  useEffect(() => {
    calculateProduction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productionCalc.needle,
    productionCalc.feeder,
    productionCalc.rpm,
    productionCalc.stichLength,
    productionCalc.count,
    productionCalc.efficiency,
  ]);

  // Calculate total rolls and fractional breakdown
  useEffect(() => {
    const actualQuantity = Number(rollInput.actualQuantity) || 0;
    const rollPerKg = Number(rollInput.rollPerKg) || 0;

    if (actualQuantity > 0 && rollPerKg > 0) {
      const totalRolls = actualQuantity / rollPerKg;
      const wholeRolls = Math.floor(totalRolls);
      const fractionalRoll = totalRolls - wholeRolls;
      const fractionalWeight = fractionalRoll * rollPerKg;

      setRollCalculation({
        actualQuantity: actualQuantity,
        rollPerKg: rollPerKg,
        numberOfRolls: totalRolls,
        totalWholeRolls: wholeRolls,
        fractionalRoll: fractionalRoll,
        fractionalWeight: fractionalWeight,
      });
    } else if (actualQuantity > 0 && parsedDescriptionValues.numberOfRolls > 0) {
      // If we have actual quantity and number of rolls from description, calculate rollPerKg
      const calculatedRollPerKg = actualQuantity / parsedDescriptionValues.numberOfRolls;
      const totalRolls = parsedDescriptionValues.numberOfRolls;

      setRollCalculation({
        actualQuantity: actualQuantity,
        rollPerKg: calculatedRollPerKg,
        numberOfRolls: totalRolls,
        totalWholeRolls: parsedDescriptionValues.numberOfRolls,
        fractionalRoll: 0,
        fractionalWeight: 0,
      });

      // Update the rollInput state with calculated rollPerKg
      setRollInput((prev) => ({
        ...prev,
        rollPerKg: calculatedRollPerKg,
      }));
    } else {
      setRollCalculation({
        actualQuantity: actualQuantity,
        rollPerKg: rollPerKg,
        numberOfRolls: 0,
        totalWholeRolls: 0,
        fractionalRoll: 0,
        fractionalWeight: 0,
      });
    }
  }, [rollInput.actualQuantity, rollInput.rollPerKg, parsedDescriptionValues.numberOfRolls]);

  const calculateProduction = () => {
    const { needle, feeder, rpm, constant, stichLength, count, efficiency } = productionCalc;

    // Reset calculations if any value is missing or zero
    if (
      needle <= 0 ||
      feeder <= 0 ||
      rpm <= 0 ||
      stichLength <= 0 ||
      count <= 0 ||
      efficiency <= 0
    ) {
      setProductionCalc((prev) => ({
        ...prev,
        productionPerDay: 0,
        productionPerHour: 0,
        productionPerMinute: 0,
      }));
      return;
    }

    try {
      // Production Formula: PRODUCTION = (NO. OF NEEDLE × FEEDER × RPM × S.L. × 0.00085 × EFF%) ÷ COUNT
      // This gives production per minute in grams

      // Step 1: Calculate basic production per minute in grams
      const efficiencyDecimal = efficiency / 100; // Convert percentage to decimal
      const productionGramsPerMinute =
        (needle * feeder * rpm * stichLength * constant * efficiencyDecimal) / count;

      // Step 2: Convert to kg and calculate time intervals
      const productionKgPerMinute = productionGramsPerMinute / 1000; // Convert grams to kg
      const productionKgPerHour = productionKgPerMinute * 60; // Per hour
      const productionKgPerDay = productionKgPerHour * 24; // Per day (24 hours)

      setProductionCalc((prev) => ({
        ...prev,
        productionPerMinute: Math.round(productionKgPerMinute * 10000) / 10000, // Round to 4 decimal places
        productionPerHour: Math.round(productionKgPerHour * 100) / 100, // Round to 2 decimal places
        productionPerDay: Math.round(productionKgPerDay * 100) / 100, // Round to 2 decimal places
      }));
    } catch (error) {
      console.error('Error in production calculation:', error);
      setProductionCalc((prev) => ({
        ...prev,
        productionPerDay: 0,
        productionPerHour: 0,
        productionPerMinute: 0,
      }));
    }
  };

  // Update roll input handler
  const handleRollInputChange = (field: keyof typeof rollInput, value: number) => {
    setRollInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Machine distribution functions
  const addMachineToDistribution = (machine: MachineResponseDto) => {
    const isAlreadySelected = selectedMachines.some((m) => m.machineId === machine.id);
    if (isAlreadySelected) {
      return;
    }

    // Get fabric efficiency for this machine
    let fabricEfficiency = productionCalc.efficiency;
    if (fabricStructures && selectedItem && fabricStructures.length > 0) {
      // Updated to use description for fabric type matching
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
        fabricEfficiency = matchingFabric.standardeffencny;
      }
    }

    const newMachine: MachineLoadDistribution = {
      machineId: machine.id,
      machineName: machine.machineName,
      allocatedRolls: 0,
      allocatedWeight: 0,
      estimatedProductionTime: 0,
      isSelected: true,

      isEditing: false,
      customParameters: {
        needle: machine.needle,
        feeder: machine.feeder,
        rpm: machine.rpm,
        efficiency: fabricEfficiency, // Use fabric efficiency instead of machine efficiency
        constant: machine.constat || 0.00085,
      },
    };

    setSelectedMachines((prev) => [...prev, newMachine]);
  };

  const removeMachineFromDistribution = (machineId: number) => {
    setSelectedMachines((prev) => prev.filter((m) => m.machineId !== machineId));
  };

  const toggleMachineEdit = (machineId: number) => {
    setSelectedMachines((prev) =>
      prev.map((machine) => {
        if (machine.machineId === machineId) {
          return { ...machine, isEditing: !machine.isEditing };
        }
        return machine;
      })
    );
  };

  const updateMachineParameters = (
    machineId: number,
    parameters: Partial<{
      needle: number;
      feeder: number;
      rpm: number;
      efficiency: number;
      constant: number;
    }>
  ) => {
    setSelectedMachines((prev) =>
      prev.map((machine) => {
        if (machine.machineId === machineId) {
          const currentParams = machine.customParameters || {
            needle: 0,
            feeder: 0,
            rpm: 0,
            efficiency: 0,
            constant: 0.00085,
          };
          return {
            ...machine,
            customParameters: { ...currentParams, ...parameters },
          };
        }
        return machine;
      })
    );
  };

  const saveMachineParameters = (machineId: number) => {
    setSelectedMachines((prev) =>
      prev.map((machine) => {
        if (machine.machineId === machineId) {
          // Recalculate production time with new parameters
          const params = machine.customParameters!;
          let estimatedTime = 0;

          if (
            machine.allocatedWeight > 0 &&
            productionCalc.stichLength > 0 &&
            productionCalc.count > 0
          ) {
            // Calculate production using custom parameters with the same formula as main calculation
            const efficiencyDecimal = params.efficiency / 100;
            const productionGramsPerMinute =
              (params.needle *
                params.feeder *
                params.rpm *
                productionCalc.stichLength *
                params.constant *
                efficiencyDecimal) /
              productionCalc.count;
            const productionKgPerHour = (productionGramsPerMinute / 1000) * 60;

            if (productionKgPerHour > 0) {
              estimatedTime = machine.allocatedWeight / productionKgPerHour;
            }
          }

          return {
            ...machine,
            isEditing: false,
            estimatedProductionTime: estimatedTime,
          };
        }
        return machine;
      })
    );
  };

  const updateMachineAllocation = (machineId: number, allocatedWeight: number) => {
    // Check if the allocated weight exceeds the actual quantity
    const actualQuantity = Number(rollInput.actualQuantity) || 0;
    const currentTotalAllocated = selectedMachines.reduce(
      (sum, m) => (m.machineId === machineId ? sum : sum + m.allocatedWeight),
      0
    );
    const newTotalAllocated = currentTotalAllocated + allocatedWeight;

    if (newTotalAllocated > actualQuantity) {
      // Show warning but still allow the update (user might adjust other machines)
      console.warn(
        `Total allocated weight (${newTotalAllocated.toFixed(2)} kg) exceeds actual quantity (${actualQuantity.toFixed(2)} kg)`
      );
    }

    setSelectedMachines((prev) =>
      prev.map((machine) => {
        if (machine.machineId === machineId) {
          // Calculate rolls based on weight
          const rolls = rollInput.rollPerKg > 0 ? allocatedWeight / rollInput.rollPerKg : 0;

          // Calculate production time using the same formula and parameters as main calculation
          let estimatedTime = 0;

          if (allocatedWeight > 0) {
            const params = machine.customParameters;
            if (params && productionCalc.stichLength > 0 && productionCalc.count > 0) {
              // Use custom machine parameters for calculation with the same formula
              const efficiencyDecimal = params.efficiency / 100;
              const productionGramsPerMinute =
                (params.needle *
                  params.feeder *
                  params.rpm *
                  productionCalc.stichLength *
                  params.constant *
                  efficiencyDecimal) /
                productionCalc.count;
              const productionKgPerHour = (productionGramsPerMinute / 1000) * 60;

              if (productionKgPerHour > 0) {
                estimatedTime = allocatedWeight / productionKgPerHour;
              }
            } else {
              // Fallback to original machine data with the same formula
              const selectedMachineData = machines?.find((m) => m.id === machineId);
              if (
                selectedMachineData &&
                productionCalc.stichLength > 0 &&
                productionCalc.count > 0
              ) {
                // Get fabric efficiency for this machine
                let fabricEfficiency = productionCalc.efficiency;
                if (fabricStructures && selectedItem && fabricStructures.length > 0) {
                  // Updated to use description for fabric type matching
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
                    fabricEfficiency = matchingFabric.standardeffencny;
                  }
                }

                // Use the same production calculation formula
                const efficiencyDecimal = fabricEfficiency / 100;
                const constant = selectedMachineData.constat || productionCalc.constant || 0.00085;
                const productionGramsPerMinute =
                  (selectedMachineData.needle *
                    selectedMachineData.feeder *
                    selectedMachineData.rpm *
                    productionCalc.stichLength *
                    constant *
                    efficiencyDecimal) /
                  productionCalc.count;
                const productionKgPerHour = (productionGramsPerMinute / 1000) * 60;

                if (productionKgPerHour > 0) {
                  estimatedTime = allocatedWeight / productionKgPerHour;
                }
              }
            }
          }

          return {
            ...machine,
            allocatedRolls: rolls,
            allocatedWeight,
            estimatedProductionTime: estimatedTime,
          };
        }
        return machine;
      })
    );
  };

  // Enhanced auto distribution that considers rolls and calculates production time properly
  const autoDistributeLoad = () => {
    if (selectedMachines.length === 0) {
      alert('Please select at least one machine first.');
      return;
    }

    const actualQuantity = Number(rollInput.actualQuantity);
    if (!actualQuantity || actualQuantity <= 0) {
      alert('No quantity available for distribution.');
      return;
    }

    const rollPerKg = Number(rollInput.rollPerKg);
    if (!rollPerKg || rollPerKg <= 0) {
      alert('Please enter Roll per Kg value first.');
      return;
    }

    const wholeRolls = rollCalculation.totalWholeRolls;
    const fractionalRoll = rollCalculation.fractionalRoll;
    const fractionalWeight = rollCalculation.fractionalWeight;

    // Distribute whole rolls evenly among machines
    const wholeRollsPerMachine = Math.floor(wholeRolls / selectedMachines.length);
    const remainingWholeRolls = wholeRolls % selectedMachines.length;

    let updatedMachines = selectedMachines.map((machine, index) => {
      // Start with base whole rolls per machine
      let machineRolls = wholeRollsPerMachine;

      // Distribute remaining whole rolls one by one
      if (index < remainingWholeRolls) {
        machineRolls += 1;
      }

      // For the last machine, add the fractional roll if it exists
      if (fractionalRoll > 0 && index === selectedMachines.length - 1) {
        machineRolls += fractionalRoll;
      }

      // Calculate weight: whole rolls * weight per roll + fractional weight (only for last machine)
      let machineWeight = machineRolls * rollPerKg;
      if (fractionalRoll > 0 && index === selectedMachines.length - 1) {
        // Adjust weight to account for fractional roll calculation
        machineWeight = (machineRolls - fractionalRoll) * rollPerKg + fractionalWeight;
      }

      return {
        ...machine,
        allocatedRolls: machineRolls,
        allocatedWeight: machineWeight,
      };
    });

    // Calculate production times using the same formula as main calculation
    updatedMachines = updatedMachines.map((machine) => {
      const selectedMachineData = machines?.find((m) => m.id === machine.machineId);
      let estimatedTime = 0;

      if (
        selectedMachineData &&
        machine.allocatedWeight > 0 &&
        productionCalc.stichLength > 0 &&
        productionCalc.count > 0
      ) {
        // Get fabric efficiency for this machine
        let fabricEfficiency = productionCalc.efficiency;
        if (fabricStructures && selectedItem && fabricStructures.length > 0) {
          // Updated to use description for fabric type matching
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
            fabricEfficiency = matchingFabric.standardeffencny;
          }
        }

        // Use the same production calculation formula with proper parameters
        const efficiencyDecimal = fabricEfficiency / 100;
        const constant = selectedMachineData.constat || productionCalc.constant || 0.00085;
        const productionGramsPerMinute =
          (selectedMachineData.needle *
            selectedMachineData.feeder *
            selectedMachineData.rpm *
            productionCalc.stichLength *
            constant *
            efficiencyDecimal) /
          productionCalc.count;
        const productionKgPerHour = (productionGramsPerMinute / 1000) * 60;

        if (productionKgPerHour > 0) {
          estimatedTime = machine.allocatedWeight / productionKgPerHour;
        }
      }

      return {
        ...machine,
        estimatedProductionTime: estimatedTime,
      };
    });

    setSelectedMachines(updatedMachines);
  };

  const handleMachineChange = (machineId: string) => {
    const machine = machines?.find((m) => m.id.toString() === machineId);
    if (machine) {
      setMachineSelection((prev) => ({
        ...prev,
        selectedMachine: machine,
      }));

      // Update production calculation with new machine values
      setProductionCalc((prev) => ({
        ...prev,
        needle: machine.needle,
        feeder: machine.feeder,
        rpm: machine.rpm,
      }));
    }
  };

  const handleProductionValueChange = (field: keyof ProductionCalculation, value: number) => {
    setProductionCalc((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRefreshFromDescription = () => {
    if (selectedItem?.descriptions) {
      setProductionCalc((prev) => ({
        ...prev,
        stichLength: parsedDescriptionValues.stitchLength || 0,
        count: parsedDescriptionValues.count || 0,
      }));

      // Also update roll per kg if found
      if (parsedDescriptionValues.weightPerRoll > 0) {
        setRollInput((prev) => ({
          ...prev,
          rollPerKg: parsedDescriptionValues.weightPerRoll,
        }));
      }
    }
  };

  const handleGoBack = () => {
    navigate('/sales-orders');
  };

  // Function to generate allotment ID based on specifications
  const generateAllotmentId = async () => {
    if (!selectedOrder || !selectedItem) return null;

    try {
      // 1st character: A (Avyaan In-house Production), J (Job Work Production)
      // Based on voucher number series: AKF/24-25/J001 for jobwork, AKF/24-25/A001 for end customer
      const firstChar = selectedOrder.voucherNumber.includes('/J') ? 'J' : 'A';

      // 2nd & 3rd character: Fabric Type
      // Extract fabric type from item name/description
      const fabricTypeMap: { [key: string]: string } = {
        'single jersey': 'SJ',
        '1x1 rib': '1R',
        '2x1 rib': '2R',
        '3x1 rib': '3R',
        'two thread fleece': '2F',
        'three thread fleece': '3F',
        'variegated rib': 'VR',
        'popcorn strip': 'PS',
        'honey comb': 'HC',
        'honeycomb strip': 'HS',
        'pop corn': 'PO',
        'pique crinkle': 'PC',
        'rice knit': 'RK',
        'single pique': 'SP',
        'double pique': 'DP',
        'single jersey pleated': 'PL',
        'small biscuit': 'SB',
        waffle: 'WA',
        'waffle miss cam': 'WM',
        'pointelle rib': 'PR',
        herringbone: 'HB',
        stripe: 'ST',
      };

      let fabricTypeCode = 'SJ'; // Default to Single Jersey
      const itemDescription = (
        selectedItem.stockItemName +
        ' ' +
        (selectedItem.descriptions || '')
      ).toLowerCase();

      for (const [key, code] of Object.entries(fabricTypeMap)) {
        if (itemDescription.includes(key)) {
          fabricTypeCode = code;
          break;
        }
      }

      // 4th character: L (Lycra), X (No Lycra)
      const fourthChar = itemDescription.includes('lycra') ? 'L' : 'X';

      // 5th character: 1 (Single Yarn), 2 (Doubled Yarn)
      // This would typically come from item specifications, defaulting to 1 for now
      const fifthChar = '1'; // Default to Single Yarn

      // 6th & 7th character: Yarn Count (30 as example)
      // This would typically come from item specifications, defaulting to 30 for now
      const yarnCount = '30'; // Default yarn count

      // 8th character: C (Combed Yarn), K (Carded Yarn)
      // This would typically come from item specifications, defaulting to C for now
      const eighthChar = itemDescription.includes('carded') ? 'K' : 'C';

      // 9th & 10th character: Machine Diameter (30 as example)
      // Using the first selected machine's diameter, defaulting to 30 if none selected
      let machineDiameter = '30';
      if (selectedMachines.length > 0 && machines) {
        const firstMachine = machines.find((m) => m.id === selectedMachines[0].machineId);
        if (firstMachine) {
          machineDiameter = firstMachine.dia.toString().padStart(2, '0').substring(0, 2);
        }
      }

      // 11th & 12th character: Machine Cylinder Gauge (28 as example)
      // Using the first selected machine's gauge, defaulting to 28 if none selected
      let machineGauge = '28';
      if (selectedMachines.length > 0 && machines) {
        const firstMachine = machines.find((m) => m.id === selectedMachines[0].machineId);
        if (firstMachine) {
          machineGauge = firstMachine.gg.toString().padStart(2, '0').substring(0, 2);
        }
      }

      // 13th & 14th character: Current Financial Year (25 as example)
      // Extract from voucher number or use current year
      let financialYear = '25';
      const voucherMatch = selectedOrder.voucherNumber.match(/\/(\d{2})-(\d{2})\//);
      if (voucherMatch) {
        financialYear = voucherMatch[1]; // Use the first two digits of the financial year
      }

      // 15th, 16th, 17th, 18th, 19th & 20th character: Serial Number (000001 as example)
      // This now comes from the backend database sequence
      const serialNumber = await ProductionAllotmentService.getNextSerialNumber();

      // 21st character: N (No Slit Line), H (HoneyComb Slit Line), O (Open Width)
      // Based on fabric type or defaulting to N
      let twentyFirstChar = 'N';
      if (itemDescription.includes('honeycomb') || itemDescription.includes('honey comb')) {
        twentyFirstChar = 'H';
      } else if (itemDescription.includes('open width')) {
        twentyFirstChar = 'O';
      }

      // Format with hyphens: ASJL-130C3028-25000001N
      // Hyphens after 4th and 12th characters
      const part1 = `${firstChar}${fabricTypeCode}${fourthChar}`; // First 4 characters
      const part2 = `${fifthChar}${yarnCount}${eighthChar}${machineDiameter}${machineGauge}`; // Next 8 characters (5-12)
      const part3 = `${financialYear}${serialNumber}${twentyFirstChar}`; // Remaining characters (13-21)

      return `${part1}-${part2}-${part3}`;
    } catch (error) {
      console.error('Error generating allotment ID:', error);
      return null;
    }
  };

  // Add handler for additional fields
  const handleAdditionalFieldChange = (
    field: keyof AdditionalFields,
    value: string | number | null
  ) => {
    setAdditionalFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProcessItem = async () => {
    if (!selectedItem || !selectedOrder) return;

    // Check if machines are selected
    if (selectedMachines.length === 0) {
      alert('Please select at least one machine before processing.');
      return;
    }

    // Check if total allocated weight exceeds actual quantity
    const totalAllocated = selectedMachines.reduce((sum, m) => sum + m.allocatedWeight, 0);
    const actualQuantity = Number(rollInput.actualQuantity || 0);

    if (selectedMachines.length > 0 && totalAllocated > actualQuantity) {
      alert(
        `Error: Total allocated weight (${totalAllocated.toFixed(2)} kg) exceeds actual quantity (${actualQuantity.toFixed(2)} kg). Please adjust machine allocations before processing.`
      );
      return;
    }

    // Generate allotment ID
    const allotmentId = await generateAllotmentId();

    setIsProcessing(true);
    try {
      // Prepare data for API call
      const machineAllocations = selectedMachines.map((machine) => ({
        machineName: machine.machineName,
        machineId: machine.machineId,
        numberOfNeedles: machine.customParameters?.needle || productionCalc.needle,
        feeders: machine.customParameters?.feeder || productionCalc.feeder,
        rpm: machine.customParameters?.rpm || productionCalc.rpm,
        rollPerKg: rollCalculation.rollPerKg,
        totalLoadWeight: machine.allocatedWeight,
        totalRolls: machine.allocatedRolls,
        rollBreakdown: {
          wholeRolls: [],
          fractionalRoll: {
            quantity: 0,
            weightPerRoll: 0,
            totalWeight: machine.allocatedWeight,
          },
        },
        estimatedProductionTime: machine.estimatedProductionTime,
      }));

      // Extract yarn count from item description
      const yarnCount = extractYarnCount(selectedItem.descriptions || '');

      // Extract composition from item description
      const composition = extractComposition(selectedItem.descriptions || '');

      // Extract fabric type from item description
      const fabricType =
        extractFabricTypeFromDescription(selectedItem.descriptions || '') ||
        extractFabricType(selectedItem.stockItemName);

      // Prepare the request data with additional fields
      const requestData = {
        allotmentId: allotmentId || `ALT-${Date.now()}`,
        voucherNumber: selectedOrder.voucherNumber,
        itemName: selectedItem.stockItemName,
        salesOrderId: selectedOrder.id,
        salesOrderItemId: selectedItem.id,
        actualQuantity: actualQuantity,
        yarnCount: yarnCount,
        diameter: parsedDescriptionValues.diameter || productionCalc.needle, // Use parsed diameter or fallback to needle count
        gauge: parsedDescriptionValues.gauge || productionCalc.feeder, // Use parsed gauge or fallback to feeder count
        fabricType: fabricType,
        slitLine: 'N/A', // TODO: Extract from item if available
        stitchLength: productionCalc.stichLength,
        efficiency: productionCalc.efficiency,
        composition: composition,
        // Add the new fields
        yarnLotNo: additionalFields.yarnLotNo,
        counter: additionalFields.counter,
        colourCode: additionalFields.colourCode,
        reqGreyGsm: additionalFields.reqGreyGsm,
        reqGreyWidth: additionalFields.reqGreyWidth,
        reqFinishGsm: additionalFields.reqFinishGsm,
        reqFinishWidth: additionalFields.reqFinishWidth,
        partyName: selectedOrder.partyName, // Fetch party name from sales order
        machineAllocations: machineAllocations,
      };

      // Send data to backend API
      const response = await ProductionAllotmentService.createProductionAllotment(requestData);

      // Mark the sales order item as processed
      setIsItemProcessing(true);
      try {
        await SalesOrderService.markSalesOrderItemAsProcessed(selectedOrder.id, selectedItem.id);
        // Update the local state to reflect the item as processed
        setSelectedItem((prev) => (prev ? { ...prev, processFlag: 1 } : null));
      } catch (error) {
        console.error('Error marking item as processed:', error);
        alert('Item was processed successfully, but there was an error updating the status.');
      } finally {
        setIsItemProcessing(false);
      }

      // Show success message with allotment ID
      if (response && response.allotmentId) {
        alert(
          `Successfully processed item: ${selectedItem.stockItemName} from order ${selectedOrder.voucherNumber}\nAllotment ID: ${response.allotmentId}`
        );
      } else {
        alert(
          `Successfully processed item: ${selectedItem.stockItemName} from order ${selectedOrder.voucherNumber}`
        );
      }

      // Navigate back to sales orders after successful processing
      navigate('/sales-orders');
    } catch (error) {
      console.error('Error processing item:', error);
      alert('Error processing item. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to extract yarn count from description
  const extractYarnCount = (description: string): string => {
    // Look for patterns like "24/1 CCH" or "30/1 CVC"
    const yarnCountRegex = /(\d+\/\d+\s*[A-Z]+)/i;
    const match = description.match(yarnCountRegex);
    return match ? match[1] : 'N/A';
  };

  // Helper function to extract fabric type from item name
  const extractFabricType = (itemName: string): string => {
    // Use the description parser's fabric type extraction if available
    if (selectedItem?.descriptions) {
      const fabricTypeFromDescription = extractFabricTypeFromDescription(selectedItem.descriptions);
      if (fabricTypeFromDescription) {
        return fabricTypeFromDescription;
      }
    }

    // Fallback to simple extraction from item name
    return itemName.split(' ')[0] || 'N/A';
  };

  // Helper function to extract composition from description
  const extractComposition = (description: string): string => {
    if (!description) return 'N/A';

    // Use the parsed description values if available
    if (parsedDescriptionValues.composition) {
      return parsedDescriptionValues.composition;
    }

    // Fallback to the existing regex pattern
    const compositionRegex = /(\d+%[^\d+]+)/g;
    const matches = description.match(compositionRegex);
    return matches ? matches.join(' + ') : 'N/A';
  };

  if (!selectedOrder || !selectedItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales Orders
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">Process Sales Order Item</h1>
            <p className="text-muted-foreground">
              Processing Item:{' '}
              <span className="font-semibold text-primary">{selectedItem?.stockItemName}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From Order: {selectedOrder?.voucherNumber} | Customer: {selectedOrder?.partyName}
            </p>
          </div>
        </div>
        {selectedItem?.processFlag !== 1 ? (
          <Button
            onClick={handleProcessItem}
            size="lg"
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
                <Package className="h-4 w-4 mr-2" />
                Process This Item
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Item is in process</span>
          </div>
        )}
      </div>

      {/* Processing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">1</div>
              <div className="text-sm text-blue-600">Item Selected</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600 font-mono">
                ₹{selectedItem.amount}
              </div>
              <div className="text-sm text-yellow-600">Item Value</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {typeof selectedItem.actualQty === 'string'
                  ? parseFloat(selectedItem.actualQty) || 0
                  : selectedItem.actualQty || 0}
              </div>
              <div className="text-sm text-green-600">Quantity (kg)</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">Ready</div>
              <div className="text-sm text-purple-600">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Item Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Item Name:</span>
                  <p className="font-semibold">{selectedItem.stockItemName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Description:</span>
                  <p className="text-sm">
                    {selectedItem.descriptions || 'No description available'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Order Number:</span>
                  <p className="font-semibold">{selectedItem.orderNo}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Voucher Number:</span>
                  <p>{selectedOrder.voucherNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yarn-lot-no">Yarn Lot No.</Label>
              <Input
                id="yarn-lot-no"
                value={additionalFields.yarnLotNo}
                onChange={(e) => handleAdditionalFieldChange('yarnLotNo', e.target.value)}
                placeholder="Enter yarn lot number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="counter">Counter</Label>
              <Input
                id="counter"
                value={additionalFields.counter}
                onChange={(e) => handleAdditionalFieldChange('counter', e.target.value)}
                placeholder="Enter counter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colour-code">Colour Code</Label>
              <Input
                id="colour-code"
                value={additionalFields.colourCode}
                onChange={(e) => handleAdditionalFieldChange('colourCode', e.target.value)}
                placeholder="Enter colour code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="party-name">Party Name</Label>
              <Input
                id="party-name"
                value={selectedOrder?.partyName || ''}
                disabled
                placeholder="Party name from sales order"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-grey-gsm">Req. Grey GSM</Label>
              <Input
                id="req-grey-gsm"
                type="number"
                value={additionalFields.reqGreyGsm || ''}
                onChange={(e) =>
                  handleAdditionalFieldChange(
                    'reqGreyGsm',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="Enter required grey GSM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-grey-width">Req. Grey Width</Label>
              <Input
                id="req-grey-width"
                type="number"
                value={additionalFields.reqGreyWidth || ''}
                onChange={(e) =>
                  handleAdditionalFieldChange(
                    'reqGreyWidth',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="Enter required grey width"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-finish-gsm">Req. Finish GSM</Label>
              <Input
                id="req-finish-gsm"
                type="number"
                value={additionalFields.reqFinishGsm || ''}
                onChange={(e) =>
                  handleAdditionalFieldChange(
                    'reqFinishGsm',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="Enter required finish GSM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-finish-width">Req. Finish Width</Label>
              <Input
                id="req-finish-width"
                type="number"
                value={additionalFields.reqFinishWidth || ''}
                onChange={(e) =>
                  handleAdditionalFieldChange(
                    'reqFinishWidth',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="Enter required finish width"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roll Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Roll Calculation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual-quantity">Actual Quantity (kg)</Label>
                <Input
                  id="actual-quantity"
                  type="number"
                  step="0.01"
                  value={rollInput.actualQuantity}
                  onChange={(e) =>
                    handleRollInputChange('actualQuantity', parseFloat(e.target.value) || 0)
                  }
                  className="text-center font-mono"
                />
                <div className="text-xs text-muted-foreground">
                  From Sales Order:{' '}
                  {typeof selectedItem.actualQty === 'string'
                    ? parseFloat(selectedItem.actualQty) || 0
                    : selectedItem.actualQty || 0}{' '}
                  kg
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll-per-kg">Roll per Kg (kg/roll)</Label>
                <Input
                  id="roll-per-kg"
                  type="number"
                  step="0.01"
                  value={rollInput.rollPerKg}
                  onChange={(e) =>
                    handleRollInputChange('rollPerKg', parseFloat(e.target.value) || 0)
                  }
                  className="text-center font-mono"
                />
                <div className="text-xs text-muted-foreground">
                  {parsedDescriptionValues.weightPerRoll > 0 ? (
                    <span className="text-green-600">
                      ✓ Auto-parsed from description: {parsedDescriptionValues.weightPerRoll}{' '}
                      kg/roll
                    </span>
                  ) : parsedDescriptionValues.numberOfRolls > 0 ? (
                    <span className="text-green-600">
                      ✓ Calculated from {parsedDescriptionValues.numberOfRolls} rolls
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      ⚠ Enter manually (not found in description)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {rollCalculation.numberOfRolls > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Roll Calculation Results</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Total Rolls:</span>
                    <p className="font-bold text-blue-800">
                      {rollCalculation.numberOfRolls.toFixed(2)} rolls
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-600">Whole Rolls:</span>
                    <p className="font-bold text-blue-800">
                      {rollCalculation.totalWholeRolls} × {rollInput.rollPerKg}kg
                    </p>
                  </div>
                  {rollCalculation.fractionalRoll > 0 && (
                    <>
                      <div>
                        <span className="text-blue-600">Fractional Roll:</span>
                        <p className="font-bold text-blue-800">
                          {rollCalculation.fractionalRoll.toFixed(2)} rolls
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-600">Fractional Weight:</span>
                        <p className="font-bold text-blue-800">
                          {rollCalculation.fractionalWeight.toFixed(2)} kg
                        </p>
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <span className="text-blue-600">Breakdown:</span>
                    <p className="font-bold text-blue-800">
                      {rollCalculation.totalWholeRolls > 0 &&
                        `${rollCalculation.totalWholeRolls} roll${rollCalculation.totalWholeRolls !== 1 ? 's' : ''} × ${rollInput.rollPerKg}kg`}
                      {rollCalculation.fractionalRoll > 0 &&
                        ` + 1 roll × ${rollCalculation.fractionalWeight.toFixed(2)}kg`}
                      {rollCalculation.totalWholeRolls === 0 &&
                        rollCalculation.fractionalRoll > 0 &&
                        `1 roll × ${rollCalculation.fractionalWeight.toFixed(2)}kg`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Production Timing Calculation */}
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
                      onValueChange={handleMachineChange}
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
                    onChange={(e) => handleProductionValueChange('needle', Number(e.target.value))}
                    className="text-center font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feeder">Feeders</Label>
                  <Input
                    id="feeder"
                    type="number"
                    value={productionCalc.feeder}
                    onChange={(e) => handleProductionValueChange('feeder', Number(e.target.value))}
                    className="text-center font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rpm">RPM</Label>
                  <Input
                    id="rpm"
                    type="number"
                    value={productionCalc.rpm}
                    onChange={(e) => handleProductionValueChange('rpm', Number(e.target.value))}
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
                      handleProductionValueChange('efficiency', Number(e.target.value))
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
                    onClick={handleRefreshFromDescription}
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
                    {(() => {
                      return (
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
                      );
                    })()}
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
                      handleProductionValueChange('stichLength', Number(e.target.value))
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
                    onChange={(e) => handleProductionValueChange('count', Number(e.target.value))}
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
            {isLoadingFabrics ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
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
                  {selectedMachines.length > 0 && (
                    <div className="mt-2 p-2 bg-green-100 rounded">
                      <p className="text-xs font-medium text-green-800">
                        Machine Parameters Auto-Loaded:
                      </p>
                      <p className="text-xs text-green-700">
                        All selected machines have their original parameters (needles, feeders, RPM,
                        efficiency) automatically fetched and can be edited individually for precise
                        calculations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Machine Load Distribution */}
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
                <Button
                  onClick={() => setShowMachineDistribution(!showMachineDistribution)}
                  variant="outline"
                  size="sm"
                >
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
                        {machines?.map((machine) => {
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
                                  removeMachineFromDistribution(machine.id);
                                } else {
                                  addMachineToDistribution(machine);
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
                            onClick={autoDistributeLoad}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!rollInput.rollPerKg || rollInput.rollPerKg <= 0}
                          >
                            Auto Distribute
                          </Button>
                          <Button
                            onClick={() => setSelectedMachines([])}
                            size="sm"
                            variant="outline"
                          >
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
                                        ? saveMachineParameters(machine.machineId)
                                        : toggleMachineEdit(machine.machineId)
                                    }
                                    size="sm"
                                    variant={machine.isEditing ? 'default' : 'outline'}
                                    className="h-7 px-2 text-xs"
                                  >
                                    {machine.isEditing ? 'Save' : 'Edit'}
                                  </Button>
                                  {machine.isEditing && (
                                    <Button
                                      onClick={() => toggleMachineEdit(machine.machineId)}
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => removeMachineFromDistribution(machine.machineId)}
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
                                          updateMachineParameters(machine.machineId, {
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
                                          updateMachineParameters(machine.machineId, {
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
                                          updateMachineParameters(machine.machineId, {
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
                                          updateMachineParameters(machine.machineId, {
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
                                          updateMachineParameters(machine.machineId, {
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
                                    step="0.01"
                                    value={machine.allocatedWeight}
                                    onChange={(e) => {
                                      const weight = Number(e.target.value);
                                      updateMachineAllocation(machine.machineId, weight);
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
                                          const fractionalPart =
                                            machine.allocatedRolls - wholeRolls;

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
                                  <p
                                    className={isOverAllocated ? 'text-red-600' : 'text-green-600'}
                                  >
                                    Total Allocated Weight:
                                  </p>
                                  <p
                                    className={`font-bold ${isOverAllocated ? 'text-red-800' : 'text-green-800'}`}
                                  >
                                    {totalAllocated.toFixed(2)} kg
                                    {isOverAllocated && (
                                      <span className="ml-2 text-red-600">⚠</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p
                                    className={isOverAllocated ? 'text-red-600' : 'text-green-600'}
                                  >
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
                                  <p
                                    className={isOverAllocated ? 'text-red-600' : 'text-green-600'}
                                  >
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
                                  ⚠ Warning: Total allocated weight ({totalAllocated.toFixed(2)}{' '}
                                  kg) exceeds actual quantity ({actualQuantity.toFixed(2)} kg).
                                  Please adjust machine allocations.
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

      {/* Processing Actions */}
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
                  onClick={handleProcessItem}
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
    </div>
  );
};

export default SalesOrderItemProcessing;
