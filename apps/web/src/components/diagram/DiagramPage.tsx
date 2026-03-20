import React, { useState, useCallback, useMemo } from 'react';
import {
  Printer, Download, RefreshCw, Edit3, Eye,
  ChevronLeft, ChevronRight, Link2, Plus,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import KeyDiagram from './KeyDiagram';
import PanelDetailPage from './PanelDetailPage';
import ConnectionEditor from './ConnectionEditor';
import './DiagramPrintStyles.css';

// ============================================================
// DiagramPage - Main container for HTML-based SLD pages
// Tab bar with Key Diagram + per-panel tabs
// Edit mode toggle, print, and PDF export
// ============================================================

type ActiveTab = 'key-diagram' | string; // string = panelPage.id

export default function DiagramPage() {
  const {
    project, panelPages,
    autoGeneratePanelPages, removePanelPage, addPanelPage,
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('key-diagram');
  const [editMode, setEditMode] = useState(false);
  const [showConnectionEditor, setShowConnectionEditor] = useState(false);

  // Total pages for title block numbering
  const totalPages = 1 + panelPages.length;

  // Ensure panelPages are generated
  const handleAutoGenerate = useCallback(() => {
    autoGeneratePanelPages();
    setActiveTab('key-diagram');
  }, [autoGeneratePanelPages]);

  // Print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Export as HTML (simple approach - user can then save as PDF from print dialog)
  const handleExportPdf = useCallback(() => {
    // Trigger print dialog which supports "Save as PDF"
    window.print();
  }, []);

  // Navigate to panel from key diagram
  const handleSelectBus = useCallback((busId: string) => {
    const panelPage = panelPages.find(pp => pp.busId === busId);
    if (panelPage) {
      setActiveTab(panelPage.id);
    } else {
      // Auto-create a panel page for this bus
      const bus = project.buses.find(b => b.id === busId);
      if (bus) {
        const busLabel = bus.name.split('(')[0].trim();
        addPanelPage(busId, `${busLabel} AC${bus.voltage}V FEEDER PANEL`);
        // We need to wait for next render to get the new panel page id
        // For now, trigger auto-generate
        autoGeneratePanelPages();
        const newPage = panelPages.find(pp => pp.busId === busId);
        if (newPage) setActiveTab(newPage.id);
      }
    }
  }, [panelPages, project.buses, addPanelPage, autoGeneratePanelPages]);

  // Group panel pages by bus for tab display
  const panelPagesByBus = useMemo(() => {
    const map = new Map<string, typeof panelPages>();
    for (const pp of panelPages) {
      const arr = map.get(pp.busId) || [];
      arr.push(pp);
      map.set(pp.busId, arr);
    }
    return map;
  }, [panelPages]);

  // Active panel page
  const activePanelPage = activeTab !== 'key-diagram'
    ? panelPages.find(pp => pp.id === activeTab)
    : null;

  // Pagination within bus pages
  const currentBusPages = activePanelPage
    ? panelPages.filter(pp => pp.busId === activePanelPage.busId)
    : [];
  const currentPageIndex = activePanelPage
    ? currentBusPages.findIndex(pp => pp.id === activePanelPage.id)
    : -1;

  return (
    <div className="flex flex-col h-full">
      {/* Top Toolbar */}
      <div className="diagram-toolbar flex items-center justify-between px-3 py-1.5 bg-navy-800 border-b border-navy-600 gap-2 flex-wrap no-print">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-300 mr-2">
            단선도 (SLD)
          </h2>

          {/* Auto-generate button */}
          <button
            onClick={handleAutoGenerate}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-300 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded transition-colors"
            title="프로젝트 데이터에서 자동 생성 (Auto-generate from project data)"
          >
            <RefreshCw className="w-3 h-3" />
            자동 생성
          </button>

          {/* Edit mode toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium border rounded transition-colors ${
              editMode
                ? 'text-yellow-300 bg-yellow-900/30 border-yellow-600'
                : 'text-gray-300 bg-navy-700 border-navy-600 hover:bg-navy-600'
            }`}
            title="연결 편집 모드 (Connection Edit Mode)"
          >
            {editMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {editMode ? '편집 모드' : '보기 모드'}
          </button>

          {/* Connection editor */}
          {editMode && (
            <button
              onClick={() => setShowConnectionEditor(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-300 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded transition-colors"
              title="연결 편집기 (Connection Editor)"
            >
              <Link2 className="w-3 h-3" />
              연결 편집
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-300 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded transition-colors"
            title="인쇄 (Print)"
          >
            <Printer className="w-3 h-3" />
            인쇄
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-300 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded transition-colors"
            title="PDF 내보내기 (Export PDF via Print)"
          >
            <Download className="w-3 h-3" />
            PDF
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="diagram-tabs flex items-center bg-navy-900 border-b border-navy-600 px-2 overflow-x-auto no-print">
        {/* Key Diagram tab */}
        <button
          onClick={() => setActiveTab('key-diagram')}
          className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-mono font-medium border-b-2 transition-colors ${
            activeTab === 'key-diagram'
              ? 'text-accent border-accent bg-navy-800'
              : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
          }`}
        >
          KEY DIAGRAM (총괄 계통도)
        </button>

        {/* Panel tabs grouped by bus */}
        {Array.from(panelPagesByBus.entries()).map(([busId, pages]) => {
          const bus = project.buses.find(b => b.id === busId);
          const busLabel = bus ? bus.name.split('(')[0].trim() : 'BUS';
          const isActive = pages.some(pp => pp.id === activeTab);

          return (
            <div key={busId} className="flex items-center flex-shrink-0">
              <div className="w-px h-4 bg-navy-600 mx-1" />
              {pages.map((pp, idx) => (
                <button
                  key={pp.id}
                  onClick={() => setActiveTab(pp.id)}
                  className={`flex-shrink-0 px-2 py-1.5 text-[10px] font-mono font-medium border-b-2 transition-colors ${
                    pp.id === activeTab
                      ? 'text-accent border-accent bg-navy-800'
                      : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  {busLabel} {pages.length > 1 ? `P${idx + 1}` : ''}
                </button>
              ))}
            </div>
          );
        })}

        {/* No panels message */}
        {panelPages.length === 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 text-[10px] text-gray-500 italic">
            패널 없음 - "자동 생성" 버튼을 클릭하세요 (No panels - click "Auto Generate")
          </div>
        )}
      </div>

      {/* Page navigation (for multi-page panels) */}
      {activePanelPage && currentBusPages.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-1 bg-navy-800 border-b border-navy-600 no-print">
          <button
            onClick={() => {
              if (currentPageIndex > 0) setActiveTab(currentBusPages[currentPageIndex - 1].id);
            }}
            disabled={currentPageIndex <= 0}
            className="p-0.5 text-gray-400 hover:text-gray-200 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-gray-400 font-mono">
            PAGE {currentPageIndex + 1} / {currentBusPages.length}
          </span>
          <button
            onClick={() => {
              if (currentPageIndex < currentBusPages.length - 1) setActiveTab(currentBusPages[currentPageIndex + 1].id);
            }}
            disabled={currentPageIndex >= currentBusPages.length - 1}
            className="p-0.5 text-gray-400 hover:text-gray-200 disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4 print:p-0 print:bg-white">
        {/* Screen: show active tab only */}
        <div className="flex justify-center print:hidden">
          {activeTab === 'key-diagram' ? (
            <div className="diagram-page">
              <KeyDiagram
                editMode={editMode}
                totalPages={totalPages}
                onSelectBus={handleSelectBus}
              />
            </div>
          ) : activePanelPage ? (
            <div className="diagram-page">
              <PanelDetailPage
                panelPage={activePanelPage}
                pageIndex={panelPages.indexOf(activePanelPage)}
                totalPages={totalPages}
                editMode={editMode}
              />
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="text-[14px] font-mono uppercase mb-2">
                NO PANEL SELECTED
              </div>
              <div className="text-[11px]">
                "자동 생성" 버튼을 클릭하여 프로젝트 데이터에서 패널 페이지를 생성하세요.
              </div>
              <div className="text-[11px] mt-1">
                Click "Auto Generate" to create panel pages from project data.
              </div>
              <button
                onClick={handleAutoGenerate}
                className="mt-4 flex items-center gap-1 mx-auto px-4 py-2 text-[11px] font-mono font-bold text-white bg-navy-700 hover:bg-navy-600 border border-navy-500 rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                AUTO GENERATE (자동 생성)
              </button>
            </div>
          )}
        </div>

        {/* Print: render ALL pages for multi-page print */}
        <div className="hidden print:block">
          {/* Key diagram always first */}
          <div className="diagram-page">
            <KeyDiagram
              editMode={false}
              totalPages={totalPages}
              onSelectBus={() => {}}
            />
          </div>

          {/* All panel pages */}
          {panelPages.map((pp, idx) => (
            <div key={pp.id} className="diagram-page">
              <PanelDetailPage
                panelPage={pp}
                pageIndex={idx}
                totalPages={totalPages}
                editMode={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Connection Editor Modal */}
      <ConnectionEditor
        isOpen={showConnectionEditor}
        onClose={() => setShowConnectionEditor(false)}
      />
    </div>
  );
}
