'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { PerformanceData } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

interface PerformanceBarChartProps {
  data: PerformanceData[];
}

export default function PerformanceBarChart({ data }: PerformanceBarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map data to ensure completed and overdue have non-undefined numerical values
  const chartData = React.useMemo(() => {
    return data.map((d) => ({
      name: d.name,
      Completed: d.completedTasks ?? d.completed ?? 0,
      Active: d.activeTasks ?? 0,
      Overdue: d.overdue ?? 0,
      'Carried Fwd': d.carriedForward ?? 0,
    }));
  }, [data]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-full min-w-0">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>Team Performance Overview (Completed vs Active vs Overdue)</span>
        </h3>
        <span className="text-xs font-semibold text-slate-400 shrink-0">Task Lifecycle Breakdown per Member</span>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center min-h-[320px]">
          <EmptyState
            icon={<BarChart3 className="h-12 w-12 text-slate-400" />}
            title="No performance data"
            description="Add team members and assign tasks to see performance metrics here."
            className="h-full flex flex-col items-center justify-center"
          />
        </div>
      ) : !mounted ? (
        <div className="h-[350px] min-h-[320px] w-full flex-1 flex items-center justify-center bg-slate-50/50 rounded-xl">
          <span className="text-sm font-medium text-slate-400 animate-pulse">Rendering performance chart...</span>
        </div>
      ) : (
        <div className="w-full h-[350px] min-h-[320px] flex-1 min-w-0">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={70}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                }}
                itemStyle={{ color: '#f8fafc', padding: '2px 0' }}
                cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: '0.875rem', paddingBottom: '1rem' }}
              />
              <Bar
                dataKey="Completed"
                name="Completed"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="Active"
                name="Active Workload"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="Overdue"
                name="Overdue"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="Carried Fwd"
                name="Carried Fwd"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
