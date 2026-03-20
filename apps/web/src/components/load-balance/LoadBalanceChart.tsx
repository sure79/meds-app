import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import type { LoadBalanceResult } from '../../types';
import { getConditionShortLabel } from '../../utils/calculations';

interface LoadBalanceChartProps {
  result: LoadBalanceResult;
}

export default function LoadBalanceChart({ result }: LoadBalanceChartProps) {
  const data = result.summaries.map(s => ({
    name: getConditionShortLabel(s.condition),
    condition: s.condition,
    loadPercent: Number(s.loadPercent.toFixed(1)),
    totalKW: Number(s.totalRunningKW.toFixed(1)),
    capacityKW: s.generatorCapacityKW,
  }));

  const getBarColor = (percent: number) => {
    if (percent > 100) return '#f44336';
    if (percent > 80) return '#ffd54f';
    return '#4caf50';
  };

  return (
    <div className="bg-navy-800 rounded-lg border border-navy-600 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">부하율 차트 (Load Factor Chart)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#1e3a5f' }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#1e3a5f' }}
            label={{ value: '%', position: 'top', offset: 10, fill: '#9ca3af', fontSize: 11 }}
            domain={[0, (max: number) => Math.max(max * 1.1, 110)]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0d1f35',
              border: '1px solid #1e3a5f',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'loadPercent') return [`${value}%`, '부하율'];
              return [value, name];
            }}
            labelStyle={{ color: '#4fc3f7', fontWeight: 600 }}
          />
          <ReferenceLine y={80} stroke="#ffd54f" strokeDasharray="5 5" label={{ value: '80%', fill: '#ffd54f', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={100} stroke="#f44336" strokeDasharray="5 5" label={{ value: '100%', fill: '#f44336', fontSize: 10, position: 'right' }} />
          <Bar dataKey="loadPercent" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.loadPercent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
