import React from 'react';

interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'fail';
  label?: string;
  className?: string;
}

const statusStyles: Record<string, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  ok: { bg: 'bg-success/15', text: 'text-success', dot: 'bg-success', defaultLabel: 'OK' },
  warning: { bg: 'bg-warning/15', text: 'text-warning', dot: 'bg-warning', defaultLabel: '주의 (Warning)' },
  fail: { bg: 'bg-danger/15', text: 'text-danger', dot: 'bg-danger', defaultLabel: '초과 (Fail)' },
};

export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label || style.defaultLabel}
    </span>
  );
}
