import { useState } from 'react';
import { PackagingDetails } from './PackagingDetails';

export function TestNoCoreFunctionality() {
  const [packagingDetails, setPackagingDetails] = useState({
    coreType: 'with' as 'with' | 'without',
    tubeWeight: 1,
    shrinkRapWeight: 0.06,
    tapeColorId: null as number | { color1Id: number; color2Id: number } | null,
  });

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

  const handleShrinkRapWeightChange = (weight: number) => {
    setPackagingDetails((prev) => ({ ...prev, shrinkRapWeight: weight }));
  };

  const handleTapeColorChange = (tapeColorId: number | { color1Id: number; color2Id: number }) => {
    setPackagingDetails((prev) => ({ ...prev, tapeColorId }));
  };

  // Calculate total weight for display
  const totalWeight = packagingDetails.coreType === 'with' 
    ? (packagingDetails.tubeWeight || 0) + (packagingDetails.shrinkRapWeight || 0)
    : packagingDetails.shrinkRapWeight || 0;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test No Core Functionality</h1>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p>Current State:</p>
        <p>Core Type: {packagingDetails.coreType}</p>
        <p>Tube Weight: {packagingDetails.tubeWeight}</p>
        <p>Shrink Rap Weight: {packagingDetails.shrinkRapWeight}</p>
        <p className="font-bold">Total Weight: {totalWeight.toFixed(3)} kg</p>
        <p>
          Tube Weight to be sent to API: {packagingDetails.coreType === 'with' ? packagingDetails.tubeWeight : 0}
        </p>
      </div>
      <PackagingDetails
        rollPerKg={10}
        onCoreTypeChange={handleCoreTypeChange}
        onTubeWeightChange={handleTubeWeightChange}
        onShrinkRapWeightChange={handleShrinkRapWeightChange}
        onTapeColorChange={handleTapeColorChange}
        tubeWeight={packagingDetails.tubeWeight}
        shrinkRapWeight={packagingDetails.shrinkRapWeight}
        tapeColorId={packagingDetails.tapeColorId}
      />
    </div>
  );
}