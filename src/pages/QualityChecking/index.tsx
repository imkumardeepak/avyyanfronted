import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { RollConfirmationService } from '@/services/rollConfirmationService';
import type { RollConfirmationResponseDto, RollConfirmationUpdateDto } from '@/types/api-types';

const QualityChecking: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    allotId: '',
    machineName: '',
    rollNo: '',
    greyGsm: '',
    greyWidth: '',
    cotton: '0',
    polyester: '0',
    spandex: '0',
    blendPercent: '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      // First, get the existing roll confirmation by allotId
      const rollConfirmations = await RollConfirmationService.getRollConfirmationsByAllotId(
        formData.allotId
      );

      // Find the specific roll by machineName and rollNo
      const existingRoll = rollConfirmations.find(
        (roll) => roll.machineName === formData.machineName && roll.rollNo === formData.rollNo
      );

      if (!existingRoll) {
        toast.error(
          'Error',
          'Roll not found. Please capture the roll first in Production Confirmation.'
        );
        setIsLoading(false);
        return;
      }

      // Prepare update data with fabric specification details
      const updateData: RollConfirmationUpdateDto = {
        greyGsm: parseFloat(formData.greyGsm) || 0,
        greyWidth: parseFloat(formData.greyWidth) || 0,
        blendPercent: parseFloat(formData.blendPercent) || 0,
        cotton: parseFloat(formData.cotton) || 0,
        polyester: parseFloat(formData.polyester) || 0,
        spandex: parseFloat(formData.spandex) || 0,
      };

      // Update the roll with fabric specification details
      await RollConfirmationService.updateRollConfirmation(existingRoll.id, updateData);

      toast.success('Success', 'Quality checking data saved successfully');

      // Reset form
      setFormData({
        allotId: '',
        machineName: '',
        rollNo: '',
        greyGsm: '',
        greyWidth: '',
        cotton: '0',
        polyester: '0',
        spandex: '0',
        blendPercent: '0',
      });
    } catch (err) {
      console.error('Error saving quality checking data:', err);
      toast.error('Error', 'Failed to save quality checking data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2 max-w-4xl mx-auto">
      <Card className="shadow-md border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg py-3">
          <CardTitle className="text-white text-base font-semibold text-center">
            Quality Checking
          </CardTitle>
        </CardHeader>

        <CardContent className="p-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2 bg-gray-50 rounded-md">
              {[
                { id: 'allotId', label: 'Lot ID *', value: formData.allotId },
                { id: 'machineName', label: 'Machine Name *', value: formData.machineName },
                { id: 'rollNo', label: 'Roll No. *', value: formData.rollNo },
              ].map((field) => (
                <div key={field.id} className="space-y-1">
                  <Label htmlFor={field.id} className="text-xs font-medium text-gray-700">
                    {field.label}
                  </Label>
                  <Input
                    id={field.id}
                    name={field.id}
                    value={field.value}
                    onChange={handleChange}
                    placeholder={`Enter ${field.label.replace(' *', '')}`}
                    required
                    className="text-xs h-8 bg-white"
                  />
                </div>
              ))}
            </div>

            {/* Quality Checking Section - Moved from ProductionConfirmation */}
            <div className="border border-gray-200 rounded-md p-3 bg-white">
              <div className="flex items-center mb-2">
                <div className="w-1 h-3 bg-blue-600 rounded mr-1.5"></div>
                <h3 className="text-sm font-semibold text-gray-80">Fabric Specifications</h3>
              </div>

              {/* Reduced size for Grey GSM and Grey Width */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 p-2 bg-blue-50 rounded-md">
                {[
                  { label: 'Plan GSM', value: 'N/A' },
                  { label: 'Plan Width', value: 'N/A' },
                  { label: 'Act GSM *', value: '' },
                  { label: 'Act Width *', value: '' },
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <Label className="text-[12px] text-blue-700 font-medium block mb-0.5">
                      {item.label}
                    </Label>
                    {index < 2 ? (
                      <div className="text-sm font-bold text-blue-900">{item.value}</div>
                    ) : (
                      <Input
                        id={index === 2 ? 'greyGsm' : 'greyWidth'}
                        name={index === 2 ? 'greyGsm' : 'greyWidth'}
                        value={formData[index === 2 ? 'greyGsm' : 'greyWidth']}
                        onChange={handleChange}
                        type="number"
                        step="1"
                        className="h-7 text-xs p-1"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Blend composition fields in a compact row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cotton', label: 'COTTON', value: formData.cotton },
                  { id: 'polyester', label: 'POLYESTER', value: formData.polyester },
                  { id: 'spandex', label: 'SPANDEX', value: formData.spandex },
                  { id: 'blendPercent', label: 'Blend %', value: formData.blendPercent },
                ].map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label htmlFor={field.id} className="text-[10px] font-medium text-gray-700">
                      {field.label}
                    </Label>
                    <Input
                      id={field.id}
                      name={field.id}
                      value={field.value}
                      onChange={handleChange}
                      type="number"
                      step="1"
                      className="h-7 text-xs p-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-1">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 h-8 min-w-28"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-1.5 h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span className="text-xs">Saving...</span>
                  </div>
                ) : (
                  <span className="text-xs">Save Quality Check</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityChecking;
