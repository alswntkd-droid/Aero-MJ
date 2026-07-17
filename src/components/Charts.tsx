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
    <div className="h-[300px] w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">공정별 생산 달성률</h3>
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
              <Cell key={`cell-${index}`} fill={entry.achievementRate < 90 ? '#ef4444' : '#F37321'} />
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
    <div className="h-[300px] w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">비가동 원인 분석 (Pareto)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="code" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} unit="%" />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Bar yAxisId="left" dataKey="duration" fill="#141414" radius={[4, 4, 0, 0]} barSize={32} />
          <Line yAxisId="right" type="monotone" dataKey="percentage" stroke="#F37321" strokeWidth={3} dot={{ r: 4, fill: '#F37321', strokeWidth: 2, stroke: '#fff' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
