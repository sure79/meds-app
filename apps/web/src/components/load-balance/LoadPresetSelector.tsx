import React, { useState, useMemo } from 'react';
import { COMMON_MARINE_LOADS, VESSEL_PRESETS, type LoadPreset } from '../../data/loadPresets';
import { useProjectStore } from '../../stores/projectStore';
import type { Load, VoltageLevel } from '../../types';
import { getLoadTypeLabel } from '../../utils/calculations';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Tabs from '../common/Tabs';
import { Package, Ship } from 'lucide-react';

interface LoadPresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  { id: 'emergency', label: '비상부하', labelEn: 'Emergency Loads', types: [] },
];

function categorizePreset(preset: LoadPreset): string {
  if (preset.isEssential && preset.defaultFactors['emergency']) return 'emergency';
  for (const cat of LOAD_CATEGORIES) {
    if (cat.id === 'emergency') continue;
    if (cat.types.includes(preset.type)) return cat.id;
  }
  return 'service';
}

export default function LoadPresetSelector({ isOpen, onClose }: LoadPresetSelectorProps) {
  const { project, addLoad } = useProjectStore();
  const [activeTab, setActiveTab] = useState<string>('equipment');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tabs = [
    { id: 'equipment', label: '장비 선택 (Equipment)', icon: <Package className="w-4 h-4" /> },
    { id: 'vessel', label: '선종 프리셋 (Vessel Preset)', icon: <Ship className="w-4 h-4" /> },
  ];

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

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(COMMON_MARINE_LOADS.map(l => l.name)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const createLoadFromPreset = (preset: LoadPreset): Omit<Load, 'id'> => {
    const mainBuses = project.buses.filter(b => b.type === 'main');
    const esbBus = project.buses.find(b => b.type === 'emergency');
    const isEmergencyLoad = preset.isEssential && esbBus && preset.defaultFactors['emergency'];

    let connectedBusId = '';
    if (isEmergencyLoad && esbBus) {
      connectedBusId = esbBus.id;
    } else if (mainBuses.length > 0) {
      connectedBusId = mainBuses[Math.floor(Math.random() * mainBuses.length)].id;
    } else if (project.buses.length > 0) {
      connectedBusId = project.buses[0].id;
    }

    return {
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
    };
  };

  const handleAddSelected = () => {
    for (const name of selected) {
      const preset = COMMON_MARINE_LOADS.find(l => l.name === name);
      if (preset) {
        // Skip if already exists
        if (project.loads.some(l => l.name === name)) continue;
        addLoad(createLoadFromPreset(preset));
      }
    }
    onClose();
  };

  const handleApplyVesselPreset = (presetIndex: number) => {
    const preset = VESSEL_PRESETS[presetIndex];
    if (!preset) return;
    for (const loadName of preset.loadNames) {
      const loadPreset = COMMON_MARINE_LOADS.find(l => l.name === loadName);
      if (loadPreset) {
        if (project.loads.some(l => l.name === loadName)) continue;
        addLoad(createLoadFromPreset(loadPreset));
      }
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프리셋 장비 추가 (Add Preset Equipment)" size="xl">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'equipment' && (
        <div className="mt-4">
          <div className="flex gap-2 mb-3">
            <Button variant="secondary" size="sm" onClick={selectAll}>전체 선택</Button>
            <Button variant="secondary" size="sm" onClick={clearAll}>전체 해제</Button>
            <span className="text-xs text-gray-500 self-center ml-2">
              {selected.size}개 선택됨 ({selected.size} selected)
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1">
            {LOAD_CATEGORIES.map(cat => {
              const presets = groupedPresets[cat.id] || [];
              if (presets.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sticky top-0 bg-navy-800 py-1 z-10">
                    {cat.label} ({cat.labelEn})
                  </h4>
                  <div className="space-y-1">
                    {presets.map((preset) => (
                      <label
                        key={preset.name}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors
                          ${selected.has(preset.name) ? 'bg-navy-600' : 'hover:bg-navy-700/50'}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(preset.name)}
                          onChange={() => toggleSelect(preset.name)}
                          className="w-4 h-4 rounded bg-navy-800 border-navy-600 accent-accent"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-300 truncate">{preset.name}</div>
                          <div className="text-[10px] text-gray-500">{preset.description}</div>
                        </div>
                        <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                          {preset.ratedPowerKW} kW
                        </span>
                        <span className="text-[10px] text-gray-500 flex-shrink-0 w-12 text-right">
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
            <Button variant="secondary" onClick={onClose}>취소</Button>
            <Button variant="primary" onClick={handleAddSelected} disabled={selected.size === 0}>
              {selected.size}개 추가 (Add {selected.size})
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'vessel' && (
        <div className="mt-4 space-y-3">
          {VESSEL_PRESETS.map((preset, idx) => (
            <div key={idx} className="bg-navy-700 rounded-lg p-4 border border-navy-600">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-200">{preset.name}</h4>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => handleApplyVesselPreset(idx)}>
                  적용 (Apply)
                </Button>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>
                  부하 {preset.loadNames.length}개 포함 (자동 발전기 추천은 Step 3에서)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
