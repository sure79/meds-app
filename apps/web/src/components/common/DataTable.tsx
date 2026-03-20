import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T, index: number) => void;
  selectedRowId?: string;
  getRowId?: (item: T) => string;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  selectedRowId,
  getRowId,
  emptyMessage = '데이터가 없습니다 (No data)',
  className = '',
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const cellPadding = compact ? 'px-2 py-1' : 'px-4 py-2.5';

  return (
    <div className={`overflow-auto rounded-lg border border-navy-600 ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-700 border-b border-navy-600">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  ${cellPadding} text-xs font-semibold text-gray-400 uppercase tracking-wide
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  ${col.sortable ? 'cursor-pointer hover:text-gray-200 select-none' : ''}
                `}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item, idx) => {
              const rowId = getRowId ? getRowId(item) : item.id;
              const isSelected = selectedRowId && rowId === selectedRowId;
              return (
                <tr
                  key={rowId ?? idx}
                  onClick={() => onRowClick?.(item, idx)}
                  className={`
                    border-b border-navy-700 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-navy-600' : 'hover:bg-navy-800/50'}
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`
                        ${cellPadding} text-gray-300
                        ${col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'}
                      `}
                    >
                      {col.render ? col.render(item, idx) : item[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
