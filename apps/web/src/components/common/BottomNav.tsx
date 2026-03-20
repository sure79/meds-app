import React, { useState } from 'react';
import {
  Home, BarChart3, GitBranch, Zap, MoreHorizontal,
  Plug, Shield, FileCheck, FolderKanban, HelpCircle, X, Ship,
} from 'lucide-react';
import type { ModuleId } from '../../types';
import { useProjectStore } from '../../stores/projectStore';

const mainTabs: { id: ModuleId; label: string; icon: React.ReactNode }[] = [
  { id: 'welcome', label: '홈', icon: <Home className="w-5 h-5" /> },
  { id: 'load-balance', label: '부하계산', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'diagram', label: '단선도', icon: <GitBranch className="w-5 h-5" /> },
  { id: 'short-circuit', label: '단락전류', icon: <Zap className="w-5 h-5" /> },
];

const moreItems: { id: ModuleId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'voltage-drop', label: '전압강하', icon: <Plug className="w-5 h-5" />, desc: '케이블 전압강하 & 사이즈 선정' },
  { id: 'protection', label: '보호협조', icon: <Shield className="w-5 h-5" />, desc: 'TCC 차트 & 선택성 검증' },
  { id: 'class-submit', label: '선급제출', icon: <FileCheck className="w-5 h-5" />, desc: '선급 승인 서류 체크리스트' },
  { id: 'projects', label: '프로젝트', icon: <FolderKanban className="w-5 h-5" />, desc: '프로젝트 생성, 저장, 관리' },
  { id: 'help', label: '도움말', icon: <HelpCircle className="w-5 h-5" />, desc: '사용법 안내 및 FAQ' },
];

export default function BottomNav() {
  const { ui, setActiveModule } = useProjectStore();
  const [showMore, setShowMore] = useState(false);

  const handleNav = (id: ModuleId) => {
    setActiveModule(id);
    setShowMore(false);
  };

  const isMoreActive = moreItems.some(item => item.id === ui.activeModule);

  return (
    <>
      {/* More Sheet Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" onClick={() => setShowMore(false)}>
          <div
            className="bg-navy-800 border-t border-navy-600 rounded-t-2xl p-4 pb-safe"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-accent" />
                <span className="text-sm font-bold text-gray-200">MEDS 메뉴</span>
              </div>
              <button onClick={() => setShowMore(false)} className="text-gray-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {moreItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                    ui.activeModule === item.id
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'bg-navy-700/50 text-gray-300 hover:bg-navy-700 border border-navy-600'
                  }`}
                >
                  <span className={ui.activeModule === item.id ? 'text-accent' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-navy-800 border-t border-navy-600 flex items-stretch safe-bottom">
        {mainTabs.map(tab => {
          const isActive = ui.activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-accent' : 'text-gray-500 active:bg-navy-700'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setShowMore(v => !v)}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
            isMoreActive || showMore ? 'text-accent' : 'text-gray-500 active:bg-navy-700'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">더보기</span>
        </button>
      </div>
    </>
  );
}
