import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
}

export default function HelpTooltip({ text }: HelpTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <HelpCircle className="w-4 h-4 text-accent/60 hover:text-accent cursor-help transition-colors" />
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-gray-200 bg-navy-700 border border-navy-500 rounded-lg shadow-lg whitespace-pre-line max-w-xs leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-navy-700 border-r border-b border-navy-500 transform rotate-45" />
        </span>
      )}
    </span>
  );
}
