import React, { useState } from 'react';
import { FileCheck, Download } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { CLASS_SUBMISSION_CHECKLIST } from '../../data/classRules';
import type { ClassSociety, ModuleId } from '../../types';
import Select from '../common/Select';
import Button from '../common/Button';
import SubmissionChecklist from './SubmissionChecklist';

export default function ClassSubmitPage() {
  const { project, updateMeta, setActiveModule } = useProjectStore();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const classSociety = project.meta.classSociety;
  const checklist = CLASS_SUBMISSION_CHECKLIST[classSociety] || [];
  const requiredItems = checklist.filter(i => i.required);
  const completedRequired = requiredItems.filter(i => completedIds.has(i.id)).length;
  const totalCompleted = checklist.filter(i => completedIds.has(i.id)).length;
  const progressPercent = checklist.length > 0 ? (totalCompleted / checklist.length) * 100 : 0;
  const requiredPercent = requiredItems.length > 0 ? (completedRequired / requiredItems.length) * 100 : 0;

  const handleToggle = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNavigate = (module: ModuleId) => {
    setActiveModule(module);
  };

  const handleClassChange = (value: string) => {
    updateMeta({ classSociety: value as ClassSociety });
    setCompletedIds(new Set());
  };

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-gray-200">
            선급 제출 서류 (Class Submission Documents)
          </h2>
        </div>
      </div>

      {/* Class Society Selector + Progress */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
          <Select
            label="선급 (Classification Society)"
            options={[
              { value: 'KR', label: 'KR (한국선급)' },
              { value: 'ABS', label: 'ABS (미국선급)' },
              { value: 'DNV', label: 'DNV (노르웨이선급)' },
              { value: 'LR', label: "LR (Lloyd's Register)" },
              { value: 'BV', label: 'BV (Bureau Veritas)' },
              { value: 'NK', label: 'NK (일본선급)' },
              { value: 'CCS', label: 'CCS (중국선급)' },
              { value: 'RINA', label: 'RINA (이탈리아선급)' },
            ]}
            value={classSociety}
            onChange={handleClassChange}
          />
          <div className="mt-3 text-xs text-gray-500">
            선박명: <span className="text-gray-300">{project.meta.vesselName}</span>
          </div>
          <div className="text-xs text-gray-500">
            프로젝트: <span className="text-gray-300">{project.meta.projectNumber}</span>
          </div>
        </div>

        {/* Progress - Total */}
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
          <div className="text-xs text-gray-500 mb-2">전체 진행률 (Total Progress)</div>
          <div className="text-2xl font-mono font-bold text-gray-200 mb-2">
            {totalCompleted}/{checklist.length}
          </div>
          <div className="w-full bg-navy-700 rounded-full h-2.5">
            <div
              className="bg-accent rounded-full h-2.5 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">{progressPercent.toFixed(0)}%</div>
        </div>

        {/* Progress - Required */}
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
          <div className="text-xs text-gray-500 mb-2">필수 서류 (Required Documents)</div>
          <div className={`text-2xl font-mono font-bold mb-2 ${
            requiredPercent === 100 ? 'text-success' : requiredPercent > 50 ? 'text-warning' : 'text-danger'
          }`}>
            {completedRequired}/{requiredItems.length}
          </div>
          <div className="w-full bg-navy-700 rounded-full h-2.5">
            <div
              className={`rounded-full h-2.5 transition-all duration-300 ${
                requiredPercent === 100 ? 'bg-success' : requiredPercent > 50 ? 'bg-warning' : 'bg-danger'
              }`}
              style={{ width: `${requiredPercent}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">{requiredPercent.toFixed(0)}%</div>
        </div>
      </div>

      {/* Checklist */}
      <SubmissionChecklist
        items={checklist}
        completedIds={completedIds}
        onToggle={handleToggle}
        onNavigate={handleNavigate}
      />

      {/* Submission status */}
      {requiredPercent === 100 && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
          <div className="text-success font-semibold">
            모든 필수 서류가 준비되었습니다! (All required documents are ready!)
          </div>
          <div className="text-xs text-gray-500 mt-1">
            선급 제출을 진행할 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}
