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

// Interfaces
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
interface RollInput {
  actualQuantity: number;
  rollPerKg: number;
}
interface RollCalculationData extends RollInput {
  numberOfRolls: number;
  totalWholeRolls: number;
  fractionalRoll: number;
  fractionalWeight: number;
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
interface PackagingDetailsState {
  coreType: 'with' | 'without';
  tubeWeight: number;
  tapeColorId: number | { color1Id: number; color2Id: number } | null;
  shrinkRapWeight?: number;
}

const SalesOrderItemProcessingRefactored = () => {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;

  // State declarations
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDto | null>(
    locationState?.orderData || null
  );
  const [selectedItem, setSelectedItem] = useState<SalesOrderItemDto | null>(
    locationState?.selectedItem || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isItemProcessing, setIsItemProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lotmentId, setLotmentId] = useState<string | null>(null);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  const [additionalFields, setAdditionalFields] = useState<AdditionalFields>({
    yarnLotNo: '',
    counter: '',
    colourCode: '',
    reqGreyGsm: null,
    reqGreyWidth: null,
    reqFinishGsm: null,
    reqFinishWidth: null,
  });
  const [packagingDetails, setPackagingDetails] = useState<PackagingDetailsState>({
    coreType: 'with',
    tubeWeight: 1,
    tapeColorId: null,
    shrinkRapWeight: 0.06,
  });
  const [machineSelection, setMachineSelection] = useState<MachineSelection>({
    selectedMachine: null,
  });
  const [selectedMachines, setSelectedMachines] = useState<MachineLoadDistributionItem[]>([]);
  const [showMachineDistribution, setShowMachineDistribution] = useState(false);

  const [rollInput, setRollInput] = useState<RollInput>({ actualQuantity: 0, rollPerKg: 0 });
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

  // Initialize data from location state or params
  useEffect(() => {
    if (locationState?.orderData && locationState?.selectedItem) {
      setSelectedOrder(locationState.orderData);
      setSelectedItem(locationState.selectedItem);
      setRollInput((prev) => ({
        ...prev,
        actualQuantity:
          parseFloat(locationState.selectedItem?.actualQty || '0') || prev.actualQuantity,
      }));
    } else if (orderId && itemId) {
      navigate('/sales-orders');
    }
  }, [locationState, orderId, itemId, navigate]);

  // Sync rollInput with selectedItem
  useEffect(() => {
    if (selectedItem) {
      setRollInput((prev) => ({
        ...prev,
        actualQuantity: parseFloat(selectedItem.actualQty || '0') || prev.actualQuantity,
      }));
    }
  }, [selectedItem]);

  // Initialize default machine (K120)
  useEffect(() => {
    if (machines?.length) {
      const k120Machine = machines.find((m) => m.machineName.toLowerCase().includes('k120'));
      const defaultMachine = k120Machine || machines[0];
      setMachineSelection({ selectedMachine: defaultMachine });
      setProductionCalc((prev) => ({
        ...prev,
        needle: defaultMachine.needle,
        feeder: defaultMachine.feeder,
        rpm: defaultMachine.rpm,
      }));
    }
  }, [machines]);

  // Parse description values
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
    const values = {
      stitchLength: 0,
      count: 0,
      weightPerRoll: 0,
      numberOfRolls: 0,
      diameter: 0,
      gauge: 0,
      composition: '',
    };

    // Parse patterns
    const patterns = {
      stitchLength: [
        /s\.?l\.?\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
        /s\/l\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
        /stitch\s+length\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
        /sl\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
      ],
      count: [
        /count\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
        /cnt\s*[:=]?\s*([0-9]+\.?[0-9]*)/i,
        /([0-9]+\.?[0-9]*)\s*count/i,
        /([0-9]+\.?[0-9]*)\s*cnt/i,
      ],
      weightPerRoll: [
        /wt\.\/roll\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg\/roll/i,
        /weight\s+per\s+roll\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg/i,
        /([0-9]+\.?[0-9]*)\s*kg\/roll/i,
        /wt\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg\/roll/i,
        /([0-9]+\.?[0-9]*)\s*kg\s*per\s*roll/i,
        /roll\s*[:=]?\s*([0-9]+\.?[0-9]*)\s*kg/i,
        /([0-9]+\.?[0-9]*)\s*kg\s*roll/i,
      ],
      numberOfRolls: [
        /no\s*of\s*rolls\s*[:=]?\s*([0-9]+)/i,
        /number\s*of\s*rolls\s*[:=]?\s*([0-9]+)/i,
        /rolls\s*[:=]?\s*([0-9]+)/i,
      ],
      diameterGauge: [
        /dia\s*x\s*gg\s*:\s*([0-9]+)"?\s*x\s*([0-9]+)/i,
        /diameter\s*x\s*gauge\s*:\s*([0-9]+)"?\s*x\s*([0-9]+)/i,
        /dia\s*:\s*([0-9]+)"?\s*\|\s*gg\s*:\s*([0-9]+)/i,
      ],
      composition: [/composition\s*:\s*([^|]+)/i, /composition\s*[:=]?\s*(.+)/i],
    };

    Object.entries(patterns).forEach(([key, patternList]) => {
      for (const pattern of patternList) {
        const match = desc.match(pattern);
        if (match && match[1]) {
          if (key === 'diameterGauge' && match[1] && match[2]) {
            values.diameter = parseInt(match[1], 10);
            values.gauge = parseInt(match[2], 10);
          } else if (key === 'composition') {
            values.composition = match[1].replace(/\s*\|\s*.*$/, '').trim();
          } else {
            values[key as keyof Omit<typeof values, 'diameter' | 'gauge' | 'composition'>] =
              parseFloat(match[1]);
          }
          break;
        }
      }
    });

    return values;
  };

  const parsedDescriptionValues = useMemo(
    () =>
      selectedItem?.descriptions
        ? parseDescriptionValues(selectedItem.descriptions)
        : {
            stitchLength: 0,
            count: 0,
            weightPerRoll: 0,
            numberOfRolls: 0,
            diameter: 0,
            gauge: 0,
            composition: '',
          },
    [selectedItem?.descriptions]
  );

  // Set values from description
  useEffect(() => {
    if (selectedItem?.descriptions) {
      setProductionCalc((prev) => ({
        ...prev,
        stichLength: parsedDescriptionValues.stitchLength || prev.stichLength,
        count: parsedDescriptionValues.count || prev.count,
      }));

      if (parsedDescriptionValues.weightPerRoll > 0 && rollInput.rollPerKg === 0) {
        setRollInput((prev) => ({ ...prev, rollPerKg: parsedDescriptionValues.weightPerRoll }));
      }

      if (parsedDescriptionValues.numberOfRolls > 0 && rollInput.rollPerKg === 0) {
        const actualQuantity = Number(rollInput.actualQuantity) || 0;
        if (actualQuantity > 0) {
          setRollInput((prev) => ({
            ...prev,
            rollPerKg: actualQuantity / parsedDescriptionValues.numberOfRolls,
          }));
        }
      }
    }
  }, [selectedItem, parsedDescriptionValues]);

  // Production calculation
  useEffect(() => {
    calculateProduction();
  }, [
    productionCalc.needle,
    productionCalc.feeder,
    productionCalc.rpm,
    productionCalc.stichLength,
    productionCalc.count,
    productionCalc.efficiency,
  ]);

  const calculateProduction = () => {
    const { needle, feeder, rpm, constant, stichLength, count, efficiency } = productionCalc;

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
      const efficiencyDecimal = efficiency / 100;
      const productionGramsPerMinute =
        (needle * feeder * rpm * stichLength * constant * efficiencyDecimal) / count;
      const productionKgPerMinute = productionGramsPerMinute / 1000;

      setProductionCalc((prev) => ({
        ...prev,
        productionPerMinute: Math.round(productionKgPerMinute * 10000) / 10000,
        productionPerHour: Math.round(productionKgPerMinute * 60 * 100) / 100,
        productionPerDay: Math.round(productionKgPerMinute * 60 * 24 * 100) / 100,
      }));
    } catch (error) {
      setProductionCalc((prev) => ({
        ...prev,
        productionPerDay: 0,
        productionPerHour: 0,
        productionPerMinute: 0,
      }));
    }
  };

  // Roll calculation
  useEffect(() => {
    const actualQuantity = Number(rollInput.actualQuantity) || 0;
    const rollPerKg = Number(rollInput.rollPerKg) || 0;

    if (actualQuantity > 0 && rollPerKg > 0) {
      const totalRolls = actualQuantity / rollPerKg;
      const wholeRolls = Math.floor(totalRolls);
      const fractionalRoll = totalRolls - wholeRolls;
      
      // If there's a fractional roll, add one additional roll for production planning
      const adjustedTotalRolls = fractionalRoll > 0 ? Math.ceil(totalRolls) : totalRolls;

      setRollCalculation({
        actualQuantity,
        rollPerKg,
        numberOfRolls: adjustedTotalRolls,
        totalWholeRolls: Math.floor(adjustedTotalRolls),
        fractionalRoll: adjustedTotalRolls - Math.floor(adjustedTotalRolls),
        fractionalWeight: (adjustedTotalRolls - Math.floor(adjustedTotalRolls)) * rollPerKg,
      });
    } else if (actualQuantity > 0 && parsedDescriptionValues.numberOfRolls > 0) {
      const calculatedRollPerKg = actualQuantity / parsedDescriptionValues.numberOfRolls;
      // Use the parsed number of rolls as is
      const numberOfRolls = parsedDescriptionValues.numberOfRolls;
        
      setRollCalculation({
        actualQuantity,
        rollPerKg: calculatedRollPerKg,
        numberOfRolls: numberOfRolls,
        totalWholeRolls: numberOfRolls,
        fractionalRoll: 0,
        fractionalWeight: 0,
      });
      setRollInput((prev) => ({ ...prev, rollPerKg: calculatedRollPerKg }));
    } else {
      setRollCalculation({
        actualQuantity,
        rollPerKg,
        numberOfRolls: 0,
        totalWholeRolls: 0,
        fractionalRoll: 0,
        fractionalWeight: 0,
      });
    }
  }, [rollInput.actualQuantity, rollInput.rollPerKg, parsedDescriptionValues.numberOfRolls]);

  // Machine distribution functions
  const addMachineToDistribution = (machine: MachineResponseDto) => {
    if (selectedMachines.some((m) => m.machineId === machine.id)) return;

    let fabricEfficiency = productionCalc.efficiency;
    if (fabricStructures && selectedItem) {
      let itemFabricType = selectedItem.descriptions
        ? extractFabricTypeFromDescription(selectedItem.descriptions)
        : '';
      if (!itemFabricType && selectedItem.stockItemName)
        itemFabricType = selectedItem.stockItemName.toLowerCase();

      const matchingFabric = fabricStructures.find(
        (f) =>
          itemFabricType.includes(f.fabricstr.toLowerCase()) ||
          f.fabricstr.toLowerCase().includes(itemFabricType.split(' ')[0])
      );
      if (matchingFabric) fabricEfficiency = matchingFabric.standardeffencny;
    }

    setSelectedMachines((prev) => [
      ...prev,
      {
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
      },
    ]);
  };

  const removeMachineFromDistribution = (machineId: number) => {
    setSelectedMachines((prev) => prev.filter((m) => m.machineId !== machineId));
  };

  const toggleMachineEdit = (machineId: number) => {
    setSelectedMachines((prev) =>
      prev.map((m) => (m.machineId === machineId ? { ...m, isEditing: !m.isEditing } : m))
    );
  };

  const updateMachineParameters = (
    machineId: number,
    parameters: Partial<MachineLoadDistributionItem['customParameters']>
  ) => {
    setSelectedMachines((prev) =>
      prev.map((m) =>
        m.machineId === machineId
          ? { ...m, customParameters: { ...m.customParameters!, ...parameters } }
          : m
      )
    );
  };

  const saveMachineParameters = (machineId: number) => {
    setSelectedMachines((prev) =>
      prev.map((machine) => {
        if (machine.machineId === machineId) {
          const params = machine.customParameters!;
          let estimatedTime = 0;

          if (
            machine.allocatedWeight > 0 &&
            productionCalc.stichLength > 0 &&
            productionCalc.count > 0
          ) {
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
              const hours = machine.allocatedWeight / productionKgPerHour;
              estimatedTime = hours / 24; // Convert to days
            }
          }

          return { ...machine, isEditing: false, estimatedProductionTime: estimatedTime };
        }
        return machine;
      })
    );
  };

  const updateMachineAllocation = (machineId: number, allocatedWeight: number) => {
    const actualQuantity = Number(rollInput.actualQuantity) || 0;
    const currentTotalAllocated = selectedMachines.reduce(
      (sum, m) => (m.machineId === machineId ? sum : sum + m.allocatedWeight),
      0
    );

    if (currentTotalAllocated + allocatedWeight > actualQuantity) {
      console.warn(`Total allocated weight exceeds actual quantity`);
    }

    setSelectedMachines((prev) =>
      prev.map((machine) => {
        if (machine.machineId === machineId) {
          const rolls = rollInput.rollPerKg > 0 ? allocatedWeight / rollInput.rollPerKg : 0;
          let estimatedTime = 0;

          if (allocatedWeight > 0) {
            const params = machine.customParameters;
            if (params && productionCalc.stichLength > 0 && productionCalc.count > 0) {
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
                const hours = allocatedWeight / productionKgPerHour;
                estimatedTime = hours / 24; // Convert to days
              }
            } else {
              const selectedMachineData = machines?.find((m) => m.id === machineId);
              if (
                selectedMachineData &&
                productionCalc.stichLength > 0 &&
                productionCalc.count > 0
              ) {
                let fabricEfficiency = productionCalc.efficiency;
                if (fabricStructures && selectedItem) {
                  let itemFabricType = selectedItem.descriptions
                    ? extractFabricTypeFromDescription(selectedItem.descriptions)
                    : '';
                  if (!itemFabricType && selectedItem.stockItemName)
                    itemFabricType = selectedItem.stockItemName.toLowerCase();

                  const matchingFabric = fabricStructures.find(
                    (f) =>
                      itemFabricType.includes(f.fabricstr.toLowerCase()) ||
                      f.fabricstr.toLowerCase().includes(itemFabricType.split(' ')[0])
                  );
                  if (matchingFabric) fabricEfficiency = matchingFabric.standardeffencny;
                }

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
                  const hours = allocatedWeight / productionKgPerHour;
                  estimatedTime = hours / 24; // Convert to days
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

  const autoDistributeLoad = () => {
    if (selectedMachines.length === 0) {
      alert('Please select at least one machine first.');
      return;
    }

    const actualQuantity = Number(rollInput.actualQuantity);
    const rollPerKg = Number(rollInput.rollPerKg);
    if (!actualQuantity || actualQuantity <= 0) {
      alert('No quantity available for distribution.');
      return;
    }
    if (!rollPerKg || rollPerKg <= 0) {
      alert('Please enter Roll per Kg value first.');
      return;
    }

    // Use the adjusted roll calculation from rollCalculation state
    const totalRolls = rollCalculation.numberOfRolls;
    const wholeRolls = rollCalculation.totalWholeRolls;
    const fractionalRoll = rollCalculation.fractionalRoll;
    const fractionalWeight = rollCalculation.fractionalWeight;

    const wholeRollsPerMachine = Math.floor(wholeRolls / selectedMachines.length);
    const remainingWholeRolls = wholeRolls % selectedMachines.length;

    let updatedMachines = selectedMachines.map((machine, index) => {
      let machineRolls = wholeRollsPerMachine + (index < remainingWholeRolls ? 1 : 0);
      // If there's a fractional roll, distribute it to the last machine
      if (fractionalRoll > 0 && index === selectedMachines.length - 1) {
        machineRolls += fractionalRoll;
      }

      let machineWeight = machineRolls * rollPerKg;
      // Adjust weight calculation for fractional roll
      if (fractionalRoll > 0 && index === selectedMachines.length - 1) {
        machineWeight = (machineRolls - fractionalRoll) * rollPerKg + fractionalWeight;
      }

      return { ...machine, allocatedRolls: machineRolls, allocatedWeight: machineWeight };
    });

    // Calculate production times
    updatedMachines = updatedMachines.map((machine) => {
      const selectedMachineData = machines?.find((m) => m.id === machine.machineId);
      let estimatedTime = 0;

      if (
        selectedMachineData &&
        machine.allocatedWeight > 0 &&
        productionCalc.stichLength > 0 &&
        productionCalc.count > 0
      ) {
        let fabricEfficiency = productionCalc.efficiency;
        if (fabricStructures && selectedItem) {
          let itemFabricType = selectedItem.descriptions
            ? extractFabricTypeFromDescription(selectedItem.descriptions)
            : '';
          if (!itemFabricType && selectedItem.stockItemName)
            itemFabricType = selectedItem.stockItemName.toLowerCase();

          const matchingFabric = fabricStructures.find(
            (f) =>
              itemFabricType.includes(f.fabricstr.toLowerCase()) ||
              f.fabricstr.toLowerCase().includes(itemFabricType.split(' ')[0])
          );
          if (matchingFabric) fabricEfficiency = matchingFabric.standardeffencny;
        }

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
          const hours = machine.allocatedWeight / productionKgPerHour;
          estimatedTime = hours / 24; // Convert to days
        }
      }

      return { ...machine, estimatedProductionTime: estimatedTime };
    });

    setSelectedMachines(updatedMachines);
  };

  // Event handlers
  const handleRollInputChange = (field: keyof RollInput, value: number) => {
    setRollInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleMachineChange = (machineId: string) => {
    const machine = machines?.find((m) => m.id.toString() === machineId);
    if (machine) {
      setMachineSelection({ selectedMachine: machine });
      setProductionCalc((prev) => ({
        ...prev,
        needle: machine.needle,
        feeder: machine.feeder,
        rpm: machine.rpm,
      }));
    }
  };

  const handleProductionValueChange = (field: keyof ProductionCalculation, value: number) => {
    setProductionCalc((prev) => ({ ...prev, [field]: value }));
  };

  const handleRefreshFromDescription = () => {
    if (selectedItem?.descriptions) {
      setProductionCalc((prev) => ({
        ...prev,
        stichLength: parsedDescriptionValues.stitchLength || 0,
        count: parsedDescriptionValues.count || 0,
      }));
      if (parsedDescriptionValues.weightPerRoll > 0) {
        setRollInput((prev) => ({ ...prev, rollPerKg: parsedDescriptionValues.weightPerRoll }));
      }
    }
  };

  const handleGoBack = () => navigate('/sales-orders');

  const handleAdditionalFieldChange = (
    field: keyof AdditionalFields,
    value: string | number | null
  ) => {
    setAdditionalFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoreTypeChange = (coreType: 'with' | 'without') => {
    setPackagingDetails((prev) => ({
      ...prev,
      coreType,
      tubeWeight: coreType === 'without' ? 0 : prev.tubeWeight === 0 ? 1 : prev.tubeWeight,
    }));
  };

  const handleTubeWeightChange = (weight: number) => {
    setPackagingDetails((prev) => ({ ...prev, tubeWeight: weight }));
  };

  const handleTapeColorChange = (tapeColorId: number | { color1Id: number; color2Id: number }) => {
    setPackagingDetails((prev) => ({ ...prev, tapeColorId }));
  };

  const handleShrinkRapWeightChange = (weight: number) => {
    setPackagingDetails((prev) => ({ ...prev, shrinkRapWeight: weight }));
  };

  // Allotment ID generation
  const generateAllotmentId = async () => {
    if (!selectedOrder || !selectedItem) return null;

    try {
      const firstChar = selectedOrder.voucherNumber.includes('/J') ? 'J' : 'A';

      // Extract fabric type from description
      let fabricTypeFromDescription = '';
      if (selectedItem.descriptions) {
        fabricTypeFromDescription = extractFabricTypeFromDescription(selectedItem.descriptions);
      }

      // If we couldn't extract from description, try from item name
      if (!fabricTypeFromDescription && selectedItem.stockItemName) {
        fabricTypeFromDescription = selectedItem.stockItemName.toLowerCase();
      }

      // Create item description for other checks
      const itemDescription = (
      selectedItem.descriptions
      ).toLowerCase();

      // Find fabric structure in master data
      let fabricTypeCode: string | null = null; // Remove default fallback
      if (fabricStructures && fabricTypeFromDescription) {
        // Try to find exact match first
        const matchingFabric = fabricStructures.find(
          (f) =>
            fabricTypeFromDescription.toLowerCase().includes(f.fabricstr.toLowerCase()) ||
            f.fabricstr
              .toLowerCase()
              .includes(fabricTypeFromDescription.toLowerCase().split(' ')[0])
        );

        // If found and has a fabricCode, use it
        if (matchingFabric && matchingFabric.fabricCode) {
          fabricTypeCode = matchingFabric.fabricCode;
        } else if (matchingFabric) {
          // Fallback to using the fabric structure name mapping if no fabricCode exists
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

          const fabricStrLower = matchingFabric.fabricstr.toLowerCase();
          for (const [key, code] of Object.entries(fabricTypeMap)) {
            if (fabricStrLower.includes(key)) {
              fabricTypeCode = code;
              break;
            }
          }
        } else {
          // Fallback to original mapping if no match found in fabric structures
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
             'waffle': 'WA',
            'waffle miss cam': 'WM',
            'pointelle rib': 'PR',
            'herringbone': 'HB',
            'stripe': 'ST',
          };

          for (const [key, code] of Object.entries(fabricTypeMap)) {
            if (itemDescription.includes(key)) {
              fabricTypeCode = code;
              break;
            }
          }
        }
      } else {
        // Fallback to original mapping if no fabric structures or description
        const fabricTypeMap: { [key: string]: string } = {
          'single jersey' : 'SJ',
          'S/J': 'SJ',

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
          'waffle': 'WA',
          'waffle miss cam': 'WM',
          'pointelle rib': 'PR',
          'herringbone': 'HB',
          'stripe' : 'ST',
        };

        for (const [key, code] of Object.entries(fabricTypeMap)) {
          if (itemDescription.includes(key)) {
            fabricTypeCode = code;
            break;
          }
        }
      }

      const fourthChar = itemDescription.includes('lycra') || itemDescription.includes('spandex') ? 'L' : 'X';

      // Enhanced yarn type detection for complex descriptions
      let fifthChar: string | null = null;
      let yarnCount: string | null = null;
      
      // Try multiple regex patterns to find yarn information
      const regexPatterns = [
        /count:\s*(\d+)s\/(\d+)/i,  // Pattern for "Count: 40s/1"
        /count:\s*(\d+)\/(\d+)/i,   // Original pattern: "count: 30/1"
        /(\d+)s\/(\d+)/i,           // Pattern for "40s/1"
        /(\d+)\/(\d+)\s*[A-Z]*/i,   // Alternative pattern: "30/1 Nm"
        /\/(\d+)\s*[A-Z]*/i         // Simple pattern: "/1 Nm"
      ];
      
      let countMatch: RegExpMatchArray | null = null;
      for (const pattern of regexPatterns) {
        countMatch = selectedItem.descriptions?.match(pattern);
        if (countMatch && countMatch[1] && countMatch[2]) {
          // For patterns like "40s/1", first group is yarn count (40), second is yarn type (1)
          yarnCount = countMatch[1].padStart(2, '0').substring(0, 2);
          fifthChar = countMatch[2] === '2' ? '2' : '1';
          break;
        }
      }
      
      // Fallback: if no pattern matches, try to find standalone numbers after "/"
      if (!fifthChar) {
        const slashMatch = selectedItem.descriptions?.match(/\/(\d+)/);
        if (slashMatch && slashMatch[1]) {
          fifthChar = slashMatch[1] === '2' ? '2' : '1';
        }
      }
      
      // Additional fallback for yarn count if not found
      if (!yarnCount && countMatch && countMatch[1]) {
        yarnCount = countMatch[1].padStart(2, '0').substring(0, 2);
      }
      
      // Final fallbacks: default values if still not found
      if (!fifthChar) {
        fifthChar = '1'; // Default yarn type
      }
      
      if (!yarnCount) {
        // Try to find any number that might represent yarn count
        const anyNumberMatch = selectedItem.descriptions?.match(/(\d+)s/i);
        if (anyNumberMatch && anyNumberMatch[1]) {
          yarnCount = anyNumberMatch[1].padStart(2, '0').substring(0, 2);
        } else {
          yarnCount = '40'; // Default yarn count
        }
      }

      // Validate required fields before generating lotment ID
      if (!fabricTypeCode) {
        throw new Error(
          'Fabric type code not found. Please ensure the sales order was created properly with correct fabric information.'
        );
      }

      // Removed fifthChar validation since we now have a default value
      /*
      if (!fifthChar) {
        throw new Error(
          'Fifth character (yarn type) not found. Please ensure the sales order was created properly with correct yarn information.'
        );
      }
      */

      if (!yarnCount) {
        throw new Error(
          'Yarn count not found. Please ensure the sales order was created properly with correct yarn count information.'
        );
      }

      const eighthChar = itemDescription.includes('carded') ? 'K' : 'C';

      let machineDiameter: string | null = null;
      let machineGauge: string | null = null;

      // Extract diameter and gauge from description first
      if (parsedDescriptionValues.diameter > 0) {
        machineDiameter = parsedDescriptionValues.diameter
          .toString()
          .padStart(2, '0')
          .substring(0, 2);
      } else if (selectedMachines.length > 0 && machines) {
        const firstMachine = machines.find((m) => m.id === selectedMachines[0].machineId);
        if (firstMachine) {
          machineDiameter = firstMachine.dia.toString().padStart(2, '0').substring(0, 2);
        }
      }

      if (parsedDescriptionValues.gauge > 0) {
        machineGauge = parsedDescriptionValues.gauge.toString().padStart(2, '0').substring(0, 2);
      } else if (selectedMachines.length > 0 && machines) {
        const firstMachine = machines.find((m) => m.id === selectedMachines[0].machineId);
        if (firstMachine) {
          machineGauge = firstMachine.gg.toString().padStart(2, '0').substring(0, 2);
        }
      }

      // Validate required fields before generating lotment ID
      if (!fabricTypeCode) {
        throw new Error(
          'Fabric type code not found. Please ensure the sales order was created properly with correct fabric information.'
        );
      }

      // Removed fifthChar validation since we now have a default value
      /*
      if (!fifthChar) {
        throw new Error(
          'Fifth character (yarn type) not found. Please ensure the sales order was created properly with correct yarn information.'
        );
      }
      */

      if (!yarnCount) {
        throw new Error(
          'Yarn count not found. Please ensure the sales order was created properly with correct yarn count information.'
        );
      }

      if (!machineDiameter) {
        throw new Error(
          'Machine diameter not found. Please ensure the sales order was created properly with correct diameter information.'
        );
      }

      if (!machineGauge) {
        throw new Error(
          'Machine gauge not found. Please ensure the sales order was created properly with correct gauge information.'
        );
      }

      // Calculate financial year based on current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
      let financialYear =
        currentMonth >= 4
          ? (currentYear % 100).toString().padStart(2, '0')
          : (currentYear % 100).toString().padStart(2, '0');

      const serialNumber = await ProductionAllotmentService.getNextSerialNumber();

      let twentyFirstChar = '';
      if (itemDescription.includes('honeycomb') || itemDescription.includes('honey comb'))
        twentyFirstChar = 'H';
      else if (itemDescription.includes('open width')|| itemDescription.includes('OW')) twentyFirstChar = 'O'
      else if (itemDescription.includes('Yes')) twentyFirstChar = 'Y';
       if (!twentyFirstChar) {
        throw new Error(
          'Slit line not found. Please ensure the sales order was created properly with correct information.'
        );
      }

      const part1 = `${firstChar}${fabricTypeCode}${fourthChar}`;
      const part2 = `${fifthChar}${yarnCount}${eighthChar}${machineDiameter}${machineGauge}`;
      const part3 = `${financialYear}${serialNumber}${twentyFirstChar}`;

      return `${part1}-${part2}-${part3}`;
    } catch (error) {
      console.error('Error generating lotment ID:', error);
      return null;
    }
  };

  useEffect(() => {
    const generateId = async () => {
      if (selectedOrder && selectedItem && !lotmentId && !isGeneratingId) {
        setIsGeneratingId(true);
        try {
          const id = await generateAllotmentId();
          setLotmentId(id);
        } catch (error: any) {
          console.error('Error generating lotment ID:', error);
          alert(
            `Error generating lotment ID: ${error.message}\n\nPlease ensure the sales order was created properly with all required information before creating production planning.`
          );
        } finally {
          setIsGeneratingId(false);
        }
      }
    };
    generateId();
  }, [selectedOrder, selectedItem, machines, selectedMachines]);

  // Process item
  const handleProcessItem = async () => {
    if (!selectedItem || !selectedOrder) return;

    if (selectedMachines.length === 0) {
      alert('Please select at least one machine before processing.');
      return;
    }

    const totalAllocated = selectedMachines.reduce((sum, m) => sum + m.allocatedWeight, 0);
    const actualQuantity = Number(rollInput.actualQuantity || 0);

    // if (selectedMachines.length > 0 && totalAllocated > actualQuantity) {
    //   alert(
    //     `Error: Total allocated weight (${totalAllocated.toFixed(2)} kg) exceeds actual quantity (${actualQuantity.toFixed(2)} kg). Please adjust machine allocations before processing.`
    //   );
    //   return;
    // }

    let lotmentId: string | null = null;
    try {
      lotmentId = await generateAllotmentId();
    } catch (error: any) {
      alert(
        `Error generating lotment ID: ${error.message}\n\nPlease ensure the sales order was created properly with all required information before creating production planning.`
      );
      return;
    }

    if (!lotmentId) {
      alert('Error generating lotment ID. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
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
          fractionalRoll: { quantity: 0, weightPerRoll: 0, totalWeight: machine.allocatedWeight },
        },
        estimatedProductionTime: machine.estimatedProductionTime,
      }));

      const extractYarnCount = (desc: string) => {
        const yarnCountRegex = /(\d+\/\d+\s*[A-Z]+)/i;
        const match = desc.match(yarnCountRegex);
        return match ? match[1] : 'N/A';
      };

      const extractFabricType = (itemName: string) => {
        if (selectedItem?.descriptions) {
          const fabricTypeFromDescription = extractFabricTypeFromDescription(
            selectedItem.descriptions
          );
          if (fabricTypeFromDescription) return fabricTypeFromDescription;
        }
        return itemName.split(' ')[0] || 'N/A';
      };

      const extractComposition = (desc: string) => {
        if (!desc) return 'N/A';
        if (parsedDescriptionValues.composition) return parsedDescriptionValues.composition;
        const compositionRegex = /(\d+%[^\d+]+)/g;
        const matches = desc.match(compositionRegex);
        return matches ? matches.join(' + ') : 'N/A';
      };

      const extractSlitLineFromDescription = (desc: string) => {
        if (!desc) return 'N/A';
        // Look for slit line pattern (note: description has "Slit Iine" typo instead of "Slit Line")
        const slitLineRegex = /slit\s*(?:iine|line)\s*:\s*([^|]+)/i;
        const match = desc.match(slitLineRegex);
        if (match) {
          // Extract just the value part and trim whitespace
          const value = match[1].trim();
          // Handle common values like "Yes", "No", "1", "0"
          if (value.toLowerCase() === 'yes' ) {
            return 'Yes';
          } else if (value.toLowerCase() === 'no' ) {
            return 'No';
          }
           else if (value.toLowerCase() === 'honeycomb' ) {
            return 'honeycomb';
          }
          else if (value.toLowerCase() === 'open width' || value.toLowerCase() === 'OW' ) {
            return 'open width';
          }
          // Return the value as is for other cases
          return value;
        }
        return 'N/A';
      };

      const requestData = {
        allotmentId: lotmentId,
        voucherNumber: selectedOrder.voucherNumber,
        itemName: selectedItem.stockItemName,
        salesOrderId: selectedOrder.id,
        salesOrderItemId: selectedItem.id,
        actualQuantity,
        yarnCount: extractYarnCount(selectedItem.descriptions || ''),
        diameter: parsedDescriptionValues.diameter || productionCalc.needle,
        gauge: parsedDescriptionValues.gauge || productionCalc.feeder,
        fabricType:  extractFabricTypeFromDescription(selectedItem.descriptions),
        slitLine: selectedItem?.descriptions
          ? extractSlitLineFromDescription(selectedItem.descriptions)
          : 'N/A',
        stitchLength: productionCalc.stichLength,
        efficiency: productionCalc.efficiency,
        composition: extractComposition(selectedItem.descriptions),
        yarnLotNo: additionalFields.yarnLotNo,
        counter: additionalFields.counter,
        colourCode: additionalFields.colourCode,
        reqGreyGsm: additionalFields.reqGreyGsm,
        reqGreyWidth: additionalFields.reqGreyWidth,
        reqFinishGsm: additionalFields.reqFinishGsm,
        reqFinishWidth: additionalFields.reqFinishWidth,
        partyName: selectedOrder.partyName,
        tubeWeight: packagingDetails.coreType === 'with' ? packagingDetails.tubeWeight : 0,
        shrinkRapWeight: packagingDetails.shrinkRapWeight,
        totalWeight:
          packagingDetails.coreType === 'with'
            ? (packagingDetails.tubeWeight || 0) + (packagingDetails.shrinkRapWeight || 0)
            : packagingDetails.shrinkRapWeight || 0,
        tapeColor: packagingDetails.tapeColorId
          ? typeof packagingDetails.tapeColorId === 'number'
            ? tapeColors.find((color) => color.id === packagingDetails.tapeColorId)?.tapeColor || ''
            : `${tapeColors.find((color) => color.id === (packagingDetails.tapeColorId as { color1Id: number; color2Id: number }).color1Id)?.tapeColor || ''} + ${tapeColors.find((color) => color.id === (packagingDetails.tapeColorId as { color1Id: number; color2Id: number }).color2Id)?.tapeColor || ''}`
          : '',
        machineAllocations,
      };

      await ProductionAllotmentService.createProductionAllotment(requestData);

      setIsItemProcessing(true);
      try {
        await SalesOrderService.markSalesOrderItemAsProcessed(selectedOrder.id, selectedItem.id);
        setSelectedItem((prev) => (prev ? { ...prev, processFlag: 1 } : null));
      } catch (error) {
        console.error('Error marking item as processed:', error);
        alert('Item was processed successfully, but there was an error updating the status.');
      } finally {
        setIsItemProcessing(false);
      }

      alert(
        `Successfully processed item: ${selectedItem.stockItemName} from order ${selectedOrder.voucherNumber}\nLotment ID: ${lotmentId}`
      );
      navigate('/sales-orders');
    } catch (error) {
      console.error('Error processing item:', error);
      alert('Error processing item. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
      <div className="border rounded-xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
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
                  <span className="font-medium max-w-[150px] truncate">
                    {selectedOrder?.partyName}
                  </span>
                </div>
                {lotmentId ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Lotment:</span>
                    <span className="font-mono font-semibold text-primary">{lotmentId}</span>
                  </div>
                ) : isGeneratingId ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Generating Lotment ID...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-red-100 p-2 rounded">
                    <span className="text-red-800 font-medium">
                      Lotment ID not generated. Required values not found in sales order. Please
                      ensure the sales order was created properly before creating production
                      planning.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pages */}
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
            machineDiameter={parsedDescriptionValues.diameter || undefined}
            machineGauge={parsedDescriptionValues.gauge || undefined}
            stitchLength={productionCalc.stichLength || undefined}
            count={productionCalc.count || undefined}
          />
        </>
      )}

      {currentPage === 3 && (
        <PackagingDetails
          rollPerKg={rollInput.rollPerKg}
          onCoreTypeChange={handleCoreTypeChange}
          onTubeWeightChange={handleTubeWeightChange}
          onTapeColorChange={handleTapeColorChange}
          onShrinkRapWeightChange={handleShrinkRapWeightChange}
          tubeWeight={packagingDetails.tubeWeight}
          shrinkRapWeight={packagingDetails.shrinkRapWeight}
          tapeColorId={packagingDetails.tapeColorId}
          lotmentId={lotmentId || undefined} // Pass lotmentId
        />
      )}

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

      {/* Navigation */}
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
