import React from 'react';
import type { CableType, ClassSociety } from '../../types';
import Select from '../common/Select';
import Input from '../common/Input';

interface CableSizingPanelProps {
  ambientTempC: number;
  setAmbientTempC: (v: number) => void;
  cableType: CableType;
  setCableType: (v: CableType) => void;
  classSociety: ClassSociety;
}

export default function CableSizingPanel({
  ambientTempC,
  setAmbientTempC,
  cableType,
  setCableType,
  classSociety,
}: CableSizingPanelProps) {
  return (
    <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">케이블 설계 조건 (Cable Design Conditions)</h3>
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="주위 온도 (Ambient Temp)"
          unit="C"
          type="number"
          value={ambientTempC}
          onChange={(v) => setAmbientTempC(Number(v))}
          min={20}
          max={60}
        />
        <Select
          label="케이블 종류 (Cable Type)"
          options={[
            { value: 'XLPE', label: 'XLPE (90C)' },
            { value: 'EPR', label: 'EPR (90C)' },
            { value: 'PVC', label: 'PVC (70C)' },
            { value: 'TPYC', label: 'TPYC' },
            { value: 'DPYC', label: 'DPYC' },
          ]}
          value={cableType}
          onChange={(v) => setCableType(v as CableType)}
        />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">선급 기준 (Class Rule)</span>
          <div className="bg-navy-700 border border-navy-600 rounded-md px-3 py-2 text-sm text-gray-300">
            {classSociety}
          </div>
          <span className="text-[10px] text-gray-600">
            {classSociety === 'KR' && '한국선급 전기설비 기준'}
            {classSociety === 'ABS' && 'ABS Rules 4-8-2/3'}
            {classSociety === 'DNV' && 'DNV Pt.4 Ch.8'}
            {!['KR', 'ABS', 'DNV'].includes(classSociety) && 'IEC 60092-352'}
          </span>
        </div>
      </div>

      <div className="mt-3 p-2 bg-navy-700/50 rounded text-xs text-gray-500">
        허용 전압 강하: 정상 운전 5% 이내, 기동시 15% 이내 (IEC 60092-101)
        <br />
        (Allowable voltage drop: Running max 5%, Starting max 15%)
      </div>
    </div>
  );
}
