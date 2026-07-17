/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Cell, Legend
} from 'recharts';
import { ProductionData, DowntimeData } from '../types';

interface PerformanceChartProps {
  data: ProductionData[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">공정별 생산 달성률</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="processName" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} unit="%" />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="achievementRate" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.achievementRate < 90 ? '#ef4444' : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface ParetoChartProps {
  data: { code: string; duration: number; percentage: number }[];
}

export const ParetoChart: React.FC<ParetoChartProps> = ({ data }) => {
  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">비가동 원인 분석 (Pareto)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="code" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} label={{ value: '분(min)', angle: -90, position: 'insideLeft', offset: 10 }} />
          <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} unit="%" />
          <Tooltip />
          <Bar yAxisId="left" dataKey="duration" fill="#64748b" radius={[4, 4, 0, 0]} barSize={40} />
          <Line yAxisId="right" type="monotone" dataKey="percentage" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
