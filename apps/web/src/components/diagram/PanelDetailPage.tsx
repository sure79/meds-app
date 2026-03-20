import React from 'react';
import { Plus } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import FeederRow from './FeederRow';
import TitleBlock from './titleBlock';
import type { PanelPage } from '../../types';

// ============================================================
// PanelDetailPage - Per-panel feeder detail (HTML layout)
// Matches EB-503 marine electrical drawing panel schedule style
// Vertical bus on left, feeders branching right
// ============================================================

interface PanelDetailPageProps {
  panelPage: PanelPage;
  pageIndex: number;
  totalPages: number;
  editMode: boolean;
}

export default function PanelDetailPage({ panelPage, pageIndex, totalPages, editMode }: PanelDetailPageProps) {
  const { project, addFeeder, removeFeeder } = useProjectStore();

  const bus = project.buses.find(b => b.id === panelPage.busId);
  const busVoltage = bus?.voltage || 440;
  const busFrequency = bus?.frequency || 60;
  const busPhase = bus?.phase || 3;

  const handleAddFeeder = () => {
    addFeeder(panelPage.id, {
      panelPageId: panelPage.id,
      mccbFrameA: 100,
      mccbTripA: 100,
      mccbType: 'MCCB',
      instantTrip: false,
      protectionLabels: [],
      cableType: 'T6',
      cableCircuitNo: String(panelPage.feeders.length + 1).padStart(2, '0'),
      destinationType: 'spare',
      destinationLabel: 'SPARE',
    });
  };

  return (
    <div
      className="bg-white text-black font-mono uppercase print:break-after-page"
      style={{
        width: 1120,
        minHeight: 790,
        border: '2px solid black',
        position: 'relative',
        padding: 0,
      }}
    >
      {/* Inner margin */}
      <div style={{ margin: 10, border: '0.5px solid black', minHeight: 770, position: 'relative' }}>
        {/* Title block (top right) */}
        <div className="absolute top-2 right-2 z-10">
          <TitleBlock
            pageNumber={pageIndex + 1}
            totalPages={totalPages}
            drawingNumber="EB-503"
            projectName={project.meta.projectNumber}
            vesselName={project.meta.vesselName}
            drawingTitle={panelPage.title}
            designer={project.meta.designer}
            date={project.meta.date}
            revision={project.meta.revision}
            classSociety={project.meta.classSociety}
          />
        </div>

        {/* Page title */}
        <div className="px-4 pt-3 pb-2">
          <div className="text-[14px] font-bold tracking-wide">
            {panelPage.title}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            PAGE {String(panelPage.pageNumber).padStart(2, '0')} | DWG. EB-503
          </div>
        </div>

        {/* Panel content area */}
        <div className="flex px-4 pt-2 pb-4">
          {/* Vertical bus bar on left */}
          <div className="flex flex-col items-center flex-shrink-0" style={{ width: 50 }}>
            {/* Bus voltage label */}
            <div className="text-[9px] text-center leading-tight mb-1">
              <div>{busFrequency}</div>
              <div>Hz</div>
              <div className="mt-1">{busPhase}PH</div>
              <div className="mt-1">{busVoltage}</div>
              <div>V</div>
            </div>

            {/* Bus label */}
            <div className="text-[8px] text-center leading-tight mt-2">
              <div>{bus?.type === 'main' ? 'MSB' : bus?.type === 'emergency' ? 'ESB' : 'DB'}</div>
              <div>AC</div>
            </div>
          </div>

          {/* Vertical bus line */}
          <div
            className="flex-shrink-0 relative"
            style={{
              width: 6,
              borderLeft: '4px solid black',
              borderRight: '0px',
              minHeight: Math.max(panelPage.feeders.length * 44 + 80, 400),
            }}
          />

          {/* Feeders area */}
          <div className="flex-1 min-w-0" style={{ maxWidth: 700 }}>
            {/* Column headers */}
            <div className="flex items-center border-b-2 border-black pb-1 mb-1 text-[8px] text-gray-500 tracking-wider">
              <div style={{ width: 6 }} />
              <div style={{ width: 3 }} />
              <div style={{ width: 90 }} className="text-center">MCCB</div>
              <div style={{ width: 70 }} className="text-center">PROT.</div>
              <div style={{ width: 16 }} />
              <div style={{ width: 50 }} className="text-center">CABLE</div>
              <div style={{ width: 30 }} className="text-center">CKT</div>
              <div style={{ width: 16 }} />
              <div style={{ width: 80 }} className="text-center">LOAD</div>
              <div className="flex-1 text-center">DESTINATION</div>
            </div>

            {/* Feeder rows */}
            {panelPage.feeders.map((feeder, idx) => (
              <FeederRow
                key={feeder.id}
                feeder={feeder}
                index={idx}
                editMode={editMode}
                onRemove={() => removeFeeder(feeder.id)}
              />
            ))}

            {/* Empty feeders message */}
            {panelPage.feeders.length === 0 && (
              <div className="py-8 text-center text-[11px] text-gray-400 italic">
                NO FEEDERS ASSIGNED
              </div>
            )}

            {/* Add feeder button */}
            {editMode && (
              <button
                onClick={handleAddFeeder}
                className="flex items-center gap-1 mt-3 px-3 py-1.5 text-[10px] font-mono font-bold text-blue-700 border border-blue-300 border-dashed rounded hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                + FEEDER ADDITIONAL (피더 추가)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
