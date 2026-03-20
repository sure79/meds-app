import React, { useState, useCallback } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import TitleBlock from './titleBlock';
import type { Bus, Generator, Load, BusTie, Project } from '../../types';

// ============================================================
// KeyDiagram - Overall power distribution diagram (HTML/CSS)
// Matches EB-503 KEY DIAGRAM (총괄 계통도) style
// NO SVG - all HTML divs with CSS borders and flexbox
// ============================================================

interface KeyDiagramProps {
  editMode: boolean;
  totalPages: number;
  onSelectBus: (busId: string) => void;
}

interface EditPopoverState {
  type: 'generator' | 'bus' | 'load' | 'busTie' | null;
  id: string | null;
  x: number;
  y: number;
}

export default function KeyDiagram({ editMode, totalPages, onSelectBus }: KeyDiagramProps) {
  const { project, updateGenerator, updateBus, updateLoad, updateBusTie } = useProjectStore();
  const [popover, setPopover] = useState<EditPopoverState>({ type: null, id: null, x: 0, y: 0 });

  const mainBuses = project.buses.filter(b => b.type === 'main' || b.type === 'section');
  const emergencyBuses = project.buses.filter(b => b.type === 'emergency');
  const allBuses = [...mainBuses, ...emergencyBuses];

  const handleElementClick = useCallback((e: React.MouseEvent, type: EditPopoverState['type'], id: string) => {
    if (!editMode) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({ type, id, x: rect.left, y: rect.bottom + 4 });
  }, [editMode]);

  const closePopover = useCallback(() => {
    setPopover({ type: null, id: null, x: 0, y: 0 });
  }, []);

  // Group buses into pairs for bus-tie connections
  const busPairs: { busA: Bus; busB: Bus; busTie?: BusTie }[] = [];
  for (const bt of project.busTies) {
    const busA = project.buses.find(b => b.id === bt.busAId);
    const busB = project.buses.find(b => b.id === bt.busBId);
    if (busA && busB) {
      busPairs.push({ busA, busB, busTie: bt });
    }
  }

  // All buses that are connected via bus-ties (used buses)
  const tiedBusIds = new Set(busPairs.flatMap(p => [p.busA.id, p.busB.id]));
  const standaloneBuses = allBuses.filter(b => !tiedBusIds.has(b.id));

  return (
    <div
      className="bg-white text-black font-mono uppercase print:break-after-page relative"
      style={{
        width: 1120,
        minHeight: 790,
        border: '2px solid black',
      }}
    >
      {/* Inner margin */}
      <div style={{ margin: 10, border: '0.5px solid black', minHeight: 770, position: 'relative' }}>
        {/* Title block (top right) */}
        <div className="absolute top-2 right-2 z-10">
          <TitleBlock
            pageNumber={1}
            totalPages={totalPages}
            drawingNumber="EB-503"
            projectName={project.meta.projectNumber}
            vesselName={project.meta.vesselName}
            drawingTitle="KEY DIAGRAM (총괄 계통도)"
            designer={project.meta.designer}
            date={project.meta.date}
            revision={project.meta.revision}
            classSociety={project.meta.classSociety}
          />
        </div>

        {/* Page title */}
        <div className="px-6 pt-4 pb-2">
          <div className="text-[14px] font-bold tracking-wide">
            KEY DIAGRAM - SINGLE LINE DIAGRAM
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {project.meta.vesselName} | {project.systemVoltage}V {project.systemPhase}PH {project.systemFrequency}Hz
          </div>
        </div>

        {/* Main diagram area */}
        <div className="px-6 pt-4">
          {/* Render bus-tie connected pairs */}
          {busPairs.map((pair, pairIdx) => (
            <BusPairSection
              key={pairIdx}
              busA={pair.busA}
              busB={pair.busB}
              busTie={pair.busTie}
              project={project}
              editMode={editMode}
              onElementClick={handleElementClick}
              onSelectBus={onSelectBus}
            />
          ))}

          {/* Render standalone buses */}
          {standaloneBuses.map(bus => (
            <StandaloneBusSection
              key={bus.id}
              bus={bus}
              project={project}
              editMode={editMode}
              onElementClick={handleElementClick}
              onSelectBus={onSelectBus}
            />
          ))}

          {/* Shore connection + Battery section */}
          <div className="flex items-start gap-16 mt-8 px-4">
            {/* Shore Connection */}
            {project.generators.filter(g => g.type === 'shore').length > 0 && (
              <div className="flex flex-col items-center">
                <div className="text-[9px] text-gray-500 mb-1">SHORE CONN.</div>
                <div
                  className="border-2 border-black rounded-full flex items-center justify-center bg-white"
                  style={{ width: 40, height: 40 }}
                >
                  <span className="text-[10px] font-bold">S</span>
                </div>
                {project.generators.filter(g => g.type === 'shore').map(g => (
                  <div key={g.id} className="text-[9px] mt-1 text-center leading-tight">
                    <div>{g.ratedPowerKW}KW</div>
                    <div>{g.ratedVoltage}V</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-4">
          <div className="flex items-center gap-6 text-[8px] text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-6 border-t-[3px] border-black" />
              <span>BUS-BAR</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="border-2 border-black rounded-full" style={{ width: 12, height: 12 }} />
              <span>GENERATOR</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="border border-black" style={{ width: 10, height: 10 }} />
              <span>MCCB/ACB</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="border border-dashed border-gray-500" style={{ width: 12, height: 10 }} />
              <span>PANEL/GROUP</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 border-t border-black border-dashed" />
              <span>CABLE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit popover overlay */}
      {popover.type && <EditPopover state={popover} onClose={closePopover} />}
    </div>
  );
}

// ============================================================
// Bus Pair Section (two buses connected by a bus-tie)
// ============================================================

interface BusPairSectionProps {
  busA: Bus;
  busB: Bus;
  busTie?: BusTie;
  project: Project;
  editMode: boolean;
  onElementClick: (e: React.MouseEvent, type: 'generator' | 'bus' | 'load' | 'busTie', id: string) => void;
  onSelectBus: (busId: string) => void;
}

function BusPairSection({ busA, busB, busTie, project, editMode, onElementClick, onSelectBus }: BusPairSectionProps) {
  const gensA = project.generators.filter(g => g.connectedBusId === busA.id);
  const gensB = project.generators.filter(g => g.connectedBusId === busB.id);
  const loadsA = project.loads.filter(l => l.connectedBusId === busA.id);
  const loadsB = project.loads.filter(l => l.connectedBusId === busB.id);

  const busALabel = busA.name.split('(')[0].trim();
  const busBLabel = busB.name.split('(')[0].trim();

  return (
    <div className="mb-8">
      {/* Bus bars and bus-tie in one row */}
      <div className="flex items-center">
        {/* Bus A */}
        <div className="flex-1">
          <BusBarLabel bus={busA} editMode={editMode} onElementClick={onElementClick} onSelectBus={onSelectBus} />
          {/* Bus bar line */}
          <div
            className={`border-t-[4px] border-black ${editMode ? 'cursor-pointer hover:border-blue-600' : ''}`}
            onClick={(e) => onElementClick(e, 'bus', busA.id)}
            onDoubleClick={() => onSelectBus(busA.id)}
          />
        </div>

        {/* Bus-Tie */}
        {busTie && (
          <div className="flex flex-col items-center px-2 flex-shrink-0" style={{ width: 60 }}>
            <div className="text-[8px] text-gray-500 mb-0.5">B/T</div>
            <div
              className={`border-2 ${busTie.isClosed ? 'border-black bg-white' : 'border-gray-400 bg-gray-200'} flex items-center justify-center ${editMode ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
              style={{ width: 28, height: 16 }}
              onClick={(e) => onElementClick(e, 'busTie', busTie.id)}
              title={busTie.isClosed ? 'CLOSED (투입)' : 'OPEN (개방)'}
            >
              <span className="text-[7px] font-bold">
                {busTie.isClosed ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="text-[7px] text-gray-500 mt-0.5">{busTie.name.split('(')[0].trim()}</div>
          </div>
        )}

        {/* Bus B */}
        <div className="flex-1">
          <BusBarLabel bus={busB} editMode={editMode} onElementClick={onElementClick} onSelectBus={onSelectBus} />
          <div
            className={`border-t-[4px] border-black ${editMode ? 'cursor-pointer hover:border-blue-600' : ''}`}
            onClick={(e) => onElementClick(e, 'bus', busB.id)}
            onDoubleClick={() => onSelectBus(busB.id)}
          />
        </div>
      </div>

      {/* Feeders and generators below */}
      <div className="flex">
        {/* Bus A feeders */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-0">
            {/* Generators */}
            {gensA.map(gen => (
              <GeneratorElement
                key={gen.id}
                gen={gen}
                editMode={editMode}
                onClick={(e) => onElementClick(e, 'generator', gen.id)}
              />
            ))}
            {/* Load feeders (grouped) */}
            {loadsA.length > 0 && (
              <FeederGroupElement
                loads={loadsA}
                busId={busA.id}
                editMode={editMode}
                onSelectBus={onSelectBus}
              />
            )}
          </div>
        </div>

        {/* Spacer for bus-tie */}
        {busTie && <div style={{ width: 60 }} className="flex-shrink-0" />}

        {/* Bus B feeders */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-0">
            {gensB.map(gen => (
              <GeneratorElement
                key={gen.id}
                gen={gen}
                editMode={editMode}
                onClick={(e) => onElementClick(e, 'generator', gen.id)}
              />
            ))}
            {loadsB.length > 0 && (
              <FeederGroupElement
                loads={loadsB}
                busId={busB.id}
                editMode={editMode}
                onSelectBus={onSelectBus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Standalone Bus Section (no bus-tie)
// ============================================================

interface StandaloneBusSectionProps {
  bus: Bus;
  project: Project;
  editMode: boolean;
  onElementClick: (e: React.MouseEvent, type: 'generator' | 'bus' | 'load' | 'busTie', id: string) => void;
  onSelectBus: (busId: string) => void;
}

function StandaloneBusSection({ bus, project, editMode, onElementClick, onSelectBus }: StandaloneBusSectionProps) {
  const gens = project.generators.filter(g => g.connectedBusId === bus.id);
  const loads = project.loads.filter(l => l.connectedBusId === bus.id);

  return (
    <div className="mb-8">
      <BusBarLabel bus={bus} editMode={editMode} onElementClick={onElementClick} onSelectBus={onSelectBus} />
      <div
        className={`border-t-[4px] border-black ${editMode ? 'cursor-pointer hover:border-blue-600' : ''}`}
        style={{ width: '60%' }}
        onClick={(e) => onElementClick(e, 'bus', bus.id)}
        onDoubleClick={() => onSelectBus(bus.id)}
      />
      <div className="flex flex-wrap gap-0">
        {gens.map(gen => (
          <GeneratorElement
            key={gen.id}
            gen={gen}
            editMode={editMode}
            onClick={(e) => onElementClick(e, 'generator', gen.id)}
          />
        ))}
        {loads.length > 0 && (
          <FeederGroupElement
            loads={loads}
            busId={bus.id}
            editMode={editMode}
            onSelectBus={onSelectBus}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function BusBarLabel({
  bus,
  editMode,
  onElementClick,
  onSelectBus,
}: {
  bus: Bus;
  editMode: boolean;
  onElementClick: (e: React.MouseEvent, type: 'bus', id: string) => void;
  onSelectBus: (busId: string) => void;
}) {
  const label = bus.name.split('(')[0].trim();
  const typeLabel = bus.type === 'main' ? 'MSB' : bus.type === 'emergency' ? 'ESB' : 'DB';

  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[10px] font-bold">
        {typeLabel} - {label}
      </span>
      <span className="text-[9px] text-gray-500">
        AC{bus.voltage}V, {bus.phase}PH, {bus.frequency}Hz
      </span>
      {editMode && (
        <button
          className="text-[8px] text-blue-600 hover:underline ml-2"
          onClick={() => onSelectBus(bus.id)}
        >
          [VIEW DETAIL]
        </button>
      )}
    </div>
  );
}

function GeneratorElement({
  gen,
  editMode,
  onClick,
}: {
  gen: Generator;
  editMode: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const kva = Math.round(gen.ratedPowerKW / gen.ratedPF);
  const typeLabel = gen.type === 'diesel' ? 'D/G' : gen.type === 'emergency' ? 'E/G' : gen.type === 'shaft' ? 'S/G' : 'G';

  return (
    <div className="flex flex-col items-center mx-3 mt-1" style={{ width: 70 }}>
      {/* Vertical line from bus down */}
      <div className="w-0 border-l-[1.5px] border-black" style={{ height: 20 }} />

      {/* ACB/MCCB symbol */}
      <div
        className={`border border-black bg-white flex items-center justify-center ${editMode ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
        style={{ width: 20, height: 12 }}
        onClick={onClick}
      >
        <span className="text-[6px] font-bold">ACB</span>
      </div>

      {/* Vertical line to generator */}
      <div className="w-0 border-l-[1.5px] border-black" style={{ height: 15 }} />

      {/* Generator circle */}
      <div
        className={`border-2 border-black rounded-full flex items-center justify-center bg-white ${editMode ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
        style={{ width: 40, height: 40 }}
        onClick={onClick}
      >
        <span className="text-[11px] font-bold">{typeLabel}</span>
      </div>

      {/* Specs */}
      <div className="text-[8px] text-center leading-tight mt-1">
        <div className="font-bold">{gen.name.split('(')[0].trim()}</div>
        <div>{kva}KVA</div>
        <div>{gen.ratedVoltage}V</div>
        <div>{gen.ratedPF}PF</div>
      </div>
    </div>
  );
}

function FeederGroupElement({
  loads,
  busId,
  editMode,
  onSelectBus,
}: {
  loads: Load[];
  busId: string;
  editMode: boolean;
  onSelectBus: (busId: string) => void;
}) {
  // Group loads by type for display
  const motorLoads = loads.filter(l => isMotorType(l.type));
  const otherLoads = loads.filter(l => !isMotorType(l.type));

  const totalKW = loads.reduce((sum, l) => sum + l.ratedPowerKW * l.quantity, 0);

  return (
    <div className="flex flex-col items-center mx-3 mt-1" style={{ minWidth: 80 }}>
      {/* Vertical line from bus */}
      <div className="w-0 border-l-[1.5px] border-black" style={{ height: 20 }} />

      {/* MCCB symbol */}
      <div className="border border-black bg-white flex items-center justify-center" style={{ width: 20, height: 12 }}>
        <span className="text-[6px] font-bold">CB</span>
      </div>

      {/* Vertical line */}
      <div className="w-0 border-l-[1.5px] border-black" style={{ height: 10 }} />

      {/* Panel box (dashed border) */}
      <div
        className={`border border-dashed border-gray-600 px-2 py-1.5 bg-white ${editMode ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-400' : ''}`}
        style={{ minWidth: 70 }}
        onClick={() => onSelectBus(busId)}
        title="Double-click to view panel detail"
      >
        <div className="text-[8px] text-center leading-tight">
          <div className="font-bold">{loads.length} FEEDERS</div>
          <div>{totalKW.toFixed(0)}KW TOTAL</div>
          {motorLoads.length > 0 && (
            <div className="text-gray-500">{motorLoads.length} MOTORS</div>
          )}
          {otherLoads.length > 0 && (
            <div className="text-gray-500">{otherLoads.length} OTHER</div>
          )}
        </div>
      </div>

      {/* Individual feeder stubs (max 6 shown) */}
      <div className="flex gap-0.5 mt-1">
        {loads.slice(0, 6).map(load => (
          <div key={load.id} className="flex flex-col items-center" style={{ width: 10 }}>
            <div className="w-0 border-l border-black" style={{ height: 6 }} />
            <div
              className={`rounded-full border border-black ${isMotorType(load.type) ? 'bg-white' : 'bg-gray-200'}`}
              style={{ width: 6, height: 6 }}
              title={`${load.name} (${load.ratedPowerKW}kW)`}
            />
          </div>
        ))}
        {loads.length > 6 && (
          <div className="text-[7px] text-gray-500 self-end ml-0.5">
            +{loads.length - 6}
          </div>
        )}
      </div>
    </div>
  );
}

function isMotorType(type: string): boolean {
  return ['pump', 'fan', 'compressor', 'motor', 'winch', 'crane', 'bow-thruster', 'hvac'].includes(type);
}

// ============================================================
// Edit Popover (shown when clicking elements in edit mode)
// ============================================================

interface EditPopoverProps {
  state: EditPopoverState;
  onClose: () => void;
}

function EditPopover({ state, onClose }: EditPopoverProps) {
  const { project, updateGenerator, updateBus, updateBusTie } = useProjectStore();

  if (!state.type || !state.id) return null;

  const gen = state.type === 'generator' ? project.generators.find(g => g.id === state.id) : null;
  const bus = state.type === 'bus' ? project.buses.find(b => b.id === state.id) : null;
  const busTie = state.type === 'busTie' ? project.busTies.find(bt => bt.id === state.id) : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover */}
      <div
        className="fixed z-50 bg-white border-2 border-black shadow-lg p-3 font-mono text-[10px] uppercase"
        style={{
          left: Math.min(state.x, window.innerWidth - 280),
          top: Math.min(state.y, window.innerHeight - 200),
          width: 260,
        }}
      >
        <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
          <span className="font-bold text-[11px]">
            {state.type === 'generator' ? 'GENERATOR' : state.type === 'bus' ? 'BUS' : 'BUS-TIE'}
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-[12px] font-bold">X</button>
        </div>

        {gen && (
          <div className="space-y-1.5">
            <PopoverField label="NAME" value={gen.name} onChange={(v) => updateGenerator(gen.id, { name: v })} />
            <PopoverField label="POWER (KW)" value={String(gen.ratedPowerKW)} onChange={(v) => updateGenerator(gen.id, { ratedPowerKW: parseFloat(v) || gen.ratedPowerKW })} />
            <PopoverField label="VOLTAGE (V)" value={String(gen.ratedVoltage)} readOnly />
            <PopoverField label="PF" value={String(gen.ratedPF)} onChange={(v) => updateGenerator(gen.id, { ratedPF: parseFloat(v) || gen.ratedPF })} />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] text-gray-500">STATUS:</span>
              <button
                className={`px-2 py-0.5 border text-[9px] ${gen.isAvailable ? 'border-green-600 text-green-700 bg-green-50' : 'border-red-600 text-red-700 bg-red-50'}`}
                onClick={() => updateGenerator(gen.id, { isAvailable: !gen.isAvailable })}
              >
                {gen.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
              </button>
            </div>
          </div>
        )}

        {bus && (
          <div className="space-y-1.5">
            <PopoverField label="NAME" value={bus.name} onChange={(v) => updateBus(bus.id, { name: v })} />
            <PopoverField label="VOLTAGE (V)" value={String(bus.voltage)} readOnly />
            <PopoverField label="GROUNDING" value={bus.groundingSystem} readOnly />
            <div className="text-[9px] text-gray-500 mt-1">
              GENERATORS: {bus.connectedGeneratorIds.length} | LOADS: {bus.connectedLoadIds.length}
            </div>
          </div>
        )}

        {busTie && (
          <div className="space-y-1.5">
            <PopoverField label="NAME" value={busTie.name} onChange={(v) => updateBusTie(busTie.id, { name: v })} />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] text-gray-500">STATUS:</span>
              <button
                className={`px-2 py-0.5 border text-[9px] ${busTie.isClosed ? 'border-green-600 text-green-700 bg-green-50' : 'border-orange-600 text-orange-700 bg-orange-50'}`}
                onClick={() => updateBusTie(busTie.id, { isClosed: !busTie.isClosed })}
              >
                {busTie.isClosed ? 'CLOSED (투입)' : 'OPEN (개방)'}
              </button>
            </div>
            <div className="text-[9px] text-gray-500 mt-1">
              BUS A: {project.buses.find(b => b.id === busTie.busAId)?.name || '-'}
            </div>
            <div className="text-[9px] text-gray-500">
              BUS B: {project.buses.find(b => b.id === busTie.busBId)?.name || '-'}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PopoverField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  if (editing && onChange && !readOnly) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[8px] text-gray-500 w-20 flex-shrink-0">{label}:</span>
        <input
          autoFocus
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => { onChange(localValue); setEditing(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onChange(localValue); setEditing(false); }
            if (e.key === 'Escape') setEditing(false);
          }}
          className="flex-1 border border-yellow-400 bg-yellow-50 px-1 py-0 text-[10px] font-mono outline-none"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] text-gray-500 w-20 flex-shrink-0">{label}:</span>
      <span
        className={`text-[10px] font-bold ${!readOnly && onChange ? 'cursor-pointer hover:bg-yellow-50 px-1' : 'px-1 text-gray-700'}`}
        onClick={() => {
          if (!readOnly && onChange) {
            setLocalValue(value);
            setEditing(true);
          }
        }}
      >
        {value}
      </span>
    </div>
  );
}
