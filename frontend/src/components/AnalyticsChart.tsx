import { ResponsiveContainer, Line, LineChart, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid } from 'recharts';

import type { AnalyticsPoint } from '../types';

export function AnalyticsChart({ data, title }: { data: AnalyticsPoint[]; title: string }) {
  return (
    <div className="h-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="mb-3 text-sm font-bold text-slate-800">{title}</p>
      <div className="grid h-[88%] grid-cols-1 gap-3 lg:grid-cols-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="consistency_score" stroke="#f43f5e" strokeWidth={3} />
            <Line type="monotone" dataKey="water_ml" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="calories_consumed" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
