import React, { useState } from 'react';
import { Plug, Calculator } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import type { CableType } from '../../types';
import Button from '../common/Button';
import CableSizingPanel from './CableSizingPanel';
import VoltageDropTable from './VoltageDropTable';
import { formatNumber } from '../../utils/calculations';

export default function VoltageDropPage() {
  const { project, voltageDropResult, isCalculating, calculateVoltageDropAPI } = useProjectStore();
  const [ambientTempC, setAmbientTempC] = useState(45);
  const [cableType, setCableType] = useState<CableType>('XLPE');

  const handleCalculate = () => {
    calculateVoltageDropAPI(ambientTempC, cableType);
  };

  const failCount = voltageDropResult?.loads.filter(l => l.status === 'fail').length || 0;
  const warnCount = voltageDropResult?.loads.filter(l => l.status === 'warning').length || 0;
  const okCount = voltageDropResult?.loads.filter(l => l.status === 'ok').length || 0;

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plug className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-gray-200">
            전압 강하 계산 (Voltage Drop Analysis)
          </h2>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCalculate}
          loading={isCalculating}
          icon={<Calculator className="w-3.5 h-3.5" />}
        >
          계산 (Calculate)
        </Button>
      </div>

      <CableSizingPanel
        ambientTempC={ambientTempC}
        setAmbientTempC={setAmbientTempC}
        cableType={cableType}
        setCableType={setCableType}
        classSociety={project.meta.classSociety}
      />

      {voltageDropResult && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-navy-800 rounded-lg border border-navy-600 p-3 text-center">
              <div className="text-xs text-gray-500">적합 (OK)</div>
              <div className="text-2xl font-mono font-bold text-success">{okCount}</div>
            </div>
            <div className="bg-navy-800 rounded-lg border border-navy-600 p-3 text-center">
              <div className="text-xs text-gray-500">주의 (Warning)</div>
              <div className="text-2xl font-mono font-bold text-warning">{warnCount}</div>
            </div>
            <div className="bg-navy-800 rounded-lg border border-navy-600 p-3 text-center">
              <div className="text-xs text-gray-500">부적합 (Fail)</div>
              <div className="text-2xl font-mono font-bold text-danger">{failCount}</div>
            </div>
          </div>
          <VoltageDropTable result={voltageDropResult} />
        </>
      )}

      {!voltageDropResult && !isCalculating && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Plug className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">계산 버튼을 눌러 전압 강하를 계산하세요</p>
          <p className="text-xs mt-1">(Press Calculate to run voltage drop analysis)</p>
        </div>
      )}
    </div>
  );
}
