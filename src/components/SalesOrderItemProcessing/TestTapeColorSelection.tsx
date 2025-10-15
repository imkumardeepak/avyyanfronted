import { useState } from 'react';
import { PackagingDetails } from './PackagingDetails';

export function TestTapeColorSelection() {
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Tape Color Selection</h1>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p>Current State:</p>
        <p>Core Type: {packagingDetails.coreType}</p>
        <p>Tube Weight: {packagingDetails.tubeWeight}</p>
        <p>Shrink Rap Weight: {packagingDetails.shrinkRapWeight}</p>
        <p>
          Tape Color ID:{' '}
          {packagingDetails.tapeColorId
            ? typeof packagingDetails.tapeColorId === 'number'
              ? `Single: ${packagingDetails.tapeColorId}`
              : `Combination: ${packagingDetails.tapeColorId.color1Id} + ${packagingDetails.tapeColorId.color2Id}`
            : 'None'}
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
