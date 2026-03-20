import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import ShortCircuitForm from './ShortCircuitForm';
import ShortCircuitTable from './ShortCircuitTable';

export default function ShortCircuitPage() {
  const { shortCircuitResult, isCalculating, calculateShortCircuitAPI } = useProjectStore();
  const [motorContribution, setMotorContribution] = useState(true);
  const [busTiesClosed, setBusTiesClosed] = useState(true);

  const handleCalculate = () => {
    calculateShortCircuitAPI(motorContribution, busTiesClosed);
  };

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <div className="flex items-center gap-3">
        <Zap className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-gray-200">
          단락 전류 계산 (Short Circuit Analysis)
        </h2>
      </div>

      <div className="bg-navy-800/50 rounded-lg border border-navy-700 p-3 text-xs text-gray-500">
        IEC 61363 기준에 따른 선박 전력 계통 단락 전류 계산. 각 모선에서의 대칭 단락 전류, 첨두 전류, 차단 전류를 계산합니다.
        <br />
        (Short circuit calculation per IEC 61363 for marine power systems. Calculates symmetrical, peak, and breaking fault currents at each bus.)
      </div>

      <ShortCircuitForm
        motorContribution={motorContribution}
        setMotorContribution={setMotorContribution}
        busTiesClosed={busTiesClosed}
        setBusTiesClosed={setBusTiesClosed}
        onCalculate={handleCalculate}
        isCalculating={isCalculating}
      />

      {shortCircuitResult && (
        <ShortCircuitTable result={shortCircuitResult} />
      )}

      {!shortCircuitResult && !isCalculating && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Zap className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">계산 버튼을 눌러 단락 전류를 계산하세요</p>
          <p className="text-xs mt-1">(Press Calculate to run short circuit analysis)</p>
        </div>
      )}
    </div>
  );
}
