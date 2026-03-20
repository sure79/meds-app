import React from 'react';
import type { ShortCircuitResult } from '../../types';
import DataTable, { type Column } from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { formatNumber } from '../../utils/calculations';

interface ShortCircuitTableProps {
  result: ShortCircuitResult;
}

export default function ShortCircuitTable({ result }: ShortCircuitTableProps) {
  const columns: Column<(typeof result.busResults)[0]>[] = [
    {
      key: 'busName',
      label: '모선 (Bus)',
      sortable: true,
    },
    {
      key: 'symmetricalKA',
      label: 'Isc Sym (kA)',
      align: 'right',
      sortable: true,
      render: (row) => <span className="font-mono">{formatNumber(row.symmetricalKA, 2)}</span>,
    },
    {
      key: 'peakKA',
      label: 'Ip Peak (kA)',
      align: 'right',
      sortable: true,
      render: (row) => <span className="font-mono">{formatNumber(row.peakKA, 2)}</span>,
    },
    {
      key: 'breakingKA',
      label: 'Ib Break (kA)',
      align: 'right',
      sortable: true,
      render: (row) => <span className="font-mono">{formatNumber(row.breakingKA, 2)}</span>,
    },
    {
      key: 'cbRatingKA',
      label: 'CB 정격 (kA)',
      align: 'right',
      render: (row) => <span className="font-mono text-accent">{formatNumber(row.cbRatingKA, 2)}</span>,
    },
    {
      key: 'status',
      label: '상태',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={result.busResults}
        getRowId={(row) => row.busId}
      />

      {/* Source breakdown */}
      <div className="mt-4 space-y-3">
        {result.busResults.map((busResult) => (
          <div key={busResult.busId} className="bg-navy-800 rounded-lg border border-navy-600 p-3">
            <h4 className="text-xs font-medium text-gray-400 mb-2">
              {busResult.busName} - 기여 전류 상세 (Fault Current Sources)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {busResult.sources.map((src, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1 bg-navy-700/50 rounded text-xs">
                  <span className="text-gray-400">{src.sourceName}</span>
                  <span className="font-mono text-gray-200">{formatNumber(src.contributionKA, 2)} kA</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
