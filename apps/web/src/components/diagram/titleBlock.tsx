import React from 'react';

// ============================================================
// TitleBlock - HTML-based engineering drawing title block
// Matches EB-503 marine electrical drawing conventions
// ============================================================

interface TitleBlockProps {
  pageNumber: number;
  totalPages: number;
  drawingNumber: string;
  projectName: string;
  vesselName: string;
  drawingTitle: string;
  designer: string;
  date: string;
  revision: string;
  classSociety: string;
  scale?: string;
}

export default function TitleBlock({
  pageNumber, totalPages, drawingNumber,
  projectName, vesselName, drawingTitle,
  designer, date, revision, classSociety, scale = 'N.T.S.',
}: TitleBlockProps) {
  const cellClass = 'border border-black px-2 py-1 font-mono text-[10px] uppercase leading-tight';
  const labelClass = 'text-[8px] text-gray-600 uppercase tracking-wide';
  const valueClass = 'text-[10px] font-bold text-black';

  return (
    <div className="border-2 border-black bg-white inline-block" style={{ width: 320 }}>
      {/* Row 1: Drawing title */}
      <div className={`${cellClass} text-center font-bold text-[12px] border-b-2 border-black`}>
        {drawingTitle || 'SINGLE LINE DIAGRAM'}
      </div>

      {/* Row 2: Vessel */}
      <div className={`${cellClass} flex gap-2`}>
        <span className={labelClass}>VESSEL:</span>
        <span className={valueClass}>{vesselName}</span>
      </div>

      {/* Row 3: Project */}
      <div className={`${cellClass} flex gap-2`}>
        <span className={labelClass}>PROJECT:</span>
        <span className={valueClass}>{projectName}</span>
      </div>

      {/* Row 4: Class + Drawing number */}
      <div className={`${cellClass} flex gap-4`}>
        <div className="flex gap-1">
          <span className={labelClass}>CLASS:</span>
          <span className={valueClass}>{classSociety}</span>
        </div>
        <div className="flex gap-1">
          <span className={labelClass}>DWG. NO.:</span>
          <span className={valueClass}>{drawingNumber}</span>
        </div>
      </div>

      {/* Row 5: Designer + Date */}
      <div className={`${cellClass} flex gap-4`}>
        <div className="flex gap-1">
          <span className={labelClass}>DESIGNED:</span>
          <span className={valueClass}>{designer}</span>
        </div>
        <div className="flex gap-1">
          <span className={labelClass}>DATE:</span>
          <span className={valueClass}>{date}</span>
        </div>
      </div>

      {/* Row 6: Scale, REV, Page */}
      <div className={`${cellClass} flex gap-4`}>
        <div className="flex gap-1">
          <span className={labelClass}>SCALE:</span>
          <span className="text-[9px]">{scale}</span>
        </div>
        <div className="flex gap-1">
          <span className={labelClass}>REV:</span>
          <span className={valueClass}>{revision}</span>
        </div>
        <div className="flex gap-1">
          <span className={labelClass}>PAGE:</span>
          <span className={valueClass}>{pageNumber} / {totalPages}</span>
        </div>
      </div>

      {/* Row 7: MEDS identifier */}
      <div className={`${cellClass} text-[8px] border-t-2 border-black`}>
        <span className={labelClass}>MAKER:</span>{' '}
        <span className="font-bold text-[9px]">MEDS - MARINE ELECTRICAL DESIGN SUITE</span>
      </div>
    </div>
  );
}
