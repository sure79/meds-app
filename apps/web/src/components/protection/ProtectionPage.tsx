import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import TCCChart from './TCCChart';
import Select from '../common/Select';

export default function ProtectionPage() {
  const { project } = useProjectStore();
  const [selectedBreakerId, setSelectedBreakerId] = useState('');
  const [selectedGenId, setSelectedGenId] = useState('');

  const breakerOptions = [
    { value: '', label: '선택 안함 (None)' },
    ...project.breakers.map(b => ({ value: b.id, label: b.name })),
    // Add sample breakers if no real ones exist
    ...(project.breakers.length === 0 ? [
      { value: 'sample-cb-1', label: 'CB-DG1 (400A) [샘플]' },
      { value: 'sample-cb-2', label: 'CB-DG2 (400A) [샘플]' },
      { value: 'sample-cb-3', label: 'CB-Pump (100A) [샘플]' },
      { value: 'sample-cb-4', label: 'CB-Fan (63A) [샘플]' },
    ] : []),
  ];

  const genOptions = [
    { value: '', label: '선택 안함 (None)' },
    ...project.generators.map(g => ({ value: g.id, label: `${g.name} (${g.ratedPowerKW}kW)` })),
  ];

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-gray-200">
          보호 협조 분석 (Protection Coordination)
        </h2>
      </div>

      <div className="bg-navy-800/50 rounded-lg border border-navy-700 p-3 text-xs text-gray-500">
        시간-전류 특성 곡선 (TCC) 차트를 통한 보호 협조 분석. 차단기 트립 곡선, 케이블 손상 곡선, 발전기 손상 곡선을 표시합니다.
        <br />
        (Time-Current Characteristic chart for protection coordination analysis. Displays breaker trip curves, cable damage curves, and generator damage curves.)
      </div>

      <div className="flex gap-6">
        {/* Left: Controls */}
        <div className="w-64 space-y-4 flex-shrink-0">
          <div className="bg-navy-800 rounded-lg border border-navy-600 p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-300">차단기 선택 (Select Breaker)</h3>
            <Select
              label="차단기 (Breaker)"
              options={breakerOptions}
              value={selectedBreakerId}
              onChange={setSelectedBreakerId}
            />
            <Select
              label="발전기 (Generator)"
              options={genOptions}
              value={selectedGenId}
              onChange={setSelectedGenId}
            />
          </div>

          {/* Selectivity Info */}
          <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">보호 협조 검토 (Selectivity Check)</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success flex-shrink-0" />
                <span className="text-gray-400">상위-하위 차단기 시간 여유 확보</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning flex-shrink-0" />
                <span className="text-gray-400">곡선 교차 영역 확인 필요</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger flex-shrink-0" />
                <span className="text-gray-400">보호 협조 불량 (Non-selective)</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">범례 (Legend)</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-accent" />
                <span className="text-gray-400">차단기 트립 곡선</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-emergency" style={{ borderTop: '2px dashed #ff6b35' }} />
                <span className="text-gray-400">발전기 손상 곡선</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-danger" style={{ borderTop: '2px dotted #f44336' }} />
                <span className="text-gray-400">케이블 손상 곡선</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: TCC Chart */}
        <div className="flex-1">
          <TCCChart
            selectedBreakerId={selectedBreakerId}
            selectedGeneratorId={selectedGenId}
          />
        </div>
      </div>
    </div>
  );
}
