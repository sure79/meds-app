import React from 'react';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import type { ChecklistItem } from '../../data/classRules';
import type { ModuleId } from '../../types';
import { useProjectStore } from '../../stores/projectStore';

interface SubmissionChecklistProps {
  items: ChecklistItem[];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (module: ModuleId) => void;
}

export default function SubmissionChecklist({ items, completedIds, onToggle, onNavigate }: SubmissionChecklistProps) {
  // Group by category
  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const categoryItems = items.filter(i => i.category === category);
        const completedCount = categoryItems.filter(i => completedIds.has(i.id)).length;

        return (
          <div key={category} className="bg-navy-800 rounded-lg border border-navy-600">
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700">
              <h4 className="text-sm font-medium text-gray-300">{category}</h4>
              <span className="text-xs text-gray-500">
                {completedCount}/{categoryItems.length}
              </span>
            </div>
            <div className="divide-y divide-navy-700">
              {categoryItems.map((item) => {
                const isCompleted = completedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-navy-700/30 transition-colors"
                  >
                    <button
                      onClick={() => onToggle(item.id)}
                      className={`mt-0.5 flex-shrink-0 ${isCompleted ? 'text-success' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                          {item.document}
                        </span>
                        {item.required && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-danger/15 text-danger rounded">필수</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                    {item.module !== 'general' && (
                      <button
                        onClick={() => onNavigate(item.module as ModuleId)}
                        className="flex-shrink-0 p-1 text-gray-600 hover:text-accent transition-colors"
                        title="해당 모듈로 이동"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
