import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, Sliders, Zap, BarChart3, ChevronRight, ChevronLeft, Check,
  Plus, Edit2, Trash2, Info, Download, Calculator, Ship,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { COMMON_MARINE_LOADS, VESSEL_PRESETS, type LoadPreset } from '../../data/loadPresets';
import type { Load, Generator, Bus, BusTie, OperatingCondition, VoltageLevel } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import Button from '../common/Button';
import HelpTooltip from '../common/HelpTooltip';
import StatusBadge from '../common/StatusBadge';
import VesselTypeSelector, { type VesselTypeOption } from './VesselTypeSelector';
import GeneratorRecommendation from './GeneratorRecommendation';
import LoadBalanceTable from './LoadBalanceTable';
import LoadBalanceChart from './LoadBalanceChart';
import LoadForm from './LoadForm';
import GeneratorForm from './GeneratorForm';
import LoadPresetSelector from './LoadPresetSelector';
import { getConditionShortLabel, getLoadTypeLabel, formatNumber } from '../../utils/calculations';
import { exportLoadBalanceCSV } from '../../utils/export';

// ==========================
// STEP DEFINITIONS
// ==========================

const STEPS = [
  { id: 1, label: '부하 목록', labelEn: 'Load List', icon: <Package className="w-4 h-4" /> },
  { id: 2, label: '운항조건 설정', labelEn: 'Operating Conditions', icon: <Sliders className="w-4 h-4" /> },
  { id: 3, label: '발전기 추천', labelEn: 'Generator Recommendation', icon: <Zap className="w-4 h-4" /> },
  { id: 4, label: '결과', labelEn: 'Results', icon: <BarChart3 className="w-4 h-4" /> },
];

// ==========================
// LOAD CATEGORY GROUPING
// ==========================

interface LoadCategory {
  id: string;
  label: string;
  labelEn: string;
  types: string[];
}

const LOAD_CATEGORIES: LoadCategory[] = [
  { id: 'engine', label: '기관실 보조기계', labelEn: 'Engine Room Auxiliaries', types: ['pump', 'compressor', 'fan'] },
  { id: 'deck', label: '갑판기계', labelEn: 'Deck Machinery', types: ['winch', 'crane', 'bow-thruster'] },
  { id: 'service', label: '선내서비스', labelEn: 'Ship Service', types: ['hvac', 'heater', 'galley', 'lighting', 'transformer', 'converter', 'ups', 'battery-charger', 'other'] },
  { id: 'nav', label: '항해통신', labelEn: 'Navigation & Communication', types: ['navigation', 'communication'] },
  { id: 'emergency', label: '비상부하', labelEn: 'Emergency Loads', types: [] }, // special: filtered by isEssential
];

function categorizePreset(preset: LoadPreset): string {
  if (preset.isEssential && preset.defaultFactors['emergency']) return 'emergency';
  for (const cat of LOAD_CATEGORIES) {
    if (cat.id === 'emergency') continue;
    if (cat.types.includes(preset.type)) return cat.id;
  }
  return 'service';
}

// ==========================
// MAIN WIZARD COMPONENT
// ==========================

export default function LoadWizard() {
  const {
    project,
    loadBalanceResult,
    isCalculating,
    addLoad,
    removeLoad,
    updateLoad,
    calculateLoadBalanceLocal,
    calculateLoadBalanceAPI,
  } = useProjectStore();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [selectedVesselType, setSelectedVesselType] = useState<string | null>(null);
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | undefined>();
  const [showGenForm, setShowGenForm] = useState(false);
  const [editingGen, setEditingGen] = useState<Generator | undefined>();

  // Step 2 state - local load factor overrides
  const [localFactors, setLocalFactors] = useState<Record<string, Record<string, number>>>({});

  // Auto-calculate on relevant changes
  useEffect(() => {
    calculateLoadBalanceLocal();
  }, [project.loads, project.generators, project.activeConditions, project.busTies]);

  // Sync load factors into local state when loads change
  useEffect(() => {
    const factors: Record<string, Record<string, number>> = {};
    for (const load of project.loads) {
      factors[load.id] = {};
      for (const lf of load.loadFactors) {
        factors[load.id][lf.condition] = lf.factor;
      }
    }
    setLocalFactors(factors);
  }, [project.loads.length]);

  const handleVesselTypeSelect = useCallback((vt: VesselTypeOption) => {
    setSelectedVesselType(vt.id);
    // Find matching VESSEL_PRESET to auto-check loads
    const matchingPreset = VESSEL_PRESETS.find(p => p.vesselType === vt.presetKey);
    if (matchingPreset) {
      setPresetChecked(new Set(matchingPreset.loadNames));
    } else {
      setPresetChecked(new Set());
    }
  }, []);

  const [presetChecked, setPresetChecked] = useState<Set<string>>(new Set());

  const togglePresetLoad = (name: string) => {
    setPresetChecked(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAddPresetLoads = () => {
    // Get main buses and emergency bus
    const mainBuses = project.buses.filter(b => b.type === 'main');
    const esbBus = project.buses.find(b => b.type === 'emergency');
    let loadBusIdx = 0;

    for (const name of presetChecked) {
      const preset = COMMON_MARINE_LOADS.find(l => l.name === name);
      if (!preset) continue;

      // Check if load already exists
      if (project.loads.some(l => l.name === name)) continue;

      const isEmergencyLoad = preset.isEssential && esbBus && preset.defaultFactors['emergency'];
      let connectedBusId = '';

      if (isEmergencyLoad && esbBus) {
        connectedBusId = esbBus.id;
      } else if (mainBuses.length > 0) {
        connectedBusId = mainBuses[loadBusIdx++ % mainBuses.length].id;
      } else if (project.buses.length > 0) {
        connectedBusId = project.buses[0].id;
      }

      addLoad({
        name: preset.name,
        type: preset.type,
        ratedPowerKW: preset.ratedPowerKW,
        ratedVoltage: project.systemVoltage as VoltageLevel,
        ratedPF: preset.ratedPF,
        efficiency: preset.efficiency,
        phase: preset.phase,
        connectedBusId,
        startMethod: preset.startMethod,
        startingCurrentMultiplier: preset.startingCurrentMultiplier,
        startDurationSec: preset.startMethod ? 5 : undefined,
        loadFactors: project.activeConditions.map(c => ({
          condition: c,
          factor: preset.defaultFactors[c] ?? 0,
        })),
        diversityFactor: 1.0,
        isEssential: preset.isEssential,
        isEmergency: !!(isEmergencyLoad && esbBus),
        cableLengthM: 30,
        cableType: preset.cableType,
        installMethod: preset.installMethod,
        quantity: 1,
      });
    }
  };

  // Step 2: update factor for a load/condition
  const handleFactorChange = (loadId: string, condition: string, value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    setLocalFactors(prev => ({
      ...prev,
      [loadId]: {
        ...(prev[loadId] || {}),
        [condition]: clamped,
      },
    }));
  };

  // Apply local factors to store when leaving step 2
  const applyFactorsToStore = () => {
    for (const loadId of Object.keys(localFactors)) {
      const load = project.loads.find(l => l.id === loadId);
      if (!load) continue;
      const updatedFactors = project.activeConditions.map(c => ({
        condition: c,
        factor: localFactors[loadId]?.[c] ?? 0,
      }));
      updateLoad(loadId, { loadFactors: updatedFactors });
    }
  };

  // Step 3: handle generator confirmation
  const handleGenConfirm = useCallback((config: any) => {
    const store = useProjectStore.getState();
    // Remove existing generators and buses (clean slate from recommendation)
    // We'll create new ones
    const existingGenIds = store.project.generators.map(g => g.id);

    // Create buses if none exist
    let msbPortId = store.project.buses.find(b => b.type === 'main')?.id;
    let msbStbdId = store.project.buses.filter(b => b.type === 'main')[1]?.id;
    let esbId = store.project.buses.find(b => b.type === 'emergency')?.id;

    const newBuses: Bus[] = [];

    if (!msbPortId) {
      msbPortId = uuidv4();
      newBuses.push({
        id: msbPortId,
        name: 'MSB Port (주배전반 좌현)',
        type: 'main',
        voltage: store.project.systemVoltage,
        frequency: store.project.systemFrequency,
        phase: store.project.systemPhase,
        groundingSystem: store.project.groundingSystem,
        connectedGeneratorIds: [],
        connectedLoadIds: [],
        connectedBusTieIds: [],
        positionX: 200,
        positionY: 220,
      });
    }

    if (!msbStbdId && config.mainGenCount >= 2) {
      msbStbdId = uuidv4();
      newBuses.push({
        id: msbStbdId,
        name: 'MSB Stbd (주배전반 우현)',
        type: 'main',
        voltage: store.project.systemVoltage,
        frequency: store.project.systemFrequency,
        phase: store.project.systemPhase,
        groundingSystem: store.project.groundingSystem,
        connectedGeneratorIds: [],
        connectedLoadIds: [],
        connectedBusTieIds: [],
        positionX: 600,
        positionY: 220,
      });
    }

    if (!esbId) {
      esbId = uuidv4();
      newBuses.push({
        id: esbId,
        name: 'ESB (비상배전반)',
        type: 'emergency',
        voltage: store.project.systemVoltage,
        frequency: store.project.systemFrequency,
        phase: store.project.systemPhase,
        groundingSystem: store.project.groundingSystem,
        connectedGeneratorIds: [],
        connectedLoadIds: [],
        connectedBusTieIds: [],
        positionX: 1000,
        positionY: 220,
      });
    }

    // Remove existing generators first
    for (const genId of existingGenIds) {
      store.removeGenerator(genId);
    }

    // Add new buses
    for (const bus of newBuses) {
      store.addBus({
        name: bus.name,
        type: bus.type,
        voltage: bus.voltage,
        frequency: bus.frequency,
        phase: bus.phase,
        groundingSystem: bus.groundingSystem,
        connectedGeneratorIds: bus.connectedGeneratorIds,
        connectedLoadIds: bus.connectedLoadIds,
        connectedBusTieIds: bus.connectedBusTieIds,
        positionX: bus.positionX,
        positionY: bus.positionY,
      });
    }

    // Refresh bus IDs after adding
    const updatedState = useProjectStore.getState();
    const allMainBuses = updatedState.project.buses.filter(b => b.type === 'main');
    const emergencyBus = updatedState.project.buses.find(b => b.type === 'emergency');

    // Create main generators split across main buses
    for (let i = 0; i < config.mainGenCount; i++) {
      const busId = allMainBuses[i % allMainBuses.length]?.id || '';
      store.addGenerator({
        name: `DG${i + 1} (주발전기 #${i + 1})`,
        type: 'diesel',
        ratedPowerKW: config.mainGenCapacityKW,
        ratedVoltage: store.project.systemVoltage,
        ratedPF: 0.8,
        frequency: store.project.systemFrequency,
        phase: store.project.systemPhase,
        xdPercent: 12,
        xdPrimePercent: 18,
        xdDoublePrimePercent: 25,
        connectedBusId: busId,
        isAvailable: true,
        rpm: 1800,
        efficiency: 0.95,
      });
    }

    // Create emergency generator
    if (emergencyBus) {
      store.addGenerator({
        name: 'EDG (비상발전기)',
        type: 'emergency',
        ratedPowerKW: config.emergencyGenCapacityKW,
        ratedVoltage: store.project.systemVoltage,
        ratedPF: 0.8,
        frequency: store.project.systemFrequency,
        phase: store.project.systemPhase,
        xdPercent: 15,
        xdPrimePercent: 22,
        xdDoublePrimePercent: 30,
        connectedBusId: emergencyBus.id,
        isAvailable: true,
        rpm: 1800,
        efficiency: 0.93,
      });
    }

    // Add bus tie between main buses if 2 main buses exist
    const finalState = useProjectStore.getState();
    const finalMainBuses = finalState.project.buses.filter(b => b.type === 'main');
    if (finalMainBuses.length >= 2 && finalState.project.busTies.length === 0) {
      store.addBusTie({
        name: 'BT1 (모선연결기)',
        busAId: finalMainBuses[0].id,
        busBId: finalMainBuses[1].id,
        isClosed: true,
      });
    }

    // Move to results step
    setStep(4);
  }, []);

  const handleDeleteLoad = (id: string) => {
    if (confirm('부하를 삭제하시겠습니까? (Delete load?)')) {
      removeLoad(id);
    }
  };

  const handleEditLoad = (load: Load) => {
    setEditingLoad(load);
    setShowLoadForm(true);
  };

  const handleCloseLoadForm = () => {
    setShowLoadForm(false);
    setEditingLoad(undefined);
  };

  const handleExportCSV = () => {
    exportLoadBalanceCSV(project);
  };

  // Navigation
  const goNext = () => {
    if (step === 2) {
      applyFactorsToStore();
    }
    if (step < 4) setStep(step + 1);
  };

  const goPrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const totalInstalledKW = project.loads.reduce((s, l) => s + l.ratedPowerKW * l.quantity, 0);

  // Group presets by category
  const groupedPresets = useMemo(() => {
    const groups: Record<string, LoadPreset[]> = {};
    for (const cat of LOAD_CATEGORIES) {
      groups[cat.id] = [];
    }
    for (const preset of COMMON_MARINE_LOADS) {
      const catId = categorizePreset(preset);
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(preset);
    }
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Step Indicator */}
      <div className="flex-shrink-0 bg-navy-800 border-b border-navy-600 px-6 py-3">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const isCurrent = s.id === step;
            const isComplete = s.id < step;
            return (
              <React.Fragment key={s.id}>
                {i > 0 && (
                  <div className={`w-8 h-0.5 ${isComplete ? 'bg-accent' : 'bg-navy-600'}`} />
                )}
                <button
                  onClick={() => {
                    if (step === 2 && s.id !== 2) applyFactorsToStore();
                    setStep(s.id);
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium
                    ${isCurrent
                      ? 'bg-accent/10 text-accent border border-accent/30'
                      : isComplete
                        ? 'text-accent/70 hover:text-accent cursor-pointer'
                        : 'text-gray-500 hover:text-gray-400 cursor-pointer'
                    }
                  `}
                >
                  <span className={`
                    w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0
                    ${isCurrent
                      ? 'bg-accent text-navy-900'
                      : isComplete
                        ? 'bg-accent/20 text-accent'
                        : 'bg-navy-700 text-gray-500'
                    }
                  `}>
                    {isComplete ? <Check className="w-3 h-3" /> : s.id}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="hidden lg:inline text-xs text-gray-500">({s.labelEn})</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto p-6">
        {step === 1 && (
          <Step1LoadList
            project={project}
            selectedVesselType={selectedVesselType}
            presetChecked={presetChecked}
            groupedPresets={groupedPresets}
            totalInstalledKW={totalInstalledKW}
            onVesselTypeSelect={handleVesselTypeSelect}
            onTogglePreset={togglePresetLoad}
            onAddPresetLoads={handleAddPresetLoads}
            onEditLoad={handleEditLoad}
            onDeleteLoad={handleDeleteLoad}
            onShowLoadForm={() => setShowLoadForm(true)}
            onShowPresets={() => setShowPresets(true)}
          />
        )}

        {step === 2 && (
          <Step2OperatingConditions
            project={project}
            localFactors={localFactors}
            onFactorChange={handleFactorChange}
          />
        )}

        {step === 3 && (
          <Step3GeneratorRecommendation
            onConfirm={handleGenConfirm}
          />
        )}

        {step === 4 && (
          <Step4Results
            project={project}
            loadBalanceResult={loadBalanceResult}
            isCalculating={isCalculating}
            onExportCSV={handleExportCSV}
            onCalculateAPI={() => calculateLoadBalanceAPI()}
            onEditGen={(gen) => { setEditingGen(gen); setShowGenForm(true); }}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 bg-navy-800 border-t border-navy-600 px-6 py-3 flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button variant="secondary" onClick={goPrev} icon={<ChevronLeft className="w-4 h-4" />}>
              이전 (Previous)
            </Button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {step}/4 단계
        </div>
        <div>
          {step < 4 && step !== 3 && (
            <Button
              variant="primary"
              onClick={goNext}
              disabled={step === 1 && project.loads.length === 0}
              icon={<ChevronRight className="w-4 h-4" />}
              className="flex-row-reverse"
            >
              다음 (Next)
            </Button>
          )}
          {step === 3 && (
            <span className="text-xs text-gray-500">
              아래에서 구성을 확정하면 결과 단계로 이동합니다
            </span>
          )}
        </div>
      </div>

      {/* Modals */}
      {showLoadForm && (
        <LoadForm isOpen={showLoadForm} onClose={handleCloseLoadForm} editingLoad={editingLoad} />
      )}
      {showPresets && (
        <LoadPresetSelector isOpen={showPresets} onClose={() => setShowPresets(false)} />
      )}
      {showGenForm && (
        <GeneratorForm
          isOpen={showGenForm}
          onClose={() => { setShowGenForm(false); setEditingGen(undefined); }}
          editingGenerator={editingGen}
        />
      )}
    </div>
  );
}

// ==========================
// STEP 1: LOAD LIST
// ==========================

interface Step1Props {
  project: any;
  selectedVesselType: string | null;
  presetChecked: Set<string>;
  groupedPresets: Record<string, LoadPreset[]>;
  totalInstalledKW: number;
  onVesselTypeSelect: (vt: VesselTypeOption) => void;
  onTogglePreset: (name: string) => void;
  onAddPresetLoads: () => void;
  onEditLoad: (load: Load) => void;
  onDeleteLoad: (id: string) => void;
  onShowLoadForm: () => void;
  onShowPresets: () => void;
}

function Step1LoadList({
  project, selectedVesselType, presetChecked, groupedPresets,
  totalInstalledKW, onVesselTypeSelect, onTogglePreset,
  onAddPresetLoads, onEditLoad, onDeleteLoad, onShowLoadForm, onShowPresets,
}: Step1Props) {
  const [showQuickStart, setShowQuickStart] = useState(project.loads.length === 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Quick Start Banner */}
      {project.loads.length === 0 && (
        <div className="bg-accent/5 border-2 border-dashed border-accent/30 rounded-xl p-6 text-center">
          <Ship className="w-10 h-10 text-accent mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            부하 목록을 작성하세요 (Define Your Load List)
          </h3>
          <p className="text-sm text-gray-400 mb-4 max-w-lg mx-auto">
            선박에 필요한 전기 장비를 먼저 정의합니다. 선종별 프리셋으로 빠르게 시작하거나, 수동으로 추가할 수 있습니다.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowQuickStart(true)}
              icon={<Package className="w-5 h-5" />}
              className="shadow-lg shadow-accent/20"
            >
              프리셋으로 빠른 시작 (Quick Start with Preset)
            </Button>
            <Button variant="secondary" size="lg" onClick={onShowLoadForm} icon={<Plus className="w-5 h-5" />}>
              수동 추가 (Add Manually)
            </Button>
          </div>
        </div>
      )}

      {/* Quick Start Section: Vessel Type + Preset Selection */}
      {(showQuickStart || project.loads.length === 0) && (
        <div className="space-y-5">
          <VesselTypeSelector selectedType={selectedVesselType} onSelect={onVesselTypeSelect} />

          {selectedVesselType && (
            <div className="bg-navy-800 rounded-xl border border-navy-600 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">
                  추천 부하 선택 (Select Recommended Loads)
                </h3>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => {
                    const allNames = COMMON_MARINE_LOADS.map(l => l.name);
                    presetChecked.size === allNames.length
                      ? onTogglePreset('__clear_all__')
                      : allNames.forEach(n => { if (!presetChecked.has(n)) onTogglePreset(n); });
                  }}>
                    전체 선택/해제
                  </Button>
                  <span className="text-xs text-gray-500 self-center">
                    {presetChecked.size}개 선택됨
                  </span>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {LOAD_CATEGORIES.map(cat => {
                  const presets = groupedPresets[cat.id] || [];
                  if (presets.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {cat.label} ({cat.labelEn})
                      </h4>
                      <div className="space-y-1">
                        {presets.map(preset => (
                          <label
                            key={preset.name}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                              ${presetChecked.has(preset.name) ? 'bg-accent/5 border border-accent/20' : 'hover:bg-navy-700/50 border border-transparent'}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={presetChecked.has(preset.name)}
                              onChange={() => onTogglePreset(preset.name)}
                              className="w-4 h-4 rounded bg-navy-800 border-navy-600 accent-accent"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-300">{preset.name}</div>
                              <div className="text-[10px] text-gray-500">{preset.description}</div>
                            </div>
                            <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                              {preset.ratedPowerKW} kW
                            </span>
                            <span className="text-[10px] text-gray-500 flex-shrink-0 w-16 text-right">
                              {getLoadTypeLabel(preset.type).split('(')[0].trim()}
                            </span>
                            {preset.isEssential && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-emergency/20 text-emergency rounded flex-shrink-0">
                                비상부하
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-navy-600">
                <Button variant="secondary" onClick={() => setShowQuickStart(false)}>
                  닫기 (Close)
                </Button>
                <Button
                  variant="primary"
                  onClick={() => { onAddPresetLoads(); setShowQuickStart(false); }}
                  disabled={presetChecked.size === 0}
                  icon={<Plus className="w-4 h-4" />}
                >
                  {presetChecked.size}개 추가 (Add {presetChecked.size})
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Load List Table */}
      {project.loads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              부하 목록 (Load List)
              <span className="text-xs text-gray-500 font-normal">({project.loads.length}개)</span>
              <HelpTooltip text="등록된 전기 장비 목록입니다. 편집/삭제가 가능합니다." />
            </h3>
            <div className="flex gap-2">
              {!showQuickStart && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowQuickStart(true)}
                  icon={<Package className="w-3.5 h-3.5" />}
                >
                  프리셋 추가
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={onShowLoadForm}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                부하 추가 (Add Load)
              </Button>
            </div>
          </div>

          <div className="overflow-auto rounded-lg border border-navy-600">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-700 border-b border-navy-600">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400">부하명 (Name)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400">유형 (Type)</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400">kW</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400">PF</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400">모선 (Bus)</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400">비상</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400 w-20">작업</th>
                </tr>
              </thead>
              <tbody>
                {project.loads.map((load: Load) => {
                  const bus = project.buses.find((b: Bus) => b.id === load.connectedBusId);
                  return (
                    <tr key={load.id} className="border-b border-navy-700/50 hover:bg-navy-800/30">
                      <td className="px-3 py-2 text-gray-300">{load.name}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">
                        {getLoadTypeLabel(load.type).split('(')[0].trim()}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-300">{load.ratedPowerKW}</td>
                      <td className="px-3 py-2 text-center font-mono text-gray-400">{load.ratedPF}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{bus?.name?.split('(')[0]?.trim() || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        {load.isEssential && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emergency/20 text-emergency rounded">ESS</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => onEditLoad(load)} className="p-1 text-gray-500 hover:text-accent">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDeleteLoad(load.id)} className="p-1 text-gray-500 hover:text-danger">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Summary */}
          <div className="mt-3 flex items-center justify-between bg-navy-800 rounded-lg border border-navy-600 px-4 py-3">
            <span className="text-sm text-gray-400">총 설치 부하 (Total Installed Load)</span>
            <span className="text-lg font-bold font-mono text-accent">{totalInstalledKW.toFixed(0)} kW</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================
// STEP 2: OPERATING CONDITIONS
// ==========================

interface Step2Props {
  project: any;
  localFactors: Record<string, Record<string, number>>;
  onFactorChange: (loadId: string, condition: string, value: number) => void;
}

function Step2OperatingConditions({ project, localFactors, onFactorChange }: Step2Props) {
  const conditions = project.activeConditions as OperatingCondition[];

  // Calculate totals per condition
  const conditionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const cond of conditions) {
      totals[cond] = project.loads.reduce((sum: number, load: Load) => {
        const factor = localFactors[load.id]?.[cond] ?? 0;
        return sum + load.ratedPowerKW * factor * load.quantity;
      }, 0);
    }
    return totals;
  }, [project.loads, conditions, localFactors]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-200">
            운항조건별 부하율 설정 (Operating Condition Load Factors)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            각 장비의 운항조건별 사용률(0~1)을 설정합니다. 프리셋 기본값이 적용되어 있습니다.
          </p>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-navy-600">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-700 border-b border-navy-600">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 sticky left-0 bg-navy-700 z-10 min-w-[180px]">
                부하명 (Load)
              </th>
              <th className="px-2 py-2 text-right text-xs font-semibold text-gray-400 w-16">kW</th>
              {conditions.map(cond => (
                <th key={cond} className="px-2 py-2 text-center text-xs font-semibold text-gray-400 min-w-[70px]">
                  {getConditionShortLabel(cond)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {project.loads.map((load: Load) => (
              <tr key={load.id} className="border-b border-navy-700/50 hover:bg-navy-800/30">
                <td className="px-3 py-1 text-left sticky left-0 bg-navy-900/80 z-10">
                  <div className="text-gray-300 text-xs">{load.name}</div>
                </td>
                <td className="px-2 py-1 text-right font-mono text-xs text-gray-400">
                  {load.ratedPowerKW}
                </td>
                {conditions.map(cond => {
                  const val = localFactors[load.id]?.[cond] ?? 0;
                  return (
                    <td key={cond} className="px-1 py-1 text-center">
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={val}
                        onChange={(e) => onFactorChange(load.id, cond, Number(e.target.value))}
                        className={`
                          w-14 bg-navy-800 border border-navy-600 rounded px-1.5 py-1 text-xs font-mono text-center
                          ${val > 0 ? 'text-gray-200' : 'text-gray-600'}
                          focus:border-accent focus:outline-none
                        `}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-navy-500 bg-navy-800">
              <td className="px-3 py-2 text-left font-semibold text-gray-300 text-xs sticky left-0 bg-navy-800 z-10">
                합계 (Total kW)
              </td>
              <td className="px-2 py-2"></td>
              {conditions.map(cond => (
                <td key={cond} className="px-2 py-2 text-center font-mono font-semibold text-accent text-xs">
                  {conditionTotals[cond]?.toFixed(0) || '0'}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ==========================
// STEP 3: GENERATOR RECOMMENDATION
// ==========================

interface Step3Props {
  onConfirm: (config: any) => void;
}

function Step3GeneratorRecommendation({ onConfirm }: Step3Props) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-200">
          발전기 추천 (Generator Recommendation)
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          부하 분석 결과를 기반으로 최적의 발전기 구성을 자동으로 추천합니다.
        </p>
      </div>
      <GeneratorRecommendation onConfirm={onConfirm} />
    </div>
  );
}

// ==========================
// STEP 4: RESULTS
// ==========================

interface Step4Props {
  project: any;
  loadBalanceResult: any;
  isCalculating: boolean;
  onExportCSV: () => void;
  onCalculateAPI: () => void;
  onEditGen: (gen: Generator) => void;
}

function Step4Results({ project, loadBalanceResult, isCalculating, onExportCSV, onCalculateAPI, onEditGen }: Step4Props) {
  const totalGenCapacity = project.generators
    .filter((g: Generator) => g.isAvailable && g.type !== 'emergency')
    .reduce((s: number, g: Generator) => s + g.ratedPowerKW, 0);

  const emergencyGenCapacity = project.generators
    .filter((g: Generator) => g.type === 'emergency')
    .reduce((s: number, g: Generator) => s + g.ratedPowerKW, 0);

  const totalInstalledKW = project.loads.reduce((s: number, l: Load) => s + l.ratedPowerKW * l.quantity, 0);

  const maxLoadPercent = loadBalanceResult
    ? Math.max(...loadBalanceResult.summaries.filter((s: any) => s.condition !== 'emergency').map((s: any) => s.loadPercent), 0)
    : 0;

  // Warnings
  const warnings: string[] = [];
  if (loadBalanceResult) {
    for (const summary of loadBalanceResult.summaries) {
      if (summary.status === 'fail') {
        warnings.push(`${getConditionShortLabel(summary.condition)}: 부하율 ${formatNumber(summary.loadPercent, 1)}% - 발전 용량 초과! (Overloaded)`);
      } else if (summary.status === 'warning') {
        warnings.push(`${getConditionShortLabel(summary.condition)}: 부하율 ${formatNumber(summary.loadPercent, 1)}% - 주의 필요 (Warning)`);
      }
    }
  }
  if (project.generators.length === 0) {
    warnings.push('발전기가 등록되지 않았습니다. Step 3에서 발전기를 구성하세요. (No generators configured)');
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
          결과 (Results)
          <HelpTooltip text="각 운항 조건별 발전기 용량 대비 부하 사용량을 분석합니다. 선급 제출 시 필수 계산서입니다." />
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            CSV 내보내기
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={isCalculating}
            onClick={onCalculateAPI}
            icon={<Calculator className="w-3.5 h-3.5" />}
          >
            서버 계산 (API Calc)
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="총 발전 용량"
          sublabel="Total Gen Capacity"
          value={`${totalGenCapacity} kW`}
          color="text-accent"
        />
        <SummaryCard
          label="총 설치 부하"
          sublabel="Total Connected"
          value={`${totalInstalledKW.toFixed(0)} kW`}
          color="text-gray-200"
        />
        <SummaryCard
          label="비상 발전 용량"
          sublabel="Emergency Gen"
          value={`${emergencyGenCapacity} kW`}
          color="text-emergency"
        />
        <SummaryCard
          label="최대 부하율"
          sublabel="Max Load %"
          value={loadBalanceResult ? `${formatNumber(maxLoadPercent, 1)}%` : '-'}
          color={maxLoadPercent > 80 ? 'text-warning' : 'text-success'}
        />
      </div>

      {/* Generator list */}
      {project.generators.length > 0 && (
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            발전기 구성 (Generator Configuration)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {project.generators.map((gen: Generator) => (
              <button
                key={gen.id}
                onClick={() => onEditGen(gen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-700/50 hover:bg-navy-700 transition-colors text-left"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  gen.type === 'emergency' ? 'bg-emergency' : 'bg-success'
                }`} />
                <div className="min-w-0">
                  <div className="text-xs text-gray-300 truncate">{gen.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{gen.ratedPowerKW} kW</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            경고 및 권고사항 (Warnings & Recommendations)
          </h3>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-warning mt-0.5">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status badges per condition */}
      {loadBalanceResult && (
        <div className="flex flex-wrap gap-2">
          {loadBalanceResult.summaries.map((s: any) => (
            <div key={s.condition} className="flex items-center gap-2 bg-navy-800 rounded-lg border border-navy-600 px-3 py-2">
              <span className="text-xs text-gray-400">{getConditionShortLabel(s.condition)}</span>
              <StatusBadge status={s.status} label={`${formatNumber(s.loadPercent, 1)}%`} />
            </div>
          ))}
        </div>
      )}

      {/* Load Balance Table */}
      {loadBalanceResult && <LoadBalanceTable result={loadBalanceResult} />}

      {/* Chart */}
      {loadBalanceResult && <LoadBalanceChart result={loadBalanceResult} />}
    </div>
  );
}

// ==========================
// SUMMARY CARD
// ==========================

function SummaryCard({ label, sublabel, value, color }: { label: string; sublabel: string; value: string; color: string }) {
  return (
    <div className="bg-navy-800 rounded-lg border border-navy-600 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-[10px] text-gray-600">{sublabel}</div>
      <div className={`text-lg font-mono font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
