import React from 'react';
import {
  BarChart3, GitBranch, Zap, Plug, Shield, FileCheck,
  Ship, FolderKanban, HelpCircle, Home, ChevronLeft, ChevronRight,
  Save, FolderOpen, Download, Upload,
} from 'lucide-react';
import type { ModuleId } from '../../types';
import { useProjectStore } from '../../stores/projectStore';
import { exportProjectJSON, importProjectJSON } from '../../utils/export';

interface NavItem {
  id: ModuleId;
  step: number;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'load-balance', step: 1, label: '부하 & 발전기', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'diagram',      step: 2, label: '단선결선도',    icon: <GitBranch className="w-4 h-4" /> },
  { id: 'short-circuit',step: 3, label: '단락전류',      icon: <Zap className="w-4 h-4" /> },
  { id: 'voltage-drop', step: 4, label: '전압강하',      icon: <Plug className="w-4 h-4" /> },
  { id: 'protection',   step: 5, label: '보호협조',      icon: <Shield className="w-4 h-4" /> },
  { id: 'class-submit', step: 6, label: '선급제출',      icon: <FileCheck className="w-4 h-4" /> },
];

export default function Sidebar() {
  const { ui, project, setActiveModule, toggleSidebar, saveToLocalStorage, loadFromLocalStorage, loadProject } = useProjectStore();
  const collapsed = ui.sidebarCollapsed;

  const handleExport = () => exportProjectJSON(project);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const proj = await importProjectJSON(file);
        loadProject(proj);
      } catch {
        alert('프로젝트 파일을 읽을 수 없습니다.');
      }
    };
    input.click();
  };

  return (
    <aside className={`flex flex-col bg-navy-800 border-r border-navy-600 transition-all duration-300 ${collapsed ? 'w-14' : 'w-56'}`}>

      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-navy-600 flex-shrink-0">
        <Ship className="w-6 h-6 text-accent flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-accent">MEDS</div>
            <div className="text-[10px] text-gray-500 truncate">Marine Electrical Design</div>
          </div>
        )}
      </div>

      {/* Project Info */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-navy-700 text-xs text-gray-400 space-y-0.5 flex-shrink-0">
          <div className="font-medium text-gray-300 truncate">{project.meta.vesselName || '새 프로젝트'}</div>
          <div className="text-gray-500 truncate">{project.meta.classSociety} · {project.systemVoltage}V {project.systemFrequency}Hz</div>
        </div>
      )}

      {/* Home & Projects */}
      <div className="border-b border-navy-700 flex-shrink-0">
        {[
          { id: 'welcome' as ModuleId, label: '홈', icon: <Home className="w-4 h-4" /> },
          { id: 'projects' as ModuleId, label: '프로젝트 관리', icon: <FolderKanban className="w-4 h-4" /> },
        ].map(item => {
          const isActive = ui.activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left ${
                isActive
                  ? 'bg-accent/10 text-accent border-r-2 border-accent'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700/50'
              }`}
            >
              {item.icon}
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 py-1 text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
            설계 단계
          </div>
        )}
        {navItems.map((item) => {
          const isActive = ui.activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={collapsed ? `${item.step}. ${item.label}` : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left ${
                isActive
                  ? 'bg-accent/10 text-accent border-r-2 border-accent'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700/50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                isActive ? 'bg-accent text-navy-900' : 'bg-navy-600 text-gray-500'
              }`}>
                {item.step}
              </span>
              {!collapsed && <span className="text-sm truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Help */}
      <div className="border-t border-navy-700 flex-shrink-0">
        <button
          onClick={() => setActiveModule('help')}
          title={collapsed ? '도움말' : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left ${
            ui.activeModule === 'help'
              ? 'bg-accent/10 text-accent border-r-2 border-accent'
              : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700/50'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          {!collapsed && <span className="text-sm">도움말</span>}
        </button>
      </div>

      {/* File Actions */}
      <div className="border-t border-navy-700 py-1 flex-shrink-0">
        {[
          { icon: <Save className="w-3.5 h-3.5" />, label: '저장', onClick: saveToLocalStorage },
          { icon: <FolderOpen className="w-3.5 h-3.5" />, label: '불러오기', onClick: () => loadFromLocalStorage() },
          { icon: <Download className="w-3.5 h-3.5" />, label: '내보내기', onClick: handleExport },
          { icon: <Upload className="w-3.5 h-3.5" />, label: '가져오기', onClick: handleImport },
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            title={action.label}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-500 hover:text-gray-300 hover:bg-navy-700/50 transition-colors"
          >
            {action.icon}
            {!collapsed && <span className="text-xs">{action.label}</span>}
          </button>
        ))}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center py-2 border-t border-navy-700 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
