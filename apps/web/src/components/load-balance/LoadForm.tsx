import React, { useState } from 'react';
import type { Load, LoadType, StartMethod, CableType, InstalMethod, VoltageLevel } from '../../types';
import { useProjectStore } from '../../stores/projectStore';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { getConditionLabel, getLoadTypeLabel } from '../../utils/calculations';

interface LoadFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingLoad?: Load;
}

const LOAD_TYPES: { value: LoadType; label: string }[] = [
  { value: 'pump', label: '펌프 (Pump)' },
  { value: 'fan', label: '팬 (Fan)' },
  { value: 'compressor', label: '압축기 (Compressor)' },
  { value: 'motor', label: '전동기 (Motor)' },
  { value: 'heater', label: '히터 (Heater)' },
  { value: 'lighting', label: '조명 (Lighting)' },
  { value: 'transformer', label: '변압기 (Transformer)' },
  { value: 'converter', label: '변환기 (Converter)' },
  { value: 'ups', label: 'UPS' },
  { value: 'battery-charger', label: '충전기 (Battery Charger)' },
  { value: 'navigation', label: '항해장비 (Navigation)' },
  { value: 'communication', label: '통신장비 (Communication)' },
  { value: 'winch', label: '윈치 (Winch)' },
  { value: 'crane', label: '크레인 (Crane)' },
  { value: 'bow-thruster', label: '바우 스러스터 (Bow Thruster)' },
  { value: 'hvac', label: '공조 (HVAC)' },
  { value: 'galley', label: '조리실 (Galley)' },
  { value: 'other', label: '기타 (Other)' },
];

const MOTOR_TYPES: LoadType[] = ['pump', 'fan', 'compressor', 'motor', 'winch', 'crane', 'bow-thruster', 'hvac'];

export default function LoadForm({ isOpen, onClose, editingLoad }: LoadFormProps) {
  const { project, addLoad, updateLoad } = useProjectStore();
  const isEditing = !!editingLoad;

  const [name, setName] = useState(editingLoad?.name || '');
  const [type, setType] = useState<LoadType>(editingLoad?.type || 'pump');
  const [ratedPowerKW, setRatedPowerKW] = useState(editingLoad?.ratedPowerKW?.toString() || '15');
  const [ratedVoltage, setRatedVoltage] = useState<string>(editingLoad?.ratedVoltage?.toString() || '440');
  const [ratedPF, setRatedPF] = useState(editingLoad?.ratedPF?.toString() || '0.85');
  const [efficiency, setEfficiency] = useState(editingLoad?.efficiency?.toString() || '0.88');
  const [phase, setPhase] = useState<string>(editingLoad?.phase?.toString() || '3');
  const [connectedBusId, setConnectedBusId] = useState(editingLoad?.connectedBusId || project.buses[0]?.id || '');

  // Motor specific
  const [startMethod, setStartMethod] = useState<StartMethod>(editingLoad?.startMethod || 'DOL');
  const [startingCurrentMultiplier, setStartingCurrentMultiplier] = useState(editingLoad?.startingCurrentMultiplier?.toString() || '6');
  const [startDurationSec, setStartDurationSec] = useState(editingLoad?.startDurationSec?.toString() || '5');

  // Load factors
  const defaultFactors = editingLoad?.loadFactors || project.activeConditions.map(c => ({ condition: c, factor: 0 }));
  const [loadFactors, setLoadFactors] = useState<Record<string, number>>(
    Object.fromEntries(defaultFactors.map(f => [f.condition, f.factor]))
  );
  const [diversityFactor, setDiversityFactor] = useState(editingLoad?.diversityFactor?.toString() || '1.0');

  // Emergency
  const [isEssential, setIsEssential] = useState(editingLoad?.isEssential ?? false);
  const [isEmergency, setIsEmergency] = useState(editingLoad?.isEmergency ?? false);

  // Cable
  const [cableLengthM, setCableLengthM] = useState(editingLoad?.cableLengthM?.toString() || '30');
  const [cableType, setCableType] = useState<CableType>(editingLoad?.cableType || 'XLPE');
  const [installMethod, setInstallMethod] = useState<InstalMethod>(editingLoad?.installMethod || 'cable-tray');

  // Misc
  const [quantity, setQuantity] = useState(editingLoad?.quantity?.toString() || '1');
  const [description, setDescription] = useState(editingLoad?.description || '');

  const isMotor = MOTOR_TYPES.includes(type);

  const handleFactorChange = (condition: string, value: number) => {
    setLoadFactors(prev => ({ ...prev, [condition]: Math.min(1, Math.max(0, value)) }));
  };

  const handleSubmit = () => {
    const load: Omit<Load, 'id'> = {
      name: name || `Load ${project.loads.length + 1}`,
      type,
      ratedPowerKW: Number(ratedPowerKW) || 15,
      ratedVoltage: Number(ratedVoltage) as VoltageLevel,
      ratedPF: Number(ratedPF) || 0.85,
      efficiency: Number(efficiency) || 0.88,
      phase: Number(phase) as 1 | 3,
      connectedBusId,
      startMethod: isMotor ? startMethod : undefined,
      startingCurrentMultiplier: isMotor ? Number(startingCurrentMultiplier) || 6 : undefined,
      startDurationSec: isMotor ? Number(startDurationSec) || 5 : undefined,
      loadFactors: project.activeConditions.map(c => ({
        condition: c,
        factor: loadFactors[c] ?? 0,
      })),
      diversityFactor: Number(diversityFactor) || 1.0,
      isEssential,
      isEmergency,
      cableLengthM: Number(cableLengthM) || 30,
      cableType,
      installMethod,
      quantity: Number(quantity) || 1,
      description,
    };

    if (isEditing && editingLoad) {
      updateLoad(editingLoad.id, load);
    } else {
      addLoad(load);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '부하 편집 (Edit Load)' : '부하 추가 (Add Load)'} size="xl">
      <div className="space-y-5">
        {/* Basic Info */}
        <section>
          <h3 className="text-sm font-medium text-gray-300 mb-3">기본 정보 (Basic Info)</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input label="이름 (Name)" value={name} onChange={setName} placeholder="LO Pump" className="col-span-2" />
            <Input label="수량 (Qty)" type="number" value={quantity} onChange={setQuantity} min={1} />
            <Select label="유형 (Type)" options={LOAD_TYPES} value={type} onChange={(v) => setType(v as LoadType)} />
            <Input label="정격 출력 (Rated Power)" unit="kW" type="number" value={ratedPowerKW} onChange={setRatedPowerKW} min={0} />
            <Select
              label="전압 (Voltage)"
              options={[
                { value: '440', label: '440V' }, { value: '450', label: '450V' },
                { value: '480', label: '480V' }, { value: '690', label: '690V' },
                { value: '220', label: '220V' },
              ]}
              value={ratedVoltage}
              onChange={setRatedVoltage}
            />
            <Input label="역률 (PF)" type="number" value={ratedPF} onChange={setRatedPF} min={0} max={1} step={0.01} />
            <Input label="효율 (Efficiency)" type="number" value={efficiency} onChange={setEfficiency} min={0} max={1} step={0.01} />
            <Select
              label="상 (Phase)"
              options={[{ value: '3', label: '3상 (3P)' }, { value: '1', label: '1상 (1P)' }]}
              value={phase}
              onChange={setPhase}
            />
            <Select
              label="연결 모선 (Bus)"
              options={project.buses.map(b => ({ value: b.id, label: b.name }))}
              value={connectedBusId}
              onChange={setConnectedBusId}
            />
          </div>
        </section>

        {/* Motor Starting (conditional) */}
        {isMotor && (
          <section className="border-t border-navy-600 pt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">기동 정보 (Starting Info)</h3>
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="기동 방식 (Start Method)"
                options={[
                  { value: 'DOL', label: 'DOL (직입)' },
                  { value: 'star-delta', label: 'Y-D (스타-델타)' },
                  { value: 'soft-starter', label: '소프트 스타터' },
                  { value: 'VFD', label: 'VFD (인버터)' },
                  { value: 'auto-transformer', label: '오토트랜스' },
                ]}
                value={startMethod}
                onChange={(v) => setStartMethod(v as StartMethod)}
              />
              <Input
                label="기동 전류 배수 (Start I mult.)"
                unit="x"
                type="number"
                value={startingCurrentMultiplier}
                onChange={setStartingCurrentMultiplier}
                min={1}
                max={10}
                step={0.1}
              />
              <Input
                label="기동 시간 (Start Duration)"
                unit="sec"
                type="number"
                value={startDurationSec}
                onChange={setStartDurationSec}
                min={0}
              />
            </div>
          </section>
        )}

        {/* Load Factors per Operating Condition */}
        <section className="border-t border-navy-600 pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">운전 조건별 부하율 (Load Factors)</h3>
          <div className="grid grid-cols-2 gap-3">
            {project.activeConditions.map(cond => (
              <div key={cond} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-24 truncate">{getConditionLabel(cond).split('(')[0].trim()}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={loadFactors[cond] ?? 0}
                  onChange={(e) => handleFactorChange(cond, Number(e.target.value))}
                  className="flex-1 accent-accent h-1"
                />
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={loadFactors[cond] ?? 0}
                  onChange={(e) => handleFactorChange(cond, Number(e.target.value))}
                  className="w-16 bg-navy-800 border border-navy-600 rounded px-2 py-1 text-xs text-gray-300 font-mono text-center"
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Input label="다양성 계수 (Diversity Factor)" type="number" value={diversityFactor} onChange={setDiversityFactor} min={0} max={1} step={0.05} />
          </div>
        </section>

        {/* Emergency / Essential */}
        <section className="border-t border-navy-600 pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">비상 설정 (Emergency)</h3>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEssential}
                onChange={(e) => setIsEssential(e.target.checked)}
                className="w-4 h-4 rounded bg-navy-800 border-navy-600 text-accent accent-accent"
              />
              <span className="text-sm text-gray-300">필수 장비 (Essential)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 rounded bg-navy-800 border-navy-600 text-accent accent-accent"
              />
              <span className="text-sm text-gray-300">비상 모선 연결 (Emergency Bus)</span>
            </label>
          </div>
        </section>

        {/* Cable Info */}
        <section className="border-t border-navy-600 pt-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">케이블 정보 (Cable Info)</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input label="길이 (Length)" unit="m" type="number" value={cableLengthM} onChange={setCableLengthM} min={0} />
            <Select
              label="케이블 종류 (Cable Type)"
              options={[
                { value: 'XLPE', label: 'XLPE' },
                { value: 'EPR', label: 'EPR' },
                { value: 'PVC', label: 'PVC' },
                { value: 'TPYC', label: 'TPYC' },
                { value: 'DPYC', label: 'DPYC' },
              ]}
              value={cableType}
              onChange={(v) => setCableType(v as CableType)}
            />
            <Select
              label="포설 방법 (Install Method)"
              options={[
                { value: 'cable-tray', label: '케이블 트레이' },
                { value: 'conduit', label: '전선관' },
                { value: 'free-air', label: '자유 공기중' },
                { value: 'bunched', label: '다발' },
              ]}
              value={installMethod}
              onChange={(v) => setInstallMethod(v as InstalMethod)}
            />
          </div>
        </section>

        {/* Description */}
        <section className="border-t border-navy-600 pt-4">
          <Input label="설명 (Description)" value={description} onChange={setDescription} placeholder="추가 설명..." />
        </section>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-navy-600">
        <Button variant="secondary" onClick={onClose}>취소 (Cancel)</Button>
        <Button variant="primary" onClick={handleSubmit}>
          {isEditing ? '수정 (Update)' : '추가 (Add)'}
        </Button>
      </div>
    </Modal>
  );
}
