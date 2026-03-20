import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import type { Load, Bus } from '../../types';

// ============================================================
// ConnectionEditor - Equipment connection manager modal
// Allows reassigning loads to different buses/panels
// Shows unconnected loads as warnings
// ============================================================

interface ConnectionEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectionEditor({ isOpen, onClose }: ConnectionEditorProps) {
  const { project, updateLoad } = useProjectStore();
  const [filter, setFilter] = useState('');
  const [selectedLoads, setSelectedLoads] = useState<Set<string>>(new Set());
  const [targetBusId, setTargetBusId] = useState<string>('');

  // Find loads with no bus or invalid bus
  const unconnectedLoads = useMemo(() => {
    return project.loads.filter(l => {
      if (!l.connectedBusId) return true;
      return !project.buses.find(b => b.id === l.connectedBusId);
    });
  }, [project]);

  // Group loads by bus
  const loadsByBus = useMemo(() => {
    const map = new Map<string, Load[]>();
    for (const bus of project.buses) {
      map.set(bus.id, project.loads.filter(l => l.connectedBusId === bus.id));
    }
    return map;
  }, [project]);

  // Filter loads
  const filteredLoads = useMemo(() => {
    if (!filter) return project.loads;
    const lc = filter.toLowerCase();
    return project.loads.filter(l =>
      l.name.toLowerCase().includes(lc) ||
      l.type.toLowerCase().includes(lc)
    );
  }, [project.loads, filter]);

  const toggleLoad = (loadId: string) => {
    setSelectedLoads(prev => {
      const next = new Set(prev);
      if (next.has(loadId)) next.delete(loadId);
      else next.add(loadId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedLoads(new Set(filteredLoads.map(l => l.id)));
  };

  const clearSelection = () => {
    setSelectedLoads(new Set());
  };

  const handleBulkAssign = () => {
    if (!targetBusId || selectedLoads.size === 0) return;
    for (const loadId of selectedLoads) {
      updateLoad(loadId, { connectedBusId: targetBusId });
    }
    setSelectedLoads(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white border-2 border-black shadow-2xl font-mono text-black uppercase"
        style={{ width: 800, maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b-2 border-black bg-gray-100">
          <div>
            <div className="text-[13px] font-bold">CONNECTION EDITOR (연결 편집기)</div>
            <div className="text-[9px] text-gray-500">
              ASSIGN LOADS TO BUSES / PANELS
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-300 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warnings */}
        {unconnectedLoads.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-300">
            <div className="flex items-center gap-1 text-[10px] text-yellow-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold">{unconnectedLoads.length} UNCONNECTED LOAD(S)</span>
            </div>
            <div className="text-[9px] text-yellow-700 mt-0.5">
              {unconnectedLoads.map(l => l.name).join(', ')}
            </div>
          </div>
        )}

        <div className="flex" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {/* Left: Load list */}
          <div className="flex-1 border-r border-black overflow-y-auto">
            {/* Filter + actions */}
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50">
              <input
                type="text"
                placeholder="FILTER LOADS..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full border border-gray-400 px-2 py-1 text-[10px] font-mono outline-none"
              />
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={selectAll}
                  className="text-[9px] text-blue-600 hover:underline"
                >
                  SELECT ALL
                </button>
                <button
                  onClick={clearSelection}
                  className="text-[9px] text-gray-500 hover:underline"
                >
                  CLEAR
                </button>
                <span className="text-[9px] text-gray-400 ml-auto">
                  {selectedLoads.size} SELECTED
                </span>
              </div>
            </div>

            {/* Load rows */}
            {filteredLoads.map(load => {
              const bus = project.buses.find(b => b.id === load.connectedBusId);
              const isSelected = selectedLoads.has(load.id);
              const isUnconnected = !bus;

              return (
                <div
                  key={load.id}
                  className={`flex items-center px-3 py-1.5 border-b border-gray-200 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''} ${isUnconnected ? 'bg-yellow-50' : ''}`}
                  onClick={() => toggleLoad(load.id)}
                >
                  <div className="flex-shrink-0 w-4">
                    {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold truncate">
                      {load.name}
                    </div>
                    <div className="text-[8px] text-gray-500">
                      {load.ratedPowerKW}KW | {load.type} | {load.ratedVoltage}V
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-[9px] ${isUnconnected ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                      {bus ? bus.name.split('(')[0].trim() : 'UNCONNECTED'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Bus list + assign */}
          <div className="w-64 flex flex-col">
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50">
              <div className="text-[10px] font-bold">ASSIGN TO BUS:</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {project.buses.map(bus => {
                const busLoads = loadsByBus.get(bus.id) || [];
                const isTarget = targetBusId === bus.id;
                const busLabel = bus.name.split('(')[0].trim();
                const typeLabel = bus.type === 'main' ? 'MSB' : bus.type === 'emergency' ? 'ESB' : 'DB';

                return (
                  <div
                    key={bus.id}
                    className={`px-3 py-2 border-b border-gray-200 cursor-pointer hover:bg-green-50 ${isTarget ? 'bg-green-100 border-l-4 border-l-green-600' : ''}`}
                    onClick={() => setTargetBusId(bus.id)}
                  >
                    <div className="text-[10px] font-bold">
                      {typeLabel} - {busLabel}
                    </div>
                    <div className="text-[8px] text-gray-500">
                      AC{bus.voltage}V {bus.phase}PH {bus.frequency}Hz
                    </div>
                    <div className="text-[8px] text-gray-400">
                      {busLoads.length} LOADS | {busLoads.reduce((s, l) => s + l.ratedPowerKW, 0).toFixed(0)}KW
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assign button */}
            <div className="px-3 py-3 border-t border-black bg-gray-50">
              <button
                onClick={handleBulkAssign}
                disabled={!targetBusId || selectedLoads.size === 0}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-bold bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                ASSIGN {selectedLoads.size} LOAD(S)
              </button>
              {selectedLoads.size > 0 && targetBusId && (
                <div className="text-[8px] text-gray-500 text-center mt-1">
                  TO: {project.buses.find(b => b.id === targetBusId)?.name.split('(')[0].trim()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
