import React from 'react';
import type { LoadBalanceResult } from '../../types';
import { useProjectStore } from '../../stores/projectStore';
import StatusBadge from '../common/StatusBadge';
import { getConditionShortLabel, formatNumber } from '../../utils/calculations';

interface LoadBalanceTableProps {
  result: LoadBalanceResult;
}

export default function LoadBalanceTable({ result }: LoadBalanceTableProps) {
  const { project } = useProjectStore();
  const conditions = project.activeConditions;

  return (
    <div className="overflow-auto rounded-lg border border-navy-600">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-700 border-b border-navy-600">
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase sticky left-0 bg-navy-700 z-10 min-w-[200px]">
              부하명 (Load)
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase w-20">
              정격 kW
            </th>
            {conditions.map(cond => (
              <th key={cond} className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase min-w-[80px]">
                {getConditionShortLabel(cond)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row) => {
            const load = project.loads.find(l => l.id === row.loadId);
            const bus = load ? project.buses.find(b => b.id === load.connectedBusId) : null;
            return (
              <tr key={row.loadId} className="border-b border-navy-700/50 hover:bg-navy-800/30">
                <td className="px-3 py-1.5 text-left sticky left-0 bg-navy-900/80 z-10">
                  <div className="text-gray-300 text-sm">{row.loadName}</div>
                  {bus && <div className="text-[10px] text-gray-500">{bus.name}</div>}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-gray-400">
                  {formatNumber(row.ratedKW, 1)}
                </td>
                {conditions.map(cond => {
                  const val = row.conditions[cond] || 0;
                  return (
                    <td key={cond} className="px-3 py-1.5 text-center font-mono">
                      <span className={val > 0 ? 'text-gray-200' : 'text-gray-600'}>
                        {val > 0 ? formatNumber(val, 1) : '-'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {/* Total Running kW */}
          <tr className="border-t-2 border-navy-500 bg-navy-800">
            <td className="px-3 py-2 text-left font-semibold text-gray-300 sticky left-0 bg-navy-800 z-10">
              합계 (Total Running kW)
            </td>
            <td className="px-3 py-2 text-right font-mono text-gray-400">
              {formatNumber(project.loads.reduce((s, l) => s + l.ratedPowerKW * l.quantity, 0), 1)}
            </td>
            {conditions.map(cond => {
              const summary = result.summaries.find(s => s.condition === cond);
              return (
                <td key={cond} className="px-3 py-2 text-center font-mono font-semibold text-gray-200">
                  {summary ? formatNumber(summary.totalRunningKW, 1) : '-'}
                </td>
              );
            })}
          </tr>

          {/* Generator Capacity */}
          <tr className="bg-navy-800">
            <td className="px-3 py-2 text-left text-gray-400 sticky left-0 bg-navy-800 z-10">
              발전 용량 (Gen Capacity kW)
            </td>
            <td className="px-3 py-2"></td>
            {conditions.map(cond => {
              const summary = result.summaries.find(s => s.condition === cond);
              return (
                <td key={cond} className="px-3 py-2 text-center font-mono text-accent">
                  {summary ? formatNumber(summary.generatorCapacityKW, 0) : '-'}
                </td>
              );
            })}
          </tr>

          {/* Load Percent */}
          <tr className="bg-navy-800">
            <td className="px-3 py-2 text-left text-gray-400 sticky left-0 bg-navy-800 z-10">
              부하율 (Load %)
            </td>
            <td className="px-3 py-2"></td>
            {conditions.map(cond => {
              const summary = result.summaries.find(s => s.condition === cond);
              if (!summary) return <td key={cond} className="px-3 py-2 text-center">-</td>;
              return (
                <td key={cond} className="px-3 py-2 text-center">
                  <span className={`font-mono font-bold ${
                    summary.loadPercent > 100 ? 'text-danger' :
                    summary.loadPercent > 80 ? 'text-warning' : 'text-success'
                  }`}>
                    {formatNumber(summary.loadPercent, 1)}%
                  </span>
                </td>
              );
            })}
          </tr>

          {/* Status */}
          <tr className="bg-navy-800">
            <td className="px-3 py-2 text-left text-gray-400 sticky left-0 bg-navy-800 z-10">
              상태 (Status)
            </td>
            <td className="px-3 py-2"></td>
            {conditions.map(cond => {
              const summary = result.summaries.find(s => s.condition === cond);
              return (
                <td key={cond} className="px-3 py-2 text-center">
                  {summary ? <StatusBadge status={summary.status} /> : '-'}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
