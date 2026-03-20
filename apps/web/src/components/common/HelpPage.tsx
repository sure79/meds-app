import React, { useState } from 'react';
import {
  BookOpen, BarChart3, GitBranch, Zap, Plug, Shield, FileCheck,
  HelpCircle, ChevronDown, ChevronRight, Lightbulb, AlertTriangle, Info, Ship,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: 'getting-started',
    icon: <BookOpen className="w-5 h-5" />,
    title: '1. 시작하기 (Getting Started)',
    content: (
      <div className="space-y-4">
        <HelpBlock icon="info" title="이 기능이 뭔가요?">
          MEDS는 선박 전기 설계에 필요한 모든 계산과 도면을 한곳에서 관리하는 프로그램입니다.
          프로젝트를 만들면 발전기, 배전반, 부하 정보를 입력하고 다양한 전기 계산을 수행할 수 있습니다.
        </HelpBlock>
        <HelpBlock icon="why" title="왜 필요한가요?">
          선박 전기 설계에서는 전력 부하 분석, 단락전류 계산, 전압강하 검토, 보호협조 등
          여러 가지 복잡한 계산이 필요합니다. MEDS를 사용하면 이 모든 과정을 체계적으로 관리할 수 있습니다.
        </HelpBlock>
        <HelpBlock icon="how" title="어떻게 사용하나요?">
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>프로젝트 정보 확인</strong> - 선박명, 선급, 전압 등 기본 정보가 설정되어 있는지 확인합니다.</li>
            <li><strong>발전기 설정</strong> - 주발전기, 비상발전기의 용량과 사양을 입력합니다.</li>
            <li><strong>부하 추가</strong> - 선박에 설치되는 전기 장비를 하나씩 등록합니다. 프리셋을 사용하면 빠릅니다.</li>
            <li><strong>계산 실행</strong> - 전력 부하 분석이 자동으로 실행됩니다. 결과를 확인하세요.</li>
            <li><strong>다른 모듈 진행</strong> - 좌측 사이드바에서 순서대로 다음 단계를 진행합니다.</li>
          </ol>
        </HelpBlock>
        <HelpBlock icon="warning" title="주의사항">
          <ul className="list-disc list-inside space-y-1">
            <li>작업 내용은 30초마다 자동 저장되지만, 중요한 변경 후에는 수동으로 저장하세요.</li>
            <li>프로젝트 파일을 JSON으로 내보내서 백업할 수 있습니다.</li>
            <li>브라우저의 개인정보 모드에서는 저장이 안 될 수 있습니다.</li>
          </ul>
        </HelpBlock>
      </div>
    ),
  },
  {
    id: 'load-balance',
    icon: <BarChart3 className="w-5 h-5" />,
    title: '2. 전력 부하 분석 (Load Balance)',
    content: (
      <div className="space-y-4">
        <HelpBlock icon="info" title="이 기능이 뭔가요?">
          전력 부하 분석은 선박의 발전기 용량이 모든 운항 조건에서 충분한지 확인하는 과정입니다.
          항해 중, 입출항, 하역 작업 등 각 상황별로 사용되는 전력을 계산하여
          발전기가 감당할 수 있는지 판단합니다.
        </HelpBlock>
        <HelpBlock icon="why" title="왜 필요한가요?">
          <ul className="list-disc list-inside space-y-1">
            <li>선급 승인을 위해 반드시 제출해야 하는 필수 계산서입니다.</li>
            <li>발전기 용량이 부족하면 정전 사고가 발생할 수 있습니다.</li>
            <li>반대로 과도한 용량은 연료 낭비와 비용 증가를 초래합니다.</li>
            <li>부하율은 일반적으로 80% 이하를 유지해야 안전합니다.</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="how" title="어떻게 사용하나요?">
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>발전기 추가/확인</strong> - 좌측 패널 상단의 "추가" 버튼으로 발전기를 등록합니다.</li>
            <li><strong>부하 추가</strong> - "프리셋" 버튼을 누르면 선종별 표준 부하를 한번에 추가할 수 있습니다. 개별 추가도 가능합니다.</li>
            <li><strong>부하율 설정</strong> - 각 부하의 운항 조건별 사용률(0~1)을 설정합니다. 예: 항해 중 1.0 = 100% 사용</li>
            <li><strong>결과 확인</strong> - 표와 차트에서 각 조건별 부하율을 확인합니다. 80% 이하가 녹색, 80~100%가 노란색, 100% 이상은 빨간색입니다.</li>
            <li><strong>CSV 내보내기</strong> - 결과를 CSV 파일로 저장하여 보고서에 활용할 수 있습니다.</li>
          </ol>
        </HelpBlock>
        <HelpBlock icon="warning" title="주의사항">
          <ul className="list-disc list-inside space-y-1">
            <li>부하율 80% 초과: 발전기 용량 증가 또는 불필요한 부하 제거를 검토하세요.</li>
            <li>비상 조건(Emergency)은 비상발전기만으로 계산됩니다.</li>
            <li>다양성 계수(Diversity Factor)를 적절히 설정하면 더 현실적인 결과를 얻을 수 있습니다.</li>
            <li>모선연결기(Bus Tie) 상태에 따라 결과가 달라질 수 있습니다.</li>
          </ul>
        </HelpBlock>
      </div>
    ),
  },
  {
    id: 'diagram',
    icon: <GitBranch className="w-5 h-5" />,
    title: '3. 단선결선도 (Single Line Diagram)',
    content: (
      <div className="space-y-4">
        <HelpBlock icon="info" title="이 기능이 뭔가요?">
          단선결선도(SLD)는 선박의 전력 계통을 한 장의 도면으로 보여주는 기본 도면입니다.
          발전기, 배전반, 부하, 차단기의 연결 관계를 시각적으로 표현합니다.
        </HelpBlock>
        <HelpBlock icon="why" title="왜 필요한가요?">
          <ul className="list-disc list-inside space-y-1">
            <li>선급 승인의 필수 제출 도면입니다.</li>
            <li>전기 계통 전체를 한눈에 파악할 수 있습니다.</li>
            <li>시공 및 유지보수 시 참고 자료로 사용됩니다.</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="how" title="어떻게 사용하나요?">
          <ol className="list-decimal list-inside space-y-2">
            <li>전력 부하 분석에서 입력한 데이터를 기반으로 자동 생성됩니다.</li>
            <li>마우스로 드래그하여 배전반 위치를 조정할 수 있습니다.</li>
            <li>확대/축소 기능으로 세부 사항을 확인하세요.</li>
            <li>PNG/SVG 형식으로 내보내기가 가능합니다.</li>
          </ol>
        </HelpBlock>
        <HelpBlock icon="warning" title="주의사항">
          <ul className="list-disc list-inside space-y-1">
            <li>부하와 발전기 정보를 먼저 입력해야 도면이 정확하게 생성됩니다.</li>
            <li>배전반 위치를 변경한 후에는 저장을 잊지 마세요.</li>
          </ul>
        </HelpBlock>
      </div>
    ),
  },
  {
    id: 'short-circuit',
    icon: <Zap className="w-5 h-5" />,
    title: '4. 단락전류 계산 (Short Circuit)',
    content: (
      <div className="space-y-4">
        <HelpBlock icon="info" title="이 기능이 뭔가요?">
          단락전류 계산은 전기 사고(합선) 발생 시 각 배전반에 흐르는 최대 전류를 계산합니다.
          이 값을 기준으로 차단기와 케이블의 차단 용량이 충분한지 확인합니다.
        </HelpBlock>
        <HelpBlock icon="why" title="왜 필요한가요?">
          <ul className="list-disc list-inside space-y-1">
            <li>차단기가 단락전류를 차단하지 못하면 화재나 폭발이 발생할 수 있습니다.</li>
            <li>선급에서 모든 차단기의 차단 용량이 단락전류보다 큰지 확인합니다.</li>
            <li>IEC 61363-1 표준에 따른 계산이 필요합니다.</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="how" title="어떻게 사용하나요?">
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>전동기 기여 포함</strong> 옵션을 설정합니다. 전동기도 단락 시 전류를 공급하므로 일반적으로 포함합니다.</li>
            <li><strong>모선연결기 상태</strong>를 설정합니다. 연결 시 양쪽 발전기의 전류가 합산됩니다.</li>
            <li>"계산" 버튼을 누르면 각 배전반별 단락전류가 계산됩니다.</li>
            <li>결과에서 차단기 용량과 비교하여 적합 여부를 확인합니다.</li>
          </ol>
        </HelpBlock>
        <HelpBlock icon="warning" title="주의사항">
          <ul className="list-disc list-inside space-y-1">
            <li>발전기의 과도 리액턴스(Xd'') 값이 정확해야 계산 결과가 신뢰할 수 있습니다.</li>
            <li>모선연결기가 닫힌 상태일 때 단락전류가 가장 크므로 이 조건으로 차단기를 선정합니다.</li>
            <li>결과가 "FAIL"이면 차단기를 더 큰 용량으로 교체해야 합니다.</li>
          </ul>
        </HelpBlock>
      </div>
    ),
  },
  {
    id: 'voltage-drop',
    icon: <Plug className="w-5 h-5" />,
    title: '5. 전압강하 계산 (Voltage Drop)',
    content: (
      <div className="space-y-4">
        <HelpBlock icon="info" title="이 기능이 뭔가요?">
          전압강하 계산은 배전반에서 각 부하까지 케이블을 통해 전력을 보낼 때
          케이블 저항으로 인해 전압이 얼마나 떨어지는지 계산합니다.
          또한 적정한 케이블 크기를 자동으로 추천합니다.
        </HelpBlock>
        <HelpBlock icon="why" title="왜 필요한가요?">
          <ul className="list-disc list-inside space-y-1">
            <li>전압이 너무 떨어지면 전동기가 정상 동작하지 않습니다.</li>
            <li>선급 규정: 정상 운전 시 5% 이내, 기동 시 15% 이내를 만족해야 합니다.</li>
            <li>케이블이 너무 가늘면 과열되어 화재 위험이 있습니다.</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="how" title="어떻게 사용하나요?">
          <ol className="list-decimal list-inside space-y-2">
            <li>각 부하의 케이블 길이와 종류가 입력되어 있는지 확인합니다.</li>
            <li>주변 온도와 케이블 종류를 설정합니다.</li>
            <li>"계산" 버튼을 눌러 전압강하를 계산합니다.</li>
            <li>결과에서 녹색(OK)이면 합격, 빨간색(FAIL)이면 케이블 크기를 키워야 합니다.</li>
            <li>시스템이 권장 케이블 크기를 자동으로 제시합니다.</li>
          </ol>
        </HelpBlock>
        <HelpBlock icon="warning" title="주의사항">
          <ul className="list-disc list-inside space-y-1">
            <li>케이블 길이는 실제 포설 경로를 따라 정확하게 측정해야 합니다.</li>
            <li>전동기 기동 시 전압강하가 15%를 초과하면 기동이 실패할 수 있습니다.</li>
            <li>케이블 허용전류(Ampacity)도 함께 확인하세요.</li>
          </ul>
        </HelpBlock>
      </div>
    ),
  },
  {
    id: 'protection',
    icon: <Shield className="w-5 h-5" />,
    title: '6. 보호협조 (Protection Coordination)',
    content: (
      <div className="space-y-4">
        <HelpBlock icon="info" title="이 기능이 뭔가요?">
          보호협조는 사고 발생 시 해당 구간의 차단기만 올바르게 동작하도록 설정하는 과정입니다.
          TCC(Time-Current Characteristic) 곡선을 사용하여 각 차단기의 동작 시간을 비교합니다.
        </HelpBlock>
        <HelpBlock icon="why" title="왜 필요한가요?">
          <ul className="list-disc list-inside space-y-1">
            <li>잘못된 차단기가 먼저 동작하면 넓은 범위가 정전됩니다.</li>
            <li>예: 조명 회로 사고 시 주배전반 차단기가 동작하면 선박 전체가 정전됩니다.</li>
            <li>선급에서 보호협조 검토를 필수로 요구합니다.</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="how" title="어떻게 사용하나요?">
          <ol className="list-decimal list-inside space-y-2">
            <li>차단기 목록에서 비교할 차단기들을 선택합니다.</li>
            <li>TCC 차트에서 각 차단기의 동작 곡선이 겹치지 않는지 확인합니다.</li>
            <li>하위 차단기(부하 측)가 상위 차단기(전원 측)보다 먼저 동작해야 합니다.</li>
            <li>곡선 간 최소 0.3초 이상의 간격(마진)이 필요합니다.</li>
          </ol>
        </HelpBlock>
        <HelpBlock icon="warning" title="주의사항">
          <ul className="list-disc list-inside space-y-1">
            <li>차단기 제조사의 정확한 트립 곡선 데이터가 필요합니다.</li>
            <li>MCCB, ACB, VCB 등 차단기 종류에 따라 특성이 다릅니다.</li>
            <li>퓨즈와 차단기의 협조도 확인해야 합니다.</li>
          </ul>
        </HelpBlock>
      </div>
    ),
  },
  {
    id: 'class-submission',
    icon: <FileCheck className="w-5 h-5" />,
    title: '7. 선급 제출 (Class Submission)',
    content: (
      <div className="space-y-4">
        <HelpBlock icon="info" title="이 기능이 뭔가요?">
          선급 제출은 선급(KR, DNV, ABS 등)에 승인을 받기 위해 필요한 도면과 계산서를
          체크리스트로 관리하는 기능입니다. 각 서류의 준비 상태를 추적할 수 있습니다.
        </HelpBlock>
        <HelpBlock icon="why" title="왜 필요한가요?">
          <ul className="list-disc list-inside space-y-1">
            <li>선급 승인 없이는 선박을 운항할 수 없습니다.</li>
            <li>누락된 서류가 있으면 승인이 지연됩니다.</li>
            <li>체크리스트로 관리하면 빠짐없이 준비할 수 있습니다.</li>
          </ul>
        </HelpBlock>
        <HelpBlock icon="how" title="어떻게 사용하나요?">
          <ol className="list-decimal list-inside space-y-2">
            <li>선급 종류를 확인합니다 (프로젝트 설정에서 지정).</li>
            <li>체크리스트에서 각 서류의 상태를 업데이트합니다.</li>
            <li>MEDS에서 생성한 계산서와 도면을 내보내기합니다.</li>
            <li>모든 항목이 녹색(완료)이 되면 제출 준비가 완료된 것입니다.</li>
          </ol>
        </HelpBlock>
        <HelpBlock icon="warning" title="주의사항">
          <ul className="list-disc list-inside space-y-1">
            <li>선급마다 요구하는 서류가 다를 수 있으므로 해당 선급의 규정을 확인하세요.</li>
            <li>계산서는 최종 데이터로 작성해야 합니다. 데이터 변경 시 재계산이 필요합니다.</li>
            <li>제출 전 모든 계산 결과가 규정을 만족하는지 다시 확인하세요.</li>
          </ul>
        </HelpBlock>
      </div>
    ),
  },
  {
    id: 'faq',
    icon: <HelpCircle className="w-5 h-5" />,
    title: '8. 자주 묻는 질문 (FAQ)',
    content: (
      <div className="space-y-4">
        <FAQItem
          q="데이터는 어디에 저장되나요?"
          a="브라우저의 로컬 스토리지에 저장됩니다. 30초마다 자동 저장되며, JSON 파일로 내보내서 백업할 수도 있습니다. 브라우저 데이터를 삭제하면 프로젝트도 삭제되므로, 중요한 프로젝트는 반드시 JSON으로 내보내서 보관하세요."
        />
        <FAQItem
          q="부하율은 몇 %가 적절한가요?"
          a="일반적으로 80% 이하를 권장합니다. 80%를 초과하면 발전기에 여유가 부족해 부하 변동 시 문제가 발생할 수 있습니다. 선급에서는 보통 최대 85~90%를 허용하지만, 설계 단계에서는 80% 이하를 목표로 하는 것이 좋습니다."
        />
        <FAQItem
          q="프리셋은 어떻게 사용하나요?"
          a="부하 목록 옆의 '프리셋' 버튼을 누르면 선종별 표준 부하 목록이 나옵니다. 원하는 선종을 선택하면 일반적인 부하들이 자동으로 추가됩니다. 추가 후에 각 부하의 세부 사항을 수정할 수 있습니다."
        />
        <FAQItem
          q="API 계산과 로컬 계산의 차이는 뭔가요?"
          a="로컬 계산은 브라우저에서 간이 방식으로 수행되며, API 계산은 서버에서 IEC 표준에 따른 정밀 계산을 수행합니다. API 서버가 연결되지 않은 경우 자동으로 로컬 계산으로 대체됩니다."
        />
        <FAQItem
          q="여러 사람이 동시에 작업할 수 있나요?"
          a="현재 버전은 단일 사용자 전용입니다. JSON 파일을 공유하여 다른 사람에게 프로젝트를 전달할 수 있습니다."
        />
        <FAQItem
          q="인쇄 또는 PDF로 내보낼 수 있나요?"
          a="브라우저의 인쇄 기능(Ctrl+P)을 사용하면 PDF로 저장할 수 있습니다. CSV 내보내기 기능으로 엑셀에서도 활용할 수 있습니다."
        />
      </div>
    ),
  },
];

function HelpBlock({ icon, title, children }: { icon: 'info' | 'why' | 'how' | 'warning'; title: string; children: React.ReactNode }) {
  const iconMap = {
    info: <Info className="w-4 h-4 text-accent" />,
    why: <Lightbulb className="w-4 h-4 text-yellow-400" />,
    how: <BookOpen className="w-4 h-4 text-green-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  };

  const borderMap = {
    info: 'border-accent/30',
    why: 'border-yellow-400/30',
    how: 'border-green-400/30',
    warning: 'border-orange-400/30',
  };

  return (
    <div className={`border-l-2 ${borderMap[icon]} pl-4 py-1`}>
      <div className="flex items-center gap-2 mb-2">
        {iconMap[icon]}
        <span className="text-sm font-semibold text-gray-200">{title}</span>
      </div>
      <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-navy-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-700/50 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4 text-accent flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
        <span className="text-sm font-medium text-gray-200">{q}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pl-11 text-sm text-gray-400 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const { setActiveModule } = useProjectStore();

  return (
    <div className="flex h-full">
      {/* Left: Table of Contents */}
      <div className="w-64 flex-shrink-0 bg-navy-800 border-r border-navy-600 flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-navy-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold text-gray-200">도움말 (Help)</h2>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">MEDS 사용 설명서</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors text-sm ${
                activeSection === section.id
                  ? 'bg-navy-700 text-accent border-r-2 border-accent'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-700/50'
              }`}
            >
              {section.icon}
              <span className="truncate text-xs">{section.title}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-navy-600 p-3">
          <button
            onClick={() => setActiveModule('welcome')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-navy-700 text-gray-300 rounded-lg hover:bg-navy-600 transition-colors text-xs"
          >
            <Ship className="w-4 h-4" />
            홈으로 돌아가기
          </button>
        </div>
      </div>

      {/* Right: Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {sections.map((section) =>
            section.id === activeSection ? (
              <div key={section.id}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-accent">{section.icon}</div>
                  <h1 className="text-xl font-bold text-gray-200">{section.title}</h1>
                </div>
                {section.content}
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
