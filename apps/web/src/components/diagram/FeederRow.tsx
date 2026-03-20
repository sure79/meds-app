import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import type { PanelFeeder, Load } from '../../types';

// ============================================================
// FeederRow - Single feeder row in the panel detail page
// Inline-editable fields matching EB-503 engineering drawing style
// ============================================================

const PROTECTION_OPTIONS = ['SHT', 'ES1', 'ES2', 'ES3', 'PT1', 'PT2', 'CT', 'UVP', 'UVR', 'RHM'];

const MCCB_FRAME_SIZES = [16, 25, 32, 50, 63, 100, 125, 160, 200, 250, 400, 630, 800, 1000, 1250, 1600];

const CABLE_TYPES = [
  'T2', 'T3.5', 'T6', 'T10', 'T16', 'T25', 'T35', 'T50', 'T70', 'T95', 'T120', 'T150', 'T185', 'T240',
  'TY2', 'TY3.5', 'TY6', 'TY10', 'TY16', 'TY25', 'TY35', 'TY50', 'TY70', 'TY95', 'TY120', 'TY150',
];

interface FeederRowProps {
  feeder: PanelFeeder;
  index: number;
  editMode: boolean;
  onRemove: () => void;
}

function isMotorType(type: string): boolean {
  return ['pump', 'fan', 'compressor', 'motor', 'winch', 'crane', 'bow-thruster', 'hvac'].includes(type);
}

export default function FeederRow({ feeder, index, editMode, onRemove }: FeederRowProps) {
  const { updateFeeder, project } = useProjectStore();

  // Find the destination load for display
  const destLoad: Load | undefined = feeder.destinationId
    ? project.loads.find(l => l.id === feeder.destinationId)
    : undefined;

  const ratedCurrentA = destLoad ? calculateCurrent(destLoad) : 0;
  const powerKW = destLoad?.ratedPowerKW || 0;
  const loadType = destLoad?.type || '';
  const isMotor = isMotorType(loadType);
  const startMethod = destLoad?.startMethod || '';

  // Inline edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  const startEdit = (field: string, currentValue: string) => {
    if (!editMode) return;
    setEditingField(field);
    setEditValue(currentValue);
  };

  const commitEdit = (field: string, value: string) => {
    setEditingField(null);
    switch (field) {
      case 'mccbFrameA':
        updateFeeder(feeder.id, { mccbFrameA: parseInt(value) || feeder.mccbFrameA });
        break;
      case 'mccbTripA':
        updateFeeder(feeder.id, { mccbTripA: parseInt(value) || feeder.mccbTripA });
        break;
      case 'mccbType':
        updateFeeder(feeder.id, { mccbType: value as PanelFeeder['mccbType'] });
        break;
      case 'cableType':
        updateFeeder(feeder.id, { cableType: value });
        break;
      case 'cableCircuitNo':
        updateFeeder(feeder.id, { cableCircuitNo: value });
        break;
      case 'destinationLabel':
        updateFeeder(feeder.id, { destinationLabel: value });
        break;
      case 'destinationId': {
        const load = project.loads.find(l => l.id === value);
        if (load) {
          updateFeeder(feeder.id, {
            destinationId: value,
            destinationLabel: load.name,
            destinationType: 'load',
          });
        }
        break;
      }
      case 'remarks':
        updateFeeder(feeder.id, { remarks: value });
        break;
    }
  };

  const toggleInstantTrip = () => {
    if (!editMode) return;
    updateFeeder(feeder.id, { instantTrip: !feeder.instantTrip });
  };

  const toggleProtection = (label: string) => {
    if (!editMode) return;
    const current = feeder.protectionLabels;
    const next = current.includes(label)
      ? current.filter(p => p !== label)
      : [...current, label];
    updateFeeder(feeder.id, { protectionLabels: next });
  };

  // Popover for protection labels
  const [showProtPopover, setShowProtPopover] = useState(false);

  const renderEditableCell = (
    field: string,
    displayValue: string,
    width: string,
    options?: string[]
  ) => {
    if (editingField === field) {
      if (options) {
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => {
              commitEdit(field, e.target.value);
            }}
            onBlur={() => setEditingField(null)}
            className="bg-yellow-50 border border-yellow-400 text-black text-[10px] font-mono px-1 py-0 outline-none"
            style={{ width }}
          >
            {options.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        );
      }
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit(field, editValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit(field, editValue);
            if (e.key === 'Escape') setEditingField(null);
          }}
          className="bg-yellow-50 border border-yellow-400 text-black text-[10px] font-mono px-1 py-0 outline-none"
          style={{ width }}
        />
      );
    }

    return (
      <span
        className={`text-[10px] font-mono text-black ${editMode ? 'cursor-pointer hover:bg-yellow-100 hover:outline hover:outline-1 hover:outline-yellow-400 px-1' : 'px-1'}`}
        onClick={() => startEdit(field, displayValue)}
        style={{ minWidth: width, display: 'inline-block' }}
      >
        {displayValue || '\u00A0'}
      </span>
    );
  };

  // Build the MCCB display string: "100/15A" or "250/INST"
  const mccbDisplay = feeder.instantTrip
    ? `${feeder.mccbFrameA}/INST`
    : `${feeder.mccbFrameA}/${feeder.mccbTripA}A`;

  // Protection labels display
  const protDisplay = feeder.protectionLabels.length > 0
    ? feeder.protectionLabels.join(', ')
    : '-';

  // Motor/load symbol
  const renderLoadSymbol = () => {
    if (feeder.destinationType === 'spare') {
      return (
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-gray-500 italic">SPARE</span>
        </div>
      );
    }

    if (feeder.destinationType === 'transformer') {
      return (
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            <div
              className="border-2 border-black rounded-full flex items-center justify-center"
              style={{ width: 18, height: 18 }}
            >
              <span className="text-[7px] font-bold">T</span>
            </div>
            <div
              className="border-2 border-black rounded-full flex items-center justify-center -ml-1"
              style={{ width: 18, height: 18 }}
            >
              <span className="text-[7px] font-bold">T</span>
            </div>
          </div>
        </div>
      );
    }

    if (isMotor) {
      return (
        <div className="flex items-center gap-2">
          <div
            className="border-2 border-black rounded-full flex items-center justify-center bg-white"
            style={{ width: 22, height: 22 }}
          >
            <span className="text-[8px] font-bold font-mono">M</span>
          </div>
          <div className="text-[9px] font-mono leading-tight">
            <div>{powerKW}kW</div>
            <div>{ratedCurrentA.toFixed(1)}A</div>
            {startMethod && <div className="text-gray-600">{startMethod}</div>}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div
          className="border-2 border-black flex items-center justify-center bg-white"
          style={{ width: 18, height: 18 }}
        >
          <span className="text-[7px] font-bold font-mono">L</span>
        </div>
        <div className="text-[9px] font-mono leading-tight">
          <div>{powerKW}kW</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center border-b border-gray-300 py-1.5 group relative">
      {/* Feeder number */}
      <div className="w-6 text-[9px] font-mono text-gray-500 text-center flex-shrink-0">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Horizontal line from bus */}
      <div className="w-3 border-t-2 border-black flex-shrink-0" />

      {/* MCCB Symbol */}
      <div className="flex items-center gap-1 flex-shrink-0" style={{ width: 90 }}>
        <div className="flex flex-col items-center">
          <div
            className={`border border-black bg-white px-1 py-0.5 text-[9px] font-mono font-bold ${editMode ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
            onClick={() => {
              if (!editMode) return;
              startEdit('mccbFrameA', String(feeder.mccbFrameA));
            }}
          >
            {mccbDisplay}
          </div>
          {editingField === 'mccbFrameA' && (
            <div className="absolute z-20 bg-white border border-gray-400 shadow-lg p-2 mt-6">
              <div className="text-[9px] font-mono mb-1 text-gray-500">FRAME (A):</div>
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                value={editValue}
                onChange={(e) => {
                  updateFeeder(feeder.id, { mccbFrameA: parseInt(e.target.value) });
                  setEditingField(null);
                }}
                onBlur={() => setEditingField(null)}
                className="text-[10px] font-mono border border-gray-300 p-0.5"
              >
                {MCCB_FRAME_SIZES.map(s => (
                  <option key={s} value={s}>{s}A</option>
                ))}
              </select>
              <div className="text-[9px] font-mono mt-1 mb-0.5 text-gray-500">TRIP (A):</div>
              <input
                type="number"
                defaultValue={feeder.mccbTripA}
                onBlur={(e) => {
                  updateFeeder(feeder.id, { mccbTripA: parseInt(e.target.value) || feeder.mccbTripA });
                }}
                className="text-[10px] font-mono border border-gray-300 p-0.5 w-16"
              />
              <div className="mt-1">
                <label className="flex items-center gap-1 text-[9px] font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feeder.instantTrip}
                    onChange={toggleInstantTrip}
                    className="w-3 h-3"
                  />
                  INST
                </label>
              </div>
            </div>
          )}
        </div>
        {feeder.mccbType !== 'MCCB' && (
          <span className="text-[8px] font-mono text-gray-500">
            ({feeder.mccbType})
          </span>
        )}
      </div>

      {/* Protection labels */}
      <div className="flex-shrink-0 relative" style={{ width: 70 }}>
        <div
          className={`text-[8px] font-mono text-gray-600 ${editMode ? 'cursor-pointer hover:bg-yellow-50 px-1' : 'px-1'}`}
          onClick={() => {
            if (!editMode) return;
            setShowProtPopover(!showProtPopover);
          }}
        >
          {protDisplay}
        </div>
        {showProtPopover && editMode && (
          <div className="absolute z-20 bg-white border border-gray-400 shadow-lg p-2 mt-1 left-0">
            <div className="text-[9px] font-mono mb-1 text-gray-500">PROTECTION:</div>
            <div className="grid grid-cols-2 gap-1">
              {PROTECTION_OPTIONS.map(opt => (
                <label key={opt} className="flex items-center gap-1 text-[9px] font-mono cursor-pointer hover:bg-gray-100 px-1">
                  <input
                    type="checkbox"
                    checked={feeder.protectionLabels.includes(opt)}
                    onChange={() => toggleProtection(opt)}
                    className="w-3 h-3"
                  />
                  {opt}
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowProtPopover(false)}
              className="mt-1 text-[9px] font-mono text-blue-600 hover:underline"
            >
              CLOSE
            </button>
          </div>
        )}
      </div>

      {/* Cable connector line */}
      <div className="flex items-center flex-shrink-0" style={{ width: 16 }}>
        <div className="w-full border-t border-black border-dashed" />
      </div>

      {/* Cable type */}
      <div className="flex-shrink-0" style={{ width: 50 }}>
        {renderEditableCell('cableType', feeder.cableType, '45px', CABLE_TYPES)}
      </div>

      {/* Circuit number */}
      <div className="flex-shrink-0" style={{ width: 30 }}>
        {renderEditableCell('cableCircuitNo', feeder.cableCircuitNo, '25px')}
      </div>

      {/* Connector line to destination */}
      <div className="flex items-center flex-shrink-0" style={{ width: 16 }}>
        <div className="w-full border-t border-black" />
        <div className="w-0 h-0 border-l-[4px] border-l-black border-y-[3px] border-y-transparent flex-shrink-0" />
      </div>

      {/* Load symbol */}
      <div className="flex-shrink-0" style={{ width: 80 }}>
        {renderLoadSymbol()}
      </div>

      {/* Destination label */}
      <div className="flex-1 min-w-0">
        {editingField === 'destinationId' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={feeder.destinationId || ''}
            onChange={(e) => commitEdit('destinationId', e.target.value)}
            onBlur={() => setEditingField(null)}
            className="text-[10px] font-mono border border-yellow-400 bg-yellow-50 p-0.5 w-full"
          >
            <option value="">-- SELECT --</option>
            {project.loads.map(l => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.ratedPowerKW}kW)
              </option>
            ))}
            <option value="__spare">SPARE</option>
          </select>
        ) : (
          <span
            className={`text-[10px] font-mono font-bold text-black truncate block ${editMode ? 'cursor-pointer hover:bg-yellow-100 hover:outline hover:outline-1 hover:outline-yellow-400 px-1' : 'px-1'}`}
            onClick={() => {
              if (!editMode) return;
              setEditingField('destinationId');
              setEditValue(feeder.destinationId || '');
            }}
            title={feeder.destinationLabel}
          >
            {feeder.destinationLabel || 'UNASSIGNED'}
          </span>
        )}
      </div>

      {/* Delete button */}
      {editMode && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          title="피더 삭제 (Remove Feeder)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function calculateCurrent(load: Load): number {
  const kW = load.ratedPowerKW;
  const v = load.ratedVoltage;
  const pf = load.ratedPF;
  const eff = load.efficiency;
  if (load.phase === 3) {
    return (kW * 1000) / (Math.sqrt(3) * v * pf * eff);
  }
  return (kW * 1000) / (v * pf * eff);
}
