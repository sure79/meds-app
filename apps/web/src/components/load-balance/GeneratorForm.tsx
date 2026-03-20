import React, { useState } from 'react';
import type { Generator, GeneratorType, VoltageLevel, Frequency } from '../../types';
import { useProjectStore } from '../../stores/projectStore';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

interface GeneratorFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingGenerator?: Generator;
}

export default function GeneratorForm({ isOpen, onClose, editingGenerator }: GeneratorFormProps) {
  const { project, addGenerator, updateGenerator } = useProjectStore();
  const isEditing = !!editingGenerator;

  const [name, setName] = useState(editingGenerator?.name || '');
  const [type, setType] = useState<GeneratorType>(editingGenerator?.type || 'diesel');
  const [ratedPowerKW, setRatedPowerKW] = useState(editingGenerator?.ratedPowerKW?.toString() || '500');
  const [ratedVoltage, setRatedVoltage] = useState<string>(editingGenerator?.ratedVoltage?.toString() || '440');
  const [ratedPF, setRatedPF] = useState(editingGenerator?.ratedPF?.toString() || '0.8');
  const [frequency, setFrequency] = useState<string>(editingGenerator?.frequency?.toString() || '60');
  const [xdPercent, setXdPercent] = useState(editingGenerator?.xdPercent?.toString() || '12');
  const [xdPrimePercent, setXdPrimePercent] = useState(editingGenerator?.xdPrimePercent?.toString() || '18');
  const [xdDoublePrimePercent, setXdDoublePrimePercent] = useState(editingGenerator?.xdDoublePrimePercent?.toString() || '25');
  const [connectedBusId, setConnectedBusId] = useState(editingGenerator?.connectedBusId || project.buses[0]?.id || '');
  const [rpm, setRpm] = useState(editingGenerator?.rpm?.toString() || '1800');
  const [efficiency, setEfficiency] = useState(editingGenerator?.efficiency?.toString() || '0.95');

  const handleSubmit = () => {
    const gen: Omit<Generator, 'id'> = {
      name: name || `Generator ${project.generators.length + 1}`,
      type,
      ratedPowerKW: Number(ratedPowerKW) || 500,
      ratedVoltage: Number(ratedVoltage) as VoltageLevel,
      ratedPF: Number(ratedPF) || 0.8,
      frequency: Number(frequency) as Frequency,
      phase: 3,
      xdPercent: Number(xdPercent) || 12,
      xdPrimePercent: Number(xdPrimePercent) || 18,
      xdDoublePrimePercent: Number(xdDoublePrimePercent) || 25,
      connectedBusId,
      isAvailable: true,
      rpm: Number(rpm) || 1800,
      efficiency: Number(efficiency) || 0.95,
    };

    if (isEditing && editingGenerator) {
      updateGenerator(editingGenerator.id, gen);
    } else {
      addGenerator(gen);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '발전기 편집 (Edit Generator)' : '발전기 추가 (Add Generator)'} size="lg">
      <div className="grid grid-cols-2 gap-4">
        <Input label="이름 (Name)" value={name} onChange={setName} placeholder="DG1" className="col-span-2" />

        <Select
          label="유형 (Type)"
          options={[
            { value: 'diesel', label: '디젤 (Diesel)' },
            { value: 'shaft', label: '축발전기 (Shaft)' },
            { value: 'turbine', label: '터빈 (Turbine)' },
            { value: 'emergency', label: '비상 (Emergency)' },
            { value: 'shore', label: '육전 (Shore)' },
          ]}
          value={type}
          onChange={(v) => setType(v as GeneratorType)}
        />

        <Input label="정격 출력 (Rated Power)" unit="kW" type="number" value={ratedPowerKW} onChange={setRatedPowerKW} min={0} />

        <Select
          label="정격 전압 (Rated Voltage)"
          options={[
            { value: '440', label: '440V' },
            { value: '450', label: '450V' },
            { value: '480', label: '480V' },
            { value: '690', label: '690V' },
            { value: '3300', label: '3300V' },
            { value: '6600', label: '6600V' },
            { value: '11000', label: '11000V' },
          ]}
          value={ratedVoltage}
          onChange={setRatedVoltage}
        />

        <Input label="역률 (Power Factor)" type="number" value={ratedPF} onChange={setRatedPF} min={0} max={1} step={0.01} />

        <Select
          label="주파수 (Frequency)"
          options={[
            { value: '60', label: '60 Hz' },
            { value: '50', label: '50 Hz' },
          ]}
          value={frequency}
          onChange={setFrequency}
        />

        <Input label="RPM" type="number" value={rpm} onChange={setRpm} unit="rpm" />

        <Input label="효율 (Efficiency)" type="number" value={efficiency} onChange={setEfficiency} min={0} max={1} step={0.01} />

        <div className="col-span-2 border-t border-navy-600 pt-3 mt-1">
          <h3 className="text-sm font-medium text-gray-300 mb-3">리액턴스 (Reactances)</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Xd'' (Sub-transient)" unit="%" type="number" value={xdPercent} onChange={setXdPercent} min={0} step={0.1} />
            <Input label="Xd' (Transient)" unit="%" type="number" value={xdPrimePercent} onChange={setXdPrimePercent} min={0} step={0.1} />
            <Input label="Xd (Synchronous)" unit="%" type="number" value={xdDoublePrimePercent} onChange={setXdDoublePrimePercent} min={0} step={0.1} />
          </div>
        </div>

        <Select
          label="연결 모선 (Connected Bus)"
          options={project.buses.map(b => ({ value: b.id, label: b.name }))}
          value={connectedBusId}
          onChange={setConnectedBusId}
          className="col-span-2"
        />
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
