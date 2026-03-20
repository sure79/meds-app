import React from 'react';
import type { VoltageDropResult } from '../../types';
import DataTable, { type Column } from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { formatNumber } from '../../utils/calculations';

interface VoltageDropTableProps {
  result: VoltageDropResult;
}

export default function VoltageDropTable({ result }: VoltageDropTableProps) {
  const columns: Column<(typeof result.loads)[0]>[] = [
    {
      key: 'loadName',
      label: '부하명 (Load)',
      sortable: true,
    },
    {
      key: 'ratedCurrentA',
      label: '정격전류 (A)',
      align: 'right',
      sortable: true,
      render: (row) => <span className="font-mono">{formatNumber(row.ratedCurrentA, 1)}</span>,
    },
    {
      key: 'cableSizeMM2',
      label: '케이블 (mm2)',
      align: 'right',
      render: (row) => <span className="font-mono">{row.cableSizeMM2}</span>,
    },
    {
      key: 'cableAmpacity',
      label: '허용전류 (A)',
      align: 'right',
      render: (row) => <span className="font-mono text-gray-400">{formatNumber(row.cableAmpacity, 0)}</span>,
    },
    {
      key: 'cableLengthM',
      label: '길이 (m)',
      align: 'right',
      render: (row) => <span className="font-mono">{row.cableLengthM}</span>,
    },
    {
      key: 'runningVDPercent',
      label: '정상 VD%',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className={`font-mono font-semibold ${
          row.runningVDPercent > 5 ? 'text-danger' : row.runningVDPercent > 3 ? 'text-warning' : 'text-success'
        }`}>
          {formatNumber(row.runningVDPercent, 2)}%
        </span>
      ),
    },
    {
      key: 'startingVDPercent',
      label: '기동 VD%',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className={`font-mono ${
          row.startingVDPercent > 15 ? 'text-danger' : row.startingVDPercent > 10 ? 'text-warning' : 'text-gray-400'
        }`}>
          {row.startingVDPercent > 0 ? `${formatNumber(row.startingVDPercent, 2)}%` : '-'}
        </span>
      ),
    },
    {
      key: 'limitPercent',
      label: '기준 (%)',
      align: 'center',
      render: (row) => <span className="font-mono text-gray-500">{row.limitPercent}%</span>,
    },
    {
      key: 'status',
      label: '상태',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'recommendedSizeMM2',
      label: '추천 (mm2)',
      align: 'right',
      render: (row) => row.recommendedSizeMM2 ? (
        <span className="font-mono text-accent">{row.recommendedSizeMM2}</span>
      ) : (
        <span className="text-gray-600">-</span>
      ),
    },
  ];

  return <DataTable columns={columns} data={result.loads} getRowId={(row) => row.loadId} />;
}
