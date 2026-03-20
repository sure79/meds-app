import React, { useState, useMemo, useCallback } from 'react';
import {
  Zap, AlertTriangle, Battery, Check, ChevronDown, ChevronUp,
  Settings, Info,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import type { OperatingCondition } from '../../types';
import Button from '../common/Button';
import BatteryCalculation from './BatteryCalculation';

const MAIN_GEN_STANDARD_SIZES = [100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1500, 2000];
const EMERGENCY_GEN_STANDARD_SIZES = [50, 75, 100, 125, 150, 200, 250, 300];

interface GeneratorRecommendationConfig {
  mainGenCount: number;
  mainGenCapacityKW: number;
  emergencyGenCapacityKW: number;
  batteryCapacityAh: number;
  totalMainCapacityKW: number;
  maxConditionLoadKW: number;
  emergencyLoadKW: number;
  reasoning: {
    main: string;
    emergency: string;
    battery: string;
  };
  emergencyLoadsList: string[];
}

function findNextStandardSize(targetKW: number, standardSizes: number[]): number {
  for (const size of standardSizes) {
    if (size >= targetKW) return size;
  }
  return standardSizes[standardSizes.length - 1];
}

interface GeneratorRecommendationProps {
  onConfirm: (config: GeneratorRecommendationConfig) => void;
}

export default function GeneratorRecommendation({ onConfirm }: GeneratorRecommendationProps) {
  const { project } = useProjectStore();
  const [showMainAdjust, setShowMainAdjust] = useState(false);
  const [showEmergencyAdjust, setShowEmergencyAdjust] = useState(false);

  // Calculate recommendation
  const recommendation = useMemo((): GeneratorRecommendationConfig => {
    const loads = project.loads;
    const conditions = project.activeConditions.filter(c => c !== 'emergency');

    // 1. Calculate total kW per condition (excluding emergency)
    const conditionTotals: Record<string, number> = {};
    for (const cond of conditions) {
      conditionTotals[cond] = loads.reduce((sum, load) => {
        const lf = load.loadFactors.find(f => f.condition === cond);
        const factor = lf ? lf.factor : 0;
        return sum + load.ratedPowerKW * factor * load.diversityFactor * load.quantity;
      }, 0);
    }

    const maxConditionLoadKW = Math.max(...Object.values(conditionTotals), 0);

    // 2. Main generators: total load x 1.15 margin, N-1 redundancy
    const totalRequiredKW = maxConditionLoadKW * 1.15;
    // Start with 2 generators, increase if single gen would be too large
    let mainGenCount = 2;
    let singleGenRequired = totalRequiredKW / (mainGenCount - 1); // N-1: (N-1) gens must handle full load

    // If single gen required is too big, add more generators
    while (singleGenRequired > 2000 && mainGenCount < 5) {
      mainGenCount++;
      singleGenRequired = totalRequiredKW / (mainGenCount - 1);
    }

    const mainGenCapacityKW = findNextStandardSize(Math.ceil(singleGenRequired), MAIN_GEN_STANDARD_SIZES);
    const totalMainCapacityKW = mainGenCapacityKW * mainGenCount;

    // 3. Emergency generator: covers all emergency-tagged loads x 1.15
    const emergencyLoadKW = loads
      .filter(l => {
        const emergencyFactor = l.loadFactors.find(f => f.condition === 'emergency' as OperatingCondition);
        return emergencyFactor && emergencyFactor.factor > 0;
      })
      .reduce((sum, l) => {
        const emergencyFactor = l.loadFactors.find(f => f.condition === 'emergency' as OperatingCondition);
        const factor = emergencyFactor ? emergencyFactor.factor : 0;
        return sum + l.ratedPowerKW * factor * l.quantity;
      }, 0);

    const emergencyLoadsList = loads
      .filter(l => {
        const emergencyFactor = l.loadFactors.find(f => f.condition === 'emergency' as OperatingCondition);
        return emergencyFactor && emergencyFactor.factor > 0;
      })
      .map(l => l.name);

    const emergencyRequired = emergencyLoadKW * 1.15;
    const emergencyGenCapacityKW = findNextStandardSize(Math.ceil(emergencyRequired), EMERGENCY_GEN_STANDARD_SIZES);

    // 4. Battery
    const batteryCapacityAh = 0; // Will be calculated by BatteryCalculation component

    // Reasoning
    const reasoning = {
      main: `최대 운항조건 부하 ${maxConditionLoadKW.toFixed(0)} kW x 1.15 안전계수 = ${totalRequiredKW.toFixed(0)} kW 필요. ` +
        `N-1 여유도 확보를 위해 ${mainGenCount}대 중 ${mainGenCount - 1}대로 전체 부하 커버 가능. ` +
        `각 ${mainGenCapacityKW} kW x ${mainGenCount}대 = 총 ${totalMainCapacityKW} kW.`,
      emergency: `비상 조건 부하 합계 ${emergencyLoadKW.toFixed(0)} kW x 1.15 = ${emergencyRequired.toFixed(0)} kW. ` +
        `표준 규격 ${emergencyGenCapacityKW} kW 비상발전기 1대 적용. ` +
        `비상 부하: ${emergencyLoadsList.length}개 장비.`,
      battery: `비상 전환 시 필수 부하 공급용. 비상 부하 ${emergencyLoadKW.toFixed(0)} kW 기준으로 30분 공급 가능한 배터리 용량 산정.`,
    };

    return {
      mainGenCount,
      mainGenCapacityKW,
      emergencyGenCapacityKW,
      batteryCapacityAh,
      totalMainCapacityKW,
      maxConditionLoadKW,
      emergencyLoadKW,
      reasoning,
      emergencyLoadsList,
    };
  }, [project.loads, project.activeConditions]);

  // Manual adjustment states
  const [adjustedMainCount, setAdjustedMainCount] = useState<number | null>(null);
  const [adjustedMainCapacity, setAdjustedMainCapacity] = useState<number | null>(null);
  const [adjustedEmergencyCapacity, setAdjustedEmergencyCapacity] = useState<number | null>(null);
  const [batteryCapacity, setBatteryCapacity] = useState(0);

  const finalMainCount = adjustedMainCount ?? recommendation.mainGenCount;
  const finalMainCapacity = adjustedMainCapacity ?? recommendation.mainGenCapacityKW;
  const finalEmergencyCapacity = adjustedEmergencyCapacity ?? recommendation.emergencyGenCapacityKW;

  const handleBatteryCapacityChange = useCallback((cap: number) => {
    setBatteryCapacity(cap);
  }, []);

  const handleConfirm = () => {
    onConfirm({
      ...recommendation,
      mainGenCount: finalMainCount,
      mainGenCapacityKW: finalMainCapacity,
      emergencyGenCapacityKW: finalEmergencyCapacity,
      batteryCapacityAh: batteryCapacity,
      totalMainCapacityKW: finalMainCapacity * finalMainCount,
    });
  };

  const hasLoads = project.loads.length > 0;

  if (!hasLoads) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          부하가 없습니다 (No Loads Defined)
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          발전기를 추천하려면 먼저 부하 목록을 작성해주세요.
          Step 1에서 부하를 추가한 후 이 단계로 돌아오세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <strong className="text-accent">자동 추천 결과 (Auto Recommendation)</strong>
            <p className="text-xs text-gray-400 mt-1">
              등록된 {project.loads.length}개 부하의 운항조건별 전력 소요를 분석하여
              최적의 발전기 구성을 추천합니다. 필요시 수동 조정이 가능합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Main Generators Card */}
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-200">
                주발전기 (Main Generators)
              </h3>
              <p className="text-xs text-gray-500">N-1 여유도 기반 자동 산정</p>
            </div>
          </div>

          {/* Result */}
          <div className="bg-navy-900/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <div className="text-3xl font-bold font-mono text-accent">
                  {finalMainCapacity}
                </div>
                <div className="text-xs text-gray-500">kW / 대</div>
              </div>
              <div className="text-2xl text-gray-600">x</div>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono text-accent">
                  {finalMainCount}
                </div>
                <div className="text-xs text-gray-500">대</div>
              </div>
              <div className="text-2xl text-gray-600">=</div>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono text-accent">
                  {finalMainCapacity * finalMainCount}
                </div>
                <div className="text-xs text-gray-500">kW 총용량</div>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="text-xs text-gray-400 leading-relaxed mb-3 bg-navy-700/30 rounded-lg p-3">
            {recommendation.reasoning.main}
          </div>

          {/* Manual Adjust */}
          <button
            onClick={() => setShowMainAdjust(!showMainAdjust)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors rounded-lg hover:bg-navy-700/50"
          >
            <span className="flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              수동 조정 (Manual Adjust)
            </span>
            {showMainAdjust ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMainAdjust && (
            <div className="mt-3 space-y-3 pt-3 border-t border-navy-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">발전기 대수 (Count)</label>
                  <select
                    value={finalMainCount}
                    onChange={(e) => setAdjustedMainCount(Number(e.target.value))}
                    className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-gray-300"
                  >
                    {[2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}대</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">개별 용량 (Each kW)</label>
                  <select
                    value={finalMainCapacity}
                    onChange={(e) => setAdjustedMainCapacity(Number(e.target.value))}
                    className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-gray-300"
                  >
                    {MAIN_GEN_STANDARD_SIZES.map(s => (
                      <option key={s} value={s}>{s} kW</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Generator Card */}
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emergency/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-emergency" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-200">
                비상발전기 (Emergency Generator)
              </h3>
              <p className="text-xs text-gray-500">SOLAS 규정 기반 비상 부하 커버</p>
            </div>
          </div>

          {/* Result */}
          <div className="bg-navy-900/50 rounded-lg p-4 mb-4 text-center">
            <div className="text-3xl font-bold font-mono text-emergency">
              {finalEmergencyCapacity} kW
            </div>
            <div className="text-xs text-gray-500 mt-1">
              비상발전기 1대 (1 x EDG)
            </div>
          </div>

          {/* Covered loads */}
          <div className="text-xs text-gray-400 leading-relaxed mb-3 bg-navy-700/30 rounded-lg p-3">
            <div className="mb-1">{recommendation.reasoning.emergency}</div>
            {recommendation.emergencyLoadsList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {recommendation.emergencyLoadsList.map((name, i) => (
                  <span key={i} className="inline-block px-1.5 py-0.5 bg-emergency/10 text-emergency rounded text-[10px]">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Manual Adjust */}
          <button
            onClick={() => setShowEmergencyAdjust(!showEmergencyAdjust)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors rounded-lg hover:bg-navy-700/50"
          >
            <span className="flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              수동 조정 (Manual Adjust)
            </span>
            {showEmergencyAdjust ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showEmergencyAdjust && (
            <div className="mt-3 space-y-3 pt-3 border-t border-navy-700">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">비상발전기 용량 (EDG Capacity)</label>
                <select
                  value={finalEmergencyCapacity}
                  onChange={(e) => setAdjustedEmergencyCapacity(Number(e.target.value))}
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-gray-300"
                >
                  {EMERGENCY_GEN_STANDARD_SIZES.map(s => (
                    <option key={s} value={s}>{s} kW</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Battery */}
      <BatteryCalculation
        emergencyLoadKW={recommendation.emergencyLoadKW}
        onCapacityChange={handleBatteryCapacityChange}
      />

      {/* Confirm Button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleConfirm}
          icon={<Check className="w-5 h-5" />}
          className="px-12 py-3 text-base shadow-lg shadow-accent/20"
        >
          이 구성으로 확정 (Confirm this Configuration)
        </Button>
      </div>
    </div>
  );
}
