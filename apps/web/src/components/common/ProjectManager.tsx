import React, { useState, useEffect, useRef } from 'react';
import {
  FolderKanban, Plus, Copy, Trash2, Download, Upload, Ship, Calendar,
  X, ChevronDown, Check, AlertTriangle, Search, FolderOpen,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import type { ProjectSummary, ClassSociety, VoltageLevel, Frequency, GroundingSystem } from '../../types';
import { VESSEL_PRESETS } from '../../data/loadPresets';

// Class society accent colors for the card left bar
const CLASS_COLORS: Record<string, string> = {
  KR: 'bg-blue-500',
  ABS: 'bg-red-500',
  DNV: 'bg-teal-500',
  LR: 'bg-orange-500',
  BV: 'bg-purple-500',
  NK: 'bg-pink-500',
  CCS: 'bg-yellow-500',
  RINA: 'bg-green-500',
};

const VESSEL_TYPES = [
  'Bulk Carrier',
  'Container Ship',
  'Oil Tanker',
  'LNG Carrier',
  'Fishing Vessel',
  'Special Purpose',
  'Tug Boat',
  'General Cargo',
  'Ro-Ro Ship',
  'Passenger Ship',
];

const CLASS_SOCIETIES: ClassSociety[] = ['KR', 'ABS', 'DNV', 'LR', 'BV', 'NK', 'CCS', 'RINA'];
const VOLTAGES: VoltageLevel[] = [440, 450, 480, 690];
const FREQUENCIES: Frequency[] = [50, 60];
const GROUNDING_SYSTEMS: GroundingSystem[] = ['IT', 'TN-S', 'TN-C-S'];

interface NewProjectForm {
  projectName: string;
  vesselName: string;
  vesselType: string;
  classSociety: ClassSociety;
  systemVoltage: VoltageLevel;
  frequency: Frequency;
  phase: 3;
  groundingSystem: GroundingSystem;
  projectNumber: string;
  designer: string;
  applyPreset: boolean;
}

function generateProjectNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MEDS-${y}${m}-${rand}`;
}

export default function ProjectManager() {
  const {
    projectList, project, setActiveModule,
    saveProjectToList, loadProjectFromList, deleteProjectFromList,
    duplicateProject, exportProjectFile, importProjectFile,
    newProject, refreshProjectList, error, clearError,
    updateSystemSettings,
  } = useProjectStore();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<NewProjectForm>({
    projectName: '',
    vesselName: '',
    vesselType: 'Bulk Carrier',
    classSociety: 'KR',
    systemVoltage: 440,
    frequency: 60,
    phase: 3,
    groundingSystem: 'IT',
    projectNumber: generateProjectNumber(),
    designer: '',
    applyPreset: true,
  });

  useEffect(() => {
    refreshProjectList();
  }, []);

  const filteredProjects = projectList.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.vesselName.toLowerCase().includes(q) ||
      p.classSociety.toLowerCase().includes(q)
    );
  });

  const handleCreateProject = () => {
    if (!form.projectName.trim()) return;

    newProject(
      {
        name: form.projectName,
        vesselName: form.vesselName,
        vesselType: form.vesselType,
        classSociety: form.classSociety,
        designer: form.designer,
        projectNumber: form.projectNumber,
        revision: 'A',
        date: new Date().toISOString().split('T')[0],
      },
      form.applyPreset ? form.vesselType : undefined,
    );

    // Apply system settings
    updateSystemSettings({
      systemVoltage: form.systemVoltage,
      systemFrequency: form.frequency,
      systemPhase: form.phase,
      groundingSystem: form.groundingSystem,
    });

    // Auto-save after a short delay to allow preset loading
    setTimeout(() => {
      saveProjectToList();
    }, 500);

    setShowNewDialog(false);
    setForm({
      ...form,
      projectName: '',
      vesselName: '',
      projectNumber: generateProjectNumber(),
      designer: '',
    });

    // Navigate to load balance
    localStorage.setItem('meds-welcome-seen', 'true');
    setActiveModule('load-balance');
  };

  const handleOpenProject = (projectId: string) => {
    loadProjectFromList(projectId);
    localStorage.setItem('meds-welcome-seen', 'true');
    setActiveModule('load-balance');
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProjectFromList(projectId);
    setShowDeleteConfirm(null);
  };

  const handleDuplicateProject = (projectId: string) => {
    duplicateProject(projectId);
  };

  const handleExportProject = (projectId: string) => {
    // Load the project temporarily to export
    const currentProjectId = project.id;
    loadProjectFromList(projectId);
    setTimeout(() => {
      exportProjectFile();
      // Reload original if different
      if (currentProjectId !== projectId) {
        loadProjectFromList(currentProjectId);
      }
    }, 100);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importProjectFile(file);
      } catch {
        // Error handled in store
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-full overflow-auto bg-navy-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <FolderKanban className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">프로젝트 관리</h1>
              <p className="text-sm text-gray-400">Project Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 text-gray-200 rounded-lg hover:bg-navy-600 transition-colors border border-navy-500 text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              프로젝트 가져오기 (Import)
            </button>
            <button
              onClick={() => setShowNewDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-navy-900 rounded-lg hover:bg-accent-hover transition-colors text-sm font-bold shadow-lg shadow-accent/20"
            >
              <Plus className="w-4 h-4" />
              새 프로젝트 (New Project)
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-3 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-sm text-danger">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="text-danger/60 hover:text-danger">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="프로젝트 검색... (Search projects)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-6 text-xs text-gray-500">
          <span>{projectList.length} / 20 프로젝트 (projects)</span>
          {project.id && (
            <span className="text-accent">
              현재 활성: {project.meta.name} (Active)
            </span>
          )}
        </div>

        {/* Project Grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-navy-800 border border-navy-600 flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              {searchQuery ? '검색 결과 없음 (No results)' : '저장된 프로젝트가 없습니다'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? '다른 검색어를 시도해 주세요'
                : '새 프로젝트를 만들거나 기존 파일을 가져오세요 (Create a new project or import an existing file)'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-navy-900 rounded-lg hover:bg-accent-hover transition-colors text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                새 프로젝트 만들기 (Create New Project)
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className={`relative bg-navy-800 border rounded-xl overflow-hidden hover:border-accent/30 transition-all group ${
                  proj.id === project.id ? 'border-accent/50 ring-1 ring-accent/20' : 'border-navy-600'
                }`}
              >
                {/* Class society accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${CLASS_COLORS[proj.classSociety] || 'bg-gray-500'}`} />

                <div className="pl-4 pr-4 pt-4 pb-3">
                  {/* Project name & active badge */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-200 truncate flex-1 pr-2">{proj.name}</h3>
                    {proj.id === project.id && (
                      <span className="flex-shrink-0 px-2 py-0.5 bg-accent/20 text-accent text-[10px] font-bold rounded-full">
                        활성 (Active)
                      </span>
                    )}
                  </div>

                  {/* Vessel info */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Ship className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{proj.vesselName}</span>
                    <span className="text-gray-600">|</span>
                    <span className="font-mono text-[11px] text-gray-500">{proj.classSociety}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-3">
                    <span>발전기 {proj.generatorCount}대</span>
                    <span>부하 {proj.loadCount}개</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(proj.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-navy-700">
                    <button
                      onClick={() => handleOpenProject(proj.id)}
                      className="flex-1 px-3 py-1.5 bg-accent/10 text-accent text-xs font-semibold rounded-md hover:bg-accent/20 transition-colors"
                    >
                      열기 (Open)
                    </button>
                    <button
                      onClick={() => handleDuplicateProject(proj.id)}
                      title="복제 (Duplicate)"
                      className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-navy-700 rounded-md transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExportProject(proj.id)}
                      title="내보내기 (Export)"
                      className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-navy-700 rounded-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(proj.id)}
                      title="삭제 (Delete)"
                      className="p-1.5 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Delete confirmation */}
                {showDeleteConfirm === proj.id && (
                  <div className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10">
                    <AlertTriangle className="w-8 h-8 text-danger mb-2" />
                    <p className="text-sm text-gray-200 text-center mb-1 font-medium">프로젝트를 삭제하시겠습니까?</p>
                    <p className="text-xs text-gray-400 text-center mb-4">Delete this project?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-4 py-1.5 bg-navy-700 text-gray-300 text-xs rounded-md hover:bg-navy-600 transition-colors"
                      >
                        취소 (Cancel)
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="px-4 py-1.5 bg-danger text-white text-xs font-semibold rounded-md hover:bg-red-600 transition-colors"
                      >
                        삭제 (Delete)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.meds.json"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* New Project Dialog (Modal) */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-600 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">새 프로젝트 만들기</h2>
                  <p className="text-xs text-gray-400">Create New Project</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewDialog(false)}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-navy-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Project Info Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  프로젝트 정보 (Project Info)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">프로젝트명 (Project Name) <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      value={form.projectName}
                      onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                      placeholder="e.g. 50K DWT Bulk Carrier 전기설계"
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">선박명 (Vessel Name)</label>
                    <input
                      type="text"
                      value={form.vesselName}
                      onChange={(e) => setForm({ ...form, vesselName: e.target.value })}
                      placeholder="e.g. HN-1234"
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">프로젝트 번호 (Project No.)</label>
                    <input
                      type="text"
                      value={form.projectNumber}
                      onChange={(e) => setForm({ ...form, projectNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">설계자 (Designer)</label>
                    <input
                      type="text"
                      value={form.designer}
                      onChange={(e) => setForm({ ...form, designer: e.target.value })}
                      placeholder="이름 입력"
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">선종 (Vessel Type)</label>
                    <select
                      value={form.vesselType}
                      onChange={(e) => setForm({ ...form, vesselType: e.target.value })}
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    >
                      {VESSEL_TYPES.map(vt => (
                        <option key={vt} value={vt}>{vt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Electrical System Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  전기 시스템 (Electrical System)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">선급 (Class Society)</label>
                    <select
                      value={form.classSociety}
                      onChange={(e) => setForm({ ...form, classSociety: e.target.value as ClassSociety })}
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    >
                      {CLASS_SOCIETIES.map(cs => (
                        <option key={cs} value={cs}>{cs}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">시스템 전압 (Voltage)</label>
                    <select
                      value={form.systemVoltage}
                      onChange={(e) => setForm({ ...form, systemVoltage: Number(e.target.value) as VoltageLevel })}
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    >
                      {VOLTAGES.map(v => (
                        <option key={v} value={v}>{v}V</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">주파수 (Frequency)</label>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: Number(e.target.value) as Frequency })}
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    >
                      {FREQUENCIES.map(f => (
                        <option key={f} value={f}>{f}Hz</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">상 (Phase)</label>
                    <select
                      value={3}
                      disabled
                      className="w-full px-3 py-2 bg-navy-900/50 border border-navy-600 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                    >
                      <option value={3}>3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">접지방식 (Grounding)</label>
                    <select
                      value={form.groundingSystem}
                      onChange={(e) => setForm({ ...form, groundingSystem: e.target.value as GroundingSystem })}
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                    >
                      {GROUNDING_SYSTEMS.map(gs => (
                        <option key={gs} value={gs}>{gs}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vessel Preset Checkbox */}
              <div className="bg-navy-900/50 border border-navy-700 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="mt-0.5">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        form.applyPreset
                          ? 'bg-accent border-accent'
                          : 'border-navy-500 bg-navy-800'
                      }`}
                      onClick={() => setForm({ ...form, applyPreset: !form.applyPreset })}
                    >
                      {form.applyPreset && <Check className="w-3.5 h-3.5 text-navy-900" />}
                    </div>
                  </div>
                  <div onClick={() => setForm({ ...form, applyPreset: !form.applyPreset })}>
                    <div className="text-sm font-medium text-gray-200">선종 프리셋 적용 (Apply Vessel Preset)</div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      선택한 선종에 맞는 표준 발전기, 배전반, 부하를 자동으로 추가합니다.
                      <br />
                      <span className="text-gray-500">Auto-populate generators and loads based on the vessel type.</span>
                    </p>
                    {form.applyPreset && (
                      <div className="mt-2">
                        {VESSEL_PRESETS.find(p => p.vesselType === form.vesselType) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-[11px] rounded-full">
                            <Check className="w-3 h-3" />
                            {form.vesselType} 프리셋 사용 가능 (Preset available)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning/10 text-warning text-[11px] rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            해당 선종의 프리셋이 없습니다 - 빈 프로젝트로 생성됩니다 (No preset for this type)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-navy-700">
              <button
                onClick={() => setShowNewDialog(false)}
                className="px-5 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-navy-700 rounded-lg transition-colors"
              >
                취소 (Cancel)
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!form.projectName.trim()}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-colors ${
                  form.projectName.trim()
                    ? 'bg-accent text-navy-900 hover:bg-accent-hover shadow-lg shadow-accent/20'
                    : 'bg-navy-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                프로젝트 생성 (Create)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
