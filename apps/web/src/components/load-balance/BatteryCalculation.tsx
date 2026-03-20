import React, { useState, useMemo } from 'react';
import { Battery, Info, ChevronDown, ChevronUp } from 'lucide-react';

const STANDARD_BATTERY_SIZES = [100, 150, 200, 300, 400, 500, 600, 800, 1000, 1200];

interface BatteryCalculationProps {
  emergencyLoadKW: number;
  onCapacityChange?: (capacityAh: number) => void;
}

export default function BatteryCalculation({ emergencyLoadKW, onCapacityChange }: BatteryCalculationProps) {
  const [transitionTimeHr, setTransitionTimeHr] = useState(0.5); // 30 min default
  const [batteryVoltage, setBatteryVoltage] = useState(24); // DC24V default
  const [efficiency, setEfficiency] = useState(0.8);
  const [safetyFactor, setSafetyFactor] = useState(1.25);
  const [showDetails, setShowDetails] = useState(false);

  const calculation = useMemo(() => {
    const powerW = emergencyLoadKW * 1000;
    const rawCapacity = (powerW * transitionTimeHr) / (batteryVoltage * efficiency) * safetyFactor;
    const rawCapacityAh = Math.ceil(rawCapacity);

    // Find next standard size
    const standardSize = STANDARD_BATTERY_SIZES.find(s => s >= rawCapacityAh) ||
      Math.ceil(rawCapacityAh / 100) * 100;

    return {
      powerW,
      rawCapacityAh,
      standardSize,
    };
  }, [emergencyLoadKW, transitionTimeHr, batteryVoltage, efficiency, safetyFactor]);

  React.useEffect(() => {
    onCapacityChange?.(calculation.standardSize);
  }, [calculation.standardSize, onCapacityChange]);

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
          <Battery className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-200">
            배터리 용량 (Battery Capacity)
          </h3>
          <p className="text-xs text-gray-500">
            비상 전환 시 필수 부하 공급용 배터리 용량 산정
          </p>
        </div>
      </div>

      {/* Result */}
      <div className="bg-navy-900/50 rounded-lg p-4 mb-4 text-center">
        <div className="text-3xl font-bold font-mono text-success">
          {calculation.standardSize} Ah
        </div>
        <div className="text-xs text-gray-500 mt-1">
          DC{batteryVoltage}V | 표준 용량 (Standard Capacity)
        </div>
        {calculation.rawCapacityAh !== calculation.standardSize && (
          <div className="text-[10px] text-gray-600 mt-1">
            계산값: {calculation.rawCapacityAh} Ah → 표준 사이즈: {calculation.standardSize} Ah
          </div>
        )}
      </div>

      {/* Calculation formula */}
      <div className="bg-navy-700/50 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-300">산정 공식 (Formula):</strong><br />
            C(Ah) = P(W) x T(h) / V(V) / η x SF<br />
            = {calculation.powerW.toLocaleString()}W x {transitionTimeHr}h / {batteryVoltage}V / {efficiency} x {safetyFactor}<br />
            = <strong className="text-gray-200">{calculation.rawCapacityAh} Ah</strong>
          </div>
        </div>
      </div>

      {/* Expand/collapse for manual adjustments */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors rounded-lg hover:bg-navy-700/50"
      >
        <span>수동 조정 (Manual Adjust)</span>
        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showDetails && (
        <div className="mt-3 space-y-3 pt-3 border-t border-navy-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">비상 부하 (Emergency Load)</label>
              <div className="bg-navy-900 rounded px-3 py-2 text-sm font-mono text-gray-300">
                {emergencyLoadKW.toFixed(1)} kW
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">전환 시간 (Transition Time)</label>
              <select
                value={transitionTimeHr}
                onChange={(e) => setTransitionTimeHr(Number(e.target.value))}
                className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-gray-300"
              >
                <option value={0.25}>15분 (15 min)</option>
                <option value={0.5}>30분 (30 min)</option>
                <option value={1}>60분 (60 min)</option>
                <option value={1.5}>90분 (90 min)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">배터리 전압 (Battery Voltage)</label>
              <select
                value={batteryVoltage}
                onChange={(e) => setBatteryVoltage(Number(e.target.value))}
                className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-gray-300"
              >
                <option value={24}>DC 24V</option>
                <option value={48}>DC 48V</option>
                <option value={110}>DC 110V</option>
                <option value={220}>DC 220V</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">안전계수 (Safety Factor)</label>
              <select
                value={safetyFactor}
                onChange={(e) => setSafetyFactor(Number(e.target.value))}
                className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-gray-300"
              >
                <option value={1.1}>1.10</option>
                <option value={1.15}>1.15</option>
                <option value={1.2}>1.20</option>
                <option value={1.25}>1.25</option>
                <option value={1.5}>1.50</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
