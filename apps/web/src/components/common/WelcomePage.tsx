import React from 'react';
import {
  Ship, BarChart3, GitBranch, Zap, Plug, Shield, FileCheck,
  ArrowRight, ChevronRight, Plus, FolderKanban, Calendar,
  Target, Clock, Award, CheckCircle2, Lightbulb, BookOpen,
  Anchor, TrendingUp, FileSpreadsheet, HelpCircle,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';

// ============================================================
// Corrected workflow steps (Loads first → Generator recommendation)
// ============================================================
const workflowSteps = [
  {
    step: 1,
    title: '선종 선택 & 부하 입력',
    titleEn: 'Vessel Type & Load Input',
    description: '선종을 선택하면 추천 장비가 자동 표시됩니다. 필요한 장비를 체크하세요.',
    icon: <Anchor className="w-5 h-5" />,
  },
  {
    step: 2,
    title: '운항조건별 부하율 설정',
    titleEn: 'Operating Condition Setup',
    description: '항해, 입출항, 정박 등 각 조건에서 장비 가동률을 설정합니다.',
    icon: <FileSpreadsheet className="w-5 h-5" />,
  },
  {
    step: 3,
    title: '발전기 & 배터리 자동 추천',
    titleEn: 'Auto Generator Recommendation',
    description: '부하 분석 결과를 바탕으로 최적의 발전기 용량과 대수를 자동 산정합니다.',
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    step: 4,
    title: '결과 확인 & 선급 제출',
    titleEn: 'Results & Class Submission',
    description: '계산 결과를 확인하고, 단선결선도/계산서를 생성하여 선급에 제출합니다.',
    icon: <Award className="w-5 h-5" />,
  },
];

const features = [
  {
    icon: <BarChart3 className="w-7 h-7" />,
    title: '부하 & 발전기 분석',
    titleEn: 'Load & Generator Analysis',
    description: '부하를 먼저 입력하면 발전기 용량/대수, 비상발전기, 배터리 용량을 자동으로 추천합니다. 운항조건별 부하율을 계산하여 선급 기준 적합 여부를 판정합니다.',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/20',
  },
  {
    icon: <GitBranch className="w-7 h-7" />,
    title: '단선결선도 자동 생성',
    titleEn: 'Single Line Diagram',
    description: '입력된 전력계통 데이터에서 IEC 표준 심볼을 사용한 엔지니어링 도면을 자동 생성합니다. 드래그로 편집하고 SVG/PNG로 내보낼 수 있습니다.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: '단락전류 계산',
    titleEn: 'Short Circuit Calculation',
    description: 'IEC 61363 기준으로 각 모선의 대칭/첨두/차단 단락전류를 계산합니다. 차단기 용량의 적합성을 자동 판정합니다.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/20',
  },
  {
    icon: <Plug className="w-7 h-7" />,
    title: '전압강하 & 케이블 사이징',
    titleEn: 'Voltage Drop & Cable Sizing',
    description: 'IEC 60092 기준으로 정상/기동 시 전압강하를 계산하고, 선급 허용치에 맞는 최적 케이블 사이즈를 자동 선정합니다.',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: '보호협조 분석',
    titleEn: 'Protection Coordination',
    description: 'Time-Current Curve(TCC) 차트로 차단기 간 선택성(Selectivity)을 확인합니다. 상위/하위 차단기의 동작 순서가 올바른지 자동 검증합니다.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
  },
  {
    icon: <FileCheck className="w-7 h-7" />,
    title: '선급 제출 문서 관리',
    titleEn: 'Class Submission Manager',
    description: 'KR, ABS, DNV 등 선급별 제출 서류 체크리스트를 관리합니다. 계산서와 도면을 PDF/Excel로 일괄 생성하여 제출을 준비합니다.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
  },
];

const benefits = [
  {
    icon: <Clock className="w-6 h-6 text-accent" />,
    title: '설계 시간 80% 단축',
    description: '수작업 엑셀 계산 대비 자동화로 기본설계 기간을 대폭 단축합니다.',
  },
  {
    icon: <Target className="w-6 h-6 text-success" />,
    title: '계산 오류 방지',
    description: 'IEC/SOLAS 공식이 내장되어 있어 수계산 실수를 원천 차단합니다.',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-yellow-400" />,
    title: '최적 설계 자동 추천',
    description: '부하 데이터만 입력하면 발전기/배터리/케이블을 자동으로 최적 선정합니다.',
  },
  {
    icon: <Award className="w-6 h-6 text-purple-400" />,
    title: '선급 승인 원스톱',
    description: '계산서, 단선결선도, 체크리스트를 한 곳에서 생성하여 선급 제출을 간소화합니다.',
  },
];

const targetUsers = [
  '선박 전기 기본설계 엔지니어',
  '생산설계에서 기본설계로 전환한 설계자',
  '중소형 설계사무소 / 조선소',
  '선종: 일반상선, 특수선, 어선, 예인선',
];

export default function WelcomePage() {
  const { setActiveModule, projectList, loadProjectFromList } = useProjectStore();

  const handleCreateNewProject = () => {
    localStorage.setItem('meds-welcome-seen', 'true');
    setActiveModule('projects');
  };

  const handleOpenProjectManager = () => {
    localStorage.setItem('meds-welcome-seen', 'true');
    setActiveModule('projects');
  };

  const handleOpenHelp = () => {
    localStorage.setItem('meds-welcome-seen', 'true');
    setActiveModule('help');
  };

  const handleQuickOpenProject = (projectId: string) => {
    loadProjectFromList(projectId);
    localStorage.setItem('meds-welcome-seen', 'true');
    setActiveModule('load-balance');
  };

  const recentProjects = [...projectList]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-full overflow-auto bg-navy-900">
      {/* ============ HERO ============ */}
      <div className="flex flex-col items-center justify-center pt-12 pb-10 px-6 bg-gradient-to-b from-navy-800 to-navy-900">
        <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-4">
          <Ship className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">MEDS</h1>
        <p className="text-lg text-accent font-medium mb-3">Marine Electrical Design Suite</p>
        <p className="text-sm text-gray-400 mb-2 text-center max-w-2xl leading-relaxed">
          AutoCAD Electrical, ETAP 같은 고가 상용 소프트웨어 없이<br />
          <span className="text-gray-300 font-medium">선박 전기 기본설계(Basic Design)</span>를 수행할 수 있는 웹 기반 통합 도구입니다.
        </p>
        <p className="text-xs text-gray-500 mb-8 text-center max-w-xl">
          부하 분석 → 발전기/배터리 자동 추천 → 단선결선도 생성 → 단락전류/전압강하 계산 → 선급 제출까지 한 곳에서 완료하세요.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={handleCreateNewProject}
            className="flex items-center gap-2 px-8 py-3 bg-accent text-navy-900 font-bold rounded-xl hover:bg-accent-hover transition-colors text-base shadow-lg shadow-accent/20"
          >
            <Plus className="w-5 h-5" />
            새 프로젝트 만들기 (New Project)
          </button>
          <button
            onClick={handleOpenProjectManager}
            className="flex items-center gap-2 px-6 py-3 bg-navy-700 text-gray-200 font-semibold rounded-xl hover:bg-navy-600 transition-colors border border-navy-500"
          >
            <FolderKanban className="w-5 h-5" />
            프로젝트 관리
          </button>
          <button
            onClick={handleOpenHelp}
            className="flex items-center gap-2 px-6 py-3 bg-navy-700 text-gray-200 font-semibold rounded-xl hover:bg-navy-600 transition-colors border border-navy-500"
          >
            <BookOpen className="w-5 h-5" />
            사용 가이드
          </button>
        </div>
      </div>

      {/* ============ RECENT PROJECTS ============ */}
      {recentProjects.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 py-10">
          <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
            최근 프로젝트 (Recent Projects)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProjects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => handleQuickOpenProject(proj.id)}
                className="bg-navy-800 border border-navy-600 rounded-xl p-4 text-left hover:border-accent/30 hover:bg-navy-700/50 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="text-sm font-semibold text-gray-200 truncate">{proj.name}</div>
                </div>
                <div className="text-xs text-gray-400 truncate mb-1">{proj.vesselName}</div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{proj.classSociety} | {proj.generatorCount}G / {proj.loadCount}L</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(proj.updatedAt)}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  열기 <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ WORKFLOW (corrected order) ============ */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
          설계 워크플로우 (Design Workflow)
        </h2>
        <p className="text-center text-xs text-gray-500 mb-8">
          부하를 먼저 정의하면, 시스템이 최적의 발전기 구성을 자동으로 추천합니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {workflowSteps.map((item, idx) => (
            <div key={item.step} className="relative">
              <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="text-accent">{item.icon}</div>
                </div>
                <div className="text-sm font-semibold text-gray-200 mb-1">{item.title}</div>
                <div className="text-[10px] text-gray-500 mb-2">{item.titleEn}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{item.description}</div>
              </div>
              {idx < workflowSteps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ChevronRight className="w-5 h-5 text-accent/40" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ============ PURPOSE & TARGET ============ */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 사용 목적 */}
          <div className="bg-navy-800 border border-navy-600 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              사용 목적 (Purpose)
            </h3>
            <ul className="space-y-3 text-xs text-gray-400">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>고가의 상용 소프트웨어(AutoCAD Electrical, ETAP) 없이 <span className="text-gray-300">선박 전기 기본설계</span>를 수행</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>IEC 61363, IEC 60092, SOLAS 국제 기준에 따른 <span className="text-gray-300">정확한 계산</span></span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>부하 데이터 입력만으로 <span className="text-gray-300">발전기, 배터리, 케이블을 자동 선정</span></span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>KR, ABS, DNV 등 <span className="text-gray-300">선급 제출 서류를 한 곳에서 생성</span>하여 승인 과정 간소화</span>
              </li>
            </ul>
          </div>

          {/* 대상 사용자 */}
          <div className="bg-navy-800 border border-navy-600 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Ship className="w-5 h-5 text-accent" />
              대상 사용자 (Target Users)
            </h3>
            <ul className="space-y-3 text-xs text-gray-400">
              {targetUsers.map((user, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>{user}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-navy-700/50 rounded-lg">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                <span className="text-warning font-medium">TIP:</span> 생산설계 경험이 있지만 기본설계가 처음인 분도
                선종 프리셋과 자동 추천 기능으로 쉽게 시작할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ FEATURES ============ */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
          주요 기능 (Features)
        </h2>
        <p className="text-center text-xs text-gray-500 mb-8">
          6가지 핵심 모듈이 유기적으로 연동되어 전체 설계 프로세스를 지원합니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`${feature.bgColor} border ${feature.borderColor} rounded-xl p-5`}
            >
              <div className={`${feature.color} mb-3`}>{feature.icon}</div>
              <h3 className="text-sm font-bold text-gray-200 mb-1">{feature.title}</h3>
              <p className="text-[10px] text-gray-500 mb-2">{feature.titleEn}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ============ EXPECTED BENEFITS ============ */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
          기대 효과 (Expected Benefits)
        </h2>
        <p className="text-center text-xs text-gray-500 mb-8">
          MEDS를 사용하면 기본설계의 품질과 효율이 크게 향상됩니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-navy-800 border border-navy-600 rounded-xl p-5 text-center">
              <div className="flex justify-center mb-3">{benefit.icon}</div>
              <h3 className="text-sm font-bold text-gray-200 mb-2">{benefit.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ============ HOW TO USE ============ */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
          사용 방법 (How to Use)
        </h2>
        <p className="text-center text-xs text-gray-500 mb-8">
          처음 사용하시는 분을 위한 단계별 안내입니다.
        </p>

        <div className="space-y-4">
          {[
            { num: '01', title: '프로젝트 생성', desc: '"새 프로젝트 만들기" 버튼을 클릭하고, 선박명, 선종, 선급, 시스템 전압을 설정합니다. 선종을 선택하면 추천 장비가 자동으로 표시됩니다.' },
            { num: '02', title: '부하 입력 & 조건 설정', desc: '추천된 장비 중 필요한 것을 체크하거나, 직접 부하를 추가합니다. 운항조건별(항해, 입출항, 정박 등) 부하율을 설정하면 총 부하가 자동 계산됩니다.' },
            { num: '03', title: '발전기 자동 추천 확인', desc: '시스템이 부하 분석을 바탕으로 주발전기 용량/대수, 비상발전기, 배터리 용량을 자동으로 추천합니다. 필요 시 수동으로 조정할 수 있습니다.' },
            { num: '04', title: '단선결선도 확인', desc: '확정된 전력계통 데이터로 단선결선도가 자동 생성됩니다. IEC 표준 심볼로 표현되며, SVG/PNG로 내보낼 수 있습니다.' },
            { num: '05', title: '계산서 생성 & 선급 제출', desc: '단락전류, 전압강하, 보호협조 계산을 실행하고, 결과를 PDF/Excel로 내보냅니다. 선급 체크리스트로 제출 준비 상태를 관리합니다.' },
          ].map((step) => (
            <div key={step.num} className="flex gap-4 bg-navy-800/50 border border-navy-700 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold flex items-center justify-center text-sm flex-shrink-0">
                {step.num}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-1">{step.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleOpenHelp}
            className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            더 자세한 사용 가이드 보기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============ APPLICABLE STANDARDS ============ */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
          적용 기준 (Applicable Standards)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { code: 'IEC 61363', name: '선박 단락전류' },
            { code: 'IEC 60092', name: '선박 전기설비' },
            { code: 'SOLAS', name: '해상인명안전' },
            { code: 'KR/ABS/DNV', name: '선급 규정' },
          ].map((std) => (
            <div key={std.code} className="bg-navy-800 border border-navy-600 rounded-lg p-3 text-center">
              <div className="text-xs font-bold text-accent mb-1">{std.code}</div>
              <div className="text-[10px] text-gray-500">{std.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ CTA ============ */}
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-sm text-gray-400 mb-6">
          지금 바로 시작하세요. 선종 프리셋으로 5분 안에 첫 번째 전력 분석을 완료할 수 있습니다.
        </p>
        <button
          onClick={handleCreateNewProject}
          className="inline-flex items-center gap-2 px-10 py-4 bg-accent text-navy-900 font-bold rounded-xl hover:bg-accent-hover transition-colors text-lg shadow-lg shadow-accent/20"
        >
          <Plus className="w-6 h-6" />
          새 프로젝트 시작하기
        </button>
      </div>

      {/* ============ FOOTER ============ */}
      <div className="text-center pb-8 text-xs text-gray-600">
        MEDS v0.1.0 &mdash; Marine Electrical Design Suite
      </div>
    </div>
  );
}
