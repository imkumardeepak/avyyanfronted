import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMachines } from '@/hooks/queries/useMachineQueries';
import { useFabricStructures } from '@/hooks/queries/useFabricStructureQueries';
import { useTapeColors } from '@/hooks/queries/useTapeColorQueries';
import { useDescriptionParser } from '@/hooks/saleOrderitemPro/useDescriptionParser';
import type { SalesOrderDto, SalesOrderItemDto, MachineResponseDto } from '@/types/api-types';
import { ProductionAllotmentService } from '@/services/productionAllotmentService';
import { SalesOrderService } from '@/services/salesOrderService';
import { ProcessingSummary } from '@/components/SalesOrderItemProcessing/ProcessingSummary';
import { ItemDetails } from '@/components/SalesOrderItemProcessing/ItemDetails';
import { ProductionTimingCalculation } from '@/components/SalesOrderItemProcessing/ProductionTimingCalculation';
import { RollCalculation } from '@/components/SalesOrderItemProcessing/RollCalculation';
import { MachineLoadDistribution } from '@/components/SalesOrderItemProcessing/MachineLoadDistribution';
import { AdditionalInformation } from '@/components/SalesOrderItemProcessing/AdditionalInformation';
import { ProcessingActions } from '@/components/SalesOrderItemProcessing/ProcessingActions';
import { PackagingDetails } from '@/components/SalesOrderItemProcessing/PackagingDetails';

interface LocationState {
  orderData?: SalesOrderDto;
  selectedItem?: SalesOrderItemDto;
}

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

interface MachineLoadDistributionItem {
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

interface RollCalculationData {
  actualQuantity: number;
  rollPerKg: number;
  numberOfRolls: number;
  totalWholeRolls: number;
  fractionalRoll: number;
  fractionalWeight: number;
}

interface RollInput {
  actualQuantity: number;
  rollPerKg: number;
}

interface AdditionalFields {
  yarnLotNo: string;
  counter: string;
  colourCode: string;
  reqGreyGsm: number | null;
  reqGreyWidth: number | null;
  reqFinishGsm: number | null;
  reqFinishWidth: number | null;
}

const SalesOrderItemProcessingRefactored = () => {
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

  // Add state for packaging details
  const [packagingDetails, setPackagingDetails] = useState({
    coreType: 'with' as 'with' | 'without',
    tubeWeight: 1,
    tapeColorId: null as number | null,
  });

  // Production calculation states
  const [machineSelection, setMachineSelection] = useState<MachineSelection>({
    selectedMachine: null,
  });

  // Multiple machine selection and load distribution
  const [selectedMachines, setSelectedMachines] = useState<MachineLoadDistributionItem[]>([]);
  const [showMachineDistribution, setShowMachineDistribution] = useState(false);

  // Roll calculation states
  const [rollInput, setRollInput] = useState<RollInput>({
    actualQuantity: 0,
    rollPerKg: 0,
  });

  const [rollCalculation, setRollCalculation] = useState<RollCalculationData>({
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
    constant: 0.00085,
    stichLength: 0,
    count: 0,
    efficiency: 0,
    productionPerDay: 0,
    productionPerHour: 0,
    productionPerMinute: 0,
  });

  // Data fetching hooks
  const { data: machines, isLoading: isLoadingMachines } = useMachines();
  const { data: fabricStructures } = useFabricStructures();
  const { data: tapeColors = [] } = useTapeColors();
  const { extractFabricTypeFromDescription } = useDescriptionParser();

  // Multi-page state
  const [currentPage, setCurrentPage] = useState(1);

  // Add state for allotment ID
  const [allotmentId, setAllotmentId] = useState<string | null>(null);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

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
      /roll\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg/i,
      /([0-9]+\.?[0-9]*)\s*kg\s*roll/i,
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
      /composition\s*:\s*([^|]+)/i,
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

    const newMachine: MachineLoadDistributionItem = {
      machineId: machine.id,
      machineName: machine.machineName,
      allocatedRolls: 0,
      allocatedWeight: 0,
      estimatedProductionTime: 0,
      isEditing: false,
      customParameters: {
        needle: machine.needle,
        feeder: machine.feeder,
        rpm: machine.rpm,
        efficiency: fabricEfficiency,
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
        'single jersysmall biscuit': 'SB',
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
     
         let fifthChar = '1'; // Default to Single Yarn
      const countRegex = /count:\s*(\d+)\/(\d+)/i;
      const countMatch = selectedItem.descriptions?.match(countRegex);
      if (countMatch && countMatch[2]) {
        // If the second number in the count is 2, it's doubled yarn
        fifthChar = countMatch[2] === '2' ? '2' : '1';
      }

      // 6th & 7th character: Yarn Count (24 as example from "Count: 24/1 CCH")
      let yarnCount = '30'; // Default yarn count
      if (countMatch && countMatch[1]) {
        // Use the first number in the count (e.g., 24 from "24/1")
        yarnCount = countMatch[1].padStart(2, '0').substring(0, 2);
      }


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

  // Generate allotment ID when dependencies are ready
  useEffect(() => {
    const generateId = async () => {
      if (selectedOrder && selectedItem && !allotmentId && !isGeneratingId) {
        setIsGeneratingId(true);
        try {
          const id = await generateAllotmentId();
          setAllotmentId(id);
        } catch (error) {
          console.error('Error generating allotment ID:', error);
        } finally {
          setIsGeneratingId(false);
        }
      }
    };

    generateId();
  }, [selectedOrder, selectedItem, machines, selectedMachines]);

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

  // Add handler for packaging details changes
  const handleCoreTypeChange = (coreType: 'with' | 'without') => {
    setPackagingDetails(prev => ({
      ...prev,
      coreType,
      tubeWeight: coreType === 'without' ? 0 : (prev.tubeWeight === 0 ? 1 : prev.tubeWeight)
    }));
  };

  const handleTubeWeightChange = (weight: number) => {
    setPackagingDetails(prev => ({
      ...prev,
      tubeWeight: weight
    }));
  };

  const handleTapeColorChange = (tapeColorId: number) => {
    setPackagingDetails(prev => ({
      ...prev,
      tapeColorId
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

    // Check if allotmentId is valid
    if (!allotmentId) {
      alert('Error generating allotment ID. Please try again.');
      return;
    }

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
        allotmentId: allotmentId, // Now guaranteed to be a string
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
        // Packaging Details
        tubeWeight: packagingDetails.tubeWeight,
        tapeColor: packagingDetails.tapeColorId 
          ? tapeColors.find((color) => color.id === packagingDetails.tapeColorId)?.tapeColor || ''
          : '',
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
      {/* Header */}<div className="space-y-6">
  {/* Compact Attractive Header */}
  <div className="border rounded-xl bg-card p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleGoBack}
          className="hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="h-8 w-px bg-border"></div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold font-display">Production Planning</h1>
            <div className="h-1 w-1 bg-primary rounded-full"></div>
            <span className="text-sm text-muted-foreground">Processing Item</span>
             <div className="flex items-center space-x-2">
              <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {selectedItem?.stockItemName}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
           
            
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Order:</span>
              <span className="font-semibold">{selectedOrder?.voucherNumber}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium max-w-[150px] truncate">{selectedOrder?.partyName}</span>
            </div>
            
            {allotmentId && (
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Allotment:</span>
                <span className="font-mono font-semibold text-primary">{allotmentId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


      {/* Page 1: Processing Summary, Item Details, Production Timing Calculation */}
      {currentPage === 1 && (
        <>
          <ProcessingSummary selectedItem={selectedItem} />
          <ItemDetails selectedItem={selectedItem} selectedOrder={selectedOrder} />
          <ProductionTimingCalculation
            machines={machines}
            isLoadingMachines={isLoadingMachines}
            selectedItem={selectedItem}
            parsedDescriptionValues={parsedDescriptionValues}
            extractFabricTypeFromDescription={extractFabricTypeFromDescription}
            fabricStructures={fabricStructures || []}
            productionCalc={productionCalc}
            machineSelection={machineSelection}
            onMachineChange={handleMachineChange}
            onProductionValueChange={handleProductionValueChange}
            onRefreshFromDescription={handleRefreshFromDescription}
          />
        </>
      )}

      {/* Page 2: Roll Calculation, Machine Load Distribution */}
      {currentPage === 2 && (
        <>
          <RollCalculation
            rollInput={rollInput}
            rollCalculation={rollCalculation}
            selectedItem={selectedItem}
            parsedDescriptionValues={parsedDescriptionValues}
            onRollInputChange={handleRollInputChange}
          />
          <MachineLoadDistribution
            machines={machines}
            isLoadingMachines={isLoadingMachines}
            selectedMachines={selectedMachines}
            rollInput={rollInput}
            showMachineDistribution={showMachineDistribution}
            onToggleMachineDistribution={() => setShowMachineDistribution(!showMachineDistribution)}
            onAddMachineToDistribution={addMachineToDistribution}
            onRemoveMachineFromDistribution={removeMachineFromDistribution}
            onToggleMachineEdit={toggleMachineEdit}
            onSaveMachineParameters={saveMachineParameters}
            onUpdateMachineParameters={updateMachineParameters}
            onUpdateMachineAllocation={updateMachineAllocation}
            onAutoDistributeLoad={autoDistributeLoad}
            onClearAllMachines={() => setSelectedMachines([])}
          />
        </>
      )}

      {/* Page 3: Item Packaging Details */}
      {currentPage === 3 && (
        <>
          <PackagingDetails 
            rollPerKg={rollInput.rollPerKg}
            onCoreTypeChange={handleCoreTypeChange}
            onTubeWeightChange={handleTubeWeightChange}
            onTapeColorChange={handleTapeColorChange}
            tubeWeight={packagingDetails.tubeWeight}
            tapeColorId={packagingDetails.tapeColorId}
          />
        </>
      )}

      {/* Page 4: Additional Information, Processing Actions */}
      {currentPage === 4 && (
        <>
          <AdditionalInformation
            additionalFields={additionalFields}
            selectedOrder={selectedOrder}
            onAdditionalFieldChange={handleAdditionalFieldChange}
            count={productionCalc.count}
            rollPerKg={rollInput.rollPerKg}
            needle={productionCalc.needle}
            feeder={productionCalc.feeder}
            stichLength={productionCalc.stichLength}
          />
          <ProcessingActions
            selectedItem={selectedItem}
            selectedOrder={selectedOrder}
            isProcessing={isProcessing}
            isItemProcessing={isItemProcessing}
            onProcessItem={handleProcessItem}
          />
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, 4))}
          disabled={currentPage === 4}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default SalesOrderItemProcessingRefactored;
