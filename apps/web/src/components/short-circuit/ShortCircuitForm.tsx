import React from 'react';
import Button from '../common/Button';
import { Calculator } from 'lucide-react';

interface ShortCircuitFormProps {
  motorContribution: boolean;
  setMotorContribution: (v: boolean) => void;
  busTiesClosed: boolean;
  setBusTiesClosed: (v: boolean) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

export default function ShortCircuitForm({
  motorContribution,
  setMotorContribution,
  busTiesClosed,
  setBusTiesClosed,
  onCalculate,
  isCalculating,
}: ShortCircuitFormProps) {
  return (
    <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">계산 조건 (Calculation Conditions)</h3>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={motorContribution}
            onChange={(e) => setMotorContribution(e.target.checked)}
            className="w-4 h-4 rounded bg-navy-800 border-navy-600 accent-accent"
          />
          <span className="text-sm text-gray-300">전동기 기여 포함 (Include Motor Contribution)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={busTiesClosed}
            onChange={(e) => setBusTiesClosed(e.target.checked)}
            className="w-4 h-4 rounded bg-navy-800 border-navy-600 accent-accent"
          />
          <span className="text-sm text-gray-300">모선연결기 투입 (Bus Ties Closed)</span>
        </label>

        <Button
          variant="primary"
          size="sm"
          onClick={onCalculate}
          loading={isCalculating}
          icon={<Calculator className="w-3.5 h-3.5" />}
        >
          계산 (Calculate)
        </Button>
      </div>
    </div>
  );
}
